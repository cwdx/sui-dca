# SUI DCA Executor

A Bun-based cron executor for automated DCA (Dollar Cost Averaging) trades on the Sui blockchain.

## Features

- **Upgradable Configuration**: JSON-based config that can be hot-reloaded without restart
- **Multiple DEX Support**: Cetus, Turbos, FlowX adapters
- **Flexible Scheduling**: Interval-based or cron expression scheduling
- **Hardened Execution**: Automatic retries, comprehensive logging, health checks
- **Alerting**: Webhook notifications for successful/failed executions
- **Dry Run Mode**: Test execution flow without submitting transactions

## Quick Start

```bash
# Install dependencies
bun install

# Configure your accounts (edit config/executor.json)
# Set your private key
export SUI_DELEGATEE_PRIVATE_KEY="your_private_key_here"

# Run in dry-run mode first
bun run start

# After verification, set dryRun: false in config
```

## Configuration

### Config File Structure

```json
{
  "version": "1.0.0",
  "network": "mainnet",
  "delegatee": {
    "address": "0x...",
    "privateKeyEnvVar": "SUI_DELEGATEE_PRIVATE_KEY"
  },
  "scheduler": {
    "checkIntervalMs": 60000,
    "cronExpression": "0 */4 * * *",
    "timezone": "UTC"
  },
  "execution": {
    "maxRetries": 3,
    "retryDelayMs": 5000,
    "gasBudget": 25000000,
    "slippageBps": 100,
    "dryRun": false
  },
  "accounts": [...],
  "healthCheck": {
    "enabled": true,
    "port": 8080
  },
  "logging": {
    "level": "info",
    "json": false
  },
  "alerts": {
    "webhookUrl": "https://hooks.slack.com/...",
    "onFailure": true
  }
}
```

### Scheduler Options

| Option | Description | Example |
|--------|-------------|---------|
| `checkIntervalMs` | Polling interval in milliseconds | `60000` (1 minute) |
| `cronExpression` | Cron pattern (overrides interval) | `"0 */4 * * *"` (every 4 hours) |
| `timezone` | Timezone for cron | `"UTC"`, `"America/New_York"` |

### Common Cron Patterns

```
"*/30 * * * *"     - Every 30 minutes
"0 * * * *"        - Every hour
"0 */4 * * *"      - Every 4 hours
"0 8 * * *"        - Daily at 8:00 AM
"0 8 * * 1"        - Weekly on Monday at 8:00 AM
"0 0 1 * *"        - Monthly on the 1st at midnight
```

### Time Scale Reference (DCA Contract)

| Value | Scale | Min Interval | Max Interval |
|-------|-------|--------------|--------------|
| 0 | Seconds | 30s | 59s |
| 1 | Minutes | 1m | 59m |
| 2 | Hours | 1h | 24h |
| 3 | Days | 1d | 30d |
| 4 | Weeks | 1w | 52w |
| 5 | Months | 1mo | 12mo |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check status |
| `/status` | GET | Detailed executor status |
| `/trigger` | POST | Manually trigger execution |
| `/reload` | POST | Hot-reload configuration |

## Hardening Features

### Retry Logic
Failed executions are automatically retried with configurable:
- `maxRetries`: Number of retry attempts (0-10)
- `retryDelayMs`: Delay between retries

### Logging
- Structured logging with timestamps
- Log levels: debug, info, warn, error
- Optional JSON output for log aggregation
- File logging support

### Health Checks
- HTTP health endpoint for monitoring
- Scheduler state tracking
- Execution statistics

### Alerts
- Webhook notifications (Slack, Discord, etc.)
- Configurable for success/failure events

## Security Best Practices

1. **Never commit private keys** - Use environment variables
2. **Start with dry-run mode** - Verify logic before real execution
3. **Set appropriate gas budgets** - Contract requires 25M gas per trade
4. **Monitor failed executions** - Set up alerts for failures
5. **Use minimal permissions** - Delegatee can only execute scheduled trades

## Architecture

```
executor/
├── config/
│   └── executor.json      # Upgradable configuration
├── src/
│   ├── index.ts           # Entry point
│   ├── types/
│   │   ├── config.ts      # Zod schemas
│   │   └── index.ts       # Type definitions
│   ├── services/
│   │   ├── sui-client.ts  # Sui SDK wrapper
│   │   ├── dca-executor.ts # Trade execution logic
│   │   ├── scheduler.ts   # Cron/interval scheduler
│   │   └── health-server.ts # HTTP server
│   └── utils/
│       ├── logger.ts      # Logging utility
│       └── config-loader.ts # Config management
└── README.md
```

## Contract Details

- **DCA Package**: `0x89b1372fa44ac2312a3876d83612d1dc9d298af332a42a153913558332a564d0`
- **Gas per trade**: 25,000,000 MIST (pre-funded by DCA owner)
- **Protocol fee**: 5 BPS (0.05%) per trade
- **Min funding per trade**: 100,000 MIST

## License

MIT
