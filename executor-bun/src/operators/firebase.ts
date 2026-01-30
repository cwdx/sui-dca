/**
 * Firebase Functions Operator
 *
 * Serverless handler for Firebase Cloud Functions with scheduled triggers.
 *
 * Usage:
 *   Deploy with Firebase CLI
 *
 * firebase.json:
 *   {
 *     "functions": {
 *       "source": ".",
 *       "runtime": "nodejs20"
 *     }
 *   }
 *
 * Environment Variables (set in Firebase console or .env):
 *   EXECUTOR_PRIVATE_KEY
 *   etc.
 */

import { discover, executeBatchForCloud, calculateSafeBatchSize, getConfig } from "../index.js";
import type { BatchExecutionResult, OperatorResult } from "../lib/types.js";

// Firebase Functions timeout limits (ms)
// Can be overridden via FIREBASE_TIMEOUT_MS env var
const FIREBASE_TIMEOUT_DEFAULT = 60000; // 60s (gen1 default)

function getFirebaseTimeout(): number {
  const envTimeout = process.env.FIREBASE_TIMEOUT_MS;
  return envTimeout ? parseInt(envTimeout, 10) : FIREBASE_TIMEOUT_DEFAULT;
}

// Types for Firebase-like interfaces
interface HttpRequest {
  method: string;
  query: Record<string, string | undefined>;
  body?: unknown;
  headers: Record<string, string | undefined>;
}

interface HttpResponse {
  status(code: number): HttpResponse;
  json(data: unknown): void;
  send(data: string): void;
}

interface ScheduledContext {
  timestamp: string;
  eventId: string;
}

// Core execution logic
async function runExecution(limit: number, timeoutMs?: number): Promise<BatchExecutionResult | null> {
  const effectiveTimeout = timeoutMs ?? getFirebaseTimeout();
  // Calculate safe batch size for the timeout
  const safeBatchSize = calculateSafeBatchSize(effectiveTimeout);
  const actualLimit = Math.min(limit, safeBatchSize);

  const { dcas, totalEligible } = await discover({ limit: actualLimit });

  console.log(`Discovered ${totalEligible} eligible DCAs, processing ${dcas.length} (safe batch for ${effectiveTimeout}ms timeout)`);

  if (dcas.length === 0) {
    return null;
  }

  // Use cloud-safe execution with automatic batch timeout
  const result = await executeBatchForCloud(dcas, effectiveTimeout, {
    concurrency: 1,
    maxRetries: 2,
  });

  console.log(`Execution complete: ${result.succeeded}/${result.total} succeeded`);

  return result;
}

/**
 * HTTP Function - Trigger execution via HTTP request
 *
 * GET  /dcaExecutor?action=discover&limit=10
 * POST /dcaExecutor?action=execute&limit=10
 */
export async function httpHandler(req: HttpRequest, res: HttpResponse): Promise<void> {
  const action = req.query.action || (req.method === "GET" ? "discover" : "execute");
  const limit = parseInt(req.query.limit || "10");

  try {
    if (action === "discover") {
      const { dcas, totalEligible, hasMore } = await discover({ limit });

      res.status(200).json({
        success: true,
        action: "discover",
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
    } else if (action === "execute") {
      const result = await runExecution(limit);

      res.status(200).json({
        success: true,
        action: "execute",
        data: result
          ? {
              total: result.total,
              succeeded: result.succeeded,
              failed: result.failed,
              durationMs: result.durationMs,
            }
          : { message: "No eligible DCAs" },
      });
    } else {
      res.status(400).json({
        success: false,
        error: `Unknown action: ${action}`,
      });
    }
  } catch (error) {
    console.error("Handler error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Scheduled Function - Run on a schedule (cron)
 *
 * Schedule in firebase.json:
 *   functions.scheduleExecutor.schedule = "every 5 minutes"
 */
export async function scheduledHandler(context: ScheduledContext): Promise<OperatorResult> {
  console.log(`Scheduled execution triggered at ${context.timestamp}`);

  try {
    const config = getConfig();
    // Timeout configurable via FIREBASE_TIMEOUT_MS env var
    const result = await runExecution(config.maxBatchSize);

    if (!result) {
      return {
        success: true,
        message: "No eligible DCAs found",
      };
    }

    return {
      success: true,
      message: `Executed ${result.succeeded}/${result.total} DCAs`,
      data: result,
    };
  } catch (error) {
    console.error("Scheduled execution error:", error);
    return {
      success: false,
      message: "Execution failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Pub/Sub Function - Trigger via Pub/Sub message
 *
 * Useful for event-driven execution or chaining with other services.
 */
export async function pubsubHandler(message: { data?: string; attributes?: Record<string, string> }): Promise<OperatorResult> {
  console.log("Pub/Sub message received");

  // Parse message data if present
  let limit = 10;
  if (message.data) {
    try {
      const decoded = Buffer.from(message.data, "base64").toString();
      const parsed = JSON.parse(decoded);
      limit = parsed.limit || 10;
    } catch {
      // Use default limit
    }
  }

  // Check attributes
  if (message.attributes?.limit) {
    limit = parseInt(message.attributes.limit);
  }

  try {
    const result = await runExecution(limit);

    return {
      success: true,
      message: result ? `Executed ${result.succeeded}/${result.total} DCAs` : "No eligible DCAs",
      data: result || undefined,
    };
  } catch (error) {
    return {
      success: false,
      message: "Execution failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Export all handlers
export const dcaExecutorHttp = httpHandler;
export const dcaExecutorScheduled = scheduledHandler;
export const dcaExecutorPubsub = pubsubHandler;
