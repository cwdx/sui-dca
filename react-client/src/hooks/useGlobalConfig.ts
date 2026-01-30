import { useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import { useNetwork } from "@/contexts/NetworkContext";

export interface GlobalConfig {
  version: number;
  feeBps: number;
  executorRewardPerTrade: bigint;
  maxOrdersPerAccount: number;
  minFundingPerTrade: bigint;
  defaultSlippageBps: number;
  maxSlippageBps: number;
  minIntervalSeconds: number;
  treasury: string;
  paused: boolean;
  executorWhitelistEnabled: boolean;
}

/**
 * Fetch GlobalConfig from on-chain
 * This replaces hardcoded values like executor reward, fee rates, etc.
 */
export function useGlobalConfig() {
  const client = useSuiClient();
  const { contracts, network } = useNetwork();

  return useQuery({
    queryKey: ["global-config", network, contracts.globalConfig],
    queryFn: async (): Promise<GlobalConfig> => {
      if (!contracts.globalConfig) {
        throw new Error("GlobalConfig not configured for this network");
      }

      const obj = await client.getObject({
        id: contracts.globalConfig,
        options: { showContent: true },
      });

      if (!obj.data?.content || obj.data.content.dataType !== "moveObject") {
        throw new Error("Failed to fetch global config");
      }

      const fields = (obj.data.content as any).fields;

      return {
        version: parseInt(fields.version),
        feeBps: parseInt(fields.fee_bps),
        executorRewardPerTrade: BigInt(fields.executor_reward_per_trade),
        maxOrdersPerAccount: parseInt(fields.max_orders_per_account),
        minFundingPerTrade: BigInt(fields.min_funding_per_trade),
        defaultSlippageBps: parseInt(fields.default_slippage_bps),
        maxSlippageBps: parseInt(fields.max_slippage_bps),
        minIntervalSeconds: parseInt(fields.min_interval_seconds),
        treasury: fields.treasury,
        paused: fields.paused,
        executorWhitelistEnabled: fields.executor_whitelist_enabled,
      };
    },
    enabled: !!contracts.globalConfig,
    staleTime: 60000, // Cache for 1 minute
    refetchInterval: 300000, // Refetch every 5 minutes
  });
}

/**
 * Helper to format executor reward in SUI
 */
export function formatExecutorReward(reward: bigint): string {
  return (Number(reward) / 1_000_000_000).toFixed(3);
}

/**
 * Helper to format fee as percentage
 */
export function formatFeeBps(bps: number): string {
  return (bps / 100).toFixed(2);
}
