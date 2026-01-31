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
import { Button, Card, CardContent } from "@/components/ui";
import { TOKENS } from "@/config/tokens";
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
      <h3 className="text-lg font-serif font-medium mb-2">{title}</h3>
      <p className="text-foreground-tertiary text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}

// Stats card component with mini sparkline
interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  trend?: "up" | "down" | "neutral";
  chartData?: { value: number }[];
}

function StatCard({ label, value, subtext, trend, chartData }: StatCardProps) {
  const trendColor = trend === "up" ? "#166534" : trend === "down" ? "#991B1B" : "#737373";

  return (
    <Card className="hover:border-border-strong transition-colors cursor-pointer">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-foreground-muted uppercase tracking-wide mb-1">
              {label}
            </p>
            <p
              className={`text-xl sm:text-2xl font-mono font-medium ${
                trend === "up"
                  ? "text-status-success"
                  : trend === "down"
                    ? "text-status-error"
                    : "text-foreground-primary"
              }`}
            >
              {value}
            </p>
            {subtext && (
              <p className="text-xs text-foreground-muted mt-1 truncate">{subtext}</p>
            )}
          </div>
          {chartData && chartData.length > 0 && (
            <div className="w-20 h-12 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={trendColor}
                    fill={trendColor}
                    fillOpacity={0.1}
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Historical performance calculator
function HistoricalStats() {
  // Calculate 1Y performance for SUI/USDC DCA
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {suiBacktest && (
        <Link href="/dca?input=USDC&output=SUI&interval=week">
          <StatCard
            label="SUI 1Y DCA"
            value={`${suiBacktest.dcaReturn >= 0 ? "+" : ""}${suiBacktest.dcaReturn.toFixed(1)}%`}
            subtext={`$100/week · ${suiBacktest.dcaTokensAcquired.toFixed(2)} SUI`}
            trend={suiBacktest.dcaReturn >= 0 ? "up" : "down"}
            chartData={getChartData(suiBacktest)}
          />
        </Link>
      )}
      {ethBacktest && (
        <Link href="/dca?input=USDC&output=WETH&interval=week">
          <StatCard
            label="ETH 1Y DCA"
            value={`${ethBacktest.dcaReturn >= 0 ? "+" : ""}${ethBacktest.dcaReturn.toFixed(1)}%`}
            subtext={`$100/week · ${ethBacktest.dcaTokensAcquired.toFixed(4)} ETH`}
            trend={ethBacktest.dcaReturn >= 0 ? "up" : "down"}
            chartData={getChartData(ethBacktest)}
          />
        </Link>
      )}
      {btcBacktest && (
        <Link href="/dca?input=USDC&output=WBTC&interval=week">
          <StatCard
            label="BTC 1Y DCA"
            value={`${btcBacktest.dcaReturn >= 0 ? "+" : ""}${btcBacktest.dcaReturn.toFixed(1)}%`}
            subtext={`$100/week · ${btcBacktest.dcaTokensAcquired.toFixed(6)} BTC`}
            trend={btcBacktest.dcaReturn >= 0 ? "up" : "down"}
            chartData={getChartData(btcBacktest)}
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
            className="w-full h-full object-cover opacity-5"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background-primary via-background-primary/95 to-background-primary" />
        </div>

        <div className="text-center py-16 sm:py-24 max-w-3xl mx-auto px-4">
          <p className="overline mb-4">Automated Investing on Sui</p>
          <h1 className="text-h1 sm:text-display font-serif text-foreground-primary mb-6">
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
            <h2 className="text-h3 sm:text-h2 font-serif text-foreground-primary">
              See How DCA Performs
            </h2>
            <p className="text-foreground-secondary mt-2 max-w-lg mx-auto">
              Real returns from $100/week DCA strategies over the past year
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
            <h2 className="text-h3 sm:text-h2 font-serif text-foreground-primary">
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
              <h2 className="text-h3 sm:text-h2 font-serif mb-4">
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
