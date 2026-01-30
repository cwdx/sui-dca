import { logger } from "./logger";

interface ConstantDef<T> {
	envVar: string;
	defaultValue: T;
	description: string;
	parse?: (value: string) => T;
}

function loadConstant<T>(def: ConstantDef<T>): T {
	const envValue = process.env[def.envVar];

	if (envValue !== undefined) {
		try {
			return def.parse ? def.parse(envValue) : (envValue as unknown as T);
		} catch (error) {
			logger.warn(`Invalid value for ${def.envVar}, using default`, {
				envVar: def.envVar,
				providedValue: envValue,
				defaultValue: String(def.defaultValue),
				error: error instanceof Error ? error.message : String(error),
			});
			return def.defaultValue;
		}
	}

	logger.warn(`Using default value for ${def.description}`, {
		envVar: def.envVar,
		defaultValue: String(def.defaultValue),
	});
	return def.defaultValue;
}

const CONSTANT_DEFS = {
	DCA_PACKAGE_ID: {
		envVar: "SUI_DCA_PACKAGE_ID",
		defaultValue:
			"0x89b1372fa44ac2312a3876d83612d1dc9d298af332a42a153913558332a564d0",
		description: "DCA contract package ID",
	},
	CETUS_GLOBAL_CONFIG: {
		envVar: "SUI_CETUS_GLOBAL_CONFIG",
		defaultValue:
			"0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f",
		description: "Cetus GlobalConfig object ID",
	},
	TURBOS_VERSION: {
		envVar: "SUI_TURBOS_VERSION",
		defaultValue:
			"0xf1cf0e81048df168ebeb1b8030fad24b3e0b53ae827c25053fff0779c1445b6f",
		description: "Turbos version object ID",
	},
	FLOWX_CONTAINER: {
		envVar: "SUI_FLOWX_CONTAINER",
		defaultValue:
			"0xba153169476e8c3114962261d1edc70de5ad9781b83cc617ecc8c1923191cae0",
		description: "FlowX container object ID",
	},
	CLOCK_OBJECT: {
		envVar: "SUI_CLOCK_OBJECT",
		defaultValue:
			"0x0000000000000000000000000000000000000000000000000000000000000006",
		description: "Sui Clock shared object ID",
	},
} as const;

let loaded = false;
let constants: Record<keyof typeof CONSTANT_DEFS, string> | null = null;

export function loadConstants(): Record<keyof typeof CONSTANT_DEFS, string> {
	if (constants && loaded) return constants;

	constants = {} as Record<keyof typeof CONSTANT_DEFS, string>;

	for (const [key, def] of Object.entries(CONSTANT_DEFS)) {
		constants[key as keyof typeof CONSTANT_DEFS] = loadConstant(
			def as ConstantDef<string>,
		);
	}

	loaded = true;
	return constants;
}

export function getConstant(key: keyof typeof CONSTANT_DEFS): string {
	if (!constants) loadConstants();
	const value = constants?.[key];
	if (value === undefined) {
		throw new Error(`Constant ${key} not found after loading`);
	}
	return value;
}

export const CONSTANTS = {
	get DCA_PACKAGE_ID() {
		return getConstant("DCA_PACKAGE_ID");
	},
	get CETUS_GLOBAL_CONFIG() {
		return getConstant("CETUS_GLOBAL_CONFIG");
	},
	get TURBOS_VERSION() {
		return getConstant("TURBOS_VERSION");
	},
	get FLOWX_CONTAINER() {
		return getConstant("FLOWX_CONTAINER");
	},
	get CLOCK_OBJECT() {
		return getConstant("CLOCK_OBJECT");
	},
};
