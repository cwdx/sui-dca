/**
 * DCA Execution Queue Handler
 *
 * Manages queued execution with concurrency control, retries, and timeouts.
 * Uses p-queue for queue management, p-retry for retry logic, p-timeout for timeouts.
 *
 * Cloud Provider Safety:
 * - Batch-level timeout: Returns partial results before cloud kills process
 * - Graceful shutdown: Handles SIGTERM/SIGINT, completes current execution
 * - AbortController: Cancels pending work on shutdown
 * - Progress tracking: Always know what completed vs pending
 *
 * Multi-Executor Safety:
 * - Stateless: Each queue instance is independent
 * - Idempotent: Handlers treat "already executed" as success
 * - No global locks: Relies on on-chain guards for atomicity
 */

import PQueue from "p-queue";
import pRetry, { AbortError } from "p-retry";
import pTimeout from "p-timeout";
import { getConfig } from "../lib/config.js";
import { executeWithQuote } from "./execute.js";
import type {
  EligibleDca,
  ExecutionResult,
  BatchExecutionResult,
  QueueOptions,
  QueueStats,
  ExecutorEvent,
  ExecutorEventHandler,
} from "../lib/types.js";

// Default queue options
const DEFAULT_CONCURRENCY = 1; // Sequential execution (7k batching doesn't work)
const DEFAULT_INTERVAL_MS = 3000; // Delay between executions
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_TIMEOUT_MS = 30000; // 30s per execution
const DEFAULT_BATCH_TIMEOUT_MS = 55000; // 55s batch timeout (safe for 60s cloud limits)

// Estimated time per DCA execution (quote + swap + delay)
const ESTIMATED_MS_PER_DCA = 8000;

/**
 * Calculate safe batch size for a given timeout
 */
export function calculateSafeBatchSize(batchTimeoutMs: number, intervalMs: number = DEFAULT_INTERVAL_MS): number {
  const msPerDca = ESTIMATED_MS_PER_DCA + intervalMs;
  // Leave 5s buffer for shutdown
  const safeMs = batchTimeoutMs - 5000;
  return Math.max(1, Math.floor(safeMs / msPerDca));
}

/**
 * Extended queue options with cloud-specific settings
 */
export interface CloudQueueOptions extends QueueOptions {
  /** Maximum time for entire batch (default: 55s for cloud safety) */
  batchTimeoutMs?: number;
  /** AbortSignal for external cancellation */
  signal?: AbortSignal;
  /** Return partial results on timeout instead of throwing */
  returnPartialOnTimeout?: boolean;
}

/**
 * DCA Execution Queue
 *
 * Manages sequential execution with rate limiting, timeouts, and graceful shutdown.
 */
export class ExecutionQueue {
  private queue: PQueue;
  private options: Required<QueueOptions> & { batchTimeoutMs: number };
  private stats: QueueStats;
  private eventHandlers: ExecutorEventHandler[] = [];
  private abortController: AbortController;
  private isShuttingDown = false;

  constructor(options?: CloudQueueOptions) {
    const config = getConfig();

    this.options = {
      concurrency: options?.concurrency ?? DEFAULT_CONCURRENCY,
      intervalMs: options?.intervalMs ?? config.executionDelayMs ?? DEFAULT_INTERVAL_MS,
      maxRetries: options?.maxRetries ?? DEFAULT_MAX_RETRIES,
      timeoutMs: options?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      batchTimeoutMs: options?.batchTimeoutMs ?? DEFAULT_BATCH_TIMEOUT_MS,
    };

    this.queue = new PQueue({
      concurrency: this.options.concurrency,
      interval: this.options.intervalMs,
      intervalCap: 1,
    });

    this.stats = {
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
    };

    this.abortController = new AbortController();

    // Link external signal if provided
    if (options?.signal) {
      options.signal.addEventListener("abort", () => this.shutdown());
    }

    // Track queue stats
    this.queue.on("active", () => {
      this.stats.running++;
      this.stats.pending = this.queue.size;
    });

    this.queue.on("completed", () => {
      this.stats.running--;
      this.stats.completed++;
    });

    this.queue.on("error", () => {
      this.stats.running--;
      this.stats.failed++;
    });
  }

  /**
   * Register an event handler
   */
  on(handler: ExecutorEventHandler): void {
    this.eventHandlers.push(handler);
  }

  /**
   * Emit an event to all handlers
   */
  private async emit(event: ExecutorEvent): Promise<void> {
    for (const handler of this.eventHandlers) {
      try {
        await handler(event);
      } catch {
        // Ignore handler errors
      }
    }
  }

  /**
   * Graceful shutdown - complete current execution, cancel pending
   */
  shutdown(): void {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    console.log("Shutting down queue gracefully...");
    this.queue.pause();
    this.queue.clear();
    this.abortController.abort();
  }

  /**
   * Check if shutdown was requested
   */
  get isAborted(): boolean {
    return this.abortController.signal.aborted || this.isShuttingDown;
  }

  /**
   * Execute a single DCA with retry and timeout
   */
  private async executeWithRetry(dca: EligibleDca): Promise<ExecutionResult> {
    // Check for abort before starting
    if (this.isAborted) {
      return {
        dcaId: dca.id,
        success: false,
        error: "Execution cancelled (shutdown)",
      };
    }

    const run = async () => {
      await this.emit({
        type: "execution:start",
        timestamp: Date.now(),
        data: { dcaId: dca.id, inputType: dca.inputType, outputType: dca.outputType },
      });

      const result = await executeWithQuote(dca);

      if (!result.success) {
        const error = result.error || "";

        // Check if "already executed" - this is success in multi-executor env
        if (error.includes("Already executed") || error.includes("No longer eligible")) {
          return result;
        }

        // Check if error is retryable (transient network/infra issues)
        const errorLower = error.toLowerCase();
        if (
          errorLower.includes("timeout") ||
          errorLower.includes("network") ||
          errorLower.includes("rate limit") ||
          errorLower.includes("fetch failed")
        ) {
          throw new Error(error);
        }

        // Non-retryable error
        throw new AbortError(error || "Execution failed");
      }

      await this.emit({
        type: "execution:success",
        timestamp: Date.now(),
        data: {
          dcaId: dca.id,
          digest: result.digest,
          reward: result.reward?.toString(),
          provider: result.provider,
        },
      });

      return result;
    };

    try {
      // Wrap entire operation (including retries) with timeout
      const result = await pTimeout(
        pRetry(run, {
          retries: this.options.maxRetries,
          signal: this.abortController.signal,
          onFailedAttempt: (error) => {
            console.log(`  Retry ${error.attemptNumber}/${this.options.maxRetries + 1} for ${dca.id.slice(0, 10)}...`);
          },
        }),
        {
          milliseconds: this.options.timeoutMs,
          message: `Execution timed out after ${this.options.timeoutMs}ms`,
        }
      );

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      await this.emit({
        type: "execution:error",
        timestamp: Date.now(),
        data: { dcaId: dca.id, error: errorMsg },
      });

      return {
        dcaId: dca.id,
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Add a DCA to the execution queue
   */
  add(dca: EligibleDca): Promise<ExecutionResult> {
    if (this.isAborted) {
      return Promise.resolve({
        dcaId: dca.id,
        success: false,
        error: "Queue is shutting down",
      });
    }

    this.stats.pending++;
    return this.queue.add(() => this.executeWithRetry(dca), {
      signal: this.abortController.signal,
    }) as Promise<ExecutionResult>;
  }

  /**
   * Execute a batch of DCAs with batch-level timeout
   * Returns partial results if timeout is reached
   */
  async executeBatch(dcas: EligibleDca[], returnPartialOnTimeout = true): Promise<BatchExecutionResult> {
    const startTime = Date.now();
    const results: ExecutionResult[] = [];
    let timedOut = false;

    await this.emit({
      type: "batch:start",
      timestamp: startTime,
      data: { count: dcas.length, batchTimeoutMs: this.options.batchTimeoutMs },
    });

    // Create a timeout promise
    const timeoutPromise = new Promise<"timeout">((resolve) => {
      setTimeout(() => resolve("timeout"), this.options.batchTimeoutMs);
    });

    // Process DCAs one at a time, checking timeout after each
    for (const dca of dcas) {
      if (this.isAborted) {
        break;
      }

      // Race between execution and timeout
      const executionPromise = this.add(dca);
      const raceResult = await Promise.race([executionPromise, timeoutPromise]);

      if (raceResult === "timeout") {
        timedOut = true;
        console.log(`Batch timeout reached after ${results.length}/${dcas.length} DCAs`);

        if (!returnPartialOnTimeout) {
          throw new Error(`Batch timed out after ${this.options.batchTimeoutMs}ms`);
        }

        // Shutdown gracefully
        this.shutdown();
        break;
      }

      results.push(raceResult);
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const durationMs = Date.now() - startTime;

    await this.emit({
      type: "batch:complete",
      timestamp: Date.now(),
      data: {
        total: dcas.length,
        processed: results.length,
        succeeded,
        failed,
        durationMs,
        timedOut,
      },
    });

    return {
      total: dcas.length,
      succeeded,
      failed,
      results,
      durationMs,
    };
  }

  /**
   * Get current queue statistics
   */
  getStats(): QueueStats {
    return {
      ...this.stats,
      pending: this.queue.size,
    };
  }

  /**
   * Wait for all queued executions to complete
   */
  async onIdle(): Promise<void> {
    await this.queue.onIdle();
  }

  /**
   * Clear the queue (pending items only)
   */
  clear(): void {
    this.queue.clear();
    this.stats.pending = 0;
  }

  /**
   * Pause the queue
   */
  pause(): void {
    this.queue.pause();
  }

  /**
   * Resume the queue
   */
  start(): void {
    this.queue.start();
  }

  /**
   * Check if queue is paused
   */
  get isPaused(): boolean {
    return this.queue.isPaused;
  }

  /**
   * Get queue size (pending items)
   */
  get size(): number {
    return this.queue.size;
  }

  /**
   * Get number of currently running executions
   */
  get pending(): number {
    return this.queue.pending;
  }
}

/**
 * Create a new execution queue with options
 */
export function createQueue(options?: CloudQueueOptions): ExecutionQueue {
  return new ExecutionQueue(options);
}

/**
 * Execute a batch of DCAs with cloud-safe defaults
 */
export async function executeBatch(dcas: EligibleDca[], options?: CloudQueueOptions): Promise<BatchExecutionResult> {
  const queue = new ExecutionQueue(options);

  // Setup signal handlers for graceful shutdown
  const shutdown = () => queue.shutdown();
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);

  try {
    return await queue.executeBatch(dcas, options?.returnPartialOnTimeout ?? true);
  } finally {
    // Cleanup signal handlers
    process.off("SIGTERM", shutdown);
    process.off("SIGINT", shutdown);
  }
}

/**
 * Execute DCAs with automatic batch sizing for cloud timeout
 */
export async function executeBatchForCloud(
  dcas: EligibleDca[],
  cloudTimeoutMs: number,
  options?: Omit<CloudQueueOptions, "batchTimeoutMs">
): Promise<BatchExecutionResult> {
  const safeBatchSize = calculateSafeBatchSize(cloudTimeoutMs, options?.intervalMs);
  const batchTimeoutMs = cloudTimeoutMs - 5000; // 5s safety buffer

  console.log(`Cloud timeout: ${cloudTimeoutMs}ms, safe batch size: ${safeBatchSize}, processing: ${Math.min(dcas.length, safeBatchSize)}`);

  const batchDcas = dcas.slice(0, safeBatchSize);

  return executeBatch(batchDcas, {
    ...options,
    batchTimeoutMs,
  });
}
