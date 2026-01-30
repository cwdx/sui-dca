import { useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { ArrowRight, Clock, ExternalLink } from "lucide-react";
import type { TokenInfo } from "@/config/tokens";
import { useNetwork } from "@/contexts/NetworkContext";

interface TradeEvent {
  type: "initiated" | "completed";
  timestamp: number;
  txDigest: string;
  data: TradeInitiatedData | TradeCompletedData;
}

interface TradeInitiatedData {
  dcaId: string;
  executor: string;
  inputAmount: bigint;
  feeAmount: bigint;
  remainingOrders: number;
  orderNumber: number;
  minOutput: bigint;
}

interface TradeCompletedData {
  dcaId: string;
  executor: string;
  outputAmount: bigint;
  executorReward: bigint;
  active: boolean;
}

interface TradeHistoryProps {
  dcaId: string;
  inputToken: TokenInfo;
  outputToken: TokenInfo;
}

export function TradeHistory({
  dcaId,
  inputToken,
  outputToken,
}: TradeHistoryProps) {
  const client = useSuiClient();
  const { contracts, network, explorerTxUrl } = useNetwork();

  const { data: trades, isLoading } = useQuery({
    queryKey: ["trade-history", network, dcaId],
    queryFn: async () => {
      const allEvents: TradeEvent[] = [];

      let cursor: { txDigest: string; eventSeq: string } | null | undefined;

      do {
        const response = await client.queryEvents({
          query: {
            MoveEventType: `${contracts.packageId}::dca::TradeCompletedEvent`,
          },
          limit: 50,
          order: "descending",
          cursor,
        });

        for (const event of response.data) {
          const parsed = event.parsedJson as any;
          if (parsed?.dca_id === dcaId) {
            allEvents.push({
              type: "completed",
              timestamp: Number(event.timestampMs),
              txDigest: event.id.txDigest,
              data: {
                dcaId: parsed.dca_id,
                executor: parsed.executor,
                outputAmount: BigInt(parsed.output_amount),
                executorReward: BigInt(parsed.executor_reward),
                active: parsed.active,
              },
            });
          }
        }

        cursor = response.hasNextPage ? response.nextCursor : null;
      } while (cursor);

      cursor = undefined;
      const initiatedMap = new Map<string, TradeInitiatedData>();

      do {
        const response = await client.queryEvents({
          query: {
            MoveEventType: `${contracts.packageId}::dca::TradeInitiatedEvent`,
          },
          limit: 50,
          order: "descending",
          cursor,
        });

        for (const event of response.data) {
          const parsed = event.parsedJson as any;
          if (parsed?.dca_id === dcaId) {
            initiatedMap.set(event.id.txDigest, {
              dcaId: parsed.dca_id,
              executor: parsed.executor,
              inputAmount: BigInt(parsed.input_amount),
              feeAmount: BigInt(parsed.fee_amount),
              remainingOrders: parseInt(parsed.remaining_orders),
              orderNumber: parseInt(parsed.order_number),
              minOutput: BigInt(parsed.min_output),
            });
          }
        }

        cursor = response.hasNextPage ? response.nextCursor : null;
      } while (cursor);

      return allEvents.map((event) => ({
        ...event,
        initiated: initiatedMap.get(event.txDigest),
      }));
    },
    enabled: !!dcaId,
    refetchInterval: 30000,
  });

  // Calculate stats
  const stats = trades?.reduce(
    (acc, trade) => {
      const completed = trade.data as TradeCompletedData;
      const initiated = (trade as any).initiated as
        | TradeInitiatedData
        | undefined;

      acc.totalOutput += completed.outputAmount;
      if (initiated) {
        acc.totalInput += initiated.inputAmount;
        acc.totalFees += initiated.feeAmount;
      }
      acc.tradeCount++;
      return acc;
    },
    { totalInput: 0n, totalOutput: 0n, totalFees: 0n, tradeCount: 0 },
  );

  const avgPrice =
    stats && stats.totalOutput > 0n
      ? Number(stats.totalInput) / Number(stats.totalOutput)
      : null;

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-background-tertiary rounded-lg" />
        ))}
      </div>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <div className="text-center py-8 text-foreground-muted text-sm">
        No trades executed yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      {stats && stats.tradeCount > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg bg-background-secondary p-3 text-center">
            <p className="text-2xl font-mono font-medium">{stats.tradeCount}</p>
            <p className="text-xs text-foreground-muted">Trades</p>
          </div>
          <div className="rounded-lg bg-background-secondary p-3 text-center">
            <p className="text-lg font-mono font-medium">
              {(Number(stats.totalInput) / 10 ** inputToken.decimals).toFixed(
                2,
              )}
            </p>
            <p className="text-xs text-foreground-muted">
              {inputToken.symbol} Spent
            </p>
          </div>
          <div className="rounded-lg bg-background-secondary p-3 text-center">
            <p className="text-lg font-mono font-medium">
              {(Number(stats.totalOutput) / 10 ** outputToken.decimals).toFixed(
                4,
              )}
            </p>
            <p className="text-xs text-foreground-muted">
              {outputToken.symbol} Received
            </p>
          </div>
          <div className="rounded-lg bg-background-secondary p-3 text-center">
            <p className="text-lg font-mono font-medium">
              {avgPrice
                ? (
                    avgPrice *
                    10 ** (outputToken.decimals - inputToken.decimals)
                  ).toFixed(4)
                : "-"}
            </p>
            <p className="text-xs text-foreground-muted">Avg Price</p>
          </div>
        </div>
      )}

      {/* Trade List */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="bg-background-secondary px-4 py-2 border-b border-border">
          <div className="grid grid-cols-12 gap-2 text-xs text-foreground-muted uppercase tracking-wide">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Trade</div>
            <div className="col-span-3">Date</div>
            <div className="col-span-3 text-right">Link</div>
          </div>
        </div>
        <div className="divide-y divide-border">
          {trades.map((trade, idx) => {
            const completed = trade.data as TradeCompletedData;
            const initiated = (trade as any).initiated as
              | TradeInitiatedData
              | undefined;
            const inputAmount = initiated
              ? (
                  Number(initiated.inputAmount) /
                  10 ** inputToken.decimals
                ).toFixed(2)
              : "?";
            const outputAmount = (
              Number(completed.outputAmount) /
              10 ** outputToken.decimals
            ).toFixed(4);

            return (
              <div
                key={`${trade.txDigest}-${idx}`}
                className="px-4 py-3 hover:bg-background-secondary/50 transition-colors"
              >
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-1">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-background-tertiary text-xs font-mono">
                      {initiated?.orderNumber || idx + 1}
                    </span>
                  </div>
                  <div className="col-span-5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{inputAmount}</span>
                      <span className="text-xs text-foreground-muted">
                        {inputToken.symbol}
                      </span>
                      <ArrowRight className="w-3 h-3 text-foreground-muted" />
                      <span className="font-mono text-sm">{outputAmount}</span>
                      <span className="text-xs text-foreground-muted">
                        {outputToken.symbol}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-3">
                    <span className="text-xs text-foreground-muted">
                      {dayjs(trade.timestamp).format("MMM D, h:mm A")}
                    </span>
                  </div>
                  <div className="col-span-3 text-right">
                    <a
                      href={explorerTxUrl(trade.txDigest)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground-secondary transition-colors"
                    >
                      View
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Compact version for DCA card
export function TradeHistoryCompact({
  dcaId,
  inputToken,
  outputToken,
}: TradeHistoryProps) {
  const client = useSuiClient();
  const { contracts, network } = useNetwork();

  const { data: lastTrade } = useQuery({
    queryKey: ["last-trade", network, dcaId],
    queryFn: async () => {
      const response = await client.queryEvents({
        query: {
          MoveEventType: `${contracts.packageId}::dca::TradeCompletedEvent`,
        },
        limit: 10,
        order: "descending",
      });

      for (const event of response.data) {
        const parsed = event.parsedJson as any;
        if (parsed?.dca_id === dcaId) {
          return {
            timestamp: Number(event.timestampMs),
            outputAmount: BigInt(parsed.output_amount),
          };
        }
      }
      return null;
    },
    enabled: !!dcaId,
    staleTime: 30000,
  });

  if (!lastTrade) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-foreground-muted">
      <Clock className="w-3.5 h-3.5" />
      <span>Last trade {dayjs(lastTrade.timestamp).fromNow()}</span>
      <span className="text-foreground-tertiary">·</span>
      <span className="font-mono">
        +
        {(Number(lastTrade.outputAmount) / 10 ** outputToken.decimals).toFixed(
          4,
        )}{" "}
        {outputToken.symbol}
      </span>
    </div>
  );
}
