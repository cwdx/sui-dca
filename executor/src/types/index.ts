export * from "./config";

export interface DCAAccountState {
	objectId: string;
	owner: string;
	delegatee: string;
	inputBalance: bigint;
	remainingOrders: number;
	lastTimeMs: number;
	every: number;
	timeScale: number;
	active: boolean;
	splitAllocation: bigint;
}

export interface ExecutionResult {
	success: boolean;
	accountId: string;
	txDigest?: string;
	error?: string;
	timestamp: number;
	gasUsed?: number;
}

export interface SchedulerState {
	isRunning: boolean;
	lastRun?: number;
	nextRun?: number;
	totalExecutions: number;
	successfulExecutions: number;
	failedExecutions: number;
}
