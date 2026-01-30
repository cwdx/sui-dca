import { useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  Activity,
  Coins,
  DollarSign,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui";
import type { TokenInfo } from "@/config/tokens";
import { useNetwork } from "@/contexts/NetworkContext";
import { usePythPrices } from "@/hooks/usePythPrices";

interface Trade {
  timestamp: number;
  txDigest: string;
  inputAmount: bigint;
  outputAmount: bigint;
  feeAmount: bigint;
  orderNumber: number;
}

interface DCAPnLProps {
  dcaId: string;
  inputToken: TokenInfo;
  outputToken: TokenInfo;
}

export function DCAPnL({ dcaId, inputToken, outputToken }: DCAPnLProps) {
  const client = useSuiClient();
  const { contracts, network } = useNetwork();

  const { data: prices } = usePythPrices([inputToken, outputToken]);
  const inputPriceUsd = inputToken.pythPriceId
    ? prices?.get(inputToken.pythPriceId)?.price
    : null;
  const outputPriceUsd = outputToken.pythPriceId
    ? prices?.get(outputToken.pythPriceId)?.price
    : null;

  const { data: trades, isLoading } = useQuery({
    queryKey: ["dca-trades-pnl", network, dcaId],
    queryFn: async () => {
      const tradeMap = new Map<string, Trade>();

      let cursor: { txDigest: string; eventSeq: string } | null | undefined;
      do {
        const response = await client.queryEvents({
          query: {
            MoveEventType: `${contracts.packageId}::dca::TradeCompletedEvent`,
          },
          limit: 50,
          order: "ascending",
          cursor,
        });

        for (const event of response.data) {
          const parsed = event.parsedJson as any;
          if (parsed?.dca_id === dcaId) {
            const existing = tradeMap.get(event.id.txDigest) || {
              timestamp: Number(event.timestampMs),
              txDigest: event.id.txDigest,
              inputAmount: 0n,
              outputAmount: 0n,
              feeAmount: 0n,
              orderNumber: 0,
            };
            existing.outputAmount = BigInt(parsed.output_amount);
            tradeMap.set(event.id.txDigest, existing);
          }
        }
        cursor = response.hasNextPage ? response.nextCursor : null;
      } while (cursor);

      cursor = undefined;
      do {
        const response = await client.queryEvents({
          query: {
            MoveEventType: `${contracts.packageId}::dca::TradeInitiatedEvent`,
          },
          limit: 50,
          order: "ascending",
          cursor,
        });

        for (const event of response.data) {
          const parsed = event.parsedJson as any;
          if (parsed?.dca_id === dcaId) {
            const existing = tradeMap.get(event.id.txDigest);
            if (existing) {
              existing.inputAmount = BigInt(parsed.input_amount);
              existing.feeAmount = BigInt(parsed.fee_amount);
              existing.orderNumber = parseInt(parsed.order_number);
            }
          }
        }
        cursor = response.hasNextPage ? response.nextCursor : null;
      } while (cursor);

      return Array.from(tradeMap.values()).sort(
        (a, b) => a.timestamp - b.timestamp,
      );
    },
    enabled: !!dcaId,
    staleTime: 30000,
  });

  const pnlData = useMemo(() => {
    if (!trades || trades.length === 0 || !inputPriceUsd || !outputPriceUsd) {
      return null;
    }

    let cumulativeInput = 0n;
    let cumulativeOutput = 0n;
    let cumulativeFees = 0n;

    const chartData = trades.map((trade) => {
      cumulativeInput += trade.inputAmount;
      cumulativeOutput += trade.outputAmount;
      cumulativeFees += trade.feeAmount;

      const inputValueUsd =
        (Number(cumulativeInput) / 10 ** inputToken.decimals) * inputPriceUsd;
      const outputValueUsd =
        (Number(cumulativeOutput) / 10 ** outputToken.decimals) *
        outputPriceUsd;
      const feesUsd =
        (Number(cumulativeFees) / 10 ** inputToken.decimals) * inputPriceUsd;

      const costBasis = inputValueUsd + feesUsd;
      const unrealizedPnl = outputValueUsd - costBasis;
      const unrealizedPnlPercent =
        costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0;

      return {
        date: dayjs(trade.timestamp).format("MMM D"),
        timestamp: trade.timestamp,
        orderNumber: trade.orderNumber,
        costBasis,
        currentValue: outputValueUsd,
        pnl: unrealizedPnl,
        pnlPercent: unrealizedPnlPercent,
        tokensHeld: Number(cumulativeOutput) / 10 ** outputToken.decimals,
        avgPrice:
          Number(cumulativeInput) /
          Number(cumulativeOutput) /
          10 ** (inputToken.decimals - outputToken.decimals),
      };
    });

    const latest = chartData[chartData.length - 1];
    const totalInput = Number(cumulativeInput) / 10 ** inputToken.decimals;
    const totalOutput = Number(cumulativeOutput) / 10 ** outputToken.decimals;
    const totalFees = Number(cumulativeFees) / 10 ** inputToken.decimals;

    return {
      chartData,
      totalInput,
      totalOutput,
      totalFees,
      costBasis: latest.costBasis,
      currentValue: latest.currentValue,
      unrealizedPnl: latest.pnl,
      unrealizedPnlPercent: latest.pnlPercent,
      avgPrice: latest.avgPrice,
      currentPrice: inputPriceUsd / outputPriceUsd,
    };
  }, [trades, inputPriceUsd, outputPriceUsd, inputToken, outputToken]);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-background-tertiary rounded-lg" />
          ))}
        </div>
        <div className="h-48 bg-background-tertiary rounded-lg" />
      </div>
    );
  }

  if (!pnlData || !trades || trades.length === 0) {
    return (
      <div className="text-center py-8 text-foreground-muted">
        No trades to analyze yet
      </div>
    );
  }

  const isProfitable = pnlData.unrealizedPnl >= 0;
  const pnlColor = isProfitable ? "#166534" : "#991b1b";
  const pnlBgColor = isProfitable ? "#F0FDF4" : "#FEF2F2";

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg bg-background-secondary p-4">
          <div className="flex items-center gap-2 text-foreground-muted mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">Cost Basis</span>
          </div>
          <p className="text-xl font-mono font-medium">
            ${pnlData.costBasis.toFixed(2)}
          </p>
        </div>

        <div className="rounded-lg bg-background-secondary p-4">
          <div className="flex items-center gap-2 text-foreground-muted mb-2">
            <Coins className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">Value</span>
          </div>
          <p className="text-xl font-mono font-medium">
            ${pnlData.currentValue.toFixed(2)}
          </p>
        </div>

        <div className="rounded-lg p-4" style={{ backgroundColor: pnlBgColor }}>
          <div
            className="flex items-center gap-2 mb-2"
            style={{ color: pnlColor }}
          >
            {isProfitable ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-xs uppercase tracking-wide">P&L</span>
          </div>
          <p
            className="text-xl font-mono font-medium"
            style={{ color: pnlColor }}
          >
            {isProfitable ? "+" : ""}${pnlData.unrealizedPnl.toFixed(2)}
          </p>
          <p className="text-xs font-mono mt-1" style={{ color: pnlColor }}>
            {isProfitable ? "+" : ""}
            {pnlData.unrealizedPnlPercent.toFixed(2)}%
          </p>
        </div>

        <div className="rounded-lg bg-background-secondary p-4">
          <div className="flex items-center gap-2 text-foreground-muted mb-2">
            <Target className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">Avg Price</span>
          </div>
          <p className="text-lg font-mono font-medium">
            {pnlData.avgPrice.toFixed(4)}
          </p>
          <Badge
            variant={
              pnlData.avgPrice < pnlData.currentPrice ? "success" : "error"
            }
            className="mt-1"
          >
            {pnlData.avgPrice < pnlData.currentPrice
              ? "Below mkt"
              : "Above mkt"}
          </Badge>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Portfolio Value */}
        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-foreground-muted" />
            <h4 className="text-sm font-medium text-foreground-primary">
              Portfolio Value
            </h4>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={pnlData.chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={pnlColor} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={pnlColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E5E5E5"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#737373" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#737373" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
                width={45}
              />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #E5E5E5",
                  borderRadius: "8px",
                  fontSize: "12px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.07)",
                }}
                formatter={(value) => [`$${Number(value).toFixed(2)}`, "Value"]}
              />
              <Area
                type="monotone"
                dataKey="currentValue"
                stroke={pnlColor}
                strokeWidth={2}
                fill="url(#colorValue)"
              />
              <Area
                type="monotone"
                dataKey="costBasis"
                stroke="#A3A3A3"
                strokeWidth={1}
                strokeDasharray="4 4"
                fill="none"
              />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-xs text-foreground-muted text-center mt-2">
            Solid = Value · Dashed = Cost Basis
          </p>
        </div>

        {/* P&L Over Time */}
        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-4">
            {isProfitable ? (
              <TrendingUp className="w-4 h-4 text-status-success" />
            ) : (
              <TrendingDown className="w-4 h-4 text-status-error" />
            )}
            <h4 className="text-sm font-medium text-foreground-primary">
              Cumulative P&L
            </h4>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={pnlData.chartData}>
              <defs>
                <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={pnlColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={pnlColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E5E5E5"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#737373" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#737373" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v >= 0 ? "+" : ""}$${v}`}
                width={50}
              />
              <ReferenceLine y={0} stroke="#E5E5E5" strokeWidth={1} />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #E5E5E5",
                  borderRadius: "8px",
                  fontSize: "12px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.07)",
                }}
                formatter={(value) => {
                  const v = Number(value);
                  return [`${v >= 0 ? "+" : ""}$${v.toFixed(2)}`, "P&L"];
                }}
              />
              <Area
                type="monotone"
                dataKey="pnl"
                stroke={pnlColor}
                strokeWidth={2}
                fill="url(#colorPnL)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Average Price Chart */}
      <div className="rounded-lg border border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-foreground-muted" />
            <h4 className="text-sm font-medium text-foreground-primary">
              Average Buy Price
            </h4>
          </div>
          <div className="flex items-center gap-4 text-xs text-foreground-muted">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-accent rounded" />
              Your Avg
            </span>
            <span className="flex items-center gap-1">
              <span
                className="w-3 h-0.5 bg-status-success rounded"
                style={{ opacity: 0.5 }}
              />
              Market
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={pnlData.chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E5E5E5"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#737373" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#737373" }}
              axisLine={false}
              tickLine={false}
              domain={["auto", "auto"]}
              tickFormatter={(v) => v.toFixed(2)}
              width={40}
            />
            <ReferenceLine
              y={pnlData.currentPrice}
              stroke="#166534"
              strokeDasharray="5 5"
              strokeOpacity={0.5}
            />
            <Tooltip
              contentStyle={{
                background: "#fff",
                border: "1px solid #E5E5E5",
                borderRadius: "8px",
                fontSize: "12px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.07)",
              }}
              formatter={(value) => [
                `${Number(value).toFixed(4)} ${inputToken.symbol}`,
                "Avg Price",
              ]}
            />
            <Line
              type="monotone"
              dataKey="avgPrice"
              stroke="#0A0A0A"
              strokeWidth={2}
              dot={{ r: 3, fill: "#0A0A0A" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-xs text-foreground-muted text-center mt-2">
          Current market: {pnlData.currentPrice.toFixed(4)} {inputToken.symbol}/
          {outputToken.symbol}
        </p>
      </div>
    </div>
  );
}

// Compact PnL badge for DCA card header
export function PnLBadge({ dcaId, inputToken, outputToken }: DCAPnLProps) {
  const client = useSuiClient();
  const { contracts, network } = useNetwork();

  const { data: prices } = usePythPrices([inputToken, outputToken]);
  const inputPriceUsd = inputToken.pythPriceId
    ? prices?.get(inputToken.pythPriceId)?.price
    : null;
  const outputPriceUsd = outputToken.pythPriceId
    ? prices?.get(outputToken.pythPriceId)?.price
    : null;

  const { data: pnl } = useQuery({
    queryKey: ["dca-pnl-quick", network, dcaId, inputPriceUsd, outputPriceUsd],
    queryFn: async () => {
      if (!inputPriceUsd || !outputPriceUsd) return null;

      let totalInput = 0n;
      let totalOutput = 0n;
      let totalFees = 0n;

      const completedResponse = await client.queryEvents({
        query: {
          MoveEventType: `${contracts.packageId}::dca::TradeCompletedEvent`,
        },
        limit: 50,
        order: "descending",
      });

      const txDigests = new Set<string>();
      for (const event of completedResponse.data) {
        const parsed = event.parsedJson as any;
        if (parsed?.dca_id === dcaId) {
          totalOutput += BigInt(parsed.output_amount);
          txDigests.add(event.id.txDigest);
        }
      }

      const initiatedResponse = await client.queryEvents({
        query: {
          MoveEventType: `${contracts.packageId}::dca::TradeInitiatedEvent`,
        },
        limit: 50,
        order: "descending",
      });

      for (const event of initiatedResponse.data) {
        const parsed = event.parsedJson as any;
        if (parsed?.dca_id === dcaId && txDigests.has(event.id.txDigest)) {
          totalInput += BigInt(parsed.input_amount);
          totalFees += BigInt(parsed.fee_amount);
        }
      }

      if (totalOutput === 0n) return null;

      const costBasis =
        ((Number(totalInput) + Number(totalFees)) / 10 ** inputToken.decimals) *
        inputPriceUsd;
      const currentValue =
        (Number(totalOutput) / 10 ** outputToken.decimals) * outputPriceUsd;
      const pnl = currentValue - costBasis;
      const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

      return { pnl, pnlPercent };
    },
    enabled: !!dcaId && !!inputPriceUsd && !!outputPriceUsd,
    staleTime: 30000,
  });

  if (!pnl) return null;

  const isProfitable = pnl.pnl >= 0;

  return (
    <Badge
      variant={isProfitable ? "success" : "error"}
      className="font-mono text-xs"
    >
      {isProfitable ? "+" : ""}
      {pnl.pnlPercent.toFixed(1)}%
    </Badge>
  );
}
