#!/usr/bin/env bun
/**
 * CLI Operator
 *
 * Command-line interface for the DCA executor.
 *
 * Usage:
 *   bun run src/operators/cli.ts                    # Execute eligible DCAs
 *   bun run src/operators/cli.ts --discover         # Just discover, don't execute
 *   bun run src/operators/cli.ts --limit 10         # Limit to 10 DCAs
 *   bun run src/operators/cli.ts --owner 0x...      # Filter by owner
 */

import { discover, executeBatch, getConfig, getEffectiveSlippage } from "../index.js";
import type { EligibleDca } from "../lib/types.js";

function parseArgs(): {
  discoverOnly: boolean;
  limit?: number;
  owner?: string;
  inputType?: string;
  outputType?: string;
} {
  const args = process.argv.slice(2);
  const result: ReturnType<typeof parseArgs> = {
    discoverOnly: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "--discover":
      case "--discover-only":
      case "-d":
        result.discoverOnly = true;
        break;
      case "--limit":
      case "-l":
        result.limit = parseInt(nextArg);
        i++;
        break;
      case "--owner":
      case "-o":
        result.owner = nextArg;
        i++;
        break;
      case "--input-type":
        result.inputType = nextArg;
        i++;
        break;
      case "--output-type":
        result.outputType = nextArg;
        i++;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
    }
  }

  return result;
}

function printHelp(): void {
  console.log(`
DCA Executor CLI

Usage:
  bun run src/operators/cli.ts [options]

Options:
  -d, --discover       Just discover eligible DCAs, don't execute
  -l, --limit <n>      Maximum number of DCAs to process (default: 50)
  -o, --owner <addr>   Filter by DCA owner address
  --input-type <type>  Filter by input token type
  --output-type <type> Filter by output token type
  -h, --help           Show this help message

Environment Variables:
  SUI_NETWORK               Network to use (default: mainnet)
  SUI_RPC_URL               Custom RPC URL
  EXECUTOR_PRIVATE_KEY      Private key for signing transactions
  DCA_PACKAGE_ID            DCA contract package ID
  MAX_BATCH_SIZE            Maximum batch size (default: 50)
  EXECUTION_DELAY_MS        Delay between executions (default: 3000)
  DRY_RUN                   Set to "true" for dry run mode

Examples:
  # Execute all eligible DCAs
  bun run src/operators/cli.ts

  # Discover only (no execution)
  bun run src/operators/cli.ts --discover

  # Execute up to 5 DCAs
  bun run src/operators/cli.ts --limit 5

  # Execute DCAs for a specific owner
  bun run src/operators/cli.ts --owner 0x123...
`);
}

function printDcaSummary(dca: EligibleDca): void {
  const overdueMs = -Number(dca.msUntilEligible);
  const effectiveSlippage = getEffectiveSlippage(dca);
  console.log(`  - ${dca.id.slice(0, 16)}...`);
  console.log(`    Pair: ${dca.inputType.split("::").pop()} → ${dca.outputType.split("::").pop()}`);
  console.log(`    Orders: ${dca.remainingOrders} remaining`);
  console.log(`    Amount: ${Number(dca.splitAllocation) / 1e9} (input token)`);
  console.log(`    Slippage: ${effectiveSlippage}bps (${effectiveSlippage / 100}%), Fee: ${dca.feeBps}bps`);
  console.log(`    Overdue: ${(overdueMs / 1000).toFixed(0)}s`);
}

async function main(): Promise<void> {
  const args = parseArgs();
  const config = getConfig();

  console.log("=== DCA Executor CLI ===");
  console.log(`Network: ${config.network}`);
  console.log(`Package: ${config.dcaPackage}`);
  console.log(`Dry Run: ${config.dryRun}`);
  console.log(`Max Batch: ${args.limit ?? config.maxBatchSize}`);
  console.log("");

  // Discover eligible DCAs
  console.log("Discovering DCA accounts...");
  const { dcas, totalDiscovered, totalEligible, hasMore } = await discover({
    limit: args.limit ?? config.maxBatchSize,
    owner: args.owner,
    inputType: args.inputType,
    outputType: args.outputType,
  });

  console.log(`\nDiscovered ${totalDiscovered} DCAs, ${totalEligible} eligible`);
  if (hasMore) {
    console.log("(more DCAs available - increase limit or paginate)");
  }

  console.log(`\nFound ${dcas.length} DCA(s) to process:`);
  for (const dca of dcas) {
    printDcaSummary(dca);
  }

  if (args.discoverOnly || dcas.length === 0) {
    console.log("\nDiscovery complete.");
    return;
  }

  // Execute batch
  console.log(`\nExecuting ${dcas.length} DCA(s) sequentially...`);

  const result = await executeBatch(dcas, {
    concurrency: 1,
    intervalMs: config.executionDelayMs,
    maxRetries: 2,
    timeoutMs: 60000,
  });

  // Print results
  console.log("\n=== Execution Results ===");
  for (const r of result.results) {
    if (r.success) {
      const rewardSui = r.reward ? `${Number(r.reward) / 1e9} SUI` : "N/A";
      console.log(`  ✓ ${r.dcaId.slice(0, 16)}... → ${r.digest?.slice(0, 16)}... (reward: ${rewardSui})`);
    } else {
      console.log(`  ✗ ${r.dcaId.slice(0, 16)}... → ${r.error}`);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`  Total: ${result.total}`);
  console.log(`  Success: ${result.succeeded}`);
  console.log(`  Failed: ${result.failed}`);
  console.log(`  Duration: ${result.durationMs}ms`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
