/**
 * Executor Configuration
 */

import { getFullnodeUrl } from "@mysten/sui/client";
import type { ExecutorConfig } from "./types.js";

/**
 * Load configuration from environment variables
 */
export function loadConfig(): ExecutorConfig {
  return {
    network: process.env.SUI_NETWORK || "mainnet",
    rpcUrl: process.env.SUI_RPC_URL || getFullnodeUrl("mainnet"),

    // DCA Contract addresses (v4 - Oracle-based pricing)
    dcaPackage:
      process.env.DCA_PACKAGE_ID ||
      "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
    globalConfig:
      process.env.GLOBAL_CONFIG_ID ||
      "0xe9f6adaea71cee4a1d4a3e48e7a42be8d2aa66f1f21e02ffa38e447d6bf3c13a",
    feeTracker:
      process.env.FEE_TRACKER_ID ||
      "0x5a840524e2c1cad27da155c6cdeff4652b76bcef1c7aad6f1ce51710e8397057",

    // Oracle infrastructure
    priceFeedRegistry:
      process.env.PRICE_FEED_REGISTRY_ID ||
      "0xdb8054678f011b6a9d5dbe72b92817bfa904c00729b9c64cc0158ebc2c27d0e0",
    termsRegistry:
      process.env.TERMS_REGISTRY_ID ||
      "0xb419b1189f3cf29808c20bc5660f228362b8af0044e707258d4a687fc9285c6a",
    pythStateId:
      process.env.PYTH_STATE_ID ||
      "0x1f9310238ee9298fb703c3419030b35b22bb1cc37113e3bb5007c99aec79e5b8",
    wormholeStateId:
      process.env.WORMHOLE_STATE_ID ||
      "0xaeab97f96cf9877fee2883315d459552b2b921edc16d7ceac6eab944dd88919c",

    // System
    clock: "0x0000000000000000000000000000000000000000000000000000000000000006",

    // Execution settings
    maxBatchSize: parseInt(process.env.MAX_BATCH_SIZE || "50"),
    executorRewardClaim: BigInt(process.env.EXECUTOR_REWARD_CLAIM || "25000000"),
    dryRun: process.env.DRY_RUN === "true",
    defaultSlippageBps: parseInt(process.env.DEFAULT_SLIPPAGE_BPS || "100"),
    executionDelayMs: parseInt(process.env.EXECUTION_DELAY_MS || "3000"),
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: ExecutorConfig): void {
  if (!config.dcaPackage.startsWith("0x")) {
    throw new Error("Invalid DCA_PACKAGE_ID format");
  }
  if (!config.globalConfig.startsWith("0x")) {
    throw new Error("Invalid GLOBAL_CONFIG_ID format");
  }
  if (!config.feeTracker.startsWith("0x")) {
    throw new Error("Invalid FEE_TRACKER_ID format");
  }
  if (!config.priceFeedRegistry.startsWith("0x")) {
    throw new Error("Invalid PRICE_FEED_REGISTRY_ID format");
  }
  if (!config.termsRegistry.startsWith("0x")) {
    throw new Error("Invalid TERMS_REGISTRY_ID format");
  }
  if (config.maxBatchSize < 1 || config.maxBatchSize > 100) {
    throw new Error("MAX_BATCH_SIZE must be between 1 and 100");
  }
  if (config.defaultSlippageBps < 1 || config.defaultSlippageBps > 10000) {
    throw new Error("DEFAULT_SLIPPAGE_BPS must be between 1 and 10000");
  }
}

// Singleton config instance
let configInstance: ExecutorConfig | null = null;
let startupLogged = false;

export function getConfig(): ExecutorConfig {
  if (!configInstance) {
    configInstance = loadConfig();
    validateConfig(configInstance);
  }
  return configInstance;
}

export function resetConfig(): void {
  configInstance = null;
  startupLogged = false;
}

/**
 * Log executor startup info (called once)
 * Should be called after config is loaded and client is available
 */
export async function logStartupInfo(): Promise<void> {
  if (startupLogged) return;
  startupLogged = true;

  // Import dynamically to avoid circular dependency
  const { getExecutorAddress, getExecutorBalance } = await import("./client.js");
  const config = getConfig();

  const address = getExecutorAddress();
  const balance = await getExecutorBalance();

  console.log("=== DCA Executor ===");
  console.log(`Network:  ${config.network}`);
  console.log(`Executor: ${address}`);
  console.log(`Balance:  ${balance.toFixed(4)} SUI`);
  console.log(`Dry Run:  ${config.dryRun}`);
  console.log("====================");
}
