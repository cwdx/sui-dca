#!/usr/bin/env bun
/**
 * Swap any token back to SUI using 7k aggregator
 *
 * Usage:
 *   bun run scripts/swap-to-sui.ts [token_type] [--dry-run]
 *
 * Examples:
 *   bun run scripts/swap-to-sui.ts  # Swap all USDC to SUI
 *   bun run scripts/swap-to-sui.ts 0xdba34...::usdc::USDC
 *   bun run scripts/swap-to-sui.ts --dry-run
 */

import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";

// Config
const SUI_TYPE = "0x2::sui::SUI";
const USDC_TYPE = "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC";
const SEVEN_K_PACKAGE = "0x17c0b1f7a6ad73f51268f16b8c06c049eecc2f28a270cdd29c06e3d2dea23302";

// 7k API
const SEVEN_K_API = "https://api.7k.ag";

interface QuoteResponse {
  routes: Array<{
    amount_in: string;
    amount_out: string;
    min_amount_out: string;
  }>;
  tx_data: string;
}

async function getKeypair(): Promise<Ed25519Keypair> {
  const privateKey = process.env.EXECUTOR_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("EXECUTOR_PRIVATE_KEY not set");
  }

  if (privateKey.startsWith("suiprivkey")) {
    const decoded = decodeSuiPrivateKey(privateKey);
    return Ed25519Keypair.fromSecretKey(decoded.secretKey);
  } else {
    const keyBytes = Buffer.from(privateKey, "base64");
    return Ed25519Keypair.fromSecretKey(keyBytes.slice(0, 32));
  }
}

async function getTokenBalance(
  client: SuiClient,
  address: string,
  coinType: string
): Promise<{ totalBalance: bigint; coins: Array<{ objectId: string; balance: bigint }> }> {
  const coins = await client.getCoins({ owner: address, coinType });

  const result = {
    totalBalance: BigInt(0),
    coins: [] as Array<{ objectId: string; balance: bigint }>,
  };

  for (const coin of coins.data) {
    const balance = BigInt(coin.balance);
    result.totalBalance += balance;
    result.coins.push({ objectId: coin.coinObjectId, balance });
  }

  return result;
}

async function get7kQuote(
  inputType: string,
  outputType: string,
  amountIn: string,
  sender: string,
  slippageBps: number = 300
): Promise<QuoteResponse> {
  const params = new URLSearchParams({
    token_in: inputType,
    token_out: outputType,
    amount_in: amountIn,
    sender,
    slippage_bps: slippageBps.toString(),
  });

  const response = await fetch(`${SEVEN_K_API}/v1/swap/quote?${params}`);
  if (!response.ok) {
    throw new Error(`7k quote failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const tokenType = args.find((a) => !a.startsWith("--")) || USDC_TYPE;

  console.log("=== Swap to SUI ===");
  console.log(`Token: ${tokenType.split("::").pop()}`);
  console.log(`Dry Run: ${dryRun}`);
  console.log("");

  const client = new SuiClient({ url: getFullnodeUrl("mainnet") });
  const keypair = await getKeypair();
  const address = keypair.getPublicKey().toSuiAddress();

  console.log(`Wallet: ${address}`);

  // Get token balance
  const { totalBalance, coins } = await getTokenBalance(client, address, tokenType);

  if (totalBalance === BigInt(0)) {
    console.log("No balance to swap");
    return;
  }

  const decimals = tokenType.includes("usdc") ? 6 : 9;
  const formatted = Number(totalBalance) / 10 ** decimals;
  console.log(`Balance: ${formatted} ${tokenType.split("::").pop()}`);
  console.log("");

  // Get quote from 7k
  console.log("Fetching 7k quote...");
  const quote = await get7kQuote(tokenType, SUI_TYPE, totalBalance.toString(), address, 300);

  if (!quote.routes || quote.routes.length === 0) {
    console.log("No routes found");
    return;
  }

  const route = quote.routes[0];
  const amountOut = BigInt(route.amount_out);
  const minAmountOut = BigInt(route.min_amount_out);
  const amountOutFormatted = Number(amountOut) / 1e9;
  const minAmountOutFormatted = Number(minAmountOut) / 1e9;

  console.log(`Expected output: ${amountOutFormatted.toFixed(6)} SUI`);
  console.log(`Minimum output: ${minAmountOutFormatted.toFixed(6)} SUI (3% slippage)`);
  console.log("");

  if (dryRun) {
    console.log("=== DRY RUN - Not executing ===");
    return;
  }

  // Build and execute transaction
  console.log("Building transaction...");

  // Decode the tx_data from 7k
  const txBytes = Buffer.from(quote.tx_data, "base64");
  const tx = Transaction.from(txBytes);

  console.log("Executing swap...");
  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: {
      showEffects: true,
      showBalanceChanges: true,
    },
  });

  if (result.effects?.status?.status === "success") {
    console.log(`\n✓ Success!`);
    console.log(`Transaction: ${result.digest}`);

    // Show balance changes
    if (result.balanceChanges) {
      console.log("\nBalance changes:");
      for (const change of result.balanceChanges) {
        const type = change.coinType.split("::").pop();
        const amount = Number(change.amount) / (change.coinType.includes("usdc") ? 1e6 : 1e9);
        const sign = Number(change.amount) > 0 ? "+" : "";
        console.log(`  ${type}: ${sign}${amount.toFixed(6)}`);
      }
    }
  } else {
    console.log(`\n✗ Failed`);
    console.log(result.effects?.status);
  }
}

main().catch(console.error);
