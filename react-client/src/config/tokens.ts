/**
 * Supported tokens for DCA with Pyth price feed IDs
 */

export interface TokenInfo {
  symbol: string;
  name: string;
  type: string;
  decimals: number;
  pythPriceId?: string; // Pyth price feed ID (hex without 0x)
  iconUrl?: string;
}

// Pyth price feed IDs for Sui mainnet
// https://pyth.network/developers/price-feed-ids
const PYTH_PRICE_IDS = {
  SUI: "23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744",
  USDC: "eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
  USDT: "2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b",
  ETH: "ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
  BTC: "e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
  DEEP: "29bdd5248234e33bd93d3b81100b5fa32eaa5997843847e2c2cb16d7db9ee2ba",
  CETUS: "e5b274b2611143df055d6e7cd8d93fe1961716bcd4dca1cad87a83bc1e78c1ef",
  WAL: null, // No Pyth feed yet
};

export const TOKENS: Record<string, TokenInfo> = {
  SUI: {
    symbol: "SUI",
    name: "Sui",
    type: "0x2::sui::SUI",
    decimals: 9,
    pythPriceId: PYTH_PRICE_IDS.SUI,
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    type: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
    decimals: 6,
    pythPriceId: PYTH_PRICE_IDS.USDC,
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    type: "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN",
    decimals: 6,
    pythPriceId: PYTH_PRICE_IDS.USDT,
  },
  DEEP: {
    symbol: "DEEP",
    name: "DeepBook",
    type: "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP",
    decimals: 6,
    pythPriceId: PYTH_PRICE_IDS.DEEP,
  },
  CETUS: {
    symbol: "CETUS",
    name: "Cetus",
    type: "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS",
    decimals: 9,
    pythPriceId: PYTH_PRICE_IDS.CETUS,
  },
  WAL: {
    symbol: "WAL",
    name: "Walrus",
    type: "0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL",
    decimals: 9,
    pythPriceId: PYTH_PRICE_IDS.WAL ?? undefined,
  },
  WETH: {
    symbol: "WETH",
    name: "Wrapped Ether",
    type: "0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN",
    decimals: 8,
    pythPriceId: PYTH_PRICE_IDS.ETH,
  },
  WBTC: {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    type: "0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN",
    decimals: 8,
    pythPriceId: PYTH_PRICE_IDS.BTC,
  },
};

export const TOKEN_LIST = Object.values(TOKENS);

export function getTokenBySymbol(symbol: string): TokenInfo | undefined {
  return TOKENS[symbol];
}

export function getTokenByType(type: string): TokenInfo | undefined {
  return TOKEN_LIST.find((t) => t.type === type);
}
