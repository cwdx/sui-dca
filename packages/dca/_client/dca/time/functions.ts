import { Transaction, TransactionArgument, TransactionResult } from '@mysten/sui/transactions'
import { getPublishedAt } from '../../_envs'
import { pure } from '../../_framework/util'

export interface HasNSecondsPassedArgs {
  bTs: bigint | TransactionArgument
  aTs: bigint | TransactionArgument
  n: bigint | TransactionArgument
}

export function hasNSecondsPassed(tx: Transaction, args: HasNSecondsPassedArgs): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::time::has_n_seconds_passed`,
    arguments: [
      pure(tx, args.bTs, `u64`),
      pure(tx, args.aTs, `u64`),
      pure(tx, args.n, `u64`),
    ],
  })
}

export interface HasNMinutesPassedArgs {
  bTs: bigint | TransactionArgument
  aTs: bigint | TransactionArgument
  n: bigint | TransactionArgument
}

export function hasNMinutesPassed(tx: Transaction, args: HasNMinutesPassedArgs): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::time::has_n_minutes_passed`,
    arguments: [
      pure(tx, args.bTs, `u64`),
      pure(tx, args.aTs, `u64`),
      pure(tx, args.n, `u64`),
    ],
  })
}

export interface HasNHoursPassedArgs {
  bTs: bigint | TransactionArgument
  aTs: bigint | TransactionArgument
  n: bigint | TransactionArgument
}

export function hasNHoursPassed(tx: Transaction, args: HasNHoursPassedArgs): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::time::has_n_hours_passed`,
    arguments: [
      pure(tx, args.bTs, `u64`),
      pure(tx, args.aTs, `u64`),
      pure(tx, args.n, `u64`),
    ],
  })
}

export interface HasNDaysPassedArgs {
  bTs: bigint | TransactionArgument
  aTs: bigint | TransactionArgument
  n: bigint | TransactionArgument
}

export function hasNDaysPassed(tx: Transaction, args: HasNDaysPassedArgs): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::time::has_n_days_passed`,
    arguments: [
      pure(tx, args.bTs, `u64`),
      pure(tx, args.aTs, `u64`),
      pure(tx, args.n, `u64`),
    ],
  })
}

export interface HasNWeeksPassedArgs {
  bTs: bigint | TransactionArgument
  aTs: bigint | TransactionArgument
  n: bigint | TransactionArgument
}

export function hasNWeeksPassed(tx: Transaction, args: HasNWeeksPassedArgs): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::time::has_n_weeks_passed`,
    arguments: [
      pure(tx, args.bTs, `u64`),
      pure(tx, args.aTs, `u64`),
      pure(tx, args.n, `u64`),
    ],
  })
}

export interface HasNMonthsPassedArgs {
  bTs: bigint | TransactionArgument
  aTs: bigint | TransactionArgument
  n: bigint | TransactionArgument
}

export function hasNMonthsPassed(tx: Transaction, args: HasNMonthsPassedArgs): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::time::has_n_months_passed`,
    arguments: [
      pure(tx, args.bTs, `u64`),
      pure(tx, args.aTs, `u64`),
      pure(tx, args.n, `u64`),
    ],
  })
}

export interface HasNSecondsPassed_Args {
  bTs: bigint | TransactionArgument
  aTs: bigint | TransactionArgument
  n: bigint | TransactionArgument
  meanDeviation: bigint | TransactionArgument
}

export function hasNSecondsPassed_(
  tx: Transaction,
  args: HasNSecondsPassed_Args,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::time::has_n_seconds_passed_`,
    arguments: [
      pure(tx, args.bTs, `u64`),
      pure(tx, args.aTs, `u64`),
      pure(tx, args.n, `u64`),
      pure(tx, args.meanDeviation, `u64`),
    ],
  })
}
