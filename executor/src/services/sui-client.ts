import {
	getFullnodeUrl,
	SuiClient,
	SuiHTTPTransport,
} from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import type { Transaction } from "@mysten/sui/transactions";
import type { ExecutorConfig } from "../types/config";
import { logger } from "../utils/logger";

const RPC_URLS: Record<string, string> = {
	mainnet: "https://fullnode.mainnet.sui.io:443",
	testnet: "https://fullnode.testnet.sui.io:443",
	devnet: "https://fullnode.devnet.sui.io:443",
};

let client: SuiClient | null = null;
let keypair: Ed25519Keypair | null = null;

export async function initSuiClient(
	config: ExecutorConfig,
): Promise<SuiClient> {
	const rpcUrl = RPC_URLS[config.network] ?? getFullnodeUrl(config.network);

	client = new SuiClient({
		transport: new SuiHTTPTransport({ url: rpcUrl }),
	});

	let privateKey = process.env[config.delegatee.privateKeyEnvVar];

	if (!privateKey && config.delegatee.privateKeyPath) {
		const keyFile = Bun.file(config.delegatee.privateKeyPath);
		if (await keyFile.exists()) {
			privateKey = (await keyFile.text()).trim();
		}
	}

	if (privateKey) {
		keypair = Ed25519Keypair.fromSecretKey(privateKey);
		logger.info("Sui client initialized", {
			network: config.network,
			delegatee: keypair.getPublicKey().toSuiAddress(),
		});
	} else {
		logger.warn("No private key configured - running in read-only mode");
	}

	return client;
}

export function getSuiClient(): SuiClient {
	if (!client)
		throw new Error("Sui client not initialized. Call initSuiClient first.");
	return client;
}

export function getKeypair(): Ed25519Keypair {
	if (!keypair)
		throw new Error("Keypair not initialized. Provide private key in config.");
	return keypair;
}

export async function executeTransaction(
	tx: Transaction,
	dryRun: boolean,
): Promise<{ digest: string; effects: unknown }> {
	const suiClient = getSuiClient();
	const kp = getKeypair();

	if (dryRun) {
		const result = await suiClient.dryRunTransactionBlock({
			transactionBlock: await tx.build({ client: suiClient }),
		});
		logger.info("Dry run completed", { effects: result.effects?.status });
		return { digest: "DRY_RUN", effects: result.effects };
	}

	const result = await suiClient.signAndExecuteTransaction({
		transaction: tx,
		signer: kp,
		options: {
			showEffects: true,
			showObjectChanges: true,
		},
	});

	logger.info("Transaction executed", {
		digest: result.digest,
		status: result.effects?.status,
	});

	return { digest: result.digest, effects: result.effects };
}
