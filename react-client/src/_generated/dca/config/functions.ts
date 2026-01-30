import type {
  Transaction,
  TransactionArgument,
  TransactionObjectInput,
  TransactionResult,
} from "@mysten/sui/transactions";
import { getPublishedAt } from "../../_envs";
import { obj, pure } from "../../_framework/util";

/** Called once when module is published. */
export function init(tx: Transaction): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::init`,
    arguments: [],
  });
}

export function assertVersion(
  tx: Transaction,
  config: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::assert_version`,
    arguments: [obj(tx, config)],
  });
}

export function assertNotPaused(
  tx: Transaction,
  config: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::assert_not_paused`,
    arguments: [obj(tx, config)],
  });
}

export function feeBps(
  tx: Transaction,
  config: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::fee_bps`,
    arguments: [obj(tx, config)],
  });
}

export function executorRewardPerTrade(
  tx: Transaction,
  config: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::executor_reward_per_trade`,
    arguments: [obj(tx, config)],
  });
}

export function maxOrdersPerAccount(
  tx: Transaction,
  config: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::max_orders_per_account`,
    arguments: [obj(tx, config)],
  });
}

export function minFundingPerTrade(
  tx: Transaction,
  config: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::min_funding_per_trade`,
    arguments: [obj(tx, config)],
  });
}

export function defaultSlippageBps(
  tx: Transaction,
  config: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::default_slippage_bps`,
    arguments: [obj(tx, config)],
  });
}

export function maxSlippageBps(
  tx: Transaction,
  config: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::max_slippage_bps`,
    arguments: [obj(tx, config)],
  });
}

export function minIntervalSeconds(
  tx: Transaction,
  config: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::min_interval_seconds`,
    arguments: [obj(tx, config)],
  });
}

export function treasury(
  tx: Transaction,
  config: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::treasury`,
    arguments: [obj(tx, config)],
  });
}

export function isPaused(
  tx: Transaction,
  config: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::is_paused`,
    arguments: [obj(tx, config)],
  });
}

export function version(
  tx: Transaction,
  config: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::version`,
    arguments: [obj(tx, config)],
  });
}

export function executorWhitelistEnabled(
  tx: Transaction,
  config: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::executor_whitelist_enabled`,
    arguments: [obj(tx, config)],
  });
}

export function whitelistedExecutors(
  tx: Transaction,
  config: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::whitelisted_executors`,
    arguments: [obj(tx, config)],
  });
}

export interface IsExecutorAllowedArgs {
  config: TransactionObjectInput;
  executor: string | TransactionArgument;
}

/**
 * Check if an executor is allowed to execute trades
 * Returns true if whitelist is disabled OR if executor is on the whitelist
 */
export function isExecutorAllowed(
  tx: Transaction,
  args: IsExecutorAllowedArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::is_executor_allowed`,
    arguments: [obj(tx, args.config), pure(tx, args.executor, `address`)],
  });
}

export interface AssertExecutorAllowedArgs {
  config: TransactionObjectInput;
  executor: string | TransactionArgument;
}

/** Assert that executor is allowed (for use in adapters) */
export function assertExecutorAllowed(
  tx: Transaction,
  args: AssertExecutorAllowedArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::assert_executor_allowed`,
    arguments: [obj(tx, args.config), pure(tx, args.executor, `address`)],
  });
}

export function totalSuiCollected(
  tx: Transaction,
  feeTracker: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::total_sui_collected`,
    arguments: [obj(tx, feeTracker)],
  });
}

export function suiBalance(
  tx: Transaction,
  feeTracker: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::sui_balance`,
    arguments: [obj(tx, feeTracker)],
  });
}

/** Create a snapshot of current config for storing in DCA account. */
export function createSnapshot(
  tx: Transaction,
  config: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::create_snapshot`,
    arguments: [obj(tx, config)],
  });
}

export function snapshotFeeBps(
  tx: Transaction,
  snapshot: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::snapshot_fee_bps`,
    arguments: [obj(tx, snapshot)],
  });
}

export function snapshotExecutorReward(
  tx: Transaction,
  snapshot: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::snapshot_executor_reward`,
    arguments: [obj(tx, snapshot)],
  });
}

export function snapshotSlippageBps(
  tx: Transaction,
  snapshot: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::snapshot_slippage_bps`,
    arguments: [obj(tx, snapshot)],
  });
}

export function snapshotTreasury(
  tx: Transaction,
  snapshot: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::snapshot_treasury`,
    arguments: [obj(tx, snapshot)],
  });
}

export interface DepositSuiArgs {
  feeTracker: TransactionObjectInput;
  sui: TransactionObjectInput;
}

/** Track SUI collected from unused executor rewards. */
export function depositSui(
  tx: Transaction,
  args: DepositSuiArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::deposit_sui`,
    arguments: [obj(tx, args.feeTracker), obj(tx, args.sui)],
  });
}

export interface AssertAdminArgs {
  config: TransactionObjectInput;
  cap: TransactionObjectInput;
}

export function assertAdmin(
  tx: Transaction,
  args: AssertAdminArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::assert_admin`,
    arguments: [obj(tx, args.config), obj(tx, args.cap)],
  });
}

export interface AssertFeeTrackerAdminArgs {
  feeTracker: TransactionObjectInput;
  cap: TransactionObjectInput;
}

export function assertFeeTrackerAdmin(
  tx: Transaction,
  args: AssertFeeTrackerAdminArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::assert_fee_tracker_admin`,
    arguments: [obj(tx, args.feeTracker), obj(tx, args.cap)],
  });
}

export interface SetFeeBpsArgs {
  config: TransactionObjectInput;
  cap: TransactionObjectInput;
  newFeeBps: bigint | TransactionArgument;
}

export function setFeeBps(
  tx: Transaction,
  args: SetFeeBpsArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::set_fee_bps`,
    arguments: [
      obj(tx, args.config),
      obj(tx, args.cap),
      pure(tx, args.newFeeBps, `u64`),
    ],
  });
}

export interface SetExecutorRewardPerTradeArgs {
  config: TransactionObjectInput;
  cap: TransactionObjectInput;
  newReward: bigint | TransactionArgument;
}

export function setExecutorRewardPerTrade(
  tx: Transaction,
  args: SetExecutorRewardPerTradeArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::set_executor_reward_per_trade`,
    arguments: [
      obj(tx, args.config),
      obj(tx, args.cap),
      pure(tx, args.newReward, `u64`),
    ],
  });
}

export interface SetMaxOrdersPerAccountArgs {
  config: TransactionObjectInput;
  cap: TransactionObjectInput;
  newLimit: bigint | TransactionArgument;
}

export function setMaxOrdersPerAccount(
  tx: Transaction,
  args: SetMaxOrdersPerAccountArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::set_max_orders_per_account`,
    arguments: [
      obj(tx, args.config),
      obj(tx, args.cap),
      pure(tx, args.newLimit, `u64`),
    ],
  });
}

export interface SetMinFundingPerTradeArgs {
  config: TransactionObjectInput;
  cap: TransactionObjectInput;
  newMinimum: bigint | TransactionArgument;
}

export function setMinFundingPerTrade(
  tx: Transaction,
  args: SetMinFundingPerTradeArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::set_min_funding_per_trade`,
    arguments: [
      obj(tx, args.config),
      obj(tx, args.cap),
      pure(tx, args.newMinimum, `u64`),
    ],
  });
}

export interface SetDefaultSlippageBpsArgs {
  config: TransactionObjectInput;
  cap: TransactionObjectInput;
  newSlippageBps: bigint | TransactionArgument;
}

export function setDefaultSlippageBps(
  tx: Transaction,
  args: SetDefaultSlippageBpsArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::set_default_slippage_bps`,
    arguments: [
      obj(tx, args.config),
      obj(tx, args.cap),
      pure(tx, args.newSlippageBps, `u64`),
    ],
  });
}

export interface SetMaxSlippageBpsArgs {
  config: TransactionObjectInput;
  cap: TransactionObjectInput;
  newMaxSlippageBps: bigint | TransactionArgument;
}

export function setMaxSlippageBps(
  tx: Transaction,
  args: SetMaxSlippageBpsArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::set_max_slippage_bps`,
    arguments: [
      obj(tx, args.config),
      obj(tx, args.cap),
      pure(tx, args.newMaxSlippageBps, `u64`),
    ],
  });
}

export interface SetMinIntervalSecondsArgs {
  config: TransactionObjectInput;
  cap: TransactionObjectInput;
  newInterval: bigint | TransactionArgument;
}

export function setMinIntervalSeconds(
  tx: Transaction,
  args: SetMinIntervalSecondsArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::set_min_interval_seconds`,
    arguments: [
      obj(tx, args.config),
      obj(tx, args.cap),
      pure(tx, args.newInterval, `u64`),
    ],
  });
}

export interface SetTreasuryArgs {
  config: TransactionObjectInput;
  cap: TransactionObjectInput;
  newTreasury: string | TransactionArgument;
}

export function setTreasury(
  tx: Transaction,
  args: SetTreasuryArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::set_treasury`,
    arguments: [
      obj(tx, args.config),
      obj(tx, args.cap),
      pure(tx, args.newTreasury, `address`),
    ],
  });
}

export interface SetPausedArgs {
  config: TransactionObjectInput;
  cap: TransactionObjectInput;
  paused: boolean | TransactionArgument;
}

export function setPaused(
  tx: Transaction,
  args: SetPausedArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::set_paused`,
    arguments: [
      obj(tx, args.config),
      obj(tx, args.cap),
      pure(tx, args.paused, `bool`),
    ],
  });
}

export interface SetWhitelistEnabledArgs {
  config: TransactionObjectInput;
  cap: TransactionObjectInput;
  enabled: boolean | TransactionArgument;
}

/** Enable or disable executor whitelist enforcement */
export function setWhitelistEnabled(
  tx: Transaction,
  args: SetWhitelistEnabledArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::set_whitelist_enabled`,
    arguments: [
      obj(tx, args.config),
      obj(tx, args.cap),
      pure(tx, args.enabled, `bool`),
    ],
  });
}

export interface AddExecutorArgs {
  config: TransactionObjectInput;
  cap: TransactionObjectInput;
  executor: string | TransactionArgument;
}

/** Add an executor to the whitelist */
export function addExecutor(
  tx: Transaction,
  args: AddExecutorArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::add_executor`,
    arguments: [
      obj(tx, args.config),
      obj(tx, args.cap),
      pure(tx, args.executor, `address`),
    ],
  });
}

export interface RemoveExecutorArgs {
  config: TransactionObjectInput;
  cap: TransactionObjectInput;
  executor: string | TransactionArgument;
}

/** Remove an executor from the whitelist */
export function removeExecutor(
  tx: Transaction,
  args: RemoveExecutorArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::remove_executor`,
    arguments: [
      obj(tx, args.config),
      obj(tx, args.cap),
      pure(tx, args.executor, `address`),
    ],
  });
}

export interface WithdrawSuiArgs {
  feeTracker: TransactionObjectInput;
  cap: TransactionObjectInput;
}

/** Admin withdraws accumulated SUI from fee tracker */
export function withdrawSui(
  tx: Transaction,
  args: WithdrawSuiArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::withdraw_sui`,
    arguments: [obj(tx, args.feeTracker), obj(tx, args.cap)],
  });
}

export interface MigrateArgs {
  config: TransactionObjectInput;
  cap: TransactionObjectInput;
}

/** Migration function - call after package upgrade */
export function migrate(tx: Transaction, args: MigrateArgs): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::migrate`,
    arguments: [obj(tx, args.config), obj(tx, args.cap)],
  });
}

export interface CreatePriceFeedRegistryArgs {
  cap: TransactionObjectInput;
  suiUsdFeedId: Array<number | TransactionArgument> | TransactionArgument;
}

/** Create a new PriceFeedRegistry (call once after deployment) */
export function createPriceFeedRegistry(
  tx: Transaction,
  args: CreatePriceFeedRegistryArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::create_price_feed_registry`,
    arguments: [obj(tx, args.cap), pure(tx, args.suiUsdFeedId, `vector<u8>`)],
  });
}

export interface AssertRegistryAdminArgs {
  registry: TransactionObjectInput;
  cap: TransactionObjectInput;
}

export function assertRegistryAdmin(
  tx: Transaction,
  args: AssertRegistryAdminArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::assert_registry_admin`,
    arguments: [obj(tx, args.registry), obj(tx, args.cap)],
  });
}

export interface RegisterDirectFeedArgs {
  registry: TransactionObjectInput;
  cap: TransactionObjectInput;
  feedId: Array<number | TransactionArgument> | TransactionArgument;
}

/** Register a direct USD price feed for a token */
export function registerDirectFeed(
  tx: Transaction,
  typeArg: string,
  args: RegisterDirectFeedArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::register_direct_feed`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.registry),
      obj(tx, args.cap),
      pure(tx, args.feedId, `vector<u8>`),
    ],
  });
}

export interface RegisterRoutedFeedArgs {
  registry: TransactionObjectInput;
  cap: TransactionObjectInput;
  feedId: Array<number | TransactionArgument> | TransactionArgument;
}

/** Register a routed price feed (e.g., TOKEN/SUI feed that routes through SUI/USD) */
export function registerRoutedFeed(
  tx: Transaction,
  typeArg: string,
  args: RegisterRoutedFeedArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::register_routed_feed`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.registry),
      obj(tx, args.cap),
      pure(tx, args.feedId, `vector<u8>`),
    ],
  });
}

export interface RemovePriceFeedArgs {
  registry: TransactionObjectInput;
  cap: TransactionObjectInput;
}

/** Remove a price feed from the registry */
export function removePriceFeed(
  tx: Transaction,
  typeArg: string,
  args: RemovePriceFeedArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::remove_price_feed`,
    typeArguments: [typeArg],
    arguments: [obj(tx, args.registry), obj(tx, args.cap)],
  });
}

export interface SetSuiUsdFeedArgs {
  registry: TransactionObjectInput;
  cap: TransactionObjectInput;
  feedId: Array<number | TransactionArgument> | TransactionArgument;
}

/** Update the SUI/USD feed ID used for routing */
export function setSuiUsdFeed(
  tx: Transaction,
  args: SetSuiUsdFeedArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::set_sui_usd_feed`,
    arguments: [
      obj(tx, args.registry),
      obj(tx, args.cap),
      pure(tx, args.feedId, `vector<u8>`),
    ],
  });
}

/** Get price feed configuration for a token type */
export function getPriceFeed(
  tx: Transaction,
  typeArg: string,
  registry: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::get_price_feed`,
    typeArguments: [typeArg],
    arguments: [obj(tx, registry)],
  });
}

/** Check if a price feed exists for a token type */
export function hasPriceFeed(
  tx: Transaction,
  typeArg: string,
  registry: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::has_price_feed`,
    typeArguments: [typeArg],
    arguments: [obj(tx, registry)],
  });
}

/** Check if a price feed requires routing (quote is SUI, not USD) */
export function requiresRouting(
  tx: Transaction,
  feed: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::requires_routing`,
    arguments: [obj(tx, feed)],
  });
}

/** Get the feed ID from a PriceFeed */
export function feedId(
  tx: Transaction,
  feed: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::feed_id`,
    arguments: [obj(tx, feed)],
  });
}

/** Get the intermediate feed ID for routing (if any) */
export function intermediateFeedId(
  tx: Transaction,
  feed: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::intermediate_feed_id`,
    arguments: [obj(tx, feed)],
  });
}

/** Get the quote currency from a PriceFeed */
export function quoteCurrency(
  tx: Transaction,
  feed: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::quote_currency`,
    arguments: [obj(tx, feed)],
  });
}

/** Get the SUI/USD feed ID from the registry */
export function suiUsdFeedId(
  tx: Transaction,
  registry: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::sui_usd_feed_id`,
    arguments: [obj(tx, registry)],
  });
}

export function emitConfigUpdated(
  tx: Transaction,
  config: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::config::emit_config_updated`,
    arguments: [obj(tx, config)],
  });
}
