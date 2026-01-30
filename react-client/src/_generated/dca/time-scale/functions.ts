import type { Transaction, TransactionResult } from "@mysten/sui/transactions";
import { getPublishedAt } from "../../_envs";

export function second(tx: Transaction): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::time_scale::second`,
    arguments: [],
  });
}

export function minute(tx: Transaction): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::time_scale::minute`,
    arguments: [],
  });
}

export function hour(tx: Transaction): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::time_scale::hour`,
    arguments: [],
  });
}

export function day(tx: Transaction): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::time_scale::day`,
    arguments: [],
  });
}

export function week(tx: Transaction): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::time_scale::week`,
    arguments: [],
  });
}

export function month(tx: Transaction): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt("dca")}::time_scale::month`,
    arguments: [],
  });
}
