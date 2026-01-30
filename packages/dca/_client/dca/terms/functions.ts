import {
  Transaction,
  TransactionArgument,
  TransactionObjectInput,
  TransactionResult,
} from '@mysten/sui/transactions'
import { getPublishedAt } from '../../_envs'
import { obj, pure } from '../../_framework/util'

export interface CreateTermsRegistryArgs {
  cap: TransactionObjectInput
  clock: TransactionObjectInput
  initialBlobId: Array<number | TransactionArgument> | TransactionArgument
}

/** Create a new TermsRegistry (call once after deployment) */
export function createTermsRegistry(
  tx: Transaction,
  args: CreateTermsRegistryArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::terms::create_terms_registry`,
    arguments: [
      obj(tx, args.cap),
      obj(tx, args.clock),
      pure(tx, args.initialBlobId, `vector<u8>`),
    ],
  })
}

export interface AssertAdminArgs {
  registry: TransactionObjectInput
  cap: TransactionObjectInput
}

export function assertAdmin(tx: Transaction, args: AssertAdminArgs): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::terms::assert_admin`,
    arguments: [
      obj(tx, args.registry),
      obj(tx, args.cap),
    ],
  })
}

export interface UpdateTermsArgs {
  registry: TransactionObjectInput
  cap: TransactionObjectInput
  clock: TransactionObjectInput
  newBlobId: Array<number | TransactionArgument> | TransactionArgument
}

/** Update the terms document with a new Walrus blob */
export function updateTerms(tx: Transaction, args: UpdateTermsArgs): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::terms::update_terms`,
    arguments: [
      obj(tx, args.registry),
      obj(tx, args.cap),
      obj(tx, args.clock),
      pure(tx, args.newBlobId, `vector<u8>`),
    ],
  })
}

export interface SetMinAcceptedVersionArgs {
  registry: TransactionObjectInput
  cap: TransactionObjectInput
  minVersion: bigint | TransactionArgument
}

/**
 * Set the minimum accepted version for new DCA accounts
 * This allows a grace period after terms updates
 */
export function setMinAcceptedVersion(
  tx: Transaction,
  args: SetMinAcceptedVersionArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::terms::set_min_accepted_version`,
    arguments: [
      obj(tx, args.registry),
      obj(tx, args.cap),
      pure(tx, args.minVersion, `u64`),
    ],
  })
}

/** Get the current Walrus blob ID for the terms document */
export function currentBlobId(
  tx: Transaction,
  registry: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::terms::current_blob_id`,
    arguments: [obj(tx, registry)],
  })
}

/** Get the current terms version number */
export function currentVersion(
  tx: Transaction,
  registry: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::terms::current_version`,
    arguments: [obj(tx, registry)],
  })
}

/** Get the minimum accepted version for new DCA accounts */
export function minAcceptedVersion(
  tx: Transaction,
  registry: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::terms::min_accepted_version`,
    arguments: [obj(tx, registry)],
  })
}

/** Get the number of terms versions in history */
export function historyLength(
  tx: Transaction,
  registry: TransactionObjectInput,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::terms::history_length`,
    arguments: [obj(tx, registry)],
  })
}

export interface IsVersionAcceptableArgs {
  registry: TransactionObjectInput
  version: bigint | TransactionArgument
}

/** Check if a version is acceptable for creating new DCA accounts */
export function isVersionAcceptable(
  tx: Transaction,
  args: IsVersionAcceptableArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::terms::is_version_acceptable`,
    arguments: [
      obj(tx, args.registry),
      pure(tx, args.version, `u64`),
    ],
  })
}

export interface AssertTermsAcceptableArgs {
  registry: TransactionObjectInput
  acceptedVersion: bigint | TransactionArgument
}

/** Assert that a terms version is acceptable */
export function assertTermsAcceptable(
  tx: Transaction,
  args: AssertTermsAcceptableArgs,
): TransactionResult {
  return tx.moveCall({
    target: `${getPublishedAt('dca')}::terms::assert_terms_acceptable`,
    arguments: [
      obj(tx, args.registry),
      pure(tx, args.acceptedVersion, `u64`),
    ],
  })
}
