import { startHealthServer, stopHealthServer } from "./services/health-server";
import { startScheduler, stopScheduler } from "./services/scheduler";
import { initSuiClient } from "./services/sui-client";
import { loadConfig } from "./utils/config-loader";
import { loadConstants } from "./utils/constants";
import { configureLogger, logger } from "./utils/logger";

async function main(): Promise<void> {
	console.log(`
╔══════════════════════════════════════════╗
║         SUI DCA EXECUTOR v1.0.0          ║
╚══════════════════════════════════════════╝
`);

	const configPath = process.env.CONFIG_PATH ?? "./config/executor.json";
	const config = await loadConfig(configPath);

	configureLogger({
		level: config.logging.level,
		json: config.logging.json,
		file: config.logging.file,
	});

	logger.info("Starting SUI DCA Executor", {
		version: config.version,
		network: config.network,
		accounts: config.accounts.length,
		dryRun: config.execution.dryRun,
	});

	loadConstants();
	await initSuiClient(config);
	startHealthServer(config);
	startScheduler(config);

	const shutdown = async (signal: string): Promise<void> => {
		logger.info(`Received ${signal}, shutting down...`);
		stopScheduler();
		stopHealthServer();
		process.exit(0);
	};

	process.on("SIGINT", () => shutdown("SIGINT"));
	process.on("SIGTERM", () => shutdown("SIGTERM"));

	logger.info("Executor running. Press Ctrl+C to stop.");
}

main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
