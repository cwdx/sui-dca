// Google Cloud Run Operator
//
// Container-based serverless handler for Cloud Run.
// Can be triggered via HTTP, Cloud Scheduler, or Pub/Sub.
//
// Usage:
//   # Build container
//   docker build -t dca-executor .
//
//   # Deploy to Cloud Run
//   gcloud run deploy dca-executor \
//     --image gcr.io/PROJECT/dca-executor \
//     --platform managed \
//     --allow-unauthenticated
//
//   # Set up Cloud Scheduler
//   gcloud scheduler jobs create http dca-executor-job \
//     --schedule "*/5 * * * *" \
//     --uri "https://dca-executor-xxx.run.app/execute" \
//     --http-method POST

import { Hono } from "hono";
import { cors } from "hono/cors";
import { discover, executeBatchForCloud, calculateSafeBatchSize, getConfig, getExecutorAddress, getExecutorBalance, logStartupInfo } from "../index.js";
import type { BatchExecutionResult } from "../lib/types.js";

// Cloud Run timeout limits (ms)
// Can be overridden via CLOUD_RUN_TIMEOUT_MS env var
const CLOUD_RUN_TIMEOUT_DEFAULT = 300000; // 5 minutes (default)

function getCloudRunTimeout(): number {
  const envTimeout = process.env.CLOUD_RUN_TIMEOUT_MS;
  return envTimeout ? parseInt(envTimeout, 10) : CLOUD_RUN_TIMEOUT_DEFAULT;
}

const app = new Hono();

// Middleware
app.use("*", cors());

// Request logging
app.use("*", async (c, next) => {
  const start = Date.now();
  console.log(`${c.req.method} ${c.req.path}`);
  await next();
  console.log(`${c.req.method} ${c.req.path} - ${Date.now() - start}ms`);
});

// Health check (required for Cloud Run)
app.get("/", (c) => {
  return c.json({
    service: "dca-executor",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", async (c) => {
  const config = getConfig();
  const address = getExecutorAddress();
  const balance = await getExecutorBalance();

  return c.json({
    status: "ok",
    runtime: "cloud-run",
    network: config.network,
    dryRun: config.dryRun,
    executor: {
      address,
      balance: `${balance.toFixed(4)} SUI`,
    },
    timestamp: new Date().toISOString(),
  });
});

// Discover eligible DCAs
app.get("/discover", async (c) => {
  try {
    const limit = parseInt(c.req.query("limit") || "50");
    const owner = c.req.query("owner");

    const { dcas, totalDiscovered, totalEligible, hasMore } = await discover({
      limit,
      owner: owner || undefined,
    });

    return c.json({
      success: true,
      data: {
        discovered: totalDiscovered,
        eligible: totalEligible,
        returned: dcas.length,
        hasMore,
        dcas: dcas.map((d) => ({
          id: d.id,
          owner: d.owner,
          pair: `${d.inputType.split("::").pop()} → ${d.outputType.split("::").pop()}`,
          remainingOrders: d.remainingOrders,
          amount: Number(d.splitAllocation) / 1e9,
        })),
      },
    });
  } catch (error) {
    console.error("Discovery error:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Execute DCAs (restricted to Cloud Scheduler or internal calls)
app.post("/execute", async (c) => {
  // Check if request is from Cloud Scheduler or has API key
  const userAgent = c.req.header("User-Agent") || "";
  const apiKey = c.req.header("X-API-Key") || c.req.query("api_key");
  const expectedApiKey = process.env.EXECUTOR_API_KEY;

  const isScheduler = userAgent.includes("Google-Cloud-Scheduler");
  const isAuthorized = expectedApiKey && apiKey === expectedApiKey;

  if (!isScheduler && !isAuthorized) {
    console.log(`[execute] Blocked unauthorized request from: ${userAgent.slice(0, 50)}`);
    return c.json({
      success: false,
      error: "Unauthorized. Execute endpoint is restricted to Cloud Scheduler.",
    }, 403);
  }

  try {
    const body = await c.req.json().catch(() => ({}));
    const requestedLimit = body.limit || parseInt(c.req.query("limit") || "10");
    const owner = body.owner || c.req.query("owner");
    const timeoutMs = body.timeoutMs || getCloudRunTimeout();

    // Calculate safe batch size for the timeout
    const safeBatchSize = calculateSafeBatchSize(timeoutMs);
    const limit = Math.min(requestedLimit, safeBatchSize);

    console.log(`Executing DCAs: limit=${limit} (safe batch for ${timeoutMs}ms), owner=${owner || "any"}`);

    // Discover
    const { dcas } = await discover({
      limit,
      owner: owner || undefined,
    });

    if (dcas.length === 0) {
      return c.json({
        success: true,
        message: "No eligible DCAs found",
        data: { total: 0, succeeded: 0, failed: 0 },
      });
    }

    // Execute with cloud-safe timeout handling
    const result = await executeBatchForCloud(dcas, timeoutMs, {
      concurrency: 1,
      maxRetries: 2,
    });

    console.log(`Execution complete: ${result.succeeded}/${result.total}`);

    return c.json({
      success: true,
      data: {
        total: result.total,
        succeeded: result.succeeded,
        failed: result.failed,
        durationMs: result.durationMs,
        results: result.results.map((r) => ({
          dcaId: r.dcaId,
          success: r.success,
          digest: r.digest,
          error: r.error,
        })),
      },
    });
  } catch (error) {
    console.error("Execution error:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Pub/Sub push endpoint (for Cloud Scheduler via Pub/Sub)
app.post("/pubsub", async (c) => {
  // Check if request is from Google (Pub/Sub)
  const userAgent = c.req.header("User-Agent") || "";
  if (!userAgent.includes("Google") && !userAgent.includes("CloudPubSub")) {
    return c.json({ success: false, error: "Unauthorized" }, 403);
  }

  try {
    const body = await c.req.json();

    // Pub/Sub message format
    const message = body.message;
    if (!message) {
      return c.json({ error: "No Pub/Sub message" }, 400);
    }

    // Decode message data
    let config: { limit?: number; timeoutMs?: number } = { limit: 10 };
    if (message.data) {
      try {
        const decoded = atob(message.data);
        config = JSON.parse(decoded);
      } catch {
        // Use defaults
      }
    }

    const timeoutMs = config.timeoutMs || getCloudRunTimeout();
    const safeBatchSize = calculateSafeBatchSize(timeoutMs);
    const limit = Math.min(config.limit || 10, safeBatchSize);

    console.log(`Pub/Sub trigger: limit=${limit} (safe batch for ${timeoutMs}ms)`);

    // Execute
    const { dcas } = await discover({ limit });

    if (dcas.length === 0) {
      return c.json({ success: true, message: "No eligible DCAs" });
    }

    const result = await executeBatchForCloud(dcas, timeoutMs);

    return c.json({
      success: true,
      executed: result.succeeded,
      total: result.total,
    });
  } catch (error) {
    console.error("Pub/Sub error:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Start server
const port = parseInt(process.env.PORT || "8080");

export default {
  port,
  fetch: app.fetch,
};

// For direct execution
if (import.meta.main) {
  // Log startup info (address, balance, etc.)
  logStartupInfo().then(() => {
    console.log(`Listening on port ${port}`);
  }).catch((err) => {
    console.warn(`Failed to log startup info: ${err.message}`);
    console.log(`Listening on port ${port}`);
  });
}
