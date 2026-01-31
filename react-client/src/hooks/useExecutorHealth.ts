import { useQuery } from "@tanstack/react-query";

export interface ExecutorHealth {
  status: "ok" | "error";
  runtime: string;
  network: string;
  dryRun: boolean;
  executor: {
    address: string;
    balance: string;
  };
  timestamp: string;
}

const EXECUTOR_API_URL = import.meta.env.VITE_EXECUTOR_API_URL || "";

export function useExecutorHealth() {
  return useQuery<ExecutorHealth>({
    queryKey: ["executor-health"],
    queryFn: async () => {
      if (!EXECUTOR_API_URL) {
        throw new Error("Executor API URL not configured");
      }
      const response = await fetch(`${EXECUTOR_API_URL}/health`);
      if (!response.ok) {
        throw new Error("Executor health check failed");
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 1,
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}

export function getExecutorApiUrl() {
  return EXECUTOR_API_URL;
}
