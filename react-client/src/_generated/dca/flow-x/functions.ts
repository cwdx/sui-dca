import type {
  Transaction,
  TransactionArgument,
  TransactionObjectInput,
  TransactionResult,
} from "@mysten/sui/transactions";
import { getPublishedAt } from "../../_envs";
import { obj, pure } from "../../_framework/util";

export interface SwapExactOutputArgs {
  clock: TransactionObjectInput;
  globalConfig: TransactionObjectInput;
  pools: TransactionObjectInput;
  feeTracker: TransactionObjectInput;
  registry: TransactionObjectInput;
  inputPriceInfo: TransactionObjectInput;
  inputIntermediate: TransactionObjectInput;
  outputPriceInfo: TransactionObjectInput;
  outputIntermediate: TransactionObjectInput;
  inputFunds: TransactionObjectInput;
  inputAmount: bigint | TransactionArgument;
  exactOutput: bigint | TransactionArgument;
  recipient: string | TransactionArgument;
  sqrtPrice: bigint | TransactionArgument;
  dca: TransactionObjectInput;
  executorReward: bigint | TransactionArgument;
}

/**
 * Swap exact output with oracle-based pricing
 *
 * For input/output_intermediate: If the token has a direct USD feed, pass the same
 * object as input/output_price_info. If the token routes through SUI, pass the
 * SUI/USD PriceInfoObject.
 */
export function swapExactOutput(
  tx: Transaction,
  typeArgs: [string, string],
  args: SwapExactOutputArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::flow_x::swap_exact_output`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.clock),
      obj(tx, args.globalConfig),
      obj(tx, args.pools),
      obj(tx, args.feeTracker),
      obj(tx, args.registry),
      obj(tx, args.inputPriceInfo),
      obj(tx, args.inputIntermediate),
      obj(tx, args.outputPriceInfo),
      obj(tx, args.outputIntermediate),
      obj(tx, args.inputFunds),
      pure(tx, args.inputAmount, `u64`),
      pure(tx, args.exactOutput, `u64`),
      pure(tx, args.recipient, `address`),
      pure(tx, args.sqrtPrice, `u64`),
      obj(tx, args.dca),
      pure(tx, args.executorReward, `u64`),
    ],
  });
}

export interface SwapExactInputArgs {
  clock: TransactionObjectInput;
  globalConfig: TransactionObjectInput;
  pools: TransactionObjectInput;
  feeTracker: TransactionObjectInput;
  registry: TransactionObjectInput;
  inputPriceInfo: TransactionObjectInput;
  inputIntermediate: TransactionObjectInput;
  outputPriceInfo: TransactionObjectInput;
  outputIntermediate: TransactionObjectInput;
  inputFunds: TransactionObjectInput;
  minOutput: bigint | TransactionArgument;
  recipient: string | TransactionArgument;
  sqrtPrice: bigint | TransactionArgument;
  dca: TransactionObjectInput;
  executorReward: bigint | TransactionArgument;
}

/** Swap exact input with oracle-based pricing */
export function swapExactInput(
  tx: Transaction,
  typeArgs: [string, string],
  args: SwapExactInputArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::flow_x::swap_exact_input`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.clock),
      obj(tx, args.globalConfig),
      obj(tx, args.pools),
      obj(tx, args.feeTracker),
      obj(tx, args.registry),
      obj(tx, args.inputPriceInfo),
      obj(tx, args.inputIntermediate),
      obj(tx, args.outputPriceInfo),
      obj(tx, args.outputIntermediate),
      obj(tx, args.inputFunds),
      pure(tx, args.minOutput, `u64`),
      pure(tx, args.recipient, `address`),
      pure(tx, args.sqrtPrice, `u64`),
      obj(tx, args.dca),
      pure(tx, args.executorReward, `u64`),
    ],
  });
}

export interface SwapExactOutputDoublehopArgs {
  clock: TransactionObjectInput;
  globalConfig: TransactionObjectInput;
  pools: TransactionObjectInput;
  feeTracker: TransactionObjectInput;
  registry: TransactionObjectInput;
  inputPriceInfo: TransactionObjectInput;
  inputIntermediate: TransactionObjectInput;
  outputPriceInfo: TransactionObjectInput;
  outputIntermediate: TransactionObjectInput;
  inputFunds: TransactionObjectInput;
  inputAmount: bigint | TransactionArgument;
  exactOutput: bigint | TransactionArgument;
  recipient: string | TransactionArgument;
  sqrtPrice: bigint | TransactionArgument;
  dca: TransactionObjectInput;
  executorReward: bigint | TransactionArgument;
}

export function swapExactOutputDoublehop(
  tx: Transaction,
  typeArgs: [string, string, string],
  args: SwapExactOutputDoublehopArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::flow_x::swap_exact_output_doublehop`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.clock),
      obj(tx, args.globalConfig),
      obj(tx, args.pools),
      obj(tx, args.feeTracker),
      obj(tx, args.registry),
      obj(tx, args.inputPriceInfo),
      obj(tx, args.inputIntermediate),
      obj(tx, args.outputPriceInfo),
      obj(tx, args.outputIntermediate),
      obj(tx, args.inputFunds),
      pure(tx, args.inputAmount, `u64`),
      pure(tx, args.exactOutput, `u64`),
      pure(tx, args.recipient, `address`),
      pure(tx, args.sqrtPrice, `u64`),
      obj(tx, args.dca),
      pure(tx, args.executorReward, `u64`),
    ],
  });
}

export interface SwapExactInputDoublehopArgs {
  clock: TransactionObjectInput;
  globalConfig: TransactionObjectInput;
  pools: TransactionObjectInput;
  feeTracker: TransactionObjectInput;
  registry: TransactionObjectInput;
  inputPriceInfo: TransactionObjectInput;
  inputIntermediate: TransactionObjectInput;
  outputPriceInfo: TransactionObjectInput;
  outputIntermediate: TransactionObjectInput;
  inputFunds: TransactionObjectInput;
  minOutput: bigint | TransactionArgument;
  recipient: string | TransactionArgument;
  sqrtPrice: bigint | TransactionArgument;
  dca: TransactionObjectInput;
  executorReward: bigint | TransactionArgument;
}

export function swapExactInputDoublehop(
  tx: Transaction,
  typeArgs: [string, string, string],
  args: SwapExactInputDoublehopArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::flow_x::swap_exact_input_doublehop`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.clock),
      obj(tx, args.globalConfig),
      obj(tx, args.pools),
      obj(tx, args.feeTracker),
      obj(tx, args.registry),
      obj(tx, args.inputPriceInfo),
      obj(tx, args.inputIntermediate),
      obj(tx, args.outputPriceInfo),
      obj(tx, args.outputIntermediate),
      obj(tx, args.inputFunds),
      pure(tx, args.minOutput, `u64`),
      pure(tx, args.recipient, `address`),
      pure(tx, args.sqrtPrice, `u64`),
      obj(tx, args.dca),
      pure(tx, args.executorReward, `u64`),
    ],
  });
}

export interface SwapExactOutputTriplehopArgs {
  clock: TransactionObjectInput;
  globalConfig: TransactionObjectInput;
  pools: TransactionObjectInput;
  feeTracker: TransactionObjectInput;
  registry: TransactionObjectInput;
  inputPriceInfo: TransactionObjectInput;
  inputIntermediate: TransactionObjectInput;
  outputPriceInfo: TransactionObjectInput;
  outputIntermediate: TransactionObjectInput;
  inputFunds: TransactionObjectInput;
  inputAmount: bigint | TransactionArgument;
  exactOutput: bigint | TransactionArgument;
  recipient: string | TransactionArgument;
  sqrtPrice: bigint | TransactionArgument;
  dca: TransactionObjectInput;
  executorReward: bigint | TransactionArgument;
}

export function swapExactOutputTriplehop(
  tx: Transaction,
  typeArgs: [string, string, string, string],
  args: SwapExactOutputTriplehopArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::flow_x::swap_exact_output_triplehop`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.clock),
      obj(tx, args.globalConfig),
      obj(tx, args.pools),
      obj(tx, args.feeTracker),
      obj(tx, args.registry),
      obj(tx, args.inputPriceInfo),
      obj(tx, args.inputIntermediate),
      obj(tx, args.outputPriceInfo),
      obj(tx, args.outputIntermediate),
      obj(tx, args.inputFunds),
      pure(tx, args.inputAmount, `u64`),
      pure(tx, args.exactOutput, `u64`),
      pure(tx, args.recipient, `address`),
      pure(tx, args.sqrtPrice, `u64`),
      obj(tx, args.dca),
      pure(tx, args.executorReward, `u64`),
    ],
  });
}

export interface SwapExactInputTriplehopArgs {
  clock: TransactionObjectInput;
  globalConfig: TransactionObjectInput;
  pools: TransactionObjectInput;
  feeTracker: TransactionObjectInput;
  registry: TransactionObjectInput;
  inputPriceInfo: TransactionObjectInput;
  inputIntermediate: TransactionObjectInput;
  outputPriceInfo: TransactionObjectInput;
  outputIntermediate: TransactionObjectInput;
  inputFunds: TransactionObjectInput;
  minOutput: bigint | TransactionArgument;
  recipient: string | TransactionArgument;
  sqrtPrice: bigint | TransactionArgument;
  dca: TransactionObjectInput;
  executorReward: bigint | TransactionArgument;
}

export function swapExactInputTriplehop(
  tx: Transaction,
  typeArgs: [string, string, string, string],
  args: SwapExactInputTriplehopArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::flow_x::swap_exact_input_triplehop`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.clock),
      obj(tx, args.globalConfig),
      obj(tx, args.pools),
      obj(tx, args.feeTracker),
      obj(tx, args.registry),
      obj(tx, args.inputPriceInfo),
      obj(tx, args.inputIntermediate),
      obj(tx, args.outputPriceInfo),
      obj(tx, args.outputIntermediate),
      obj(tx, args.inputFunds),
      pure(tx, args.minOutput, `u64`),
      pure(tx, args.recipient, `address`),
      pure(tx, args.sqrtPrice, `u64`),
      obj(tx, args.dca),
      pure(tx, args.executorReward, `u64`),
    ],
  });
}
