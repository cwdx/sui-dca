/**
 * DCA Executor - Production-Ready Library
 *
 * This module exports all handlers and utilities for building DCA execution
 * operators (CLI, Express, Cloudflare Workers, Firebase Functions, etc.)
 *
 * @example
 * ```ts
 * import { discover, executeBatch, createQueue } from "dca-executor";
 *
 * // Discover eligible DCAs
 * const { dcas } = await discover({ limit: 10 });
 *
 * // Execute with queue
 * const result = await executeBatch(dcas, { concurrency: 1 });
 * console.log(`Executed ${result.succeeded}/${result.total} DCAs`);
 * ```
 */

// ============ Types ============
export type {
  // Core types
  DcaAccount,
  EligibleDca,
  QuotedDca,
  // Execution types
  ExecutionResult,
  BatchExecutionResult,
  // Discovery types
  DiscoveryOptions,
  DiscoveryResult,
  // Queue types
  QueueOptions,
  QueueStats,
  // Handler types
  ExecutorHandler,
  // Operator types
  OperatorContext,
  OperatorResult,
  // Config types
  ExecutorConfig,
  // Event types
  ExecutorEventType,
  ExecutorEvent,
  ExecutorEventHandler,
} from "./lib/types.js";

// ============ Configuration ============
export { loadConfig, validateConfig, getConfig, resetConfig, logStartupInfo } from "./lib/config.js";

// ============ Clients ============
export {
  getSuiClient,
  getMetaAg,
  createMetaAg,
  getKeypair,
  getExecutorAddress,
  getExecutorBalance,
  timeScaleToMs,
  getEffectiveSlippage,
  resetClients,
} from "./lib/client.js";

// ============ Discovery ============
export { discover, discoverAll, countEligible, discoverStream, discoverWithCallback } from "./handlers/discover.js";

// ============ Execution ============
export { getQuote, execute, executeWithQuote, verifyStillEligible } from "./handlers/execute.js";

// ============ Queue ============
export {
  ExecutionQueue,
  createQueue,
  executeBatch,
  executeBatchForCloud,
  calculateSafeBatchSize,
  type CloudQueueOptions,
} from "./handlers/queue.js";

// ============ Convenience Function ============

import { discover } from "./handlers/discover.js";
import { executeBatch } from "./handlers/queue.js";
import { getConfig } from "./lib/config.js";
import type { BatchExecutionResult, DiscoveryOptions, QueueOptions } from "./lib/types.js";

export interface RunOptions extends DiscoveryOptions, QueueOptions {
  /** Stop after discovery, don't execute */
  discoverOnly?: boolean;
}

/**
 * Run the DCA executor (discover + execute)
 *
 * This is a convenience function that combines discovery and execution.
 * For more control, use discover() and executeBatch() separately.
 */
export async function run(options?: RunOptions): Promise<BatchExecutionResult | null> {
  const config = getConfig();

  // Discover eligible DCAs
  const { dcas, totalDiscovered, totalEligible } = await discover({
    limit: options?.limit ?? config.maxBatchSize,
    cursor: options?.cursor,
    inputType: options?.inputType,
    outputType: options?.outputType,
    owner: options?.owner,
  });

  console.log(`Discovered ${totalDiscovered} DCAs, ${totalEligible} eligible, ${dcas.length} in batch`);

  if (options?.discoverOnly || dcas.length === 0) {
    return null;
  }

  // Execute batch
  const result = await executeBatch(dcas, {
    concurrency: options?.concurrency,
    intervalMs: options?.intervalMs,
    maxRetries: options?.maxRetries,
    timeoutMs: options?.timeoutMs,
  });

  console.log(`Executed ${result.succeeded}/${result.total} DCAs in ${result.durationMs}ms`);

  return result;
}
