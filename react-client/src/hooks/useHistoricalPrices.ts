import { useQuery } from "@tanstack/react-query";
import type { TokenInfo } from "@/config/tokens";

const BENCHMARKS_API = "https://benchmarks.pyth.network/v1/shims/tradingview";

export interface HistoricalPrice {
  timestamp: number;
  price: number;
}

export interface DCABacktestResult {
  date: string;
  timestamp: number;
  invested: number;
  tokensAcquired: number;
  avgPrice: number;
  dcaValue: number;
  exchangeRate: number;
}

export interface BacktestSummary {
  totalInvested: number;
  dcaTokensAcquired: number;
  dcaAvgPrice: number;
  dcaCurrentValue: number;
  dcaReturn: number;
  trades: DCABacktestResult[];
}

// Map token symbols to Pyth TradingView symbols
const PYTH_SYMBOLS: Record<string, string> = {
  SUI: "Crypto.SUI/USD",
  USDC: "Crypto.USDC/USD",
  USDT: "Crypto.USDT/USD",
  WETH: "Crypto.ETH/USD",
  WBTC: "Crypto.BTC/USD",
  CETUS: "Crypto.CETUS/USD",
  DEEP: "Crypto.DEEP/USD",
  WAL: "Crypto.WAL/USD",
};

type Resolution = "1" | "5" | "15" | "60" | "240" | "D" | "W";

/**
 * Fetch historical OHLC prices from Pyth Benchmarks
 */
async function fetchPythHistory(
  symbol: string,
  fromTs: number,
  toTs: number,
  resolution: Resolution = "D",
): Promise<HistoricalPrice[]> {
  const pythSymbol = PYTH_SYMBOLS[symbol];
  if (!pythSymbol) return [];

  try {
    const url = `${BENCHMARKS_API}/history?symbol=${encodeURIComponent(pythSymbol)}&resolution=${resolution}&from=${fromTs}&to=${toTs}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Pyth Benchmarks error: ${response.status}`);
      return [];
    }

    const data = await response.json();

    if (data.s !== "ok" || !data.t || !data.c) {
      return [];
    }

    // Use close prices
    return data.t.map((timestamp: number, i: number) => ({
      timestamp: timestamp * 1000, // Convert to milliseconds
      price: data.c[i],
    }));
  } catch (error) {
    console.error(`Failed to fetch Pyth history for ${symbol}:`, error);
    return [];
  }
}

/**
 * Hook to fetch historical prices for a token pair
 */
export function useHistoricalPrices(
  inputToken: TokenInfo | undefined,
  outputToken: TokenInfo | undefined,
  startDate: Date,
  endDate: Date,
  resolution: Resolution = "D",
) {
  const fromTs = Math.floor(startDate.getTime() / 1000);
  const toTs = Math.floor(endDate.getTime() / 1000);

  return useQuery({
    queryKey: [
      "pyth-historical",
      inputToken?.symbol,
      outputToken?.symbol,
      fromTs,
      toTs,
      resolution,
    ],
    queryFn: async (): Promise<HistoricalPrice[] | null> => {
      if (!inputToken || !outputToken) return null;

      // Fetch both token USD prices
      const [inputPrices, outputPrices] = await Promise.all([
        fetchPythHistory(inputToken.symbol, fromTs, toTs, resolution),
        fetchPythHistory(outputToken.symbol, fromTs, toTs, resolution),
      ]);

      if (!inputPrices.length || !outputPrices.length) return null;

      // Create map of output prices by timestamp
      const outputMap = new Map<number, number>();
      for (const p of outputPrices) {
        outputMap.set(p.timestamp, p.price);
      }

      // Calculate exchange rates (input/output)
      const exchangeRates: HistoricalPrice[] = [];
      for (const input of inputPrices) {
        const outputPrice = outputMap.get(input.timestamp);
        if (outputPrice && outputPrice > 0) {
          exchangeRates.push({
            timestamp: input.timestamp,
            price: input.price / outputPrice,
          });
        }
      }

      return exchangeRates;
    },
    enabled:
      !!inputToken &&
      !!outputToken &&
      !!PYTH_SYMBOLS[inputToken.symbol] &&
      !!PYTH_SYMBOLS[outputToken.symbol] &&
      fromTs < toTs,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Calculate DCA backtest from historical prices
 */
export function calculateBacktest(
  prices: HistoricalPrice[],
  amountPerTrade: number,
  intervalDays: number,
): BacktestSummary | null {
  if (!prices.length || amountPerTrade <= 0 || intervalDays <= 0) return null;

  const trades: DCABacktestResult[] = [];
  let totalInvested = 0;
  let tokensAcquired = 0;

  const startTime = prices[0].timestamp;
  const endTime = prices[prices.length - 1].timestamp;
  const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
  const currentPrice = prices[prices.length - 1].price;

  // Execute trades at intervals
  for (
    let tradeTime = startTime;
    tradeTime <= endTime;
    tradeTime += intervalMs
  ) {
    const price = findClosestPrice(prices, tradeTime);
    if (!price || price.price <= 0) continue;

    // DCA trade
    const tokensThisTrade = amountPerTrade / price.price;
    totalInvested += amountPerTrade;
    tokensAcquired += tokensThisTrade;

    const avgPrice = totalInvested / tokensAcquired;
    const dcaValue = tokensAcquired * currentPrice;

    trades.push({
      date: new Date(tradeTime).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "2-digit",
      }),
      timestamp: tradeTime,
      invested: totalInvested,
      tokensAcquired,
      avgPrice,
      dcaValue,
      exchangeRate: price.price,
    });
  }

  if (trades.length === 0) return null;

  const finalDcaValue = tokensAcquired * currentPrice;

  return {
    totalInvested,
    dcaTokensAcquired: tokensAcquired,
    dcaAvgPrice: totalInvested / tokensAcquired,
    dcaCurrentValue: finalDcaValue,
    dcaReturn: ((finalDcaValue - totalInvested) / totalInvested) * 100,
    trades,
  };
}

function findClosestPrice(
  prices: HistoricalPrice[],
  targetTime: number,
): HistoricalPrice | null {
  if (!prices.length) return null;

  let closest = prices[0];
  let minDiff = Math.abs(prices[0].timestamp - targetTime);

  for (const price of prices) {
    const diff = Math.abs(price.timestamp - targetTime);
    if (diff < minDiff) {
      minDiff = diff;
      closest = price;
    }
    if (price.timestamp > targetTime && diff > minDiff) break;
  }

  return closest;
}

/**
 * Check if historical data is available for a token
 */
export function hasHistoricalData(token: TokenInfo): boolean {
  return !!PYTH_SYMBOLS[token.symbol];
}
