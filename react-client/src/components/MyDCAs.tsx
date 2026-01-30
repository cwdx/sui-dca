import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  History,
  Loader2,
  Pause,
  Play,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  reactivateAsOwner,
  redeemFundsAndDeactivate,
  setInactive,
} from "@/_generated/dca/dca/functions";
import { DCAPnL, PnLBadge } from "@/components/DCAPnL";
import { TokenIcon } from "@/components/TokenIcon";
import {
  TradeHistory,
  TradeHistoryCompact,
  useExecutedTradeCount,
} from "@/components/TradeHistory";
import { Button, Card, CardContent } from "@/components/ui";
import { getTokenByType } from "@/config/tokens";
import { useNetwork } from "@/contexts/NetworkContext";

dayjs.extend(relativeTime);

interface DCAAccount {
  id: string;
  inputType: string;
  outputType: string;
  owner: string;
  active: boolean;
  remainingOrders: number;
  initialOrders: number;
  inputBalance: bigint;
  splitAllocation: bigint;
  every: number;
  timeScale: number;
  lastTimeMs: bigint;
  startTimeMs: bigint;
}

const TIME_SCALE_NAMES: Record<number, string> = {
  1: "minute",
  2: "hour",
  3: "day",
  4: "week",
  5: "month",
};

const TIME_SCALE_MS: Record<number, number> = {
  1: 60_000,
  2: 3_600_000,
  3: 86_400_000,
  4: 604_800_000,
  5: 2_592_000_000,
};

/**
 * Live countdown timer with progress bar
 */
function CountdownTimer({
  targetMs,
  intervalMs,
}: {
  targetMs: number;
  intervalMs: number;
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const msRemaining = targetMs - now;
  const isReady = msRemaining <= 0;

  // Progress: how much of the interval has elapsed (0 to 100)
  const startMs = targetMs - intervalMs;
  const elapsed = now - startMs;
  const progress = Math.min(100, Math.max(0, (elapsed / intervalMs) * 100));

  // Format time remaining
  const formatTime = (ms: number) => {
    if (ms <= 0) return "Ready";
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes < 60) return `${minutes}m ${secs}s`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours < 24) return `${hours}h ${mins}m`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  if (isReady) {
    return (
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-status-success flex items-center gap-1">
          <Zap className="w-3 h-3" /> Ready
        </p>
        <div className="h-1 bg-status-success rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-mono font-medium text-foreground-primary">
        {formatTime(msRemaining)}
      </p>
      <div className="h-1 bg-background-tertiary rounded-full overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function parseDCAObject(obj: any): DCAAccount | null {
  try {
    if (!obj?.data?.content || obj.data.content.dataType !== "moveObject") {
      return null;
    }

    const fields = obj.data.content.fields;
    const dcaType = obj.data.content.type;

    const typeMatch = dcaType.match(/<(.+),\s*(.+)>/);
    if (!typeMatch) return null;

    return {
      id: obj.data.objectId,
      inputType: typeMatch[1].trim(),
      outputType: typeMatch[2].trim(),
      owner: fields.owner,
      active: fields.active,
      remainingOrders: parseInt(fields.remaining_orders),
      initialOrders: parseInt(fields.initial_orders),
      inputBalance: BigInt(fields.input_balance),
      splitAllocation: BigInt(fields.split_allocation),
      every: parseInt(fields.every),
      timeScale: fields.time_scale,
      lastTimeMs: BigInt(fields.last_time_ms),
      startTimeMs: BigInt(fields.start_time_ms),
    };
  } catch {
    return null;
  }
}

export function MyDCAs() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { contracts, network } = useNetwork();

  const { data: dcas, isLoading } = useQuery({
    queryKey: ["my-dcas", network, account?.address],
    queryFn: async () => {
      if (!account) return [];

      const dcaIds: string[] = [];
      let cursor: { txDigest: string; eventSeq: string } | null | undefined;

      do {
        const response = await client.queryEvents({
          query: {
            MoveEventType: `${contracts.packageId}::dca::DCACreatedEvent`,
          },
          limit: 50,
          order: "descending",
          cursor,
        });

        for (const event of response.data) {
          const parsed = event.parsedJson as any;
          if (parsed?.owner === account.address && parsed?.id) {
            dcaIds.push(parsed.id);
          }
        }

        cursor = response.hasNextPage ? response.nextCursor : null;
      } while (cursor);

      if (dcaIds.length === 0) return [];

      const allObjects: DCAAccount[] = [];
      for (let i = 0; i < dcaIds.length; i += 50) {
        const batch = dcaIds.slice(i, i + 50);
        const objects = await client.multiGetObjects({
          ids: batch,
          options: { showContent: true, showType: true },
        });

        for (const obj of objects) {
          const parsed = parseDCAObject(obj);
          if (parsed) allObjects.push(parsed);
        }
      }

      return allObjects;
    },
    enabled: !!account,
    refetchInterval: 10000,
  });

  if (!account) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="animate-pulse">
                <div className="h-16 bg-background-secondary" />
                <div className="p-6 space-y-4">
                  <div className="h-3 bg-background-tertiary rounded-full w-full" />
                  <div className="flex gap-4">
                    <div className="h-16 bg-background-tertiary rounded-lg flex-1" />
                    <div className="h-16 bg-background-tertiary rounded-lg flex-1" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!dcas || dcas.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-background-tertiary mx-auto mb-4 flex items-center justify-center">
            <Zap className="w-8 h-8 text-foreground-muted" />
          </div>
          <p className="text-lg font-serif text-foreground-primary mb-2">
            No DCA strategies yet
          </p>
          <p className="text-sm text-foreground-muted max-w-sm mx-auto">
            Create your first dollar-cost averaging strategy to automatically
            invest over time
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort: active first, then by remaining orders
  const sortedDcas = [...dcas].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    if (a.remainingOrders !== b.remainingOrders) {
      return b.remainingOrders - a.remainingOrders;
    }
    return 0;
  });

  return (
    <div className="space-y-4">
      {sortedDcas.map((dca) => (
        <DCACard key={dca.id} dca={dca} />
      ))}
    </div>
  );
}

type ViewMode = "none" | "history" | "pnl";

function DCACard({ dca }: { dca: DCAAccount }) {
  const queryClient = useQueryClient();
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("none");

  const inputToken = getTokenByType(dca.inputType);
  const outputToken = getTokenByType(dca.outputType);

  // Get actual executed trade count from on-chain events
  const { data: executedTrades = 0 } = useExecutedTradeCount(dca.id);

  const hasExecutedTrades = executedTrades > 0;
  const isCompleted =
    !dca.active &&
    dca.remainingOrders === 0 &&
    executedTrades === dca.initialOrders;
  const isCancelled = !dca.active && executedTrades < dca.initialOrders;

  // Use actual executed trades for progress calculation
  const progress = (executedTrades / dca.initialOrders) * 100;
  const inputBalance =
    Number(dca.inputBalance) / 10 ** (inputToken?.decimals || 9);
  const perTradeAmount =
    Number(dca.splitAllocation) / 10 ** (inputToken?.decimals || 9);

  // Calculate next execution time
  const nextExecutionMs =
    Number(dca.lastTimeMs) + dca.every * TIME_SCALE_MS[dca.timeScale];

  const handleCancel = async () => {
    setError(null);
    const tx = new Transaction();
    redeemFundsAndDeactivate(tx, [dca.inputType, dca.outputType], dca.id);

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["my-dcas"] });
        },
        onError: (err) => setError(err.message),
      },
    );
  };

  const handlePause = async () => {
    setError(null);
    const tx = new Transaction();
    setInactive(tx, [dca.inputType, dca.outputType], dca.id);

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["my-dcas"] });
        },
        onError: (err) => setError(err.message),
      },
    );
  };

  const handleResume = async () => {
    setError(null);
    const tx = new Transaction();
    reactivateAsOwner(tx, [dca.inputType, dca.outputType], dca.id);

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["my-dcas"] });
        },
        onError: (err) => setError(err.message),
      },
    );
  };

  // Status styling
  const statusConfig = dca.active
    ? { color: "text-status-success", bg: "bg-status-success", label: "Active" }
    : isCompleted
      ? {
          color: "text-foreground-muted",
          bg: "bg-foreground-muted",
          label: "Completed",
        }
      : isCancelled
        ? {
            color: "text-status-error",
            bg: "bg-status-error",
            label: "Cancelled",
          }
        : {
            color: "text-status-warning",
            bg: "bg-status-warning",
            label: "Paused",
          };

  return (
    <Card className="overflow-hidden">
      {/* Header with token pair */}
      <div className="bg-background-secondary px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Token pair visualization */}
            <div className="flex items-center">
              <div className="relative">
                {inputToken && <TokenIcon token={inputToken} size="md" />}
              </div>
              <div className="relative -ml-2 ring-2 ring-background-secondary rounded-full">
                {outputToken && <TokenIcon token={outputToken} size="md" />}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg text-foreground-primary">
                  {inputToken?.symbol || "?"}
                </span>
                <ArrowRight className="w-4 h-4 text-foreground-muted" />
                <span className="font-serif text-lg text-foreground-primary">
                  {outputToken?.symbol || "?"}
                </span>
              </div>
              <p className="text-xs text-foreground-muted">
                {perTradeAmount >= 1
                  ? perTradeAmount.toFixed(2)
                  : perTradeAmount.toPrecision(2)}{" "}
                {inputToken?.symbol} every {dca.every}{" "}
                {TIME_SCALE_NAMES[dca.timeScale]}
                {dca.every > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasExecutedTrades && inputToken && outputToken && (
              <PnLBadge
                dcaId={dca.id}
                inputToken={inputToken}
                outputToken={outputToken}
              />
            )}
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${statusConfig.bg}`} />
              <span className={`text-sm font-medium ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-6">
        {/* Progress section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-foreground-secondary">Progress</span>
            <span className="text-sm font-mono font-medium text-foreground-primary">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ease-out ${
                isCompleted
                  ? "bg-status-success"
                  : dca.active
                    ? "bg-accent"
                    : "bg-foreground-muted"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-lg bg-background-secondary p-3">
            <p className="text-xs text-foreground-muted uppercase tracking-wide mb-1">
              Orders
            </p>
            <p className="font-mono text-lg font-medium">
              {executedTrades}
              <span className="text-foreground-muted text-sm">
                /{dca.initialOrders}
              </span>
            </p>
          </div>
          <div className="rounded-lg bg-background-secondary p-3">
            <p className="text-xs text-foreground-muted uppercase tracking-wide mb-1">
              Remaining
            </p>
            <p className="font-mono text-lg font-medium">
              {inputBalance >= 1
                ? inputBalance.toFixed(2)
                : inputBalance > 0
                  ? inputBalance.toPrecision(2)
                  : "0.00"}
              <span className="text-foreground-muted text-sm ml-1">
                {inputToken?.symbol}
              </span>
            </p>
          </div>
          <div className="rounded-lg bg-background-secondary p-3">
            <p className="text-xs text-foreground-muted uppercase tracking-wide mb-1">
              Next Trade
            </p>
            {dca.active && dca.remainingOrders > 0 ? (
              <CountdownTimer
                targetMs={nextExecutionMs}
                intervalMs={dca.every * TIME_SCALE_MS[dca.timeScale]}
              />
            ) : isCompleted ? (
              <p className="text-sm text-foreground-muted flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Done
              </p>
            ) : (
              <p className="text-sm text-foreground-muted flex items-center gap-1">
                <Pause className="w-3 h-3" /> Paused
              </p>
            )}
          </div>
        </div>

        {/* Last trade info */}
        {hasExecutedTrades && inputToken && outputToken && (
          <div className="mb-4">
            <TradeHistoryCompact
              dcaId={dca.id}
              inputToken={inputToken}
              outputToken={outputToken}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-status-error/20 bg-status-error-bg px-4 py-3 text-sm text-status-error mb-4 flex items-start gap-2">
            <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        {dca.remainingOrders > 0 && (
          <div className="flex gap-3 pt-4 border-t border-border">
            {dca.active ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePause}
                  disabled={isPending}
                  className="flex-1 gap-2"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Pause className="w-4 h-4" />
                  )}
                  Pause
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isPending}
                  className="flex-1 gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel & Withdraw
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleResume}
                  disabled={isPending}
                  className="flex-1 gap-2"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Resume
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isPending}
                  className="flex-1 gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel & Withdraw
                </Button>
              </>
            )}
          </div>
        )}

        {/* Expandable sections */}
        {hasExecutedTrades && inputToken && outputToken && (
          <>
            {/* Tabs */}
            <div className="flex items-center justify-center gap-1 pt-4 mt-4 border-t border-border">
              <button
                onClick={() =>
                  setViewMode(viewMode === "history" ? "none" : "history")
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === "history"
                    ? "bg-accent text-foreground-inverse"
                    : "text-foreground-muted hover:text-foreground-secondary hover:bg-background-secondary"
                }`}
              >
                <History className="w-4 h-4" />
                History
              </button>
              <button
                onClick={() => setViewMode(viewMode === "pnl" ? "none" : "pnl")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === "pnl"
                    ? "bg-accent text-foreground-inverse"
                    : "text-foreground-muted hover:text-foreground-secondary hover:bg-background-secondary"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </button>
            </div>

            {/* Expanded content with animation */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                viewMode !== "none"
                  ? "max-h-[2000px] opacity-100 mt-4"
                  : "max-h-0 opacity-0"
              }`}
            >
              {viewMode === "history" && (
                <TradeHistory
                  dcaId={dca.id}
                  inputToken={inputToken}
                  outputToken={outputToken}
                />
              )}
              {viewMode === "pnl" && (
                <DCAPnL
                  dcaId={dca.id}
                  inputToken={inputToken}
                  outputToken={outputToken}
                />
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
