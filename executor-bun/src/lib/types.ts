/**
 * DCA Executor Types
 */

import type { MetaQuote } from "@7kprotocol/sdk-ts";

// ============ DCA Account Types ============

export interface DcaAccount {
  id: string;
  owner: string;
  delegatee: string;
  active: boolean;
  remainingOrders: number;
  inputBalance: bigint;
  splitAllocation: bigint;
  lastTimeMs: bigint;
  every: number;
  timeScale: number;
  inputType: string;
  outputType: string;
  executorRewardPerTrade: bigint;
  customSlippageBps: number | null;
  defaultSlippageBps: number;
  feeBps: number;
}

export interface EligibleDca extends DcaAccount {
  nextExecutionMs: bigint;
  msUntilEligible: bigint;
}

export interface QuotedDca extends EligibleDca {
  quote: MetaQuote;
  netInputAmount: bigint;
}

// ============ Execution Types ============

export interface ExecutionResult {
  dcaId: string;
  success: boolean;
  digest?: string;
  error?: string;
  reward?: bigint;
  inputAmount?: bigint;
  outputAmount?: bigint;
  provider?: string;
}

export interface BatchExecutionResult {
  total: number;
  succeeded: number;
  failed: number;
  results: ExecutionResult[];
  durationMs: number;
}

// ============ Discovery Types ============

export interface DiscoveryOptions {
  /** Maximum number of DCAs to return per page */
  limit?: number;
  /** Cursor for pagination (last DCA ID from previous page) */
  cursor?: string;
  /** Filter by input token type */
  inputType?: string;
  /** Filter by output token type */
  outputType?: string;
  /** Only return DCAs owned by this address */
  owner?: string;
}

export interface DiscoveryResult {
  dcas: EligibleDca[];
  hasMore: boolean;
  nextCursor?: string;
  totalDiscovered: number;
  totalEligible: number;
}

// ============ Queue Types ============

export interface QueueOptions {
  /** Maximum concurrent executions */
  concurrency?: number;
  /** Delay between executions in ms */
  intervalMs?: number;
  /** Maximum retries per DCA */
  maxRetries?: number;
  /** Timeout per execution in ms */
  timeoutMs?: number;
}

export interface QueueStats {
  pending: number;
  running: number;
  completed: number;
  failed: number;
}

// ============ Handler Types ============

export interface ExecutorHandler {
  discover(options?: DiscoveryOptions): Promise<DiscoveryResult>;
  execute(dca: EligibleDca): Promise<ExecutionResult>;
  executeBatch(dcas: EligibleDca[], options?: QueueOptions): Promise<BatchExecutionResult>;
}

// ============ Operator Types ============

export interface OperatorContext {
  /** Trigger source (cli, cron, api, webhook) */
  source: string;
  /** Request ID for tracing */
  requestId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

export interface OperatorResult {
  success: boolean;
  message: string;
  data?: BatchExecutionResult;
  error?: string;
}

// ============ Config Types ============

export interface ExecutorConfig {
  network: string;
  rpcUrl: string;
  dcaPackage: string;
  globalConfig: string;
  feeTracker: string;
  /** Price feed registry for oracle lookups */
  priceFeedRegistry: string;
  /** Terms registry for terms acceptance */
  termsRegistry: string;
  /** Pyth state object ID */
  pythStateId: string;
  /** Wormhole state object ID */
  wormholeStateId: string;
  clock: string;
  maxBatchSize: number;
  executorRewardClaim: bigint;
  dryRun: boolean;
  defaultSlippageBps: number;
  /** Delay between sequential executions in ms */
  executionDelayMs: number;
}

// ============ Event Types ============

export type ExecutorEventType =
  | "discovery:start"
  | "discovery:complete"
  | "execution:start"
  | "execution:success"
  | "execution:error"
  | "batch:start"
  | "batch:complete";

export interface ExecutorEvent {
  type: ExecutorEventType;
  timestamp: number;
  data: Record<string, unknown>;
}

export type ExecutorEventHandler = (event: ExecutorEvent) => void | Promise<void>;
