import { useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import type { TokenInfo } from "@/config/tokens";

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  iconUrl: string | null;
}

export function useTokenMetadata(token: TokenInfo | undefined) {
  const client = useSuiClient();

  return useQuery({
    queryKey: ["token-metadata", token?.type],
    queryFn: async (): Promise<TokenMetadata | null> => {
      if (!token) return null;

      try {
        const metadata = await client.getCoinMetadata({
          coinType: token.type,
        });

        if (!metadata) {
          return {
            name: token.name,
            symbol: token.symbol,
            decimals: token.decimals,
            iconUrl: null,
          };
        }

        return {
          name: metadata.name,
          symbol: metadata.symbol,
          decimals: metadata.decimals,
          iconUrl: metadata.iconUrl ?? null,
        };
      } catch {
        return {
          name: token.name,
          symbol: token.symbol,
          decimals: token.decimals,
          iconUrl: null,
        };
      }
    },
    enabled: !!token,
    staleTime: 300000, // Cache for 5 minutes
  });
}

// Batch fetch multiple token metadata
export function useTokensMetadata(tokens: TokenInfo[]) {
  const client = useSuiClient();

  return useQuery({
    queryKey: ["tokens-metadata", tokens.map((t) => t.type).join(",")],
    queryFn: async (): Promise<Map<string, TokenMetadata>> => {
      const results = new Map<string, TokenMetadata>();

      await Promise.all(
        tokens.map(async (token) => {
          try {
            const metadata = await client.getCoinMetadata({
              coinType: token.type,
            });

            results.set(token.type, {
              name: metadata?.name ?? token.name,
              symbol: metadata?.symbol ?? token.symbol,
              decimals: metadata?.decimals ?? token.decimals,
              iconUrl: metadata?.iconUrl ?? null,
            });
          } catch {
            results.set(token.type, {
              name: token.name,
              symbol: token.symbol,
              decimals: token.decimals,
              iconUrl: null,
            });
          }
        }),
      );

      return results;
    },
    enabled: tokens.length > 0,
    staleTime: 300000,
  });
}
