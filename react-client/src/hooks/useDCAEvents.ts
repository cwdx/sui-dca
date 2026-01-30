import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useNetwork } from "@/contexts/NetworkContext";
import { toast } from "@/hooks/useToast";

interface TradeCompletedEvent {
  dca_id: string;
  executor: string;
  output_amount: string;
  executor_reward: string;
  active: boolean;
}

interface TradeInitiatedEvent {
  dca_id: string;
  executor: string;
  input_amount: string;
  fee_amount: string;
  remaining_orders: string;
  order_number: string;
  min_output: string;
}

interface DCACreatedEvent {
  id: string;
  owner: string;
  input_type: string;
  output_type: string;
  total_orders: string;
}

interface DCADeactivatedEvent {
  dca_id: string;
  owner: string;
  remaining_balance: string;
}

/**
 * Hook to subscribe to DCA events and show live updates
 */
export function useDCAEventSubscription() {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const queryClient = useQueryClient();
  const { contracts, network } = useNetwork();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!account?.address || !contracts.packageId) return;

    const subscribeToEvents = async () => {
      try {
        // Subscribe to TradeCompletedEvent
        const unsubTradeCompleted = await client.subscribeEvent({
          filter: {
            MoveEventType: `${contracts.packageId}::dca::TradeCompletedEvent`,
          },
          onMessage: (event) => {
            const data = event.parsedJson as TradeCompletedEvent;

            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ["my-dcas"] });
            queryClient.invalidateQueries({ queryKey: ["trade-history", network, data.dca_id] });
            queryClient.invalidateQueries({ queryKey: ["executed-trade-count", network, data.dca_id] });
            queryClient.invalidateQueries({ queryKey: ["last-trade", network, data.dca_id] });
            queryClient.invalidateQueries({ queryKey: ["token-balance"] });

            // Format output amount (assuming 9 decimals for SUI, will show raw for others)
            const outputAmount = (Number(data.output_amount) / 1e9).toFixed(4);

            toast({
              variant: "success",
              title: "Trade Executed",
              description: `Received ${outputAmount} tokens. ${data.active ? "More trades pending." : "DCA completed!"}`,
            });
          },
        });

        // Subscribe to DCACreatedEvent for the current user
        const unsubDCACreated = await client.subscribeEvent({
          filter: {
            MoveEventType: `${contracts.packageId}::dca::DCACreatedEvent`,
          },
          onMessage: (event) => {
            const data = event.parsedJson as DCACreatedEvent;

            // Only show toast if it's the current user's DCA
            if (data.owner === account.address) {
              queryClient.invalidateQueries({ queryKey: ["my-dcas"] });
              queryClient.invalidateQueries({ queryKey: ["token-balance"] });

              toast({
                variant: "success",
                title: "DCA Created",
                description: `New strategy with ${data.total_orders} orders started.`,
              });
            }
          },
        });

        // Subscribe to DCADeactivatedEvent
        const unsubDCADeactivated = await client.subscribeEvent({
          filter: {
            MoveEventType: `${contracts.packageId}::dca::DCADeactivatedEvent`,
          },
          onMessage: (event) => {
            const data = event.parsedJson as DCADeactivatedEvent;

            if (data.owner === account.address) {
              queryClient.invalidateQueries({ queryKey: ["my-dcas"] });
              queryClient.invalidateQueries({ queryKey: ["token-balance"] });

              const refundAmount = (Number(data.remaining_balance) / 1e6).toFixed(2);
              toast({
                title: "DCA Cancelled",
                description: refundAmount !== "0.00"
                  ? `Refunded ${refundAmount} tokens.`
                  : "Strategy cancelled successfully.",
              });
            }
          },
        });

        // Store cleanup function
        unsubscribeRef.current = () => {
          unsubTradeCompleted();
          unsubDCACreated();
          unsubDCADeactivated();
        };
      } catch (error) {
        console.error("Failed to subscribe to DCA events:", error);
      }
    };

    subscribeToEvents();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [account?.address, contracts.packageId, client, queryClient, network]);
}

/**
 * Hook to poll for updates (fallback for environments where WebSocket isn't available)
 */
export function useDCAPolling(intervalMs = 10000) {
  const queryClient = useQueryClient();
  const account = useCurrentAccount();

  useEffect(() => {
    if (!account?.address) return;

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["my-dcas"] });
      queryClient.invalidateQueries({ queryKey: ["executed-trade-count"] });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [account?.address, queryClient, intervalMs]);
}
