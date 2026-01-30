/**
 * DCA Execution Handler
 *
 * Handles single DCA execution with quote fetching and swap execution.
 *
 * Race Condition Handling:
 * - Stateless: No shared mutable state between executions
 * - Idempotent: Contract rejects duplicate executions (ENotEnoughTimePassed)
 * - Fresh verification: Re-checks eligibility before execution
 * - Graceful failures: Handles "already executed" as success
 *
 * Oracle Integration (v2):
 * The contract now supports oracle-based min_output calculation using Pyth price feeds.
 * For direct DCA contract calls (init_trade), executors must:
 * 1. Fetch price feed configs from PriceFeedRegistry
 * 2. Update Pyth price feeds in the PTB
 * 3. Pass PriceInfoObjects to init_trade
 *
 * However, this executor uses MetaAg for aggregated swaps, which handles slippage
 * protection independently. The legacy init_trade_legacy function is still available
 * for backward compatibility during migration.
 *
 * For FlowX adapter usage with oracle pricing, see flow_x.move adapter functions.
 */

import { Transaction } from "@mysten/sui/transactions";
import { getSuiClient, getMetaAg, getKeypair, getExecutorAddress, getEffectiveSlippage, timeScaleToMs } from "../lib/client.js";
import { getConfig } from "../lib/config.js";
import { getTokenByType } from "../lib/token-registry.js";
import { getPriceInfoObjectIds } from "../lib/pyth.js";
import { initTrade, resolveTrade } from "../_generated/dca/dca/functions.js";
import type { EligibleDca, QuotedDca, ExecutionResult } from "../lib/types.js";

// Known error patterns for race conditions
const ALREADY_EXECUTED_ERRORS = [
  "ENotEnoughTimePassed",
  "ENoRemainingOrders",
  "EInactive",
  "EUnfundedAccount",
];

/**
 * Check if error indicates DCA was already executed by another executor
 */
function isAlreadyExecutedError(error: string): boolean {
  return ALREADY_EXECUTED_ERRORS.some((e) => error.includes(e));
}

/**
 * Re-verify DCA is still eligible (fresh check before execution)
 * Prevents race conditions where another executor already executed
 */
async function verifyStillEligible(dcaId: string): Promise<{ eligible: boolean; reason?: string }> {
  const client = getSuiClient();

  try {
    const obj = await client.getObject({
      id: dcaId,
      options: { showContent: true },
    });

    if (!obj.data?.content || obj.data.content.dataType !== "moveObject") {
      return { eligible: false, reason: "DCA not found or deleted" };
    }

    const fields = (obj.data.content as any).fields;

    // Check basic eligibility
    if (!fields.active) {
      return { eligible: false, reason: "DCA is inactive" };
    }
    if (parseInt(fields.remaining_orders) === 0) {
      return { eligible: false, reason: "No remaining orders" };
    }
    if (BigInt(fields.input_balance) === 0n) {
      return { eligible: false, reason: "No input balance" };
    }

    // Check time eligibility
    const now = BigInt(Date.now());
    const lastTimeMs = BigInt(fields.last_time_ms);
    const every = parseInt(fields.every);
    const timeScale = fields.time_scale;
    const intervalMs = timeScaleToMs(every, timeScale);
    const nextExecutionMs = lastTimeMs + intervalMs;

    if (now < nextExecutionMs) {
      const waitMs = Number(nextExecutionMs - now);
      return { eligible: false, reason: `Not yet eligible, wait ${waitMs}ms` };
    }

    return { eligible: true };
  } catch (error) {
    return { eligible: false, reason: `Verification failed: ${error}` };
  }
}

/**
 * Get quote for a single DCA
 */
export async function getQuote(dca: EligibleDca): Promise<QuotedDca | null> {
  try {
    // Calculate net input after DCA protocol fee
    const grossAmount = dca.splitAllocation;
    const feeAmount = (grossAmount * BigInt(dca.feeBps)) / 10000n;
    const netInputAmount = grossAmount - feeAmount;

    const metaAg = getMetaAg();
    const quotes = await metaAg.quote({
      coinTypeIn: dca.inputType,
      coinTypeOut: dca.outputType,
      amountIn: netInputAmount.toString(),
    });

    if (quotes.length === 0) {
      return null;
    }

    // Pick best quote (highest output)
    const bestQuote = quotes.reduce((best, q) => (BigInt(q.amountOut) > BigInt(best.amountOut) ? q : best));

    return {
      ...dca,
      quote: bestQuote,
      netInputAmount,
    };
  } catch {
    return null;
  }
}

/**
 * Execute a single DCA trade
 *
 * Race-condition safe:
 * - Re-verifies eligibility before execution
 * - Handles "already executed" errors gracefully
 * - Stateless - safe to call from multiple executors
 *
 * @param quotedDca DCA with quote attached
 * @param skipVerification Skip fresh eligibility check (use with caution)
 * @returns Execution result
 */
export async function execute(quotedDca: QuotedDca, skipVerification = false): Promise<ExecutionResult> {
  const client = getSuiClient();
  const config = getConfig();
  const keypair = getKeypair();
  const executorAddress = getExecutorAddress();

  // Fresh eligibility check to prevent race conditions
  if (!skipVerification) {
    const { eligible, reason } = await verifyStillEligible(quotedDca.id);
    if (!eligible) {
      return {
        dcaId: quotedDca.id,
        success: false,
        error: `No longer eligible: ${reason}`,
      };
    }
  }

  const tx = new Transaction();

  try {
    // Look up Pyth feed IDs for input and output tokens
    const inputToken = getTokenByType(quotedDca.inputType);
    const outputToken = getTokenByType(quotedDca.outputType);

    if (!inputToken || !outputToken) {
      return {
        dcaId: quotedDca.id,
        success: false,
        error: `Missing price feed: input=${!!inputToken}, output=${!!outputToken}`,
      };
    }

    // Collect price feed IDs (input, output, and SUI for intermediate routing)
    const suiFeedId = "23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744";
    const priceIds = [inputToken.pythFeedId, outputToken.pythFeedId];

    // Add SUI feed if needed for routing (tokens without direct USD feeds)
    // For now, always include SUI feed as it's commonly used
    if (!priceIds.includes(suiFeedId)) {
      priceIds.push(suiFeedId);
    }

    // 1. Get existing PriceInfoObjects for the feeds
    // Note: These objects contain prices that are regularly updated by other actors
    // The contract will verify the prices are fresh (within MAX_PRICE_AGE_SECONDS)
    const priceInfoObjectIds = getPriceInfoObjectIds(priceIds);

    // Map price info objects to their feed IDs
    const inputPriceInfoId = priceInfoObjectIds[0];
    const outputPriceInfoId = priceInfoObjectIds[1];
    // For intermediate (routing), use SUI/USD price info, or same as primary if direct USD feed
    const intermediatePriceInfoId = priceInfoObjectIds.length > 2 ? priceInfoObjectIds[2] : priceInfoObjectIds[0];

    // 2. init_trade with oracle params - get funds and hot-potato promise (using generated client)
    const [fundsBalance, promise] = initTrade(tx, [quotedDca.inputType, quotedDca.outputType], {
      dca: quotedDca.id,
      clock: config.clock,
      registry: config.priceFeedRegistry,
      inputPriceInfo: inputPriceInfoId,
      inputIntermediate: intermediatePriceInfoId,
      outputPriceInfo: outputPriceInfoId,
      outputIntermediate: intermediatePriceInfoId,
    });

    // 3. Convert Balance<Input> to Coin<Input> for swap
    const inputCoin = tx.moveCall({
      target: "0x2::coin::from_balance",
      typeArguments: [quotedDca.inputType],
      arguments: [fundsBalance],
    });

    // 4. Execute swap using MetaAg
    const metaAg = getMetaAg();
    const effectiveSlippage = getEffectiveSlippage(quotedDca);
    const outputCoin = await metaAg.swap(
      {
        quote: quotedDca.quote,
        signer: executorAddress,
        tx,
        coinIn: inputCoin,
      },
      effectiveSlippage
    );

    // 5. Get output amount for resolve_trade validation
    const outputAmount = tx.moveCall({
      target: "0x2::coin::value",
      typeArguments: [quotedDca.outputType],
      arguments: [outputCoin],
    });

    // 6. resolve_trade - complete the trade, get executor reward (using generated client)
    const rewardCoin = resolveTrade(tx, [quotedDca.inputType, quotedDca.outputType], {
      dca: quotedDca.id,
      feeTracker: config.feeTracker,
      promise,
      outputAmount,
      executorReward: config.executorRewardClaim,
    });

    // 7. Transfer output to DCA owner, reward to executor
    tx.transferObjects([outputCoin], quotedDca.owner);
    tx.transferObjects([rewardCoin], executorAddress);

    // Execute transaction
    if (config.dryRun) {
      const result = await client.dryRunTransactionBlock({
        transactionBlock: await tx.build({ client }),
      });

      if (result.effects.status.error) {
        return {
          dcaId: quotedDca.id,
          success: false,
          error: `Dry run failed: ${result.effects.status.error}`,
        };
      }

      return {
        dcaId: quotedDca.id,
        success: true,
        digest: "dry-run",
        inputAmount: quotedDca.netInputAmount,
        outputAmount: BigInt(quotedDca.quote.amountOut),
        provider: quotedDca.quote.provider,
      };
    }

    const result = await client.signAndExecuteTransaction({
      transaction: tx,
      signer: keypair,
      options: { showEffects: true, showEvents: true },
    });

    if (result.effects?.status.error) {
      const error = result.effects.status.error;

      // Check if another executor already executed this DCA
      // This is expected in multi-executor environments - treat as success
      if (isAlreadyExecutedError(error)) {
        return {
          dcaId: quotedDca.id,
          success: true, // Idempotent: already done = success
          digest: result.digest,
          error: `Already executed by another executor: ${error}`,
        };
      }

      return {
        dcaId: quotedDca.id,
        success: false,
        digest: result.digest,
        error,
      };
    }

    // Extract reward from events
    let reward: bigint | undefined;
    let outputAmountActual: bigint | undefined;
    const events = result.events || [];
    const completedEvent = events.find((e) => e.type.includes("TradeCompletedEvent"));
    if (completedEvent) {
      const parsed = completedEvent.parsedJson as { executor_reward?: string; amount_out?: string };
      reward = parsed.executor_reward ? BigInt(parsed.executor_reward) : undefined;
      outputAmountActual = parsed.amount_out ? BigInt(parsed.amount_out) : undefined;
    }

    return {
      dcaId: quotedDca.id,
      success: true,
      digest: result.digest,
      reward,
      inputAmount: quotedDca.netInputAmount,
      outputAmount: outputAmountActual ?? BigInt(quotedDca.quote.amountOut),
      provider: quotedDca.quote.provider,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    // Check if race condition error (another executor won)
    if (isAlreadyExecutedError(errorMsg)) {
      return {
        dcaId: quotedDca.id,
        success: true, // Idempotent: already done = success
        error: `Already executed by another executor: ${errorMsg}`,
      };
    }

    return {
      dcaId: quotedDca.id,
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Check if a DCA is still eligible for execution
 * Useful for pre-flight checks in multi-executor environments
 */
export { verifyStillEligible };

/**
 * Execute a DCA with fresh quote
 *
 * @param dca Eligible DCA to execute
 * @returns Execution result
 */
export async function executeWithQuote(dca: EligibleDca): Promise<ExecutionResult> {
  const quotedDca = await getQuote(dca);
  if (!quotedDca) {
    return {
      dcaId: dca.id,
      success: false,
      error: "No valid quote available",
    };
  }

  return execute(quotedDca);
}
