/**
 * DCA Discovery Handler
 *
 * Discovers eligible DCAs with pagination support for handling large numbers of accounts.
 *
 * Scalability (handles 10k+ DCAs):
 * - Paginated event queries (100 per page)
 * - Concurrent object fetching with p-map (controlled concurrency)
 * - Streaming pagination for memory efficiency
 * - Batched RPC calls to avoid rate limits
 */

import pMap from "p-map";
import { getSuiClient, timeScaleToMs } from "../lib/client.js";
import { getConfig } from "../lib/config.js";
import type { DcaAccount, EligibleDca, DiscoveryOptions, DiscoveryResult } from "../lib/types.js";

const DEFAULT_PAGE_SIZE = 50;
const MAX_EVENTS_PER_QUERY = 100;
const FETCH_CONCURRENCY = 10; // Concurrent object fetches
const MULTI_GET_BATCH_SIZE = 50; // Objects per multiGetObjects call

/**
 * Parse DCA object into account structure
 */
function parseDcaObject(obj: any, dcaId: string): DcaAccount | null {
  try {
    if (!obj?.data?.content || obj.data.content.dataType !== "moveObject") {
      return null;
    }

    const fields = (obj.data.content as any).fields;
    const dcaType = obj.data.content.type;

    const typeMatch = dcaType.match(/<(.+),\s*(.+)>/);
    if (!typeMatch) return null;

    const tradeParams = fields.trade_params?.fields;
    const customSlippageBps = tradeParams?.slippage_bps ? parseInt(tradeParams.slippage_bps) : null;
    const defaultSlippageBps = parseInt(fields.config_snapshot.fields.default_slippage_bps);
    const feeBps = parseInt(fields.config_snapshot.fields.fee_bps);

    return {
      id: dcaId,
      owner: fields.owner,
      delegatee: fields.delegatee,
      active: fields.active,
      remainingOrders: parseInt(fields.remaining_orders),
      inputBalance: BigInt(fields.input_balance),
      splitAllocation: BigInt(fields.split_allocation),
      lastTimeMs: BigInt(fields.last_time_ms),
      every: parseInt(fields.every),
      timeScale: fields.time_scale,
      inputType: typeMatch[1].trim(),
      outputType: typeMatch[2].trim(),
      executorRewardPerTrade: BigInt(fields.config_snapshot.fields.executor_reward_per_trade),
      customSlippageBps,
      defaultSlippageBps,
      feeBps,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch multiple DCA objects in batches using multiGetObjects
 * More efficient than individual getObject calls
 */
async function fetchDcaObjectsBatched(dcaIds: string[]): Promise<DcaAccount[]> {
  const client = getSuiClient();
  const accounts: DcaAccount[] = [];

  // Process in batches using p-map for controlled concurrency
  const batches: string[][] = [];
  for (let i = 0; i < dcaIds.length; i += MULTI_GET_BATCH_SIZE) {
    batches.push(dcaIds.slice(i, i + MULTI_GET_BATCH_SIZE));
  }

  const batchResults = await pMap(
    batches,
    async (batchIds) => {
      const objects = await client.multiGetObjects({
        ids: batchIds,
        options: { showContent: true, showType: true },
      });

      const batchAccounts: DcaAccount[] = [];
      for (let i = 0; i < objects.length; i++) {
        const account = parseDcaObject(objects[i], batchIds[i]);
        if (account) {
          batchAccounts.push(account);
        }
      }
      return batchAccounts;
    },
    { concurrency: FETCH_CONCURRENCY }
  );

  for (const batch of batchResults) {
    accounts.push(...batch);
  }

  return accounts;
}

/**
 * Discover DCA accounts from on-chain events with pagination
 */
async function discoverDcaAccountsPage(cursor?: string): Promise<{ dcaIds: string[]; nextCursor?: string }> {
  const client = getSuiClient();
  const config = getConfig();

  const events = await client.queryEvents({
    query: {
      MoveEventType: `${config.dcaPackage}::dca::DCACreatedEvent`,
    },
    cursor: cursor ? { txDigest: cursor, eventSeq: "0" } : undefined,
    limit: MAX_EVENTS_PER_QUERY,
    order: "descending",
  });

  const dcaIds = events.data.map((event) => (event.parsedJson as { id: string }).id);

  return {
    dcaIds,
    nextCursor: events.hasNextPage ? events.nextCursor?.txDigest : undefined,
  };
}

/**
 * Discover all DCA accounts from on-chain events (single page)
 */
async function discoverAllDcaAccounts(cursor?: string): Promise<{ accounts: DcaAccount[]; nextCursor?: string }> {
  const { dcaIds, nextCursor } = await discoverDcaAccountsPage(cursor);

  if (dcaIds.length === 0) {
    return { accounts: [], nextCursor };
  }

  const accounts = await fetchDcaObjectsBatched(dcaIds);

  return { accounts, nextCursor };
}

/**
 * Filter accounts to find eligible DCAs
 */
function filterEligibleDcas(accounts: DcaAccount[], options?: DiscoveryOptions): EligibleDca[] {
  const now = BigInt(Date.now());
  const eligible: EligibleDca[] = [];

  for (const account of accounts) {
    // Skip inactive or completed DCAs
    if (!account.active || account.remainingOrders === 0 || account.inputBalance === 0n) {
      continue;
    }

    // Apply filters
    if (options?.inputType && account.inputType !== options.inputType) {
      continue;
    }
    if (options?.outputType && account.outputType !== options.outputType) {
      continue;
    }
    if (options?.owner && account.owner !== options.owner) {
      continue;
    }

    // Check if eligible for execution
    const intervalMs = timeScaleToMs(account.every, account.timeScale);
    const nextExecutionMs = account.lastTimeMs + intervalMs;
    const msUntilEligible = nextExecutionMs - now;

    if (msUntilEligible <= 0n) {
      eligible.push({
        ...account,
        nextExecutionMs,
        msUntilEligible,
      });
    }
  }

  // Sort by most overdue first
  eligible.sort((a, b) => Number(a.msUntilEligible - b.msUntilEligible));

  return eligible;
}

/**
 * Discover eligible DCAs with pagination
 *
 * @param options Discovery options including pagination
 * @returns Discovery result with eligible DCAs and pagination info
 */
export async function discover(options?: DiscoveryOptions): Promise<DiscoveryResult> {
  const limit = options?.limit ?? DEFAULT_PAGE_SIZE;
  let cursor = options?.cursor;
  let totalDiscovered = 0;
  const allEligible: EligibleDca[] = [];

  // Paginate through all DCA events until we have enough eligible DCAs
  while (allEligible.length < limit) {
    const { accounts, nextCursor } = await discoverAllDcaAccounts(cursor);
    totalDiscovered += accounts.length;

    const eligible = filterEligibleDcas(accounts, options);
    allEligible.push(...eligible);

    if (!nextCursor) {
      // No more events to process
      break;
    }
    cursor = nextCursor;
  }

  // Limit results and prepare pagination
  const limitedEligible = allEligible.slice(0, limit);
  const hasMore = allEligible.length > limit || cursor !== undefined;

  return {
    dcas: limitedEligible,
    hasMore,
    nextCursor: hasMore && limitedEligible.length > 0 ? limitedEligible[limitedEligible.length - 1].id : undefined,
    totalDiscovered,
    totalEligible: allEligible.length,
  };
}

/**
 * Discover all eligible DCAs (no pagination limit)
 * Use with caution - may be slow with many DCAs
 */
export async function discoverAll(options?: Omit<DiscoveryOptions, "limit" | "cursor">): Promise<EligibleDca[]> {
  const allEligible: EligibleDca[] = [];
  let cursor: string | undefined;

  do {
    const { accounts, nextCursor } = await discoverAllDcaAccounts(cursor);
    const eligible = filterEligibleDcas(accounts, options);
    allEligible.push(...eligible);
    cursor = nextCursor;
  } while (cursor);

  return allEligible;
}

/**
 * Count eligible DCAs without fetching full details
 */
export async function countEligible(options?: Omit<DiscoveryOptions, "limit" | "cursor">): Promise<number> {
  const all = await discoverAll(options);
  return all.length;
}

/**
 * Async generator for streaming discovery of eligible DCAs
 * Memory-efficient for very large datasets (10k+ DCAs)
 *
 * @example
 * ```ts
 * for await (const dca of discoverStream({ inputType: "0x2::sui::SUI" })) {
 *   console.log(`Found eligible DCA: ${dca.id}`);
 *   // Process immediately, don't accumulate in memory
 * }
 * ```
 */
export async function* discoverStream(
  options?: Omit<DiscoveryOptions, "limit" | "cursor">
): AsyncGenerator<EligibleDca, void, unknown> {
  let cursor: string | undefined;

  do {
    const { accounts, nextCursor } = await discoverAllDcaAccounts(cursor);
    const eligible = filterEligibleDcas(accounts, options);

    for (const dca of eligible) {
      yield dca;
    }

    cursor = nextCursor;
  } while (cursor);
}

/**
 * Discover eligible DCAs with callback for each found
 * Useful for processing as they're found without accumulating
 *
 * @example
 * ```ts
 * await discoverWithCallback(
 *   (dca) => queue.add(dca),
 *   { inputType: "0x2::sui::SUI" }
 * );
 * ```
 */
export async function discoverWithCallback(
  callback: (dca: EligibleDca) => void | Promise<void>,
  options?: Omit<DiscoveryOptions, "limit" | "cursor">
): Promise<{ totalDiscovered: number; totalEligible: number }> {
  let cursor: string | undefined;
  let totalDiscovered = 0;
  let totalEligible = 0;

  do {
    const { accounts, nextCursor } = await discoverAllDcaAccounts(cursor);
    totalDiscovered += accounts.length;

    const eligible = filterEligibleDcas(accounts, options);
    totalEligible += eligible.length;

    // Process eligible DCAs with p-map for controlled concurrency
    await pMap(eligible, callback, { concurrency: FETCH_CONCURRENCY });

    cursor = nextCursor;
  } while (cursor);

  return { totalDiscovered, totalEligible };
}
