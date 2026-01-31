import {
  ArrowRight,
  Calculator,
  CalendarDays,
  History,
  Loader2,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "wouter";
import { TokenSelectDisplay } from "@/components/TokenIcon";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { TOKEN_LIST, TOKENS, type TokenInfo } from "@/config/tokens";
import {
  calculateBacktest,
  hasHistoricalData,
  useHistoricalPrices,
} from "@/hooks/useHistoricalPrices";
import { calculateExchangeRate, usePythPrices } from "@/hooks/usePythPrices";

type Interval = "daily" | "weekly" | "monthly";

const INTERVAL_DAYS: Record<Interval, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

// Preset date ranges
const DATE_PRESETS = [
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
] as const;

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function parseDate(str: string): Date {
  return new Date(`${str}T00:00:00`);
}

export function DCACalculator() {
  // Token selection
  const [inputToken, setInputToken] = useState<TokenInfo>(TOKENS.USDC);
  const [outputToken, setOutputToken] = useState<TokenInfo>(TOKENS.SUI);

  // Strategy config
  const [amountPerTrade, setAmountPerTrade] = useState("100");
  const [interval, setInterval] = useState<Interval>("weekly");

  // Date range
  const [endDate, setEndDate] = useState(() => formatDate(new Date()));
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return formatDate(d);
  });

  // Fetch current prices for display
  const { data: prices } = usePythPrices(TOKEN_LIST);
  const inputPrice = inputToken.pythPriceId
    ? prices?.get(inputToken.pythPriceId)
    : null;
  const outputPrice = outputToken.pythPriceId
    ? prices?.get(outputToken.pythPriceId)
    : null;
  const currentRate = calculateExchangeRate(inputToken, outputToken, prices);

  // Fetch historical prices
  const {
    data: historicalPrices,
    isLoading,
    isError,
  } = useHistoricalPrices(
    inputToken,
    outputToken,
    parseDate(startDate),
    parseDate(endDate),
  );

  // Calculate backtest results
  const backtest = useMemo(() => {
    if (!historicalPrices) return null;
    const amount = parseFloat(amountPerTrade) || 0;
    if (amount <= 0) return null;
    return calculateBacktest(historicalPrices, amount, INTERVAL_DAYS[interval]);
  }, [historicalPrices, amountPerTrade, interval]);

  // Check if tokens have historical data
  const inputHasHistory = hasHistoricalData(inputToken);
  const outputHasHistory = hasHistoricalData(outputToken);
  const canBacktest = inputHasHistory && outputHasHistory;

  // Set preset date range
  const setPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setEndDate(formatDate(end));
    setStartDate(formatDate(start));
  };

  const handleFlip = () => {
    setInputToken(outputToken);
    setOutputToken(inputToken);
  };

  // Deep link to create real DCA (dashboard with params)
  const basePath = import.meta.env.BASE_URL || "/";
  const createDCALink = `${basePath}dca?input=${inputToken.symbol}&output=${outputToken.symbol}&amount=${amountPerTrade}&interval=${interval}`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="overline mb-2">Historical Backtest</p>
        <h1 className="text-h2 text-foreground-primary">
          DCA Calculator
        </h1>
        <p className="text-foreground-secondary mt-2">
          See how DCA would have performed using real historical prices from
          Pyth
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Configure Backtest
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Token Selection */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Spend</Label>
                <Select
                  value={inputToken.symbol}
                  onValueChange={(v) => setInputToken(TOKENS[v])}
                >
                  <SelectTrigger>
                    <TokenSelectDisplay
                      token={inputToken}
                      price={inputPrice?.price}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {TOKEN_LIST.map((token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        <TokenSelectDisplay
                          token={token}
                          price={
                            token.pythPriceId
                              ? prices?.get(token.pythPriceId)?.price
                              : null
                          }
                        />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFlip}
                  className="rounded-full w-10 h-10 p-0"
                >
                  <ArrowRight className="w-4 h-4 rotate-90" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Buy</Label>
                <Select
                  value={outputToken.symbol}
                  onValueChange={(v) => setOutputToken(TOKENS[v])}
                >
                  <SelectTrigger>
                    <TokenSelectDisplay
                      token={outputToken}
                      price={outputPrice?.price}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {TOKEN_LIST.filter(
                      (t) => t.symbol !== inputToken.symbol,
                    ).map((token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        <TokenSelectDisplay
                          token={token}
                          price={
                            token.pythPriceId
                              ? prices?.get(token.pythPriceId)?.price
                              : null
                          }
                        />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label>Amount per Trade</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={amountPerTrade}
                  onChange={(e) => setAmountPerTrade(e.target.value)}
                  placeholder="100"
                  className="pr-16 font-mono"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-foreground-muted">
                  {inputToken.symbol}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {["50", "100", "250", "500"].map((amount) => (
                <Button
                  key={amount}
                  variant={amountPerTrade === amount ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setAmountPerTrade(amount)}
                  className="flex-1"
                >
                  ${amount}
                </Button>
              ))}
            </div>

            {/* Frequency */}
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={interval}
                onValueChange={(v) => setInterval(v as Interval)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                Date Range
              </Label>

              <div className="flex gap-2">
                {DATE_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="secondary"
                    size="sm"
                    onClick={() => setPreset(preset.days)}
                    className="flex-1"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-xs text-foreground-muted">From</span>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-foreground-muted">To</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    max={formatDate(new Date())}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Current Rate */}
            {currentRate && (
              <div className="rounded-lg bg-background-tertiary p-3 text-sm">
                <p className="text-foreground-muted">Current Rate</p>
                <p className="font-mono text-foreground-primary">
                  1 {inputToken.symbol} = {currentRate.toFixed(6)}{" "}
                  {outputToken.symbol}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Cards */}
          {backtest ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-foreground-muted uppercase tracking-wide">
                    Total Invested
                  </p>
                  <p className="text-xl font-mono font-medium mt-1">
                    {backtest.totalInvested.toLocaleString()}{" "}
                    {inputToken.symbol}
                  </p>
                  <p className="text-xs text-foreground-muted mt-1">
                    {backtest.trades.length} trades
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-foreground-muted uppercase tracking-wide">
                    Tokens Acquired
                  </p>
                  <p className="text-xl font-mono font-medium mt-1">
                    {backtest.dcaTokensAcquired.toFixed(4)} {outputToken.symbol}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-foreground-muted uppercase tracking-wide">
                    Avg. Buy Price
                  </p>
                  <p className="text-xl font-mono font-medium mt-1">
                    {backtest.dcaAvgPrice.toFixed(6)}
                  </p>
                  <p className="text-xs text-foreground-muted mt-1">
                    {inputToken.symbol}/{outputToken.symbol}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-foreground-muted uppercase tracking-wide">
                    Return
                  </p>
                  <p
                    className={`text-xl font-mono font-medium mt-1 flex items-center gap-1 ${
                      backtest.dcaReturn >= 0
                        ? "text-status-success"
                        : "text-status-error"
                    }`}
                  >
                    {backtest.dcaReturn >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {backtest.dcaReturn >= 0 ? "+" : ""}
                    {backtest.dcaReturn.toFixed(2)}%
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-4">
                    <div className="h-4 bg-background-tertiary rounded w-20 mb-2" />
                    <div className="h-6 bg-background-tertiary rounded w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Historical Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!canBacktest ? (
                <div className="h-[300px] flex flex-col items-center justify-center text-foreground-muted gap-2">
                  <span>
                    Historical data not available for{" "}
                    {!inputHasHistory ? inputToken.symbol : outputToken.symbol}
                  </span>
                </div>
              ) : isLoading ? (
                <div className="h-[300px] flex flex-col items-center justify-center text-foreground-muted gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Loading historical prices from Pyth...</span>
                </div>
              ) : isError ? (
                <div className="h-[300px] flex flex-col items-center justify-center text-foreground-muted gap-2">
                  <span className="text-status-error">
                    Failed to load historical data. Try a different date range.
                  </span>
                </div>
              ) : backtest && backtest.trades.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={backtest.trades}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      stroke="#737373"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      stroke="#737373"
                      tickFormatter={(v) =>
                        `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}`
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#fff",
                        border: "1px solid #e5e5e5",
                        borderRadius: "8px",
                      }}
                      formatter={(value) => [
                        `$${(value as number).toFixed(2)}`,
                        "",
                      ]}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="invested"
                      name="Total Invested"
                      stroke="#a3a3a3"
                      fill="#f5f5f5"
                      strokeDasharray="5 5"
                    />
                    <Area
                      type="monotone"
                      dataKey="dcaValue"
                      name="Portfolio Value"
                      stroke="#0a0a0a"
                      fill="#0a0a0a"
                      fillOpacity={0.1}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-foreground-muted gap-2">
                  <span>No trades in selected date range</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="border-accent">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg text-foreground-primary">
                    Ready to start your DCA?
                  </p>
                  <p className="text-sm text-foreground-secondary mt-1">
                    Create a real DCA strategy with these settings
                  </p>
                </div>
                <Link href={createDCALink}>
                  <Button className="gap-2">
                    <Zap className="w-4 h-4" />
                    Create DCA
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
