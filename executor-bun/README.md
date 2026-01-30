# DCA Executor

Production-ready permissionless executor for Sui DCA (Dollar Cost Averaging) smart contracts.

## Features

- **Sequential Execution**: Reliable one-at-a-time swap execution with 7k Protocol
- **Multi-DEX Aggregation**: FlowX, Cetus, Bluefin via 7k MetaAg
- **Oracle-Based Pricing**: Pyth oracle integration for trustless min_output calculation
- **Queue Management**: p-queue with concurrency control, retries, timeouts
- **Multiple Operators**: CLI, Express API, Cloudflare Workers, Firebase Functions, Cloud Run
- **Pagination**: Handle large numbers of DCAs efficiently
- **Event System**: Hook into execution lifecycle

## TypeScript Client Generation

Generate typed SDK bindings from the Move contracts using [sui-client-gen](https://github.com/kunalabs-io/sui-client-gen):

```bash
# First time: build the Docker image (~25 min)
bun run codegen:build-image

# Generate for Node/Bun (executor)
bun run codegen
# Output: executor-bun/src/_generated/

# Generate for React frontend
bun run codegen:react
# Output: react-client/src/_generated/
```

The generated TypeScript includes:
- Typed function wrappers (`initAccount`, `initTrade`, `resolveTrade`, etc.)
- BCS struct definitions (`DCA`, `TradePromise`, `GlobalConfig`, etc.)
- Event types (`DCACreatedEvent`, `TradeCompletedEvent`, etc.)

**Usage example:**
```typescript
import { initAccount } from './_generated/dca/dca/functions'
import { Transaction } from '@mysten/sui/transactions'

const tx = new Transaction()
initAccount(tx, [INPUT_TYPE, OUTPUT_TYPE], {
  globalConfig: CONFIG_ID,
  clock: '0x6',
  // ... typed args
})
```

## Quick Start

```bash
# Install dependencies
bun install

# Configure environment
cp .env.example .env
# Edit .env with your EXECUTOR_PRIVATE_KEY

# Discover eligible DCAs
bun run discover

# Execute eligible DCAs
bun run execute
```

## Architecture

```
src/
├── lib/                    # Core utilities
│   ├── types.ts           # TypeScript types
│   ├── config.ts          # Configuration loader
│   └── client.ts          # Sui client, MetaAg, keypair
├── handlers/              # Business logic
│   ├── discover.ts        # DCA discovery with pagination
│   ├── execute.ts         # Single DCA execution
│   └── queue.ts           # Queue management (p-queue)
├── operators/             # Trigger mechanisms
│   ├── cli.ts             # Command-line interface
│   ├── express.ts         # Express/Hono API server
│   ├── cloudflare.ts      # Cloudflare Workers
│   ├── firebase.ts        # Firebase Functions
│   └── gcloud.ts          # Google Cloud Run
└── index.ts               # Main exports
```

## Usage

### As a Library

```typescript
import { discover, executeBatch, createQueue } from "dca-executor";

// Discover eligible DCAs
const { dcas, hasMore } = await discover({ limit: 10 });

// Execute with queue
const result = await executeBatch(dcas, {
  concurrency: 1,
  intervalMs: 3000,
  maxRetries: 2,
});

console.log(`Executed ${result.succeeded}/${result.total} DCAs`);
```

### CLI Operator

```bash
# Discover eligible DCAs
bun run cli --discover

# Execute with limit
bun run cli --limit 10

# Filter by owner
bun run cli --owner 0x123...

# Dry run mode
DRY_RUN=true bun run cli
```

### Express API Operator

```bash
# Start server
bun run server

# Endpoints:
# GET  /health           - Health check
# GET  /discover         - List eligible DCAs
# POST /execute          - Execute eligible DCAs
# POST /execute/:dcaId   - Execute specific DCA
```

### Cloud Deployment

**Cloudflare Workers:**
```bash
# wrangler.toml
[triggers]
crons = ["*/5 * * * *"]

wrangler deploy
```

**Google Cloud Run:**
```bash
# Build and deploy
docker build -t gcr.io/PROJECT/dca-executor .
gcloud run deploy dca-executor --image gcr.io/PROJECT/dca-executor

# Set up Cloud Scheduler
gcloud scheduler jobs create http dca-executor-job \
  --schedule "*/5 * * * *" \
  --uri "https://dca-executor-xxx.run.app/execute" \
  --http-method POST
```

**Firebase Functions:**
```typescript
// index.ts
export { dcaExecutorHttp, dcaExecutorScheduled } from "dca-executor/operators/firebase";
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `SUI_NETWORK` | `mainnet` | Sui network |
| `SUI_RPC_URL` | Mysten fullnode | RPC endpoint |
| `EXECUTOR_PRIVATE_KEY` | - | Private key (suiprivkey, base64, or hex) |
| `DCA_PACKAGE_ID` | v4 mainnet | DCA contract package |
| `PRICE_FEED_REGISTRY_ID` | - | Price feed registry object ID |
| `PYTH_STATE_ID` | mainnet | Pyth state object ID |
| `WORMHOLE_STATE_ID` | mainnet | Wormhole state object ID |
| `MAX_BATCH_SIZE` | `50` | Max DCAs per batch |
| `EXECUTION_DELAY_MS` | `3000` | Delay between executions |
| `DRY_RUN` | `false` | Simulate without executing |

### Cloud Provider Timeouts

Operators automatically calculate safe batch sizes based on cloud timeouts:

| Variable | Default | Description |
|----------|---------|-------------|
| `CF_TIMEOUT_MS` | `30000` | Cloudflare Workers timeout (30s) |
| `FIREBASE_TIMEOUT_MS` | `60000` | Firebase Functions timeout (60s gen1, 540s gen2) |
| `CLOUD_RUN_TIMEOUT_MS` | `300000` | Cloud Run timeout (5min default, 60min max) |

The executor uses `calculateSafeBatchSize()` to determine how many DCAs can fit within the timeout, leaving a 5s buffer for graceful shutdown.

## Queue Options

```typescript
const result = await executeBatch(dcas, {
  concurrency: 1,      // Sequential (recommended for 7k)
  intervalMs: 3000,    // Delay between executions
  maxRetries: 2,       // Retry count for transient errors
  timeoutMs: 60000,    // Per-execution timeout
});
```

## Event Handling

```typescript
import { createQueue } from "dca-executor";

const queue = createQueue();

queue.on((event) => {
  switch (event.type) {
    case "execution:start":
      console.log(`Starting ${event.data.dcaId}`);
      break;
    case "execution:success":
      console.log(`Success: ${event.data.digest}`);
      break;
    case "execution:error":
      console.error(`Error: ${event.data.error}`);
      break;
  }
});

await queue.executeBatch(dcas);
```

## Scalability (10k+ DCAs)

Discovery is optimized for large datasets:

```typescript
// Method 1: Paginated discovery
const { dcas, hasMore, nextCursor } = await discover({ limit: 100 });
// Then fetch next page with cursor

// Method 2: Streaming (memory-efficient)
for await (const dca of discoverStream()) {
  await queue.add(dca); // Process immediately, don't accumulate
}

// Method 3: Callback-based
await discoverWithCallback(
  (dca) => queue.add(dca),
  { inputType: "0x2::sui::SUI" }
);
```

**Performance optimizations:**
- `multiGetObjects` batches (50 objects per call vs individual fetches)
- `p-map` concurrency control (10 parallel RPC calls)
- Streaming pagination (never loads all 10k+ DCAs in memory)
- Event cursor-based pagination (100 events per page)

**Estimated throughput:**
- ~500 DCAs/second discovery rate
- ~1 DCA/3s execution rate (7k quote provider sync delay)

## Why Sequential Execution?

7k Protocol's `settle` function validates that `output >= expected_output` per swap. When batching multiple swaps:

1. Quotes are fetched at time T₀
2. First swap executes and changes pool liquidity
3. Second swap's quote (from T₀) is now stale
4. Output < expected → settle error

**Solution**: Execute DCAs one at a time with 3s delay for quote providers to sync.

## Contract Addresses (Mainnet)

- **DCA Package v4**: `0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4`
- **GlobalConfig**: `0xe9f6adaea71cee4a1d4a3e48e7a42be8d2aa66f1f21e02ffa38e447d6bf3c13a`
- **FeeTracker**: `0x5a840524e2c1cad27da155c6cdeff4652b76bcef1c7aad6f1ce51710e8397057`
- **PriceFeedRegistry**: `0xdb8054678f011b6a9d5dbe72b92817bfa904c00729b9c64cc0158ebc2c27d0e0`
- **TermsRegistry**: `0xb419b1189f3cf29808c20bc5660f228362b8af0044e707258d4a687fc9285c6a`
- **AdminCap**: `0x41d0976ce8c84ac68803a1807e720a989f5d070d14e39028f3a91c23d294e017`
- **UpgradeCap**: `0x9f3de629cf31630abacf6b6748231fc8d41b762958afd0b369d204817580adc7`

### Pyth Oracle (Mainnet)

- **Pyth State**: `0x1f9310238ee9298fb703c3419030b35b22bb1cc37113e3bb5007c99aec79e5b8`
- **Wormhole State**: `0xaeab97f96cf9877fee2883315d459552b2b921edc16d7ceac6eab944dd88919c`

### Registered Price Feeds

| Token | Sui Type | Pyth Feed ID |
|-------|----------|--------------|
| SUI | `0x2::sui::SUI` | `23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744` |
| USDC | `0xdba34672...::usdc::USDC` | `eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a` |
| USDT | `0xc060006...::coin::COIN` | `2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b` |
| DEEP | `0xdeeb7a4...::deep::DEEP` | `29bdd5248234e33bd93d3b81100b5fa32eaa5997843847e2c2cb16d7c6d9f7ff` |
| CETUS | `0x06864a6...::cetus::CETUS` | `e5b274b2611143df055d6e7cd8d93fe1961716bcd4dca1cad87a83bc1e78c1ef` |
| WAL | `0x356a26e...::wal::WAL` | `eba0732395fae9dec4bae12e52760b35fc1c5671e2da8b449c9af4efe5d54341` |
| BUCK | `0xce7ff77...::buck::BUCK` | `fdf28a46570252b25fd31cb257973f865afc5ca2f320439e45d95e0394bc7382` |
| TURBOS | `0x5d1f47e...::turbos::TURBOS` | `f9c2e890443dd995d0baafc08eea3358be1ffb874f93f99c30b3816c460bbac3` |
| NS | `0x5145494...::ns::NS` | `bb5ff26e47a3a6cc7ec2fce1db996c2a145300edc5acaabe43bf9ff7c5dd5d32` |
| NAVX | `0xa99b895...::navx::NAVX` | `88250f854c019ef4f88a5c073d52a18bb1c6ac437033f5932cd017d24917ab46` |
| SCA | `0x7016aae...::sca::SCA` | `7e17f0ac105abe9214deb9944c30264f5986bf292869c6bd8e8da3ccd92d79bc` |
| haSUI | `0xbde4ba4...::hasui::HASUI` | `6120ffcf96395c70aa77e72dcb900bf9d40dccab228efca59a17b90ce423d5e8` |
| vSUI | `0x549e8b6...::cert::CERT` | `57ff7100a282e4af0c91154679c5dae2e5dcacb93fd467ea9cb7e58afdcfde27` |
| afSUI | `0xf325ce1...::afsui::AFSUI` | `17cd845b16e874485b2684f8b8d1517d744105dbb904eec30222717f4bc9ee0d` |
| WBTC | `0x027792d...::coin::COIN` | `c9d8b075a5c69303365ae23633d4e085199bf5c520a3b90fed1322a0342ffc33` |
| WETH | `0xaf8cd5e...::coin::COIN` | `ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace` |

See `src/lib/token-registry.ts` for full type addresses and decimals.

### Terms of Service

Terms stored on Walrus: `Nxd9fLX7LnT3HoXDbTCL5EfL5VZehKZus_wscId7uj0`

View: https://walrus.site/Nxd9fLX7LnT3HoXDbTCL5EfL5VZehKZus_wscId7uj0

## License

MIT
