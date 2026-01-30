/**
 * DCA Executor - Bun TypeScript
 *
 * Permissionless executor for DCA trades using 7k Protocol.
 *
 * Features:
 * - Sequential execution: Reliable one-at-a-time swap execution
 * - Multi-aggregator support: 7k (FlowX, Cetus, Bluefin, Momentum, Steamm)
 * - Configurable slippage read from on-chain DCA config
 * - Executor rewards for permissionless execution
 *
 * Note on Batching:
 * - True PTB batching of multiple 7k swaps is NOT reliable
 * - 7k's settle function checks `coin_out >= min_out` per swap
 * - When multiple swaps hit overlapping pools, first swap changes state
 * - Subsequent swaps get less output than quoted → settle error 0
 * - Sequential execution is the reliable approach
 *
 * Usage:
 *   bun run src/executor.ts              # Execute eligible DCAs
 *   bun run src/executor.ts --discover   # Just discover, don't execute
 */

import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Transaction, TransactionObjectArgument } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { MetaAg, EProvider, type MetaQuote } from "@7kprotocol/sdk-ts";
import { SuiPriceServiceConnection, SuiPythClient } from "@pythnetwork/pyth-sui-js";

// ============ Config ============

const config = {
  network: process.env.SUI_NETWORK || "mainnet",
  rpcUrl: process.env.SUI_RPC_URL || getFullnodeUrl("mainnet"),

  // DCA Contract addresses (v4 - Oracle-based pricing)
  dcaPackage: process.env.DCA_PACKAGE_ID || "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
  globalConfig: process.env.GLOBAL_CONFIG_ID || "0xe9f6adaea71cee4a1d4a3e48e7a42be8d2aa66f1f21e02ffa38e447d6bf3c13a",
  feeTracker: process.env.FEE_TRACKER_ID || "0x5a840524e2c1cad27da155c6cdeff4652b76bcef1c7aad6f1ce51710e8397057",
  priceFeedRegistry: process.env.PRICE_FEED_REGISTRY_ID || "0xdb8054678f011b6a9d5dbe72b92817bfa904c00729b9c64cc0158ebc2c27d0e0",
  termsRegistry: process.env.TERMS_REGISTRY_ID || "0xb419b1189f3cf29808c20bc5660f228362b8af0044e707258d4a687fc9285c6a",

  // Pyth Oracle
  pythHermesUrl: process.env.PYTH_HERMES_URL || "https://hermes.pyth.network",
  pythStateId: process.env.PYTH_STATE_ID || "0x1f9310238ee9298fb703c3419030b35b22bb1cc37113e3bb5007c99aec79e5b8", // Mainnet
  wormholeStateId: process.env.WORMHOLE_STATE_ID || "0xaeab97f96cf9877fee2883315d459552b2b921edc16d7ceac6eab944dd88919c", // Mainnet

  // Execution settings
  maxBatchSize: parseInt(process.env.MAX_BATCH_SIZE || "5"),
  executorRewardClaim: BigInt(process.env.EXECUTOR_REWARD_CLAIM || "25000000"),
  dryRun: process.env.DRY_RUN === "true",
  defaultSlippageBps: parseInt(process.env.DEFAULT_SLIPPAGE_BPS || "100"), // Fallback for MetaAg init

  // Clock object (system)
  clock: "0x0000000000000000000000000000000000000000000000000000000000000006",
};

// ============ Types ============

interface DcaAccount {
  id: string;
  owner: string;
  delegatee: string;
  active: boolean;
  remainingOrders: number;
  inputBalance: bigint;
  splitAllocation: bigint;
  lastTimeMs: bigint;
  every: number;
  timeScale: number;
  inputType: string;
  outputType: string;
  executorRewardPerTrade: bigint;
  // Slippage from DCA config
  customSlippageBps: number | null; // User-set custom slippage
  defaultSlippageBps: number; // Default from GlobalConfig snapshot
  feeBps: number; // Fee rate from snapshot
}

interface EligibleDca extends DcaAccount {
  nextExecutionMs: bigint;
  msUntilEligible: bigint;
}

interface QuotedDca extends EligibleDca {
  quote: MetaQuote;
  netInputAmount: bigint;
}

// ============ Sui Client & 7k MetaAg ============

const client = new SuiClient({ url: config.rpcUrl });

// Create MetaAg with all providers
function createMetaAg(): MetaAg {
  return new MetaAg({
    client,
    slippageBps: config.defaultSlippageBps,
    partnerCommissionBps: 0,
    tipBps: 0,
    providers: {
      [EProvider.BLUEFIN7K]: {},
      [EProvider.FLOWX]: {},
      [EProvider.CETUS]: {},
    },
  });
}

// Default instance for quoting
const metaAg = createMetaAg();

// ============ Pyth Oracle ============

const pythConnection = new SuiPriceServiceConnection(config.pythHermesUrl);
const pythClient = new SuiPythClient(client, config.pythStateId, config.wormholeStateId);

// Price feed IDs (Pyth mainnet) - TODO: Move to config or fetch from registry
const PRICE_FEED_IDS: Record<string, string> = {
  // Format: coin_type -> Pyth feed ID
  "0x2::sui::SUI": "0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744", // SUI/USD
  "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC": "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a", // USDC/USD
  // Add more as needed
};

// Get price feed IDs for a token pair
function getPriceFeedIds(inputType: string, outputType: string): string[] {
  const inputFeedId = PRICE_FEED_IDS[inputType];
  const outputFeedId = PRICE_FEED_IDS[outputType];

  if (!inputFeedId || !outputFeedId) {
    console.warn(`Missing price feed for ${!inputFeedId ? inputType : outputType}`);
    return [];
  }

  return [inputFeedId, outputFeedId];
}

function getKeypair(): Ed25519Keypair {
  const privateKey = process.env.EXECUTOR_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("EXECUTOR_PRIVATE_KEY not set");
  }

  if (privateKey.startsWith("suiprivkey")) {
    const { secretKey } = decodeSuiPrivateKey(privateKey);
    return Ed25519Keypair.fromSecretKey(secretKey);
  }

  const keyBytes = privateKey.startsWith("0x")
    ? Buffer.from(privateKey.slice(2), "hex")
    : Buffer.from(privateKey, "base64");

  return Ed25519Keypair.fromSecretKey(keyBytes);
}

// ============ Time Scale Helpers ============

function timeScaleToMs(every: number, timeScale: number): bigint {
  const multipliers: Record<number, bigint> = {
    0: 1000n,           // seconds
    1: 60n * 1000n,     // minutes
    2: 3600n * 1000n,   // hours
    3: 86400n * 1000n,  // days
    4: 604800n * 1000n, // weeks
    5: 2592000n * 1000n // months (30 days)
  };
  return BigInt(every) * (multipliers[timeScale] || 1000n);
}

// Get effective slippage for a DCA (custom if set, otherwise default from snapshot)
function getEffectiveSlippage(dca: DcaAccount): number {
  return dca.customSlippageBps ?? dca.defaultSlippageBps;
}

// ============ DCA Discovery ============

async function discoverDcaAccounts(): Promise<DcaAccount[]> {
  console.log("Discovering DCA accounts...");

  const events = await client.queryEvents({
    query: {
      MoveEventType: `${config.dcaPackage}::dca::DCACreatedEvent`
    },
    limit: 100,
    order: "descending"
  });

  console.log(`Found ${events.data.length} DCACreatedEvent(s)`);

  const accounts: DcaAccount[] = [];

  for (const event of events.data) {
    const parsed = event.parsedJson as any;
    const dcaId = parsed.id;

    try {
      const obj = await client.getObject({
        id: dcaId,
        options: { showContent: true, showType: true }
      });

      if (!obj.data?.content || obj.data.content.dataType !== "moveObject") {
        continue;
      }

      const fields = (obj.data.content as any).fields;
      const dcaType = obj.data.content.type;

      const typeMatch = dcaType.match(/<(.+),\s*(.+)>/);
      if (!typeMatch) continue;

      // Extract slippage: custom if set, otherwise use default from snapshot
      const tradeParams = fields.trade_params?.fields;
      const customSlippageBps = tradeParams?.slippage_bps
        ? parseInt(tradeParams.slippage_bps)
        : null;
      const defaultSlippageBps = parseInt(fields.config_snapshot.fields.default_slippage_bps);
      const feeBps = parseInt(fields.config_snapshot.fields.fee_bps);

      accounts.push({
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
      });

    } catch (e) {
      console.warn(`Failed to fetch DCA ${dcaId}:`, e);
    }
  }

  return accounts;
}

async function findEligibleDcas(): Promise<EligibleDca[]> {
  const accounts = await discoverDcaAccounts();
  const now = BigInt(Date.now());

  const eligible: EligibleDca[] = [];

  for (const account of accounts) {
    if (!account.active || account.remainingOrders === 0 || account.inputBalance === 0n) {
      continue;
    }

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

  eligible.sort((a, b) => Number(a.msUntilEligible - b.msUntilEligible));

  return eligible;
}

// ============ Quote Fetching ============

async function getQuoteForDca(dca: EligibleDca): Promise<QuotedDca | null> {
  try {
    // Calculate net input after DCA protocol fee (from snapshot)
    const grossAmount = dca.splitAllocation;
    const feeAmount = (grossAmount * BigInt(dca.feeBps)) / 10000n;
    const netInputAmount = grossAmount - feeAmount;

    console.log(`  Getting quote for ${dca.id.slice(0, 10)}... (${Number(netInputAmount) / 1e9} ${dca.inputType.split("::").pop()})`);

    const quotes = await metaAg.quote({
      coinTypeIn: dca.inputType,
      coinTypeOut: dca.outputType,
      amountIn: netInputAmount.toString(),
    });

    if (quotes.length === 0) {
      console.log(`    No quotes available`);
      return null;
    }

    // Pick best quote (highest output)
    const bestQuote = quotes.reduce((best, q) =>
      BigInt(q.amountOut) > BigInt(best.amountOut) ? q : best
    );

    const outputDecimals = dca.outputType.includes("usdc") || dca.outputType.includes("USDC") ? 6 : 9;
    console.log(`    Best: ${bestQuote.provider} → ${Number(bestQuote.amountOut) / Math.pow(10, outputDecimals)} ${dca.outputType.split("::").pop()}`);

    return {
      ...dca,
      quote: bestQuote,
      netInputAmount,
    };

  } catch (e) {
    console.warn(`    Failed to get quote for ${dca.id.slice(0, 10)}:`, e);
    return null;
  }
}

// ============ Single DCA Execution ============

async function executeSingleDca(quotedDca: QuotedDca): Promise<string | null> {
  const keypair = getKeypair();
  const executorAddress = keypair.toSuiAddress();

  const tx = new Transaction();

  // 0. Get Pyth price feeds and update them
  const priceFeedIds = getPriceFeedIds(quotedDca.inputType, quotedDca.outputType);
  if (priceFeedIds.length === 0) {
    console.warn(`    Skipping ${quotedDca.id.slice(0, 10)}: Missing price feeds`);
    return null;
  }

  // Fetch fresh price data from Pyth Hermes
  const priceUpdateData = await pythConnection.getPriceFeedsUpdateData(priceFeedIds);

  // Update prices in PTB and get PriceInfoObject IDs
  const priceInfoObjectIds = await pythClient.updatePriceFeeds(tx, priceUpdateData, priceFeedIds);

  // For tokens with direct USD feeds, use the same object for primary and intermediate
  // TODO: Support multi-hop routing (TOKEN->SUI->USD) by checking registry
  const inputPriceInfo = tx.object(priceInfoObjectIds[0]);
  const inputIntermediate = tx.object(priceInfoObjectIds[0]); // Same for direct USD feed
  const outputPriceInfo = tx.object(priceInfoObjectIds[1]);
  const outputIntermediate = tx.object(priceInfoObjectIds[1]); // Same for direct USD feed

  // 1. init_trade with oracle parameters - get funds and hot-potato promise
  const [fundsBalance, promise] = tx.moveCall({
    target: `${config.dcaPackage}::dca::init_trade`,
    typeArguments: [quotedDca.inputType, quotedDca.outputType],
    arguments: [
      tx.object(quotedDca.id),
      tx.object(config.clock),
      tx.object(config.priceFeedRegistry),
      inputPriceInfo,
      inputIntermediate,
      outputPriceInfo,
      outputIntermediate,
    ],
  });

  // 2. Convert Balance<Input> to Coin<Input> for swap
  const inputCoin = tx.moveCall({
    target: "0x2::coin::from_balance",
    typeArguments: [quotedDca.inputType],
    arguments: [fundsBalance],
  });

  // 3. Execute swap using MetaAg
  const effectiveSlippage = getEffectiveSlippage(quotedDca);
  const outputCoin = await metaAg.swap({
    quote: quotedDca.quote,
    signer: executorAddress,
    tx,
    coinIn: inputCoin,
  }, effectiveSlippage);

  // 4. Get output amount for resolve_trade validation
  const outputAmount = tx.moveCall({
    target: "0x2::coin::value",
    typeArguments: [quotedDca.outputType],
    arguments: [outputCoin],
  });

  // 5. resolve_trade - complete the trade, get executor reward
  const rewardCoin = tx.moveCall({
    target: `${config.dcaPackage}::dca::resolve_trade`,
    typeArguments: [quotedDca.inputType, quotedDca.outputType],
    arguments: [
      tx.object(quotedDca.id),
      tx.object(config.feeTracker),
      promise,
      outputAmount,
      tx.pure.u64(config.executorRewardClaim),
    ],
  });

  // 6. Transfer output to DCA owner, reward to executor
  tx.transferObjects([outputCoin], quotedDca.owner);
  tx.transferObjects([rewardCoin], executorAddress);

  // Execute transaction
  if (config.dryRun) {
    const result = await client.dryRunTransactionBlock({
      transactionBlock: await tx.build({ client }),
    });

    if (result.effects.status.error) {
      console.log(`    [DRY RUN] Error: ${result.effects.status.error}`);
      return null;
    }
    console.log(`    [DRY RUN] Success - Gas: ${result.effects.gasUsed.computationCost} computation`);
    return "dry-run-success";
  } else {
    const result = await client.signAndExecuteTransaction({
      transaction: tx,
      signer: keypair,
      options: { showEffects: true, showEvents: true },
    });

    if (result.effects?.status.error) {
      console.log(`    Error: ${result.effects.status.error}`);
      return null;
    }

    // Extract reward from events
    const events = result.events || [];
    const completedEvent = events.find(e => e.type.includes("TradeCompletedEvent"));
    if (completedEvent) {
      const parsed = completedEvent.parsedJson as any;
      const reward = BigInt(parsed.executor_reward || 0);
      console.log(`    ✓ ${result.digest.slice(0, 16)}... (reward: ${Number(reward) / 1e9} SUI)`);
    } else {
      console.log(`    ✓ ${result.digest.slice(0, 16)}...`);
    }

    return result.digest;
  }
}

// ============ Main ============

async function main() {
  const discoverOnly = process.argv.includes("--discover") || process.argv.includes("--discover-only");

  console.log("=== DCA Executor ===");
  console.log(`Network: ${config.network}`);
  console.log(`Package: ${config.dcaPackage}`);
  console.log(`Dry Run: ${config.dryRun}`);
  console.log(`Max Batch: ${config.maxBatchSize}`);
  console.log("");

  // Discover eligible DCAs
  const eligible = await findEligibleDcas();

  console.log(`\nFound ${eligible.length} eligible DCA(s) for execution:`);
  for (const dca of eligible) {
    const overdueMs = -Number(dca.msUntilEligible);
    const effectiveSlippage = getEffectiveSlippage(dca);
    console.log(`  - ${dca.id.slice(0, 16)}...`);
    console.log(`    Pair: ${dca.inputType.split("::").pop()} → ${dca.outputType.split("::").pop()}`);
    console.log(`    Orders: ${dca.remainingOrders} remaining`);
    console.log(`    Amount: ${Number(dca.splitAllocation) / 1e9} (input token)`);
    console.log(`    Slippage: ${effectiveSlippage}bps (${effectiveSlippage / 100}%), Fee: ${dca.feeBps}bps`);
    console.log(`    Overdue: ${(overdueMs / 1000).toFixed(0)}s`);
  }

  if (discoverOnly || eligible.length === 0) {
    console.log("\nDiscovery complete.");
    return;
  }

  // Execute DCAs sequentially (batching fails due to 7k settle conflicts)
  const batch = eligible.slice(0, config.maxBatchSize);
  console.log(`\nExecuting ${batch.length} DCA(s) sequentially...`);

  let successCount = 0;
  let failCount = 0;

  for (const dca of batch) {
    console.log(`\n[${successCount + failCount + 1}/${batch.length}] ${dca.id.slice(0, 16)}...`);

    // Get fresh quote right before execution
    const quotedDca = await getQuoteForDca(dca);
    if (!quotedDca) {
      console.log(`  ✗ No valid quote`);
      failCount++;
      continue;
    }

    // Execute single DCA
    const digest = await executeSingleDca(quotedDca);
    if (digest) {
      successCount++;
    } else {
      failCount++;
    }

    // Delay between executions to let quote providers update to latest state
    // 7k aggregators may have caching/indexing lag after block finalization
    if (batch.indexOf(dca) < batch.length - 1) {
      console.log(`  Waiting 3s for quote providers to sync...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log(`\n=== Execution Summary ===`);
  console.log(`  Success: ${successCount}/${batch.length}`);
  if (failCount > 0) {
    console.log(`  Failed: ${failCount}/${batch.length}`);
  }
}

main().catch(console.error);
