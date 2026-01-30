import { useQuery } from "@tanstack/react-query";
import { TOKEN_LIST, type TokenInfo } from "@/config/tokens";

const HERMES_URL = "https://hermes.pyth.network";

export interface TokenPrice {
  price: number;
  confidence: number;
  timestamp: number;
}

// Map of token symbol to USD price
export type PriceMap = Map<string, TokenPrice>;

/**
 * Fetch all available Pyth prices in a single request.
 * Handles partial failures gracefully - if some IDs are invalid, we still get the valid ones.
 */
export function usePythPrices(tokens: TokenInfo[]) {
  const tokensByPriceId = new Map<string, TokenInfo>();
  for (const token of tokens) {
    if (token.pythPriceId) {
      tokensByPriceId.set(token.pythPriceId, token);
    }
  }
  const priceIds = Array.from(tokensByPriceId.keys());

  return useQuery({
    queryKey: ["pyth-prices", priceIds.join(",")],
    queryFn: async (): Promise<PriceMap> => {
      if (priceIds.length === 0) return new Map();

      // Fetch prices - Pyth returns partial results if some IDs are invalid
      const idsParam = priceIds.map((id) => `ids[]=${id}`).join("&");
      const response = await fetch(
        `${HERMES_URL}/v2/updates/price/latest?${idsParam}`,
      );

      // If request fails, try fetching one by one
      if (!response.ok) {
        return fetchPricesIndividually(priceIds, tokensByPriceId);
      }

      const data = await response.json();
      const results = new Map<string, TokenPrice>();

      for (const item of data.parsed || []) {
        const priceData = item.price;
        if (!priceData) continue;

        const price = Number(priceData.price) * 10 ** priceData.expo;
        const confidence = Number(priceData.conf) * 10 ** priceData.expo;
        const token = tokensByPriceId.get(item.id);

        if (token) {
          results.set(token.pythPriceId!, {
            price,
            confidence,
            timestamp: priceData.publish_time * 1000,
          });
        }
      }

      return results;
    },
    enabled: priceIds.length > 0,
    refetchInterval: 10000,
    staleTime: 5000,
    retry: 2,
    retryDelay: 1000,
  });
}

/**
 * Fallback: fetch prices one by one to handle invalid IDs gracefully
 */
async function fetchPricesIndividually(
  priceIds: string[],
  tokensByPriceId: Map<string, TokenInfo>,
): Promise<PriceMap> {
  const results = new Map<string, TokenPrice>();

  await Promise.allSettled(
    priceIds.map(async (priceId) => {
      try {
        const response = await fetch(
          `${HERMES_URL}/v2/updates/price/latest?ids[]=${priceId}`,
        );
        if (!response.ok) return;

        const data = await response.json();
        const item = data.parsed?.[0];
        if (!item?.price) return;

        const priceData = item.price;
        const price = Number(priceData.price) * 10 ** priceData.expo;
        const confidence = Number(priceData.conf) * 10 ** priceData.expo;
        const token = tokensByPriceId.get(priceId);

        if (token) {
          results.set(token.pythPriceId!, {
            price,
            confidence,
            timestamp: priceData.publish_time * 1000,
          });
        }
      } catch {
        // Silently ignore individual failures
      }
    }),
  );

  return results;
}

/**
 * Calculate exchange rate between two tokens.
 * Supports multi-hop routing through USD prices.
 *
 * @param inputToken - Token to sell (e.g., USDC)
 * @param outputToken - Token to buy (e.g., SUI)
 * @param prices - Map of pythPriceId -> TokenPrice (USD prices)
 * @returns Exchange rate (how many outputToken per 1 inputToken), or null if unavailable
 */
export function calculateExchangeRate(
  inputToken: TokenInfo,
  outputToken: TokenInfo,
  prices: PriceMap | undefined,
): number | null {
  if (!prices) return null;

  // Both tokens need USD prices for calculation
  const inputUsdPrice = inputToken.pythPriceId
    ? prices.get(inputToken.pythPriceId)
    : null;
  const outputUsdPrice = outputToken.pythPriceId
    ? prices.get(outputToken.pythPriceId)
    : null;

  // Direct calculation if both have USD prices
  if (inputUsdPrice && outputUsdPrice && outputUsdPrice.price > 0) {
    return inputUsdPrice.price / outputUsdPrice.price;
  }

  // Multi-hop: Try to find a path through a common token (USD-priced tokens)
  // For tokens without Pyth feeds, we could add on-chain DEX price lookup here
  // For now, return null if direct path not available
  return null;
}

/**
 * Get USD price for a single token
 */
export function getUsdPrice(
  token: TokenInfo,
  prices: PriceMap | undefined,
): number | null {
  if (!prices || !token.pythPriceId) return null;
  return prices.get(token.pythPriceId)?.price ?? null;
}

// Legacy exports for backwards compatibility
export function usePythPrice(token: TokenInfo | undefined) {
  return useQuery({
    queryKey: ["pyth-price", token?.pythPriceId],
    queryFn: async (): Promise<TokenPrice | null> => {
      if (!token?.pythPriceId) return null;

      const response = await fetch(
        `${HERMES_URL}/v2/updates/price/latest?ids[]=${token.pythPriceId}`,
      );

      if (!response.ok) return null;

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
    refetchInterval: 10000,
    staleTime: 5000,
  });
}

/**
 * Hook to get all token prices with convenient accessors
 */
export function useTokenPrices() {
  const { data: prices, isLoading, isError } = usePythPrices(TOKEN_LIST);

  return {
    prices,
    isLoading,
    isError,
    getPrice: (token: TokenInfo) => getUsdPrice(token, prices),
    getExchangeRate: (input: TokenInfo, output: TokenInfo) =>
      calculateExchangeRate(input, output, prices),
  };
}
