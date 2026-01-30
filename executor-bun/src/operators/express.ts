/**
 * Express API Operator
 *
 * REST API server for triggering DCA execution.
 *
 * Endpoints:
 *   GET  /health           - Health check
 *   GET  /discover         - Discover eligible DCAs
 *   POST /execute          - Execute eligible DCAs
 *   POST /execute/:dcaId   - Execute specific DCA
 *
 * Usage:
 *   bun run src/operators/express.ts
 *   # Server starts on PORT (default: 3000)
 *
 * Environment Variables:
 *   PORT                 - Server port (default: 3000)
 *   API_KEY              - Optional API key for authentication
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { discover, executeWithQuote, executeBatch, getConfig, discoverAll } from "../index.js";
import type { EligibleDca } from "../lib/types.js";

const app = new Hono();

// Middleware
app.use("*", cors());

// Optional API key authentication
app.use("*", async (c, next) => {
  const apiKey = process.env.API_KEY;
  if (apiKey) {
    const providedKey = c.req.header("X-API-Key") || c.req.query("api_key");
    if (providedKey !== apiKey) {
      return c.json({ error: "Unauthorized" }, 401);
    }
  }
  await next();
});

// Health check
app.get("/health", (c) => {
  const config = getConfig();
  return c.json({
    status: "ok",
    network: config.network,
    dryRun: config.dryRun,
    timestamp: new Date().toISOString(),
  });
});

// Discover eligible DCAs
app.get("/discover", async (c) => {
  try {
    const limit = parseInt(c.req.query("limit") || "50");
    const cursor = c.req.query("cursor");
    const owner = c.req.query("owner");
    const inputType = c.req.query("inputType");
    const outputType = c.req.query("outputType");

    const result = await discover({
      limit,
      cursor: cursor || undefined,
      owner: owner || undefined,
      inputType: inputType || undefined,
      outputType: outputType || undefined,
    });

    return c.json({
      success: true,
      data: {
        dcas: result.dcas.map((dca) => ({
          id: dca.id,
          owner: dca.owner,
          inputType: dca.inputType,
          outputType: dca.outputType,
          remainingOrders: dca.remainingOrders,
          splitAllocation: dca.splitAllocation.toString(),
          msUntilEligible: dca.msUntilEligible.toString(),
        })),
        hasMore: result.hasMore,
        nextCursor: result.nextCursor,
        totalDiscovered: result.totalDiscovered,
        totalEligible: result.totalEligible,
      },
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Execute all eligible DCAs
app.post("/execute", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const limit = body.limit || parseInt(c.req.query("limit") || "50");
    const owner = body.owner || c.req.query("owner");

    // Discover eligible DCAs
    const { dcas } = await discover({
      limit,
      owner: owner || undefined,
    });

    if (dcas.length === 0) {
      return c.json({
        success: true,
        message: "No eligible DCAs found",
        data: { total: 0, succeeded: 0, failed: 0, results: [] },
      });
    }

    // Execute batch
    const result = await executeBatch(dcas, {
      concurrency: 1,
      maxRetries: 2,
      timeoutMs: 60000,
    });

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
          reward: r.reward?.toString(),
        })),
      },
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Execute specific DCA by ID
app.post("/execute/:dcaId", async (c) => {
  try {
    const dcaId = c.req.param("dcaId");

    // Find the DCA
    const allEligible = await discoverAll();
    const dca = allEligible.find((d) => d.id === dcaId);

    if (!dca) {
      return c.json(
        {
          success: false,
          error: `DCA ${dcaId} not found or not eligible`,
        },
        404
      );
    }

    // Execute
    const result = await executeWithQuote(dca);

    return c.json({
      success: result.success,
      data: {
        dcaId: result.dcaId,
        digest: result.digest,
        error: result.error,
        reward: result.reward?.toString(),
        inputAmount: result.inputAmount?.toString(),
        outputAmount: result.outputAmount?.toString(),
        provider: result.provider,
      },
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Start server
const port = parseInt(process.env.PORT || "3000");
console.log(`DCA Executor API starting on port ${port}...`);

export default {
  port,
  fetch: app.fetch,
};

// For direct execution
if (import.meta.main) {
  const config = getConfig();
  console.log(`Network: ${config.network}`);
  console.log(`Dry Run: ${config.dryRun}`);
  console.log(`Listening on http://localhost:${port}`);
}
