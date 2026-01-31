import { ConnectButton } from "@mysten/dapp-kit";
import {
  ArrowRight,
  BarChart3,
  Clock,
  Shield,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Link } from "wouter";
import { TokenIcon } from "@/components/TokenIcon";
import { Button, Card, CardContent } from "@/components/ui";
import { TOKENS, type TokenInfo } from "@/config/tokens";
import {
  calculateBacktest,
  useHistoricalPrices,
  type BacktestSummary,
} from "@/hooks/useHistoricalPrices";

// Feature card component - reusable
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="p-6 rounded-2xl bg-black/[0.02] border border-border">
      <div className="w-10 h-10 rounded-lg bg-accent text-foreground-inverse flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-foreground-tertiary text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}

// Stats card component with mini sparkline and token icon
interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  period?: string;
  trend?: "up" | "down" | "neutral";
  chartData?: { value: number }[];
  token?: TokenInfo;
  totalInvested?: number;
  currentValue?: number;
}

function StatCard({ label, value, subtext, period, trend, chartData, token, totalInvested, currentValue }: StatCardProps) {
  const trendColor = trend === "up" ? "#166534" : trend === "down" ? "#991B1B" : "#737373";

  return (
    <Card className="hover:border-border-strong transition-colors cursor-pointer">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          {/* Token icon */}
          {token && (
            <div className="flex-shrink-0">
              <TokenIcon token={token} size="md" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-foreground-muted uppercase tracking-wide mb-0.5">
                  {label}
                </p>
                <p
                  className={`text-xl font-mono font-medium ${
                    trend === "up"
                      ? "text-status-success"
                      : trend === "down"
                        ? "text-status-error"
                        : "text-foreground-primary"
                  }`}
                >
                  {value}
                </p>
                {period && (
                  <p className="text-xs text-foreground-tertiary mt-0.5">
                    {period}
                  </p>
                )}
              </div>
              {chartData && chartData.length > 0 && (
                <div className="w-16 h-10 flex-shrink-0 pointer-events-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={trendColor}
                        fill={trendColor}
                        fillOpacity={0.1}
                        strokeWidth={1.5}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            {/* Additional stats */}
            <div className="mt-2 pt-2 border-t border-border text-xs text-foreground-muted space-y-0.5">
              {subtext && <p className="truncate">{subtext}</p>}
              {totalInvested && currentValue && (
                <p className="font-mono">
                  ${totalInvested.toLocaleString()} → ${currentValue.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Historical performance calculator
function HistoricalStats() {
  // Calculate 1Y performance for DCA (Pyth Benchmarks API limit)
  const endDate = useMemo(() => new Date(), []);
  const startDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d;
  }, []);

  const { data: suiPrices, isLoading: suiLoading } = useHistoricalPrices(
    TOKENS.USDC,
    TOKENS.SUI,
    startDate,
    endDate
  );

  const { data: ethPrices, isLoading: ethLoading } = useHistoricalPrices(
    TOKENS.USDC,
    TOKENS.WETH,
    startDate,
    endDate
  );

  const { data: btcPrices, isLoading: btcLoading } = useHistoricalPrices(
    TOKENS.USDC,
    TOKENS.WBTC,
    startDate,
    endDate
  );

  // Weekly DCA with $100/week
  const suiBacktest = useMemo(() => {
    if (!suiPrices) return null;
    return calculateBacktest(suiPrices, 100, 7);
  }, [suiPrices]);

  const ethBacktest = useMemo(() => {
    if (!ethPrices) return null;
    return calculateBacktest(ethPrices, 100, 7);
  }, [ethPrices]);

  const btcBacktest = useMemo(() => {
    if (!btcPrices) return null;
    return calculateBacktest(btcPrices, 100, 7);
  }, [btcPrices]);

  const isLoading = suiLoading || ethLoading || btcLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="h-4 bg-background-tertiary rounded w-20 mb-2 animate-pulse" />
              <div className="h-8 bg-background-tertiary rounded w-24 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Convert backtest trades to sparkline chart data
  const getChartData = (backtest: BacktestSummary | null) => {
    if (!backtest) return [];
    return backtest.trades.map((t) => ({ value: t.dcaValue }));
  };

  // Calculate period string from backtest data (e.g., "2Y 3M" or "8M")
  const getPeriod = (backtest: BacktestSummary | null): string => {
    if (!backtest || backtest.trades.length < 2) return "";
    const firstTrade = backtest.trades[0];
    const lastTrade = backtest.trades[backtest.trades.length - 1];
    const diffMs = lastTrade.timestamp - firstTrade.timestamp;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    if (years > 0 && months > 0) return `${years}Y ${months}M`;
    if (years > 0) return `${years}Y`;
    if (months > 0) return `${months}M`;
    return `${diffDays}D`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {suiBacktest && (
        <Link href="/dca?input=USDC&output=SUI&interval=week">
          <StatCard
            label="SUI Weekly DCA"
            value={`${suiBacktest.dcaReturn >= 0 ? "+" : ""}${suiBacktest.dcaReturn.toFixed(1)}%`}
            subtext={`${suiBacktest.dcaTokensAcquired.toFixed(2)} SUI acquired`}
            period={getPeriod(suiBacktest)}
            trend={suiBacktest.dcaReturn >= 0 ? "up" : "down"}
            chartData={getChartData(suiBacktest)}
            token={TOKENS.SUI}
            totalInvested={Math.round(suiBacktest.totalInvested)}
            currentValue={Math.round(suiBacktest.dcaCurrentValue)}
          />
        </Link>
      )}
      {ethBacktest && (
        <Link href="/dca?input=USDC&output=WETH&interval=week">
          <StatCard
            label="ETH Weekly DCA"
            value={`${ethBacktest.dcaReturn >= 0 ? "+" : ""}${ethBacktest.dcaReturn.toFixed(1)}%`}
            subtext={`${ethBacktest.dcaTokensAcquired.toFixed(4)} ETH acquired`}
            period={getPeriod(ethBacktest)}
            trend={ethBacktest.dcaReturn >= 0 ? "up" : "down"}
            chartData={getChartData(ethBacktest)}
            token={TOKENS.WETH}
            totalInvested={Math.round(ethBacktest.totalInvested)}
            currentValue={Math.round(ethBacktest.dcaCurrentValue)}
          />
        </Link>
      )}
      {btcBacktest && (
        <Link href="/dca?input=USDC&output=WBTC&interval=week">
          <StatCard
            label="BTC Weekly DCA"
            value={`${btcBacktest.dcaReturn >= 0 ? "+" : ""}${btcBacktest.dcaReturn.toFixed(1)}%`}
            subtext={`${btcBacktest.dcaTokensAcquired.toFixed(6)} BTC acquired`}
            period={getPeriod(btcBacktest)}
            trend={btcBacktest.dcaReturn >= 0 ? "up" : "down"}
            chartData={getChartData(btcBacktest)}
            token={TOKENS.WBTC}
            totalInvested={Math.round(btcBacktest.totalInvested)}
            currentValue={Math.round(btcBacktest.dcaCurrentValue)}
          />
        </Link>
      )}
    </div>
  );
}

export function Landing() {
  return (
    <div className="space-y-20 sm:space-y-32">
      {/* Hero Section */}
      <section className="relative">
        {/* Background image - Unsplash */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1920&q=80"
            alt=""
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background-primary/80 via-background-primary/60 to-background-primary" />
        </div>

        <div className="text-center py-16 sm:py-24 max-w-3xl mx-auto px-4">
          <p className="overline mb-4">Automated Investing on Sui</p>
          <h1 className="text-h1 sm:text-display text-foreground-primary mb-6">
            Dollar Cost Averaging,
            <br />
            Made Simple
          </h1>
          <p className="text-body sm:text-body-lg text-foreground-secondary mb-10 max-w-xl mx-auto">
            Automate your crypto investments with trustless, oracle-powered DCA
            strategies on Sui blockchain.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/dca">
              <Button className="gap-2 w-full sm:w-auto">
                <Zap className="w-4 h-4" />
                Start DCA
              </Button>
            </Link>
            <Link href="/calculator">
              <Button variant="secondary" className="gap-2 w-full sm:w-auto">
                <BarChart3 className="w-4 h-4" />
                Try Calculator
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Historical Performance */}
      <section className="px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="overline mb-2">Historical Performance</p>
            <h2 className="text-h3 sm:text-h2 text-foreground-primary">
              See How DCA Performs
            </h2>
            <p className="text-foreground-secondary mt-2 max-w-lg mx-auto">
              Real returns from $100/week DCA strategies using Pyth historical data
            </p>
          </div>
          <HistoricalStats />
          <p className="text-center text-xs text-foreground-muted mt-4">
            Past performance does not guarantee future results. Click a card to start this strategy.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="overline mb-2">Why Sui DCA</p>
            <h2 className="text-h3 sm:text-h2 text-foreground-primary">
              Built for Serious Investors
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Shield className="w-5 h-5" />}
              title="Oracle-Powered"
              description="Pyth Network oracles ensure fair pricing on every trade with real-time data and slippage protection."
            />
            <FeatureCard
              icon={<Clock className="w-5 h-5" />}
              title="Fully Automated"
              description="Set your schedule and forget. Permissionless executors trigger your trades exactly on time."
            />
            <FeatureCard
              icon={<TrendingUp className="w-5 h-5" />}
              title="Non-Custodial"
              description="Your funds stay in your DCA account on-chain. Cancel anytime and withdraw instantly."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 pb-12">
        <div className="max-w-3xl mx-auto">
          <Card className="bg-accent text-foreground-inverse border-0">
            <CardContent className="py-12 text-center">
              <h2 className="text-h3 sm:text-h2 mb-4">
                Ready to Start Investing?
              </h2>
              <p className="text-foreground-inverse/80 mb-8 max-w-md mx-auto">
                Connect your wallet and create your first DCA strategy in under a minute.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <ConnectButton />
                <Link href="/dca">
                  <Button
                    variant="secondary"
                    className="gap-2 bg-white text-accent hover:bg-white/90 w-full sm:w-auto"
                  >
                    Create Strategy
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
