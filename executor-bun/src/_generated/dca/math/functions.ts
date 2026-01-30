import { Transaction, TransactionArgument, TransactionResult } from '@mysten/sui/transactions'
import { getPublishedAt } from '../../_envs'
import { pure } from '../../_framework/util'

export interface MulArgs {
  x: bigint | TransactionArgument
  y: bigint | TransactionArgument
}

export function mul(tx: Transaction, args: MulArgs): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::math::mul`,
    arguments: [
      pure(tx, args.x, `u64`),
      pure(tx, args.y, `u64`),
    ],
  })
}

export interface DivArgs {
  x: bigint | TransactionArgument
  y: bigint | TransactionArgument
}

export function div(tx: Transaction, args: DivArgs): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::math::div`,
    arguments: [
      pure(tx, args.x, `u64`),
      pure(tx, args.y, `u64`),
    ],
  })
}
