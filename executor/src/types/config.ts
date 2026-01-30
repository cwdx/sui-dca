import { z } from "zod";

export const TimeScaleSchema = z.enum([
	"seconds",
	"minutes",
	"hours",
	"days",
	"weeks",
	"months",
]);
export type TimeScale = z.infer<typeof TimeScaleSchema>;

export const TimeScaleValues: Record<TimeScale, number> = {
	seconds: 0,
	minutes: 1,
	hours: 2,
	days: 3,
	weeks: 4,
	months: 5,
};

export const DexAdapterSchema = z.enum(["cetus", "turbos", "flowx"]);
export type DexAdapter = z.infer<typeof DexAdapterSchema>;

export const DCAAccountConfigSchema = z.object({
	objectId: z.string().startsWith("0x"),
	inputType: z.string(),
	outputType: z.string(),
	adapter: DexAdapterSchema,
	poolId: z.string().startsWith("0x"),
	enabled: z.boolean().default(true),
	description: z.string().optional(),
});

export type DCAAccountConfig = z.infer<typeof DCAAccountConfigSchema>;

export const ExecutorConfigSchema = z.object({
	version: z.string().default("1.0.0"),

	network: z.enum(["mainnet", "testnet", "devnet"]).default("mainnet"),

	delegatee: z
		.object({
			address: z.string().startsWith("0x").default("0x0"),
			privateKeyPath: z.string().optional(),
			privateKeyEnvVar: z.string().default("SUI_DELEGATEE_PRIVATE_KEY"),
		})
		.default({}),

	scheduler: z
		.object({
			checkIntervalMs: z.number().min(1000).default(60_000),
			cronExpression: z.string().optional(),
			timezone: z.string().default("UTC"),
		})
		.default({}),

	execution: z
		.object({
			maxRetries: z.number().min(0).max(10).default(3),
			retryDelayMs: z.number().min(100).default(5_000),
			gasBudget: z.number().default(25_000_000),
			slippageBps: z.number().min(0).max(10000).default(100),
			dryRun: z.boolean().default(false),
		})
		.default({}),

	accounts: z.array(DCAAccountConfigSchema).default([]),

	healthCheck: z
		.object({
			enabled: z.boolean().default(true),
			port: z.number().default(8080),
			path: z.string().default("/health"),
		})
		.default({}),

	logging: z
		.object({
			level: z.enum(["debug", "info", "warn", "error"]).default("info"),
			file: z.string().optional(),
			json: z.boolean().default(false),
		})
		.default({}),

	alerts: z
		.object({
			webhookUrl: z.string().url().optional(),
			onFailure: z.boolean().default(true),
			onSuccess: z.boolean().default(false),
		})
		.optional(),
});

export type ExecutorConfig = z.infer<typeof ExecutorConfigSchema>;
