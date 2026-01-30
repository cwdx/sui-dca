import {
  Transaction,
  TransactionArgument,
  TransactionObjectInput,
  TransactionResult,
} from '@mysten/sui/transactions'
import { getPublishedAt } from '../../_envs'
import { obj, pure } from '../../_framework/util'

export interface InitAccountArgs {
  globalConfig: TransactionObjectInput
  termsRegistry: TransactionObjectInput
  clock: TransactionObjectInput
  delegatee: string | TransactionArgument
  inputFunds: TransactionObjectInput
  every: bigint | TransactionArgument
  totalOrders: bigint | TransactionArgument
  timeScale: number | TransactionArgument
  startTimeMs: bigint | TransactionArgument
  acceptedTermsVersion: bigint | TransactionArgument
  inputDecimals: number | TransactionArgument
  outputDecimals: number | TransactionArgument
  executorRewardFunds: TransactionObjectInput
}

/**
 * Create a new DCA account with current GlobalConfig settings.
 * start_time_ms: Optional start time in milliseconds. Pass 0 to start immediately (default).
 * If non-zero, the first trade can only execute after this time + interval.
 * accepted_terms_version: The terms version the user has accepted (must meet minimum).
 * input_decimals/output_decimals: Token decimal places for oracle calculations.
 */
export function initAccount(
  tx: Transaction,
  typeArgs: [string, string],
  args: InitAccountArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::init_account`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.globalConfig),
      obj(tx, args.termsRegistry),
      obj(tx, args.clock),
      pure(tx, args.delegatee, `address`),
      obj(tx, args.inputFunds),
      pure(tx, args.every, `u64`),
      pure(tx, args.totalOrders, `u64`),
      pure(tx, args.timeScale, `u8`),
      pure(tx, args.startTimeMs, `u64`),
      pure(tx, args.acceptedTermsVersion, `u64`),
      pure(tx, args.inputDecimals, `u8`),
      pure(tx, args.outputDecimals, `u8`),
      obj(tx, args.executorRewardFunds),
    ],
  })
}

export interface NewArgs {
  globalConfig: TransactionObjectInput
  termsRegistry: TransactionObjectInput
  clock: TransactionObjectInput
  delegatee: string | TransactionArgument
  inputFunds: TransactionObjectInput
  every: bigint | TransactionArgument
  totalOrders: bigint | TransactionArgument
  timeScale: number | TransactionArgument
  startTimeMs: bigint | TransactionArgument
  acceptedTermsVersion: bigint | TransactionArgument
  inputDecimals: number | TransactionArgument
  outputDecimals: number | TransactionArgument
  executorRewardFunds: TransactionObjectInput
}

/**
 * Create a new DCA account.
 * start_time_ms: Optional start time in milliseconds. Pass 0 to start immediately (default).
 * If non-zero, the first trade can only execute after this time + interval.
 * accepted_terms_version: The terms version the user has accepted (must meet minimum).
 * input_decimals/output_decimals: Token decimal places for oracle calculations.
 */
export function new_(
  tx: Transaction,
  typeArgs: [string, string],
  args: NewArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::new`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.globalConfig),
      obj(tx, args.termsRegistry),
      obj(tx, args.clock),
      pure(tx, args.delegatee, `address`),
      obj(tx, args.inputFunds),
      pure(tx, args.every, `u64`),
      pure(tx, args.totalOrders, `u64`),
      pure(tx, args.timeScale, `u8`),
      pure(tx, args.startTimeMs, `u64`),
      pure(tx, args.acceptedTermsVersion, `u64`),
      pure(tx, args.inputDecimals, `u8`),
      pure(tx, args.outputDecimals, `u8`),
      obj(tx, args.executorRewardFunds),
    ],
  })
}

export interface InitTradeArgs {
  dca: TransactionObjectInput
  clock: TransactionObjectInput
  registry: TransactionObjectInput
  inputPriceInfo: TransactionObjectInput
  inputIntermediate: TransactionObjectInput
  outputPriceInfo: TransactionObjectInput
  outputIntermediate: TransactionObjectInput
}

/**
 * Initialize a trade with oracle-based min_output calculation.
 * Restricted to friend modules (whitelisted adapters) for security.
 * This prevents malicious executors from stealing user funds by not completing swaps.
 * Caller gets executor reward as incentive. Fee is deducted and sent to treasury.
 *
 * Parameters:
 * - dca: The DCA account
 * - clock: System clock
 * - registry: Price feed registry for oracle lookups
 * - input_price_info: Pyth price info for input token
 * - input_intermediate: Intermediate price info for routing (pass same as input_price_info if direct USD feed)
 * - output_price_info: Pyth price info for output token
 * - output_intermediate: Intermediate price info for routing (pass same as output_price_info if direct USD feed)
 * - ctx: Transaction context
 * Oracle-aware init_trade - callable from PTBs or friend modules
 * The oracle validates prices, so this is safe to make public
 */
export function initTrade(
  tx: Transaction,
  typeArgs: [string, string],
  args: InitTradeArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::init_trade`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.dca),
      obj(tx, args.clock),
      obj(tx, args.registry),
      obj(tx, args.inputPriceInfo),
      obj(tx, args.inputIntermediate),
      obj(tx, args.outputPriceInfo),
      obj(tx, args.outputIntermediate),
    ],
  })
}

export interface InitTradeLegacyArgs {
  dca: TransactionObjectInput
  clock: TransactionObjectInput
}

/**
 * Legacy init_trade without oracle (for backward compatibility during migration)
 * DEPRECATED: Use init_trade with oracle parameters instead.
 */
export function initTradeLegacy(
  tx: Transaction,
  typeArgs: [string, string],
  args: InitTradeLegacyArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::init_trade_legacy`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.dca),
      obj(tx, args.clock),
    ],
  })
}

export interface ResolveTradeArgs {
  dca: TransactionObjectInput
  feeTracker: TransactionObjectInput
  promise: TransactionObjectInput
  outputAmount: bigint | TransactionArgument
  executorReward: bigint | TransactionArgument
}

/**
 * Resolve a trade. Called after swap completes.
 * executor_reward is validated against the snapshotted budget to prevent theft.
 * output_amount is the actual amount received from the DEX (for event tracking).
 * Safe to make public because:
 * 1. TradePromise hot-potato must come from init_trade in same PTB
 * 2. executor_reward is capped at snapshotted maximum
 */
export function resolveTrade(
  tx: Transaction,
  typeArgs: [string, string],
  args: ResolveTradeArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::resolve_trade`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.dca),
      obj(tx, args.feeTracker),
      obj(tx, args.promise),
      pure(tx, args.outputAmount, `u64`),
      pure(tx, args.executorReward, `u64`),
    ],
  })
}

export interface EmitDeactivationEventArgs {
  dca: TransactionObjectInput
  reason: number | TransactionArgument
}

/** Helper to emit deactivation event */
export function emitDeactivationEvent(
  tx: Transaction,
  typeArgs: [string, string],
  args: EmitDeactivationEventArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::emit_deactivation_event`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.dca),
      pure(tx, args.reason, `u8`),
    ],
  })
}

export interface FeeAmountWithBpsArgs {
  grossAmount: bigint | TransactionArgument
  feeBps: bigint | TransactionArgument
}

export function feeAmountWithBps(tx: Transaction, args: FeeAmountWithBpsArgs): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::fee_amount_with_bps`,
    arguments: [
      pure(tx, args.grossAmount, `u64`),
      pure(tx, args.feeBps, `u64`),
    ],
  })
}

export interface NetTradeAmountWithBpsArgs {
  grossAmount: bigint | TransactionArgument
  feeBps: bigint | TransactionArgument
}

export function netTradeAmountWithBps(
  tx: Transaction,
  args: NetTradeAmountWithBpsArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::net_trade_amount_with_bps`,
    arguments: [
      pure(tx, args.grossAmount, `u64`),
      pure(tx, args.feeBps, `u64`),
    ],
  })
}

export function owner(
  tx: Transaction,
  typeArgs: [string, string],
  dca: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::owner`,
    typeArguments: typeArgs,
    arguments: [obj(tx, dca)],
  })
}

export function delegatee(
  tx: Transaction,
  typeArgs: [string, string],
  dca: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::delegatee`,
    typeArguments: typeArgs,
    arguments: [obj(tx, dca)],
  })
}

export function startTimeMs(
  tx: Transaction,
  typeArgs: [string, string],
  dca: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::start_time_ms`,
    typeArguments: typeArgs,
    arguments: [obj(tx, dca)],
  })
}

export function initialOrders(
  tx: Transaction,
  typeArgs: [string, string],
  dca: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::initial_orders`,
    typeArguments: typeArgs,
    arguments: [obj(tx, dca)],
  })
}

export function remainingOrders(
  tx: Transaction,
  typeArgs: [string, string],
  dca: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::remaining_orders`,
    typeArguments: typeArgs,
    arguments: [obj(tx, dca)],
  })
}

export function active(
  tx: Transaction,
  typeArgs: [string, string],
  dca: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::active`,
    typeArguments: typeArgs,
    arguments: [obj(tx, dca)],
  })
}

export function feeBps(
  tx: Transaction,
  typeArgs: [string, string],
  dca: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::fee_bps`,
    typeArguments: typeArgs,
    arguments: [obj(tx, dca)],
  })
}

export function executorRewardPerTrade(
  tx: Transaction,
  typeArgs: [string, string],
  dca: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::executor_reward_per_trade`,
    typeArguments: typeArgs,
    arguments: [obj(tx, dca)],
  })
}

export function defaultSlippageBps(
  tx: Transaction,
  typeArgs: [string, string],
  dca: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::default_slippage_bps`,
    typeArguments: typeArgs,
    arguments: [obj(tx, dca)],
  })
}

/** Get effective slippage: custom if set, otherwise default from config */
export function effectiveSlippageBps(
  tx: Transaction,
  typeArgs: [string, string],
  dca: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::effective_slippage_bps`,
    typeArguments: typeArgs,
    arguments: [obj(tx, dca)],
  })
}

export function tradeInput(
  tx: Transaction,
  typeArgs: [string, string],
  promise: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::trade_input`,
    typeArguments: typeArgs,
    arguments: [obj(tx, promise)],
  })
}

export function tradeMinOutput(
  tx: Transaction,
  typeArgs: [string, string],
  promise: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::trade_min_output`,
    typeArguments: typeArgs,
    arguments: [obj(tx, promise)],
  })
}

export function acceptedTermsVersion(
  tx: Transaction,
  typeArgs: [string, string],
  dca: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::accepted_terms_version`,
    typeArguments: typeArgs,
    arguments: [obj(tx, dca)],
  })
}

export function inputDecimals(
  tx: Transaction,
  typeArgs: [string, string],
  dca: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::input_decimals`,
    typeArguments: typeArgs,
    arguments: [obj(tx, dca)],
  })
}

export function outputDecimals(
  tx: Transaction,
  typeArgs: [string, string],
  dca: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::output_decimals`,
    typeArguments: typeArgs,
    arguments: [obj(tx, dca)],
  })
}

export interface ComputeSplitAllocationArgs {
  inputAmount: bigint | TransactionArgument
  orders: bigint | TransactionArgument
}

export function computeSplitAllocation(
  tx: Transaction,
  args: ComputeSplitAllocationArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::compute_split_allocation`,
    arguments: [
      pure(tx, args.inputAmount, `u64`),
      pure(tx, args.orders, `u64`),
    ],
  })
}

export interface IntervalToSecondsArgs {
  every: bigint | TransactionArgument
  timeScale: number | TransactionArgument
}

/** Convert every + time_scale to seconds for interval validation */
export function intervalToSeconds(tx: Transaction, args: IntervalToSecondsArgs): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::interval_to_seconds`,
    arguments: [
      pure(tx, args.every, `u64`),
      pure(tx, args.timeScale, `u8`),
    ],
  })
}

export interface GetMinOutputAmountArgs {
  dca: TransactionObjectInput
  inputAmount: bigint | TransactionArgument
}

export function getMinOutputAmount(
  tx: Transaction,
  typeArgs: [string, string],
  args: GetMinOutputAmountArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::get_min_output_amount`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.dca),
      pure(tx, args.inputAmount, `u64`),
    ],
  })
}

export function setInactiveAndReset(
  tx: Transaction,
  typeArgs: [string, string],
  dca: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::set_inactive_and_reset`,
    typeArguments: typeArgs,
    arguments: [obj(tx, dca)],
  })
}

export function assertActive(
  tx: Transaction,
  typeArgs: [string, string],
  dca: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::assert_active`,
    typeArguments: typeArgs,
    arguments: [obj(tx, dca)],
  })
}

export function assertDelegatee(
  tx: Transaction,
  typeArgs: [string, string],
  dca: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::assert_delegatee`,
    typeArguments: typeArgs,
    arguments: [obj(tx, dca)],
  })
}

export function assertTimeScale(
  tx: Transaction,
  timeScale: number | TransactionArgument,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::assert_time_scale`,
    arguments: [pure(tx, timeScale, `u8`)],
  })
}

export interface AssertEveryArgs {
  every: bigint | TransactionArgument
  timeScale: number | TransactionArgument
}

export function assertEvery(tx: Transaction, args: AssertEveryArgs): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::assert_every`,
    arguments: [
      pure(tx, args.every, `u64`),
      pure(tx, args.timeScale, `u8`),
    ],
  })
}

export interface AssertTimeArgs {
  currentTs: bigint | TransactionArgument
  lastTs: bigint | TransactionArgument
  every: bigint | TransactionArgument
  timeScale: number | TransactionArgument
}

export function assertTime(tx: Transaction, args: AssertTimeArgs): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::assert_time`,
    arguments: [
      pure(tx, args.currentTs, `u64`),
      pure(tx, args.lastTs, `u64`),
      pure(tx, args.every, `u64`),
      pure(tx, args.timeScale, `u8`),
    ],
  })
}

export interface AssertMaxPriceViaOutputArgs {
  outputAmount: bigint | TransactionArgument
  promise: TransactionObjectInput
}

export function assertMaxPriceViaOutput(
  tx: Transaction,
  typeArgs: [string, string],
  args: AssertMaxPriceViaOutputArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::assert_max_price_via_output`,
    typeArguments: typeArgs,
    arguments: [
      pure(tx, args.outputAmount, `u64`),
      obj(tx, args.promise),
    ],
  })
}

export function assertOwner(
  tx: Transaction,
  typeArgs: [string, string],
  dca: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::assert_owner`,
    typeArguments: typeArgs,
    arguments: [obj(tx, dca)],
  })
}

export function assertOwnerOrDelegatee(
  tx: Transaction,
  typeArgs: [string, string],
  dca: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::assert_owner_or_delegatee`,
    typeArguments: typeArgs,
    arguments: [obj(tx, dca)],
  })
}

export interface SetDelegateeArgs {
  dca: TransactionObjectInput
  newDelegatee: string | TransactionArgument
}

/** Owner can change the delegatee address */
export function setDelegatee(
  tx: Transaction,
  typeArgs: [string, string],
  args: SetDelegateeArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::set_delegatee`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.dca),
      pure(tx, args.newDelegatee, `address`),
    ],
  })
}

export interface SetSlippageArgs {
  dca: TransactionObjectInput
  globalConfig: TransactionObjectInput
  slippageBps: bigint | TransactionArgument
}

/**
 * Owner can set custom slippage tolerance (overrides default)
 * Slippage must be within protocol's max_slippage_bps limit
 */
export function setSlippage(
  tx: Transaction,
  typeArgs: [string, string],
  args: SetSlippageArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::set_slippage`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.dca),
      obj(tx, args.globalConfig),
      pure(tx, args.slippageBps, `u64`),
    ],
  })
}

/** Owner can reset slippage to use default from config */
export function resetSlippage(
  tx: Transaction,
  typeArgs: [string, string],
  dca: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::reset_slippage`,
    typeArguments: typeArgs,
    arguments: [obj(tx, dca)],
  })
}

/** Owner can pause their DCA account at any time */
export function setInactive(
  tx: Transaction,
  typeArgs: [string, string],
  dca: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::set_inactive`,
    typeArguments: typeArgs,
    arguments: [obj(tx, dca)],
  })
}

/** Owner can reactivate their DCA account if it has funds and remaining orders */
export function reactivateAsOwner(
  tx: Transaction,
  typeArgs: [string, string],
  dca: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::reactivate_as_owner`,
    typeArguments: typeArgs,
    arguments: [obj(tx, dca)],
  })
}

/** Owner can withdraw all funds and deactivate - effectively canceling the DCA */
export function redeemFundsAndDeactivate(
  tx: Transaction,
  typeArgs: [string, string],
  dca: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::redeem_funds_and_deactivate`,
    typeArguments: typeArgs,
    arguments: [obj(tx, dca)],
  })
}

export interface WithdrawInputArgs {
  dca: TransactionObjectInput
  amount: bigint | TransactionArgument
  decreaseOrders: bigint | TransactionArgument
}

/** Owner can partially withdraw input funds (reducing remaining orders proportionally) */
export function withdrawInput(
  tx: Transaction,
  typeArgs: [string, string],
  args: WithdrawInputArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::withdraw_input`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.dca),
      pure(tx, args.amount, `u64`),
      pure(tx, args.decreaseOrders, `u64`),
    ],
  })
}

export interface AddExecutorRewardArgs {
  dca: TransactionObjectInput
  rewardFunds: TransactionObjectInput
}

/** Owner can add more executor reward balance to the account */
export function addExecutorReward(
  tx: Transaction,
  typeArgs: [string, string],
  args: AddExecutorRewardArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::add_executor_reward`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.dca),
      obj(tx, args.rewardFunds),
    ],
  })
}

export function checkVersionAndUpgrade(
  tx: Transaction,
  typeArgs: [string, string],
  dca: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::dca::check_version_and_upgrade`,
    typeArguments: typeArgs,
    arguments: [obj(tx, dca)],
  })
}
