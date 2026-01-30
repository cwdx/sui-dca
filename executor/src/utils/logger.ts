type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
};

let currentLevel: LogLevel = "info";
let jsonMode = false;
let logFile: Bun.FileSink | null = null;

export function configureLogger(opts: {
	level: LogLevel;
	json?: boolean;
	file?: string;
}): void {
	currentLevel = opts.level;
	jsonMode = opts.json ?? false;
	if (opts.file) {
		logFile = Bun.file(opts.file).writer();
	}
}

function formatMessage(
	level: LogLevel,
	message: string,
	data?: Record<string, unknown>,
): string {
	const timestamp = new Date().toISOString();
	if (jsonMode) {
		return JSON.stringify({ timestamp, level, message, ...data });
	}
	const prefix = `[${timestamp}] [${level.toUpperCase().padEnd(5)}]`;
	const dataStr = data ? ` ${JSON.stringify(data)}` : "";
	return `${prefix} ${message}${dataStr}`;
}

function log(
	level: LogLevel,
	message: string,
	data?: Record<string, unknown>,
): void {
	if (LOG_LEVELS[level] < LOG_LEVELS[currentLevel]) return;

	const formatted = formatMessage(level, message, data);
	const output = level === "error" ? console.error : console.log;
	output(formatted);

	if (logFile) {
		logFile.write(`${formatted}\n`);
	}
}

export const logger = {
	debug: (msg: string, data?: Record<string, unknown>) =>
		log("debug", msg, data),
	info: (msg: string, data?: Record<string, unknown>) => log("info", msg, data),
	warn: (msg: string, data?: Record<string, unknown>) => log("warn", msg, data),
	error: (msg: string, data?: Record<string, unknown>) =>
		log("error", msg, data),
};
