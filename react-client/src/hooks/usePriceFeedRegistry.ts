import { useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import { useNetwork } from "@/contexts/NetworkContext";

export interface PriceFeed {
  feedId: string; // Hex string (without 0x prefix)
  quoteCurrency: number; // 0=USD, 1=SUI
  intermediateFeedId?: string;
}

export interface PriceFeedRegistry {
  suiUsdFeedId: string;
  feeds: Map<string, PriceFeed>;
}

/**
 * Convert on-chain blob (number array) to hex string
 */
function bytesToHex(bytes: number[]): string {
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Fetch PriceFeedRegistry from on-chain
 * This provides Pyth price feed IDs for each token, eliminating hardcoded feed IDs
 */
export function usePriceFeedRegistry() {
  const client = useSuiClient();
  const { contracts, network } = useNetwork();

  return useQuery({
    queryKey: ["price-feed-registry", network, contracts.priceFeedRegistry],
    queryFn: async (): Promise<PriceFeedRegistry> => {
      if (!contracts.priceFeedRegistry) {
        throw new Error("PriceFeedRegistry not configured for this network");
      }

      const obj = await client.getObject({
        id: contracts.priceFeedRegistry,
        options: { showContent: true },
      });

      if (!obj.data?.content || obj.data.content.dataType !== "moveObject") {
        throw new Error("Failed to fetch price feed registry");
      }

      const fields = (obj.data.content as any).fields;
      const suiUsdFeedId = bytesToHex(fields.sui_usd_feed_id);

      return {
        suiUsdFeedId,
        feeds: new Map(),
      };
    },
    enabled: !!contracts.priceFeedRegistry,
    staleTime: 300000, // Cache for 5 minutes
  });
}

/**
 * Fetch a specific price feed for a coin type from the registry
 */
export function usePriceFeed(coinType: string | undefined) {
  const client = useSuiClient();
  const { contracts, network } = useNetwork();

  return useQuery({
    queryKey: ["price-feed", network, contracts.priceFeedRegistry, coinType],
    queryFn: async (): Promise<PriceFeed | null> => {
      if (!coinType || !contracts.priceFeedRegistry) return null;

      try {
        const feedObj = await client.getDynamicFieldObject({
          parentId: contracts.priceFeedRegistry,
          name: {
            type: "0x1::ascii::String",
            value: coinType,
          },
        });

        if (
          !feedObj.data?.content ||
          feedObj.data.content.dataType !== "moveObject"
        ) {
          return null;
        }

        const fields = (feedObj.data.content as any).fields.value?.fields;
        if (!fields) return null;

        return {
          feedId: bytesToHex(fields.feed_id),
          quoteCurrency: fields.quote_currency,
          intermediateFeedId: fields.intermediate_feed_id?.fields?.vec?.[0]
            ? bytesToHex(fields.intermediate_feed_id.fields.vec[0])
            : undefined,
        };
      } catch {
        return null;
      }
    },
    enabled: !!coinType && !!contracts.priceFeedRegistry,
    staleTime: 300000,
  });
}

/**
 * Fetch price feeds for multiple coin types
 */
export function usePriceFeeds(coinTypes: string[]) {
  const client = useSuiClient();
  const { contracts, network } = useNetwork();

  return useQuery({
    queryKey: [
      "price-feeds",
      network,
      contracts.priceFeedRegistry,
      coinTypes.join(","),
    ],
    queryFn: async (): Promise<Map<string, PriceFeed>> => {
      const feeds = new Map<string, PriceFeed>();

      if (!contracts.priceFeedRegistry) {
        return feeds;
      }

      // Fetch the registry's dynamic fields (table entries)
      let cursor: string | null = null;
      const allFields: any[] = [];

      do {
        const response = await client.getDynamicFields({
          parentId: contracts.priceFeedRegistry,
          cursor,
        });
        allFields.push(...response.data);
        cursor = response.hasNextPage ? response.nextCursor : null;
      } while (cursor);

      for (const field of allFields) {
        if (
          field.name?.value &&
          coinTypes.some((ct) => ct === field.name.value)
        ) {
          try {
            const feedObj = await client.getObject({
              id: field.objectId,
              options: { showContent: true },
            });

            if (
              feedObj.data?.content &&
              feedObj.data.content.dataType === "moveObject"
            ) {
              const f =
                (feedObj.data.content as any).fields?.value?.fields ||
                (feedObj.data.content as any).fields;
              if (f?.feed_id) {
                feeds.set(field.name.value, {
                  feedId: bytesToHex(f.feed_id),
                  quoteCurrency: f.quote_currency || 0,
                  intermediateFeedId: f.intermediate_feed_id?.fields?.vec?.[0]
                    ? bytesToHex(f.intermediate_feed_id.fields.vec[0])
                    : undefined,
                });
              }
            }
          } catch (e) {
            console.warn(`Failed to fetch feed for ${field.name.value}:`, e);
          }
        }
      }

      return feeds;
    },
    enabled: coinTypes.length > 0 && !!contracts.priceFeedRegistry,
    staleTime: 300000,
  });
}
