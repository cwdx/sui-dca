import { useQuery } from "@tanstack/react-query";
import type { TokenInfo } from "@/config/tokens";

const HERMES_URL = "https://hermes.pyth.network";

interface PythPrice {
  id: string;
  price: {
    price: string;
    conf: string;
    expo: number;
    publish_time: number;
  };
}

export interface TokenPrice {
  price: number;
  confidence: number;
  timestamp: number;
}

// Fetch single token price
export function usePythPrice(token: TokenInfo | undefined) {
  return useQuery({
    queryKey: ["pyth-price", token?.pythPriceId],
    queryFn: async (): Promise<TokenPrice | null> => {
      if (!token?.pythPriceId) return null;

      const response = await fetch(
        `${HERMES_URL}/v2/updates/price/latest?ids[]=${token.pythPriceId}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch price: ${response.status}`);
      }

      const data = await response.json();
      const priceData = data.parsed?.[0]?.price;

      if (!priceData) return null;

      const price = Number(priceData.price) * 10 ** priceData.expo;
      const confidence = Number(priceData.conf) * 10 ** priceData.expo;

      return {
        price,
        confidence,
        timestamp: priceData.publish_time * 1000,
      };
    },
    enabled: !!token?.pythPriceId,
    refetchInterval: 10000, // Refresh every 10 seconds
    staleTime: 5000,
  });
}

// Fetch multiple token prices in one request
export function usePythPrices(tokens: TokenInfo[]) {
  const priceIds = tokens
    .filter((t) => t.pythPriceId)
    .map((t) => t.pythPriceId!);

  return useQuery({
    queryKey: ["pyth-prices", priceIds.join(",")],
    queryFn: async (): Promise<Map<string, TokenPrice>> => {
      if (priceIds.length === 0) return new Map();

      const idsParam = priceIds.map((id) => `ids[]=${id}`).join("&");
      const response = await fetch(
        `${HERMES_URL}/v2/updates/price/latest?${idsParam}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.status}`);
      }

      const data = await response.json();
      const results = new Map<string, TokenPrice>();

      for (const item of data.parsed || []) {
        const priceData = item.price;
        if (!priceData) continue;

        const price = Number(priceData.price) * 10 ** priceData.expo;
        const confidence = Number(priceData.conf) * 10 ** priceData.expo;

        results.set(item.id, {
          price,
          confidence,
          timestamp: priceData.publish_time * 1000,
        });
      }

      return results;
    },
    enabled: priceIds.length > 0,
    refetchInterval: 10000,
    staleTime: 5000,
  });
}

// Get price of token A in terms of token B
export function calculateExchangeRate(
  priceA: TokenPrice | null | undefined,
  priceB: TokenPrice | null | undefined,
): number | null {
  if (!priceA || !priceB || priceB.price === 0) return null;
  return priceA.price / priceB.price;
}

/**
 * Fetch prices by raw feed IDs (from on-chain registry)
 * This allows fetching prices for any token registered on-chain
 */
export function usePythPricesByFeedIds(feedIds: string[]) {
  return useQuery({
    queryKey: ["pyth-prices-raw", feedIds.join(",")],
    queryFn: async (): Promise<Map<string, TokenPrice>> => {
      if (feedIds.length === 0) return new Map();

      const idsParam = feedIds.map((id) => `ids[]=${id}`).join("&");
      const response = await fetch(
        `${HERMES_URL}/v2/updates/price/latest?${idsParam}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.status}`);
      }

      const data = await response.json();
      const results = new Map<string, TokenPrice>();

      for (const item of data.parsed || []) {
        const priceData = item.price;
        if (!priceData) continue;

        const price = Number(priceData.price) * 10 ** priceData.expo;
        const confidence = Number(priceData.conf) * 10 ** priceData.expo;

        results.set(item.id, {
          price,
          confidence,
          timestamp: priceData.publish_time * 1000,
        });
      }

      return results;
    },
    enabled: feedIds.length > 0,
    refetchInterval: 10000,
    staleTime: 5000,
  });
}
