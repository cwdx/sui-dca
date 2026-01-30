import {
  Transaction,
  TransactionArgument,
  TransactionObjectInput,
  TransactionResult,
} from '@mysten/sui/transactions'
import { getPublishedAt } from '../../_envs'
import { obj, pure } from '../../_framework/util'

export interface CalculateMinOutputArgs {
  clock: TransactionObjectInput
  registry: TransactionObjectInput
  inputPriceInfo: TransactionObjectInput
  inputIntermediate: TransactionObjectInput
  outputPriceInfo: TransactionObjectInput
  outputIntermediate: TransactionObjectInput
  inputAmount: bigint | TransactionArgument
  slippageBps: bigint | TransactionArgument
  inputDecimals: number | TransactionArgument
  outputDecimals: number | TransactionArgument
}

/**
 * Calculate minimum output amount using Pyth oracle prices with slippage
 * This is the main function called during trade execution
 *
 * Parameters:
 * - clock: System clock for price staleness check
 * - registry: Price feed registry
 * - input_price_info: Pyth price info object for input token
 * - input_intermediate: Intermediate price info for routing (pass same as input_price_info if direct USD feed)
 * - output_price_info: Pyth price info object for output token
 * - output_intermediate: Intermediate price info for routing (pass same as output_price_info if direct USD feed)
 * - input_amount: Amount of input tokens to trade
 * - slippage_bps: Slippage tolerance in basis points
 * - input_decimals: Decimal places for input token
 * - output_decimals: Decimal places for output token
 *
 * Note: For tokens with direct USD feeds, pass the same object as both primary and intermediate.
 * The oracle checks the feed config to determine if routing is actually needed.
 *
 * Returns: Minimum output amount after slippage
 */
export function calculateMinOutput(
  tx: Transaction,
  typeArgs: [string, string],
  args: CalculateMinOutputArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::oracle::calculate_min_output`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.clock),
      obj(tx, args.registry),
      obj(tx, args.inputPriceInfo),
      obj(tx, args.inputIntermediate),
      obj(tx, args.outputPriceInfo),
      obj(tx, args.outputIntermediate),
      pure(tx, args.inputAmount, `u64`),
      pure(tx, args.slippageBps, `u64`),
      pure(tx, args.inputDecimals, `u8`),
      pure(tx, args.outputDecimals, `u8`),
    ],
  })
}

export interface GetUsdPriceArgs {
  clock: TransactionObjectInput
  priceInfo: TransactionObjectInput
  feedConfig: TransactionObjectInput
  intermediatePriceInfo: TransactionObjectInput
}

/**
 * Get USD price for a token, handling routing if needed
 * Returns (price, exponent) where actual_price = price * 10^exponent
 *
 * Note: intermediate_price_info is always passed but only used if feed_config requires routing.
 * For direct USD feeds, the caller should pass the same object for both price_info and intermediate.
 */
export function getUsdPrice(tx: Transaction, args: GetUsdPriceArgs): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::oracle::get_usd_price`,
    arguments: [
      obj(tx, args.clock),
      obj(tx, args.priceInfo),
      obj(tx, args.feedConfig),
      obj(tx, args.intermediatePriceInfo),
    ],
  })
}

export interface MultiplyPricesArgs {
  price1: TransactionObjectInput
  price2: TransactionObjectInput
}

/**
 * Multiply two prices together for routing
 * token_sui * sui_usd = token_usd
 */
export function multiplyPrices(tx: Transaction, args: MultiplyPricesArgs): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::oracle::multiply_prices`,
    arguments: [
      obj(tx, args.price1),
      obj(tx, args.price2),
    ],
  })
}

export interface AddExponentsArgs {
  e1: TransactionObjectInput
  e2: TransactionObjectInput
  adjustment: bigint | TransactionArgument
}

/**
 * Add two I64 exponents and add an adjustment
 * result = e1 + e2 + adjustment (adjustment compensates for PRECISION division)
 */
export function addExponents(tx: Transaction, args: AddExponentsArgs): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::oracle::add_exponents`,
    arguments: [
      obj(tx, args.e1),
      obj(tx, args.e2),
      pure(tx, args.adjustment, `u64`),
    ],
  })
}

export interface CalculateFairOutputArgs {
  inputAmount: bigint | TransactionArgument
  inputPrice: bigint | TransactionArgument
  inputExpo: TransactionObjectInput
  outputPrice: bigint | TransactionArgument
  outputExpo: TransactionObjectInput
  inputDecimals: number | TransactionArgument
  outputDecimals: number | TransactionArgument
}

/**
 * Calculate fair output amount with decimal normalization
 * fair_output = input_amount * input_price / output_price * decimal_adjustment
 */
export function calculateFairOutput(
  tx: Transaction,
  args: CalculateFairOutputArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::oracle::calculate_fair_output`,
    arguments: [
      pure(tx, args.inputAmount, `u64`),
      pure(tx, args.inputPrice, `u64`),
      obj(tx, args.inputExpo),
      pure(tx, args.outputPrice, `u64`),
      obj(tx, args.outputExpo),
      pure(tx, args.inputDecimals, `u8`),
      pure(tx, args.outputDecimals, `u8`),
    ],
  })
}

export interface AdjustForExponentsArgs {
  value: bigint | TransactionArgument
  inputExpo: TransactionObjectInput
  outputExpo: TransactionObjectInput
}

/** Adjust value for price exponent differences */
export function adjustForExponents(
  tx: Transaction,
  args: AdjustForExponentsArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::oracle::adjust_for_exponents`,
    arguments: [
      pure(tx, args.value, `u128`),
      obj(tx, args.inputExpo),
      obj(tx, args.outputExpo),
    ],
  })
}

export interface AdjustForDecimalsArgs {
  value: bigint | TransactionArgument
  inputDecimals: number | TransactionArgument
  outputDecimals: number | TransactionArgument
}

/** Adjust for token decimal differences */
export function adjustForDecimals(tx: Transaction, args: AdjustForDecimalsArgs): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::oracle::adjust_for_decimals`,
    arguments: [
      pure(tx, args.value, `u128`),
      pure(tx, args.inputDecimals, `u8`),
      pure(tx, args.outputDecimals, `u8`),
    ],
  })
}

/** Power of 10 helper */
export function pow10(tx: Transaction, exp: bigint | TransactionArgument): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::oracle::pow10`,
    arguments: [pure(tx, exp, `u64`)],
  })
}
