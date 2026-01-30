import { Transaction } from "@mysten/sui/transactions";
import type { DCAAccountState, ExecutionResult } from "../types";
import type { DCAAccountConfig, ExecutorConfig } from "../types/config";
import { CONSTANTS } from "../utils/constants";
import { logger } from "../utils/logger";
import { executeTransaction, getKeypair, getSuiClient } from "./sui-client";

const TIME_SCALE_MS: Record<number, number> = {
	0: 1000, // seconds
	1: 60_000, // minutes
	2: 3600_000, // hours
	3: 86400_000, // days
	4: 604800_000, // weeks
	5: 2592000_000, // months (30 days approx)
};

export async function fetchDCAAccountState(
	objectId: string,
): Promise<DCAAccountState | null> {
	const client = getSuiClient();

	try {
		const obj = await client.getObject({
			id: objectId,
			options: { showContent: true, showType: true },
		});

		if (!obj.data?.content || obj.data.content.dataType !== "moveObject") {
			logger.warn("DCA account not found or invalid", { objectId });
			return null;
		}

		const fields = obj.data.content.fields as Record<string, unknown>;

		return {
			objectId,
			owner: fields.owner as string,
			delegatee: fields.delegatee as string,
			inputBalance: BigInt(
				(fields.input_balance as Record<string, string>)?.value ?? "0",
			),
			remainingOrders: Number(fields.remaining_orders ?? 0),
			lastTimeMs: Number(fields.last_time_ms ?? 0),
			every: Number(fields.every ?? 0),
			timeScale: Number(fields.time_scale ?? 0),
			active: Boolean(fields.active),
			splitAllocation: BigInt(String(fields.split_allocation ?? "0")),
		};
	} catch (error) {
		logger.error("Failed to fetch DCA account", {
			objectId,
			error: error instanceof Error ? error.message : String(error),
		});
		return null;
	}
}

export function isReadyForExecution(state: DCAAccountState): {
	ready: boolean;
	reason?: string;
	nextExecutionMs?: number;
} {
	if (!state.active) {
		return { ready: false, reason: "Account is inactive" };
	}

	if (state.remainingOrders <= 0) {
		return { ready: false, reason: "No remaining orders" };
	}

	if (state.inputBalance <= 0n) {
		return { ready: false, reason: "No input balance" };
	}

	const now = Date.now();
	const intervalMs = state.every * TIME_SCALE_MS[state.timeScale];
	const nextExecutionMs = state.lastTimeMs + intervalMs;

	if (now < nextExecutionMs) {
		return {
			ready: false,
			reason: "Not enough time passed",
			nextExecutionMs,
		};
	}

	return { ready: true };
}

export async function executeDCASwap(
	accountConfig: DCAAccountConfig,
	state: DCAAccountState,
	config: ExecutorConfig,
): Promise<ExecutionResult> {
	const timestamp = Date.now();
	const { objectId, inputType, outputType, adapter, poolId } = accountConfig;

	try {
		const delegatee = getKeypair().getPublicKey().toSuiAddress();
		if (state.delegatee !== delegatee) {
			return {
				success: false,
				accountId: objectId,
				error: `Delegatee mismatch: expected ${delegatee}, got ${state.delegatee}`,
				timestamp,
			};
		}

		const tx = new Transaction();
		tx.setGasBudget(config.execution.gasBudget);

		const tradeAmount = state.splitAllocation;
		const minOutput = 1n; // Contract handles min price check

		if (adapter === "cetus") {
			buildCetusSwap(tx, {
				dcaObjectId: objectId,
				poolId,
				inputType,
				outputType,
				amount: tradeAmount,
				minOutput,
				gasCost: BigInt(config.execution.gasBudget),
			});
		} else {
			return {
				success: false,
				accountId: objectId,
				error: `Adapter ${adapter} not yet implemented`,
				timestamp,
			};
		}

		const result = await executeTransaction(tx, config.execution.dryRun);

		return {
			success: true,
			accountId: objectId,
			txDigest: result.digest,
			timestamp,
		};
	} catch (error) {
		return {
			success: false,
			accountId: objectId,
			error: error instanceof Error ? error.message : String(error),
			timestamp,
		};
	}
}

function buildCetusSwap(
	tx: Transaction,
	params: {
		dcaObjectId: string;
		poolId: string;
		inputType: string;
		outputType: string;
		amount: bigint;
		minOutput: bigint;
		gasCost: bigint;
	},
): void {
	const { dcaObjectId, poolId, inputType, outputType, amount, gasCost } =
		params;

	const inputCoin = tx.splitCoins(tx.gas, [tx.pure.u64(0)]);
	const outputCoin = tx.moveCall({
		target: "0x2::coin::zero",
		typeArguments: [outputType],
	});

	const sqrtPriceLimit = 4295048016n;

	tx.moveCall({
		target: `${CONSTANTS.DCA_PACKAGE_ID}::cetus::swap_ab`,
		typeArguments: [inputType, outputType],
		arguments: [
			tx.object(CONSTANTS.CETUS_GLOBAL_CONFIG),
			tx.object(poolId),
			inputCoin,
			outputCoin,
			tx.pure.bool(true), // a2b
			tx.pure.bool(true), // by_amount_in
			tx.pure.u64(amount),
			tx.pure.u128(sqrtPriceLimit),
			tx.pure.bool(false), // arg_8
			tx.object(CONSTANTS.CLOCK_OBJECT),
			tx.pure.u64(1), // output_threshold
			tx.object(dcaObjectId),
			tx.pure.u64(gasCost),
		],
	});
}

export async function executeAllAccounts(
	config: ExecutorConfig,
): Promise<ExecutionResult[]> {
	const results: ExecutionResult[] = [];

	for (const accountConfig of config.accounts) {
		if (!accountConfig.enabled) {
			logger.debug("Skipping disabled account", {
				objectId: accountConfig.objectId,
			});
			continue;
		}

		const state = await fetchDCAAccountState(accountConfig.objectId);
		if (!state) {
			results.push({
				success: false,
				accountId: accountConfig.objectId,
				error: "Failed to fetch account state",
				timestamp: Date.now(),
			});
			continue;
		}

		const readyCheck = isReadyForExecution(state);
		if (!readyCheck.ready) {
			logger.debug("Account not ready for execution", {
				objectId: accountConfig.objectId,
				reason: readyCheck.reason,
				nextExecutionMs: readyCheck.nextExecutionMs,
			});
			continue;
		}

		logger.info("Executing DCA trade", {
			objectId: accountConfig.objectId,
			adapter: accountConfig.adapter,
			remainingOrders: state.remainingOrders,
		});

		let result: ExecutionResult;
		let retries = 0;

		do {
			result = await executeDCASwap(accountConfig, state, config);
			if (result.success) break;

			retries++;
			if (retries <= config.execution.maxRetries) {
				logger.warn("Retrying execution", {
					objectId: accountConfig.objectId,
					attempt: retries,
					error: result.error,
				});
				await Bun.sleep(config.execution.retryDelayMs);
			}
		} while (retries <= config.execution.maxRetries);

		results.push(result);
	}

	return results;
}
