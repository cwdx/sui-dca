/**
 * Sui Client and 7k MetaAg Setup
 */

import { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { MetaAg, EProvider } from "@7kprotocol/sdk-ts";
import { getConfig } from "./config.js";

// ============ Sui Client ============

let suiClientInstance: SuiClient | null = null;

export function getSuiClient(): SuiClient {
  if (!suiClientInstance) {
    const config = getConfig();
    suiClientInstance = new SuiClient({ url: config.rpcUrl });
  }
  return suiClientInstance;
}

// ============ MetaAg ============

/**
 * Create a new MetaAg instance with all providers
 */
export function createMetaAg(): MetaAg {
  const config = getConfig();
  return new MetaAg({
    client: getSuiClient(),
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

// Default MetaAg instance for quoting
let metaAgInstance: MetaAg | null = null;

export function getMetaAg(): MetaAg {
  if (!metaAgInstance) {
    metaAgInstance = createMetaAg();
  }
  return metaAgInstance;
}

// ============ Keypair ============

let keypairInstance: Ed25519Keypair | null = null;

export function getKeypair(): Ed25519Keypair {
  if (!keypairInstance) {
    const privateKey = process.env.EXECUTOR_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("EXECUTOR_PRIVATE_KEY not set");
    }

    if (privateKey.startsWith("suiprivkey")) {
      const { secretKey } = decodeSuiPrivateKey(privateKey);
      keypairInstance = Ed25519Keypair.fromSecretKey(secretKey);
    } else {
      const keyBytes = privateKey.startsWith("0x")
        ? Buffer.from(privateKey.slice(2), "hex")
        : Buffer.from(privateKey, "base64");
      keypairInstance = Ed25519Keypair.fromSecretKey(keyBytes);
    }
  }
  return keypairInstance;
}

export function getExecutorAddress(): string {
  return getKeypair().toSuiAddress();
}

/**
 * Get executor's SUI balance in SUI (not MIST)
 */
export async function getExecutorBalance(): Promise<number> {
  const client = getSuiClient();
  const address = getExecutorAddress();
  const balance = await client.getBalance({ owner: address, coinType: "0x2::sui::SUI" });
  return Number(balance.totalBalance) / 1e9;
}

// ============ Helpers ============

/**
 * Convert time scale enum to milliseconds
 */
export function timeScaleToMs(every: number, timeScale: number): bigint {
  const multipliers: Record<number, bigint> = {
    0: 1000n, // seconds
    1: 60n * 1000n, // minutes
    2: 3600n * 1000n, // hours
    3: 86400n * 1000n, // days
    4: 604800n * 1000n, // weeks
    5: 2592000n * 1000n, // months (30 days)
  };
  return BigInt(every) * (multipliers[timeScale] || 1000n);
}

/**
 * Get effective slippage for a DCA (custom if set, otherwise default from snapshot)
 */
export function getEffectiveSlippage(dca: { customSlippageBps: number | null; defaultSlippageBps: number }): number {
  return dca.customSlippageBps ?? dca.defaultSlippageBps;
}

// ============ Reset (for testing) ============

export function resetClients(): void {
  suiClientInstance = null;
  metaAgInstance = null;
  keypairInstance = null;
}
