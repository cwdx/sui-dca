/**
 * Pyth Oracle Integration
 *
 * Provides PriceInfoObject lookups for DCA trade execution.
 * Uses a mapping of Pyth feed IDs to known PriceInfoObject addresses on Sui mainnet.
 */

import { SuiPythClient } from "@pythnetwork/pyth-sui-js";
import type { SuiClient } from "@mysten/sui/client";
import type { Transaction } from "@mysten/sui/transactions";
import { getConfig } from "./config.js";

// Cache for Pyth client
let pythClient: SuiPythClient | null = null;

/**
 * Initialize or get the Pyth client
 */
export function getPythClient(suiClient: SuiClient): SuiPythClient {
  if (!pythClient) {
    const config = getConfig();
    pythClient = new SuiPythClient(
      suiClient,
      config.pythStateId,
      config.wormholeStateId
    );
  }
  return pythClient;
}

/**
 * Known Pyth price feed IDs mapped to PriceInfoObject addresses on Sui mainnet
 *
 * To find a PriceInfoObject for a new feed:
 * 1. Query events: MoveEventType: `${pythPackage}::event::PriceFeedUpdateEvent`
 * 2. Find an event with your target feed ID in price_feed.price_identifier.bytes
 * 3. Get the transaction's objectChanges to find the PriceInfoObject ID
 */
export const PYTH_PRICE_INFO_OBJECTS: Record<string, string> = {
  // Stablecoins
  "eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a": "0x5dec622733a204ca27f5a90d8c2fad453cc6665186fd5dff13a83d0b6c9027ab", // USDC/USD
  "2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b": "0x985e3db9f93f76ee8bace7c3dd5cc676a096accd5d9e09e9ae0fb6571f8e7ff5", // USDT/USD

  // Major tokens
  "23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744": "0x801dbc2f0053d34734814b2d6df491ce7807a725fe9a01ad74a07e9c51396c37", // SUI/USD
  "e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43": "0x9a62b4863bdeaabdc9500fce769cf7e72d5585eeb28a6d26e4cafadc13f76912", // BTC/USD
  "ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace": "0x9d0d275efbd37d8a8855f6f2c761fa5983293dd8ce202ee5196626de8fcd4469", // ETH/USD (also WETH)

  // Sui ecosystem (these may need to be discovered)
  "29bdd5248234e33bd93d3b81100b5fa32eaa5997843847e2c2cb16d7c6d9f7ff": "", // DEEP/USD - needs discovery
  "e5b274b2611143df055d6e7cd8d93fe1961716bcd4dca1cad87a83bc1e78c1ef": "", // CETUS/USD - needs discovery
  "eba0732395fae9dec4bae12e52760b35fc1c5671e2da8b449c9af4efe5d54341": "", // WAL/USD - needs discovery
};

/**
 * Get PriceInfoObject ID for a Pyth feed ID
 * @param feedId - Pyth price feed ID (32-byte hex without 0x prefix)
 * @returns PriceInfoObject ID or undefined if not found
 */
export function getPriceInfoObjectId(feedId: string): string | undefined {
  const normalizedFeedId = feedId.toLowerCase().replace(/^0x/, "");
  const objectId = PYTH_PRICE_INFO_OBJECTS[normalizedFeedId];
  return objectId || undefined;
}

/**
 * Get PriceInfoObject IDs for multiple feed IDs
 * @param feedIds - Array of Pyth price feed IDs
 * @returns Array of PriceInfoObject IDs (same order as input)
 * @throws Error if any feed ID is not found
 */
export function getPriceInfoObjectIds(feedIds: string[]): string[] {
  const results: string[] = [];

  for (const feedId of feedIds) {
    const objectId = getPriceInfoObjectId(feedId);
    if (!objectId) {
      throw new Error(`PriceInfoObject not found for feed: ${feedId.slice(0, 16)}...`);
    }
    results.push(objectId);
  }

  return results;
}

/**
 * Known Pyth price feed IDs for common Sui tokens (mainnet)
 * Reference: https://pyth.network/developers/price-feed-ids
 */
export const PYTH_FEED_IDS = {
  // Stablecoins (direct USD feeds)
  USDC: "eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
  USDT: "2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b",

  // Major tokens (direct USD feeds)
  SUI: "23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744",
  BTC: "e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
  ETH: "ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
  SOL: "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",

  // Sui ecosystem tokens
  DEEP: "29bdd5248234e33bd93d3b81100b5fa32eaa5997843847e2c2cb16d7c6d9f7ff",
  CETUS: "e5b274b2611143df055d6e7cd8d93fe1961716bcd4dca1cad87a83bc1e78c1ef",
  WAL: "eba0732395fae9dec4bae12e52760b35fc1c5671e2da8b449c9af4efe5d54341",
  TURBOS: "f9c2e890443dd995d0baafc08eea3358be1ffb874f93f99c30b3816c460bbac3",
  NS: "bb5ff26e47a3a6cc7ec2fce1db996c2a145300edc5acaabe43bf9ff7c5dd5d32",
  NAVX: "88250f854c019ef4f88a5c073d52a18bb1c6ac437033f5932cd017d24917ab46",
  SCA: "7e17f0ac105abe9214deb9944c30264f5986bf292869c6bd8e8da3ccd92d79bc",
  BUCK: "fdf28a46570252b25fd31cb257973f865afc5ca2f320439e45d95e0394bc7382",
  haSUI: "6120ffcf96395c70aa77e72dcb900bf9d40dccab228efca59a17b90ce423d5e8",
  vSUI: "57ff7100a282e4af0c91154679c5dae2e5dcacb93fd467ea9cb7e58afdcfde27",
  afSUI: "17cd845b16e874485b2684f8b8d1517d744105dbb904eec30222717f4bc9ee0d",
  WBTC: "c9d8b075a5c69303365ae23633d4e085199bf5c520a3b90fed1322a0342ffc33",
} as const;

/**
 * Reset the Pyth client (useful for testing)
 */
export function resetPythClient(): void {
  pythClient = null;
}
