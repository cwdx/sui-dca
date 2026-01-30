import { ArrowRight, Calculator, TrendingUp, Zap } from "lucide-react";
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
import { calculateExchangeRate, usePythPrices } from "@/hooks/usePythPrices";

type TimeScale = "day" | "week" | "month";

const TIME_SCALE_DAYS: Record<TimeScale, number> = {
  day: 1,
  week: 7,
  month: 30,
};

interface SimulationPoint {
  date: string;
  invested: number;
  dcaValue: number;
  lumpSumValue: number;
  tokensAcquired: number;
  avgPrice: number;
}

// Simulate DCA with historical-like price variations
function simulateDCA(
  amountPerOrder: number,
  numOrders: number,
  interval: TimeScale,
  currentPrice: number,
  volatility: number = 0.15, // 15% price volatility
): SimulationPoint[] {
  const points: SimulationPoint[] = [];
  let totalInvested = 0;
  let tokensAcquired = 0;
  const daysPerOrder = TIME_SCALE_DAYS[interval];
  const initialPrice = currentPrice;

  // Generate simulated price path with mean reversion
  const prices: number[] = [];
  let price = initialPrice * (1 + (Math.random() - 0.5) * volatility * 2);

  for (let i = 0; i < numOrders; i++) {
    // Random walk with mean reversion to current price
    const drift = (currentPrice - price) * 0.1;
    const shock = (Math.random() - 0.5) * volatility * price;
    price = Math.max(price * 0.5, price + drift + shock);
    prices.push(price);
  }

  for (let i = 0; i < numOrders; i++) {
    const orderPrice = prices[i];
    const tokensThisOrder = amountPerOrder / orderPrice;

    totalInvested += amountPerOrder;
    tokensAcquired += tokensThisOrder;

    const avgPrice = totalInvested / tokensAcquired;
    const dcaValue = tokensAcquired * currentPrice;
    const lumpSumTokens = (amountPerOrder * numOrders) / prices[0];
    const lumpSumValue = lumpSumTokens * currentPrice;

    const date = new Date();
    date.setDate(date.getDate() + i * daysPerOrder);

    points.push({
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      invested: totalInvested,
      dcaValue,
      lumpSumValue,
      tokensAcquired,
      avgPrice,
    });
  }

  return points;
}

export function DCACalculator() {
  // Form state
  const [inputToken, setInputToken] = useState<TokenInfo>(TOKENS.USDC);
  const [outputToken, setOutputToken] = useState<TokenInfo>(TOKENS.SUI);
  const [amountPerOrder, setAmountPerOrder] = useState("100");
  const [numOrders, setNumOrders] = useState("12");
  const [interval, setInterval] = useState<TimeScale>("week");

  // Fetch prices
  const { data: prices } = usePythPrices(TOKEN_LIST);
  const inputPrice = inputToken.pythPriceId
    ? prices?.get(inputToken.pythPriceId)
    : null;
  const outputPrice = outputToken.pythPriceId
    ? prices?.get(outputToken.pythPriceId)
    : null;
  const exchangeRate = calculateExchangeRate(inputPrice, outputPrice);

  // Calculate simulation
  const simulation = useMemo(() => {
    const amount = parseFloat(amountPerOrder) || 0;
    const orders = parseInt(numOrders) || 0;
    if (amount <= 0 || orders <= 0 || !exchangeRate) return null;

    return simulateDCA(amount, orders, interval, exchangeRate);
  }, [amountPerOrder, numOrders, interval, exchangeRate]);

  // Summary stats
  const totalInvested =
    (parseFloat(amountPerOrder) || 0) * (parseInt(numOrders) || 0);
  const finalTokens = simulation?.[simulation.length - 1]?.tokensAcquired || 0;
  const avgPrice = simulation?.[simulation.length - 1]?.avgPrice || 0;
  const currentValue = finalTokens * (exchangeRate || 0);

  // Deep link to create real DCA
  const createDCALink = `/create?input=${inputToken.symbol}&output=${outputToken.symbol}&amount=${amountPerOrder}&orders=${numOrders}&interval=${interval}`;

  const handleFlip = () => {
    setInputToken(outputToken);
    setOutputToken(inputToken);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="overline mb-2">Simulation</p>
        <h1 className="text-h2 font-serif text-foreground-primary">
          DCA Calculator
        </h1>
        <p className="text-foreground-secondary mt-2">
          Simulate your DCA strategy and see projected outcomes
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Configure Strategy
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

              {/* Flip Button */}
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

            {/* Amount & Schedule */}
            <div className="space-y-2">
              <Label>Amount per Trade</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={amountPerOrder}
                  onChange={(e) => setAmountPerOrder(e.target.value)}
                  placeholder="100"
                  className="pr-16 font-mono"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-foreground-muted">
                  {inputToken.symbol}
                </span>
              </div>
            </div>

            {/* Shortcuts */}
            <div className="flex gap-2">
              {["50", "100", "250", "500"].map((amount) => (
                <Button
                  key={amount}
                  variant={amountPerOrder === amount ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setAmountPerOrder(amount)}
                  className="flex-1"
                >
                  ${amount}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={interval}
                  onValueChange={(v) => setInterval(v as TimeScale)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Daily</SelectItem>
                    <SelectItem value="week">Weekly</SelectItem>
                    <SelectItem value="month">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={numOrders} onValueChange={setNumOrders}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4 trades</SelectItem>
                    <SelectItem value="8">8 trades</SelectItem>
                    <SelectItem value="12">12 trades</SelectItem>
                    <SelectItem value="24">24 trades</SelectItem>
                    <SelectItem value="52">52 trades</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Exchange Rate */}
            {exchangeRate && (
              <div className="rounded-lg bg-background-tertiary p-3 text-sm">
                <p className="text-foreground-muted">Current Rate</p>
                <p className="font-mono text-foreground-primary">
                  1 {inputToken.symbol} = {exchangeRate.toFixed(6)}{" "}
                  {outputToken.symbol}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-foreground-muted uppercase tracking-wide">
                  Total Invested
                </p>
                <p className="text-xl font-mono font-medium mt-1">
                  {totalInvested.toLocaleString()} {inputToken.symbol}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-foreground-muted uppercase tracking-wide">
                  Tokens Acquired
                </p>
                <p className="text-xl font-mono font-medium mt-1">
                  {finalTokens.toFixed(4)} {outputToken.symbol}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-foreground-muted uppercase tracking-wide">
                  Avg. Buy Price
                </p>
                <p className="text-xl font-mono font-medium mt-1">
                  {avgPrice > 0 ? avgPrice.toFixed(6) : "-"} {inputToken.symbol}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-foreground-muted uppercase tracking-wide">
                  Current Value
                </p>
                <p className="text-xl font-mono font-medium mt-1">
                  {currentValue.toFixed(4)} {outputToken.symbol}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Value Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                DCA vs Lump Sum
              </CardTitle>
            </CardHeader>
            <CardContent>
              {simulation && simulation.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={simulation}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      stroke="#737373"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      stroke="#737373"
                      tickFormatter={(v) => `$${v.toLocaleString()}`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#fff",
                        border: "1px solid #e5e5e5",
                        borderRadius: "8px",
                      }}
                      formatter={(value) => [`$${Number(value).toFixed(2)}`]}
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
                      name="DCA Value"
                      stroke="#0a0a0a"
                      fill="#0a0a0a"
                      fillOpacity={0.1}
                    />
                    <Area
                      type="monotone"
                      dataKey="lumpSumValue"
                      name="Lump Sum Value"
                      stroke="#166534"
                      fill="#166534"
                      fillOpacity={0.1}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-foreground-muted">
                  Configure your strategy to see projections
                </div>
              )}
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="border-accent">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-serif text-lg text-foreground-primary">
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
