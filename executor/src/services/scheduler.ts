import { Cron } from "croner";
import type { ExecutionResult, SchedulerState } from "../types";
import type { ExecutorConfig } from "../types/config";
import { logger } from "../utils/logger";
import { executeAllAccounts } from "./dca-executor";

let scheduler: Cron | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;

const state: SchedulerState = {
	isRunning: false,
	totalExecutions: 0,
	successfulExecutions: 0,
	failedExecutions: 0,
};

async function runExecution(config: ExecutorConfig): Promise<void> {
	if (state.isRunning) {
		logger.warn("Previous execution still running, skipping this cycle");
		return;
	}

	state.isRunning = true;
	state.lastRun = Date.now();

	try {
		logger.info("Starting execution cycle");
		const results = await executeAllAccounts(config);

		for (const result of results) {
			state.totalExecutions++;
			if (result.success) {
				state.successfulExecutions++;
				logger.info("Trade executed successfully", {
					accountId: result.accountId,
					txDigest: result.txDigest,
				});
				if (config.alerts?.onSuccess && config.alerts.webhookUrl) {
					await sendAlert(config.alerts.webhookUrl, "success", result);
				}
			} else {
				state.failedExecutions++;
				logger.error("Trade execution failed", {
					accountId: result.accountId,
					error: result.error,
				});
				if (config.alerts?.onFailure && config.alerts.webhookUrl) {
					await sendAlert(config.alerts.webhookUrl, "failure", result);
				}
			}
		}

		logger.info("Execution cycle completed", {
			total: results.length,
			successful: results.filter((r) => r.success).length,
			failed: results.filter((r) => !r.success).length,
		});
	} catch (error) {
		logger.error("Execution cycle failed", {
			error: error instanceof Error ? error.message : String(error),
		});
	} finally {
		state.isRunning = false;
	}
}

export function startScheduler(config: ExecutorConfig): void {
	if (scheduler || intervalId) {
		logger.warn("Scheduler already running");
		return;
	}

	if (config.scheduler.cronExpression) {
		scheduler = new Cron(
			config.scheduler.cronExpression,
			{ timezone: config.scheduler.timezone },
			async () => {
				await runExecution(config);
			},
		);

		const nextRun = scheduler.nextRun();
		state.nextRun = nextRun?.getTime();
		logger.info("Scheduler started with cron expression", {
			cron: config.scheduler.cronExpression,
			timezone: config.scheduler.timezone,
			nextRun: nextRun?.toISOString(),
		});
	} else {
		intervalId = setInterval(async () => {
			await runExecution(config);
		}, config.scheduler.checkIntervalMs);

		state.nextRun = Date.now() + config.scheduler.checkIntervalMs;
		logger.info("Scheduler started with interval", {
			intervalMs: config.scheduler.checkIntervalMs,
		});
	}

	runExecution(config);
}

export function stopScheduler(): void {
	if (scheduler) {
		scheduler.stop();
		scheduler = null;
	}
	if (intervalId) {
		clearInterval(intervalId);
		intervalId = null;
	}
	logger.info("Scheduler stopped");
}

export function getSchedulerState(): SchedulerState {
	if (scheduler) {
		const nextRun = scheduler.nextRun();
		state.nextRun = nextRun?.getTime();
	}
	return { ...state };
}

export async function triggerManualExecution(
	config: ExecutorConfig,
): Promise<ExecutionResult[]> {
	logger.info("Manual execution triggered");
	return executeAllAccounts(config);
}

async function sendAlert(
	webhookUrl: string,
	status: "success" | "failure",
	result: ExecutionResult,
): Promise<void> {
	try {
		await fetch(webhookUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				type: "dca_execution",
				status,
				accountId: result.accountId,
				txDigest: result.txDigest,
				error: result.error,
				timestamp: new Date(result.timestamp).toISOString(),
			}),
		});
	} catch (error) {
		logger.warn("Failed to send alert", {
			error: error instanceof Error ? error.message : String(error),
		});
	}
}
