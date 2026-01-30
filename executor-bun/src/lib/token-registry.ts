/**
 * Token Registry - Maps Sui token types to Pyth price feed IDs
 *
 * This file contains the known Sui mainnet token addresses and their
 * corresponding Pyth price feed IDs for oracle-based pricing.
 */

export interface TokenInfo {
  symbol: string;
  name: string;
  type: string;
  decimals: number;
  pythFeedId: string; // 32-byte hex without 0x prefix
  pythSymbol: string;
}

/**
 * Known Sui mainnet tokens with Pyth price feeds
 *
 * To add a new token:
 * 1. Find the Pyth feed ID: https://www.pyth.network/developers/price-feed-ids
 * 2. Find the Sui token type from the token's documentation or explorer
 * 3. Add entry below with correct decimals
 */
export const TOKEN_REGISTRY: Record<string, TokenInfo> = {
  // === Native ===
  "SUI": {
    symbol: "SUI",
    name: "Sui",
    type: "0x2::sui::SUI",
    decimals: 9,
    pythFeedId: "23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744",
    pythSymbol: "Crypto.SUI/USD",
  },

  // === Stablecoins ===
  "USDC": {
    symbol: "USDC",
    name: "USD Coin",
    type: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
    decimals: 6,
    pythFeedId: "eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
    pythSymbol: "Crypto.USDC/USD",
  },
  "USDT": {
    symbol: "USDT",
    name: "Tether USD (Wormhole)",
    type: "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN",
    decimals: 6,
    pythFeedId: "2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b",
    pythSymbol: "Crypto.USDT/USD",
  },
  "BUCK": {
    symbol: "BUCK",
    name: "Bucket USD",
    type: "0xce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2::buck::BUCK",
    decimals: 9,
    pythFeedId: "fdf28a46570252b25fd31cb257973f865afc5ca2f320439e45d95e0394bc7382",
    pythSymbol: "Crypto.BUCK/USD",
  },

  // === Sui Ecosystem Tokens ===
  "DEEP": {
    symbol: "DEEP",
    name: "DeepBook",
    type: "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP",
    decimals: 6,
    pythFeedId: "29bdd5248234e33bd93d3b81100b5fa32eaa5997843847e2c2cb16d7c6d9f7ff",
    pythSymbol: "Crypto.DEEP/USD",
  },
  "CETUS": {
    symbol: "CETUS",
    name: "Cetus",
    type: "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS",
    decimals: 9,
    pythFeedId: "e5b274b2611143df055d6e7cd8d93fe1961716bcd4dca1cad87a83bc1e78c1ef",
    pythSymbol: "Crypto.CETUS/USD",
  },
  "WAL": {
    symbol: "WAL",
    name: "Walrus",
    type: "0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL",
    decimals: 9,
    pythFeedId: "eba0732395fae9dec4bae12e52760b35fc1c5671e2da8b449c9af4efe5d54341",
    pythSymbol: "Crypto.WAL/USD",
  },
  "TURBOS": {
    symbol: "TURBOS",
    name: "Turbos Finance",
    type: "0x5d1f47ea69bb0de31c313d7acf89b890dbb8991ea8e03c6c355171f84bb1ba4a::turbos::TURBOS",
    decimals: 9,
    pythFeedId: "f9c2e890443dd995d0baafc08eea3358be1ffb874f93f99c30b3816c460bbac3",
    pythSymbol: "Crypto.TURBOS/USD",
  },
  "NS": {
    symbol: "NS",
    name: "SuiNS",
    type: "0x5145494a5f5100e645e4b0aa950fa6b68f614e8c59e17bc5ded3495123a79178::ns::NS",
    decimals: 6,
    pythFeedId: "bb5ff26e47a3a6cc7ec2fce1db996c2a145300edc5acaabe43bf9ff7c5dd5d32",
    pythSymbol: "Crypto.NS/USD",
  },
  "NAVX": {
    symbol: "NAVX",
    name: "NAVI Protocol",
    type: "0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::navx::NAVX",
    decimals: 9,
    pythFeedId: "88250f854c019ef4f88a5c073d52a18bb1c6ac437033f5932cd017d24917ab46",
    pythSymbol: "Crypto.NAVX/USD",
  },
  "SCA": {
    symbol: "SCA",
    name: "Scallop",
    type: "0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6::sca::SCA",
    decimals: 9,
    pythFeedId: "7e17f0ac105abe9214deb9944c30264f5986bf292869c6bd8e8da3ccd92d79bc",
    pythSymbol: "Crypto.SCA/USD",
  },

  // === Liquid Staking Tokens ===
  "haSUI": {
    symbol: "haSUI",
    name: "Haedal Staked SUI",
    type: "0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI",
    decimals: 9,
    pythFeedId: "6120ffcf96395c70aa77e72dcb900bf9d40dccab228efca59a17b90ce423d5e8",
    pythSymbol: "Crypto.HASUI/USD",
  },
  "vSUI": {
    symbol: "vSUI",
    name: "Volo Staked SUI",
    type: "0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT",
    decimals: 9,
    pythFeedId: "57ff7100a282e4af0c91154679c5dae2e5dcacb93fd467ea9cb7e58afdcfde27",
    pythSymbol: "Crypto.VSUI/USD",
  },
  "afSUI": {
    symbol: "afSUI",
    name: "Aftermath Staked SUI",
    type: "0xf325ce1300e8dac124071d3152c5c5ee6174914f8bc2161e88329cf579246efc::afsui::AFSUI",
    decimals: 9,
    pythFeedId: "17cd845b16e874485b2684f8b8d1517d744105dbb904eec30222717f4bc9ee0d",
    pythSymbol: "Crypto.AFSUI/USD",
  },

  // === Bridged Assets ===
  "WBTC": {
    symbol: "WBTC",
    name: "Wrapped Bitcoin (Wormhole)",
    type: "0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN",
    decimals: 8,
    pythFeedId: "c9d8b075a5c69303365ae23633d4e085199bf5c520a3b90fed1322a0342ffc33",
    pythSymbol: "Crypto.WBTC/USD",
  },
  "WETH": {
    symbol: "WETH",
    name: "Wrapped Ether (Wormhole)",
    type: "0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN",
    decimals: 8,
    pythFeedId: "ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
    pythSymbol: "Crypto.ETH/USD",
  },
};

// Create reverse lookup by Sui type
export const TOKEN_BY_TYPE: Record<string, TokenInfo> = Object.fromEntries(
  Object.values(TOKEN_REGISTRY).map(token => [token.type, token])
);

/**
 * Get token info by symbol
 */
export function getTokenBySymbol(symbol: string): TokenInfo | undefined {
  return TOKEN_REGISTRY[symbol.toUpperCase()];
}

/**
 * Get token info by Sui type
 */
export function getTokenByType(type: string): TokenInfo | undefined {
  return TOKEN_BY_TYPE[type];
}

/**
 * Get Pyth feed ID for a token type
 */
export function getPythFeedId(type: string): string | undefined {
  return TOKEN_BY_TYPE[type]?.pythFeedId;
}

/**
 * Get token decimals
 */
export function getTokenDecimals(type: string): number | undefined {
  return TOKEN_BY_TYPE[type]?.decimals;
}

/**
 * Check if a token has a registered price feed
 */
export function hasRegisteredFeed(type: string): boolean {
  return type in TOKEN_BY_TYPE;
}

/**
 * Get all registered token types
 */
export function getAllTokenTypes(): string[] {
  return Object.keys(TOKEN_BY_TYPE);
}

/**
 * Get all registered tokens
 */
export function getAllTokens(): TokenInfo[] {
  return Object.values(TOKEN_REGISTRY);
}
