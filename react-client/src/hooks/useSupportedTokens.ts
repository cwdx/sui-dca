import { useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import { TOKENS, type TokenInfo } from "@/config/tokens";
import { useNetwork } from "@/contexts/NetworkContext";

interface RegisteredToken {
  coinType: string;
  feedId: string;
  quoteCurrency: number; // 0=USD, 1=SUI
  isRouted: boolean;
}

/**
 * Convert bytes array to hex string
 */
function bytesToHex(bytes: number[]): string {
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Fetch all registered tokens from the on-chain PriceFeedRegistry.
 * Falls back to hardcoded TOKENS if registry fetch fails.
 */
export function useSupportedTokens() {
  const client = useSuiClient();
  const { contracts } = useNetwork();

  return useQuery({
    queryKey: ["supported-tokens", contracts.priceFeedRegistry],
    queryFn: async (): Promise<TokenInfo[]> => {
      // If no registry configured, return hardcoded tokens
      if (!contracts.priceFeedRegistry) {
        return Object.values(TOKENS);
      }

      try {
        // Fetch all dynamic fields from the registry's feeds table
        const allFields: any[] = [];
        let cursor: string | null = null;

        do {
          const response = await client.getDynamicFields({
            parentId: contracts.priceFeedRegistry,
            cursor,
          });
          allFields.push(...response.data);
          cursor = response.hasNextPage ? response.nextCursor : null;
        } while (cursor);

        // Find the feeds table
        const feedsField = allFields.find((f) => f.name?.value === "feeds");
        if (!feedsField) {
          console.warn(
            "No feeds table found in registry, using hardcoded tokens",
          );
          return Object.values(TOKENS);
        }

        // Get the table object
        const tableObj = await client.getObject({
          id: feedsField.objectId,
          options: { showContent: true },
        });

        if (!tableObj.data?.content) {
          return Object.values(TOKENS);
        }

        // Fetch table entries (dynamic fields of the table)
        const tableId =
          (tableObj.data.content as any).fields?.id?.id || feedsField.objectId;
        const tableEntries: any[] = [];
        let tableCursor: string | null = null;

        do {
          const response = await client.getDynamicFields({
            parentId: tableId,
            cursor: tableCursor,
          });
          tableEntries.push(...response.data);
          tableCursor = response.hasNextPage ? response.nextCursor : null;
        } while (tableCursor);

        // Build token list from registered feeds
        const registeredTokens: TokenInfo[] = [];
        const seenTypes = new Set<string>();

        for (const entry of tableEntries) {
          const coinType = entry.name?.value;
          if (!coinType || seenTypes.has(coinType)) continue;
          seenTypes.add(coinType);

          // Try to match with our known tokens first
          const knownToken = Object.values(TOKENS).find(
            (t) => t.type === coinType,
          );
          if (knownToken) {
            registeredTokens.push(knownToken);
            continue;
          }

          // Fetch the feed entry to get more info
          try {
            const feedObj = await client.getObject({
              id: entry.objectId,
              options: { showContent: true },
            });

            if (feedObj.data?.content) {
              const feedFields = (feedObj.data.content as any).fields?.value
                ?.fields;
              if (feedFields?.feed_id) {
                // Extract symbol from coin type (last part after ::)
                const symbol = coinType.split("::").pop() || "UNKNOWN";

                registeredTokens.push({
                  symbol,
                  name: symbol,
                  type: coinType,
                  decimals: 9, // Default, would need metadata lookup for accurate value
                  pythPriceId: bytesToHex(feedFields.feed_id),
                });
              }
            }
          } catch (e) {
            console.warn(`Failed to fetch feed for ${coinType}:`, e);
          }
        }

        // If we got some tokens from registry, return them
        // Otherwise fall back to hardcoded
        if (registeredTokens.length > 0) {
          return registeredTokens;
        }

        return Object.values(TOKENS);
      } catch (error) {
        console.warn(
          "Failed to fetch tokens from registry, using hardcoded:",
          error,
        );
        return Object.values(TOKENS);
      }
    },
    staleTime: 300000, // Cache for 5 minutes
    retry: 2,
  });
}

/**
 * Fetch coin metadata from chain to get accurate decimals and icon
 */
export function useTokenMetadataFromChain(coinType: string | undefined) {
  const client = useSuiClient();

  return useQuery({
    queryKey: ["coin-metadata", coinType],
    queryFn: async () => {
      if (!coinType) return null;

      const metadata = await client.getCoinMetadata({ coinType });
      return metadata;
    },
    enabled: !!coinType,
    staleTime: 600000, // Cache for 10 minutes
  });
}
