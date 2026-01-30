import { describe, expect, test } from "bun:test";
import { ExecutorConfigSchema, TimeScaleValues } from "../types/config";

describe("ExecutorConfigSchema", () => {
	test("parses minimal config with defaults", () => {
		const config = ExecutorConfigSchema.parse({});

		expect(config.version).toBe("1.0.0");
		expect(config.network).toBe("mainnet");
		expect(config.scheduler.checkIntervalMs).toBe(60_000);
		expect(config.execution.maxRetries).toBe(3);
		expect(config.execution.dryRun).toBe(false);
		expect(config.accounts).toEqual([]);
		expect(config.healthCheck.enabled).toBe(true);
	});

	test("parses full config", () => {
		const input = {
			version: "2.0.0",
			network: "testnet",
			delegatee: {
				address: "0x123",
				privateKeyEnvVar: "MY_KEY",
			},
			scheduler: {
				checkIntervalMs: 30000,
				cronExpression: "0 * * * *",
				timezone: "America/New_York",
			},
			execution: {
				maxRetries: 5,
				retryDelayMs: 10000,
				gasBudget: 50000000,
				slippageBps: 200,
				dryRun: true,
			},
			accounts: [
				{
					objectId: "0xabc",
					inputType: "0x2::sui::SUI",
					outputType: "0xusdc::USDC",
					adapter: "cetus",
					poolId: "0xpool",
					enabled: true,
					description: "Test account",
				},
			],
			healthCheck: {
				enabled: false,
				port: 9090,
				path: "/ping",
			},
			logging: {
				level: "debug",
				json: true,
				file: "./logs/executor.log",
			},
			alerts: {
				webhookUrl: "https://hooks.example.com/webhook",
				onFailure: true,
				onSuccess: true,
			},
		};

		const config = ExecutorConfigSchema.parse(input);

		expect(config.version).toBe("2.0.0");
		expect(config.network).toBe("testnet");
		expect(config.scheduler.cronExpression).toBe("0 * * * *");
		expect(config.execution.dryRun).toBe(true);
		expect(config.accounts).toHaveLength(1);
		expect(config.accounts[0].adapter).toBe("cetus");
		expect(config.healthCheck.enabled).toBe(false);
		expect(config.logging.level).toBe("debug");
	});

	test("rejects invalid network", () => {
		expect(() =>
			ExecutorConfigSchema.parse({
				network: "invalid",
			}),
		).toThrow();
	});

	test("rejects invalid adapter", () => {
		expect(() =>
			ExecutorConfigSchema.parse({
				accounts: [
					{
						objectId: "0xabc",
						inputType: "0x2::sui::SUI",
						outputType: "0xusdc::USDC",
						adapter: "invalid",
						poolId: "0xpool",
					},
				],
			}),
		).toThrow();
	});
});

describe("TimeScaleValues", () => {
	test("has correct mappings", () => {
		expect(TimeScaleValues.seconds).toBe(0);
		expect(TimeScaleValues.minutes).toBe(1);
		expect(TimeScaleValues.hours).toBe(2);
		expect(TimeScaleValues.days).toBe(3);
		expect(TimeScaleValues.weeks).toBe(4);
		expect(TimeScaleValues.months).toBe(5);
	});
});
