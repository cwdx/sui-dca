/**
 * Cloudflare Workers Operator
 *
 * Serverless handler for Cloudflare Workers with scheduled triggers (cron).
 *
 * Usage:
 *   Deploy to Cloudflare Workers with wrangler
 *
 * wrangler.toml:
 *   [triggers]
 *   crons = ["* /5 * * * *"]  # Every 5 minutes
 *
 * Environment Variables (set in Cloudflare dashboard):
 *   SUI_RPC_URL
 *   EXECUTOR_PRIVATE_KEY
 *   DCA_PACKAGE_ID
 *   etc.
 */

import { Hono } from "hono";
import { discover, executeBatchForCloud, calculateSafeBatchSize, getConfig } from "../index.js";
import type { BatchExecutionResult } from "../lib/types.js";

// Cloudflare Workers timeout limits (ms)
// Can be overridden via CF_TIMEOUT_MS env var
const CF_TIMEOUT_DEFAULT = 30000; // 30s CPU time (safe default)

function getCloudflareTimeout(): number {
  const envTimeout = process.env.CF_TIMEOUT_MS;
  return envTimeout ? parseInt(envTimeout, 10) : CF_TIMEOUT_DEFAULT;
}

// Types for Cloudflare Workers
interface Env {
  SUI_NETWORK?: string;
  SUI_RPC_URL?: string;
  EXECUTOR_PRIVATE_KEY: string;
  DCA_PACKAGE_ID?: string;
  GLOBAL_CONFIG_ID?: string;
  FEE_TRACKER_ID?: string;
  PRICE_FEED_REGISTRY_ID?: string;
  TERMS_REGISTRY_ID?: string;
  MAX_BATCH_SIZE?: string;
  EXECUTION_DELAY_MS?: string;
  DRY_RUN?: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

interface ScheduledEvent {
  cron: string;
  scheduledTime: number;
}

// Hono app for HTTP requests
const app = new Hono<{ Bindings: Env }>();

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    runtime: "cloudflare-workers",
    timestamp: new Date().toISOString(),
  });
});

app.get("/discover", async (c) => {
  // Set env vars from Cloudflare bindings
  setEnvFromBindings(c.env);

  const limit = parseInt(c.req.query("limit") || "50");
  const { dcas, totalEligible, hasMore } = await discover({ limit });

  return c.json({
    success: true,
    data: {
      count: dcas.length,
      totalEligible,
      hasMore,
      dcas: dcas.map((d) => ({
        id: d.id,
        inputType: d.inputType,
        outputType: d.outputType,
        remainingOrders: d.remainingOrders,
      })),
    },
  });
});

app.post("/execute", async (c) => {
  setEnvFromBindings(c.env);

  const limit = parseInt(c.req.query("limit") || "10");
  const result = await runExecution(limit);

  return c.json({
    success: true,
    data: result,
  });
});

// Helper to set process.env from Cloudflare bindings
function setEnvFromBindings(env: Env): void {
  if (env.SUI_NETWORK) process.env.SUI_NETWORK = env.SUI_NETWORK;
  if (env.SUI_RPC_URL) process.env.SUI_RPC_URL = env.SUI_RPC_URL;
  if (env.EXECUTOR_PRIVATE_KEY) process.env.EXECUTOR_PRIVATE_KEY = env.EXECUTOR_PRIVATE_KEY;
  if (env.DCA_PACKAGE_ID) process.env.DCA_PACKAGE_ID = env.DCA_PACKAGE_ID;
  if (env.GLOBAL_CONFIG_ID) process.env.GLOBAL_CONFIG_ID = env.GLOBAL_CONFIG_ID;
  if (env.FEE_TRACKER_ID) process.env.FEE_TRACKER_ID = env.FEE_TRACKER_ID;
  if (env.PRICE_FEED_REGISTRY_ID) process.env.PRICE_FEED_REGISTRY_ID = env.PRICE_FEED_REGISTRY_ID;
  if (env.TERMS_REGISTRY_ID) process.env.TERMS_REGISTRY_ID = env.TERMS_REGISTRY_ID;
  if (env.MAX_BATCH_SIZE) process.env.MAX_BATCH_SIZE = env.MAX_BATCH_SIZE;
  if (env.EXECUTION_DELAY_MS) process.env.EXECUTION_DELAY_MS = env.EXECUTION_DELAY_MS;
  if (env.DRY_RUN) process.env.DRY_RUN = env.DRY_RUN;
}

// Core execution logic
async function runExecution(limit: number, timeoutMs?: number): Promise<BatchExecutionResult | null> {
  const effectiveTimeout = timeoutMs ?? getCloudflareTimeout();
  // Calculate safe batch size for the timeout
  const safeBatchSize = calculateSafeBatchSize(effectiveTimeout);
  const actualLimit = Math.min(limit, safeBatchSize);

  const { dcas } = await discover({ limit: actualLimit });

  if (dcas.length === 0) {
    console.log("No eligible DCAs found");
    return null;
  }

  console.log(`Executing ${dcas.length} DCAs (safe batch for ${effectiveTimeout}ms timeout)...`);

  // Use cloud-safe execution with automatic batch timeout
  const result = await executeBatchForCloud(dcas, effectiveTimeout, {
    concurrency: 1,
    maxRetries: 2,
  });

  console.log(`Completed: ${result.succeeded}/${result.total} succeeded`);

  return result;
}

// Export for Cloudflare Workers
export default {
  // HTTP handler
  fetch: app.fetch,

  // Scheduled handler (cron trigger)
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`Cron triggered: ${event.cron} at ${new Date(event.scheduledTime).toISOString()}`);

    setEnvFromBindings(env);

    // Run execution in background
    ctx.waitUntil(
      runExecution(10).then((result) => {
        if (result) {
          console.log(`Scheduled execution complete: ${result.succeeded}/${result.total}`);
        }
      })
    );
  },
};
