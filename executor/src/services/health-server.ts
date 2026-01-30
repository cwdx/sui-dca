import type { ExecutorConfig } from "../types/config";
import { loadConfig, reloadConfig } from "../utils/config-loader";
import { logger } from "../utils/logger";
import { getSchedulerState, triggerManualExecution } from "./scheduler";

let server: ReturnType<typeof Bun.serve> | null = null;

export function startHealthServer(config: ExecutorConfig): void {
	if (!config.healthCheck.enabled) {
		logger.info("Health check server disabled");
		return;
	}

	server = Bun.serve({
		port: config.healthCheck.port,
		async fetch(req) {
			const url = new URL(req.url);

			if (req.method === "GET" && url.pathname === config.healthCheck.path) {
				const state = getSchedulerState();
				return Response.json({
					status: "healthy",
					uptime: process.uptime(),
					scheduler: state,
					timestamp: new Date().toISOString(),
				});
			}

			if (req.method === "GET" && url.pathname === "/status") {
				const state = getSchedulerState();
				const currentConfig = await loadConfig();
				return Response.json({
					scheduler: state,
					config: {
						version: currentConfig.version,
						network: currentConfig.network,
						accountsCount: currentConfig.accounts.length,
						dryRun: currentConfig.execution.dryRun,
					},
					timestamp: new Date().toISOString(),
				});
			}

			if (req.method === "POST" && url.pathname === "/trigger") {
				const currentConfig = await loadConfig();
				const results = await triggerManualExecution(currentConfig);
				return Response.json({
					triggered: true,
					results,
					timestamp: new Date().toISOString(),
				});
			}

			if (req.method === "POST" && url.pathname === "/reload") {
				try {
					const newConfig = await reloadConfig();
					return Response.json({
						reloaded: true,
						version: newConfig.version,
						timestamp: new Date().toISOString(),
					});
				} catch (error) {
					return Response.json(
						{
							reloaded: false,
							error: error instanceof Error ? error.message : String(error),
						},
						{ status: 400 },
					);
				}
			}

			return new Response("Not Found", { status: 404 });
		},
	});

	logger.info("Health server started", {
		port: config.healthCheck.port,
		path: config.healthCheck.path,
	});
}

export function stopHealthServer(): void {
	if (server) {
		server.stop();
		server = null;
		logger.info("Health server stopped");
	}
}
