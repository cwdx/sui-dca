import { type ExecutorConfig, ExecutorConfigSchema } from "../types/config";
import { logger } from "./logger";

const CONFIG_PATH = "./config/executor.json";
let cachedConfig: ExecutorConfig | null = null;
let lastModified = 0;

export async function loadConfig(
	configPath = CONFIG_PATH,
): Promise<ExecutorConfig> {
	const file = Bun.file(configPath);
	const exists = await file.exists();

	if (!exists) {
		logger.warn(`Config file not found at ${configPath}, using defaults`);
		return ExecutorConfigSchema.parse({});
	}

	const stat = await file.stat();
	const currentModified = stat?.mtime?.getTime() ?? 0;

	if (cachedConfig && currentModified === lastModified) {
		return cachedConfig;
	}

	const content = await file.text();
	const parsed = JSON.parse(content);
	const validated = ExecutorConfigSchema.parse(parsed);

	cachedConfig = validated;
	lastModified = currentModified;
	logger.info("Config loaded", {
		path: configPath,
		version: validated.version,
	});

	return validated;
}

export async function reloadConfig(
	configPath = CONFIG_PATH,
): Promise<ExecutorConfig> {
	cachedConfig = null;
	lastModified = 0;
	return loadConfig(configPath);
}

export async function saveConfig(
	config: ExecutorConfig,
	configPath = CONFIG_PATH,
): Promise<void> {
	const validated = ExecutorConfigSchema.parse(config);
	await Bun.write(configPath, JSON.stringify(validated, null, 2));
	cachedConfig = validated;
	logger.info("Config saved", { path: configPath });
}

export function watchConfig(
	configPath: string,
	onChange: (config: ExecutorConfig) => void,
): () => void {
	const watcher = Bun.spawn(["watchman-wait", configPath], {
		stdout: "pipe",
		onExit: () => {},
	});

	const interval = setInterval(async () => {
		const newConfig = await loadConfig(configPath);
		if (newConfig !== cachedConfig) {
			onChange(newConfig);
		}
	}, 5000);

	return () => {
		clearInterval(interval);
		watcher.kill();
	};
}
