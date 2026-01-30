#!/usr/bin/env bun
/**
 * Register Price Feeds Script
 *
 * Registers all tokens from the token registry with the on-chain PriceFeedRegistry.
 *
 * Usage:
 *   bun run scripts/register-feeds.ts              # Register all feeds
 *   bun run scripts/register-feeds.ts --dry-run    # Show what would be registered
 *   bun run scripts/register-feeds.ts SUI USDC     # Register specific tokens
 */

import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { TOKEN_REGISTRY, type TokenInfo } from "../src/lib/token-registry.js";

// Config
const config = {
  rpcUrl: process.env.SUI_RPC_URL || getFullnodeUrl("mainnet"),
  dcaPackage: process.env.DCA_PACKAGE_ID || "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
  priceFeedRegistry: process.env.PRICE_FEED_REGISTRY_ID || "0xdb8054678f011b6a9d5dbe72b92817bfa904c00729b9c64cc0158ebc2c27d0e0",
  adminCap: process.env.ADMIN_CAP_ID || "0x41d0976ce8c84ac68803a1807e720a989f5d070d14e39028f3a91c23d294e017",
};

function getKeypair(): Ed25519Keypair {
  const privateKey = process.env.EXECUTOR_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("EXECUTOR_PRIVATE_KEY environment variable not set");
  }

  if (privateKey.startsWith("suiprivkey")) {
    const { secretKey } = decodeSuiPrivateKey(privateKey);
    return Ed25519Keypair.fromSecretKey(secretKey);
  }

  // Try base64 or hex
  const keyBytes = privateKey.startsWith("0x")
    ? Buffer.from(privateKey.slice(2), "hex")
    : Buffer.from(privateKey, "base64");

  return Ed25519Keypair.fromSecretKey(keyBytes);
}

async function getRegisteredFeeds(client: SuiClient): Promise<Set<string>> {
  // Query events to find already registered feeds
  const events = await client.queryEvents({
    query: {
      MoveEventType: `${config.dcaPackage}::config::PriceFeedRegisteredEvent`,
    },
    limit: 1000,
  });

  const registered = new Set<string>();
  for (const event of events.data) {
    const json = event.parsedJson as { coin_type: string };
    // Normalize the type (add 0x prefix if missing)
    let coinType = json.coin_type;
    if (!coinType.startsWith("0x") && !coinType.startsWith("0000")) {
      coinType = "0x" + coinType;
    }
    registered.add(coinType);
  }

  return registered;
}

async function registerFeed(
  client: SuiClient,
  keypair: Ed25519Keypair,
  token: TokenInfo
): Promise<string> {
  const tx = new Transaction();

  tx.moveCall({
    target: `${config.dcaPackage}::config::register_direct_feed`,
    typeArguments: [token.type],
    arguments: [
      tx.object(config.priceFeedRegistry),
      tx.object(config.adminCap),
      tx.pure.vector("u8", Buffer.from(token.pythFeedId, "hex")),
    ],
  });

  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true },
  });

  if (result.effects?.status?.status !== "success") {
    throw new Error(`Transaction failed: ${JSON.stringify(result.effects?.status)}`);
  }

  return result.digest;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const specificTokens = args.filter(arg => !arg.startsWith("--"));

  console.log("=== Price Feed Registration ===\n");
  console.log(`Package: ${config.dcaPackage}`);
  console.log(`Registry: ${config.priceFeedRegistry}`);
  console.log(`Dry Run: ${dryRun}\n`);

  const client = new SuiClient({ url: config.rpcUrl });

  // Get already registered feeds
  console.log("Checking already registered feeds...");
  const registered = await getRegisteredFeeds(client);
  console.log(`Found ${registered.size} already registered feeds\n`);

  // Determine which tokens to register
  let tokensToRegister: TokenInfo[];
  if (specificTokens.length > 0) {
    tokensToRegister = specificTokens
      .map(sym => TOKEN_REGISTRY[sym.toUpperCase()])
      .filter((t): t is TokenInfo => t !== undefined);
  } else {
    tokensToRegister = Object.values(TOKEN_REGISTRY);
  }

  // Filter out already registered
  const needsRegistration = tokensToRegister.filter(token => {
    // Normalize type for comparison
    const normalizedType = token.type.replace(/^0x0+/, "0x");
    for (const regType of registered) {
      const normalizedReg = regType.replace(/^0x0+/, "0x").replace(/^0+/, "0x");
      if (normalizedType === normalizedReg || token.type === regType) {
        return false;
      }
    }
    return true;
  });

  console.log(`Tokens in registry: ${tokensToRegister.length}`);
  console.log(`Already registered: ${tokensToRegister.length - needsRegistration.length}`);
  console.log(`Need registration: ${needsRegistration.length}\n`);

  if (needsRegistration.length === 0) {
    console.log("All tokens already registered!");
    return;
  }

  console.log("Tokens to register:");
  for (const token of needsRegistration) {
    console.log(`  - ${token.symbol}: ${token.pythSymbol}`);
  }
  console.log("");

  if (dryRun) {
    console.log("Dry run mode - no transactions sent.");
    return;
  }

  const keypair = getKeypair();
  console.log(`Sender: ${keypair.toSuiAddress()}\n`);

  let success = 0;
  let failed = 0;

  for (const token of needsRegistration) {
    process.stdout.write(`Registering ${token.symbol}... `);
    try {
      const digest = await registerFeed(client, keypair, token);
      console.log(`✓ ${digest.slice(0, 16)}...`);
      success++;
    } catch (error) {
      console.log(`✗ ${error instanceof Error ? error.message : error}`);
      failed++;
    }

    // Small delay between transactions
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n=== Summary ===`);
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);
}

main().catch(console.error);
