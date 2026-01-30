import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  ArrowUpDown,
  Calculator,
  CheckCircle2,
  Clock,
  Coins,
  Loader2,
  Rocket,
  Shield,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link, useSearch } from "wouter";
import { initAccount } from "@/_generated/dca/dca/functions";
import { TermsDialog, useTermsVersion } from "@/components/TermsAcceptance";
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
import { useNetwork } from "@/contexts/NetworkContext";
import { formatExecutorReward, useGlobalConfig } from "@/hooks/useGlobalConfig";
import { calculateExchangeRate, usePythPrices } from "@/hooks/usePythPrices";

type TimeScale = "minute" | "hour" | "day" | "week" | "month";
type StartOption = "now" | "scheduled";

const TIME_SCALE_VALUES: Record<TimeScale, number> = {
  minute: 1,
  hour: 2,
  day: 3,
  week: 4,
  month: 5,
};

const TIME_SCALE_LABELS: Record<
  TimeScale,
  { singular: string; plural: string }
> = {
  minute: { singular: "minute", plural: "minutes" },
  hour: { singular: "hour", plural: "hours" },
  day: { singular: "day", plural: "days" },
  week: { singular: "week", plural: "weeks" },
  month: { singular: "month", plural: "months" },
};

// Strategy presets - popular DCA configurations
interface StrategyPreset {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  inputToken: string;
  outputToken: string;
  amountPerOrder: string;
  numOrders: string;
  interval: string;
  timeScale: TimeScale;
  color: string;
}

const STRATEGY_PRESETS: StrategyPreset[] = [
  {
    id: "sui-stacker",
    name: "SUI Stacker",
    description: "Daily SUI accumulation - the classic approach",
    icon: <Coins className="w-5 h-5" />,
    inputToken: "USDC",
    outputToken: "SUI",
    amountPerOrder: "10",
    numOrders: "30",
    interval: "1",
    timeScale: "day",
    color: "from-blue-500/10 to-cyan-500/10 border-blue-500/20",
  },
  {
    id: "btc-builder",
    name: "Bitcoin Builder",
    description: "Weekly BTC - long-term store of value",
    icon: <Shield className="w-5 h-5" />,
    inputToken: "USDC",
    outputToken: "WBTC",
    amountPerOrder: "50",
    numOrders: "12",
    interval: "1",
    timeScale: "week",
    color: "from-orange-500/10 to-amber-500/10 border-orange-500/20",
  },
  {
    id: "eth-accumulator",
    name: "ETH Accumulator",
    description: "Weekly ETH - smart contract ecosystem bet",
    icon: <TrendingUp className="w-5 h-5" />,
    inputToken: "USDC",
    outputToken: "WETH",
    amountPerOrder: "50",
    numOrders: "12",
    interval: "1",
    timeScale: "week",
    color: "from-purple-500/10 to-indigo-500/10 border-purple-500/20",
  },
  {
    id: "deep-diver",
    name: "DEEP Diver",
    description: "Weekly DEEP - Sui DeFi infrastructure play",
    icon: <Rocket className="w-5 h-5" />,
    inputToken: "USDC",
    outputToken: "DEEP",
    amountPerOrder: "25",
    numOrders: "12",
    interval: "1",
    timeScale: "week",
    color: "from-teal-500/10 to-emerald-500/10 border-teal-500/20",
  },
  {
    id: "profit-taker",
    name: "Profit Taker",
    description: "De-risk SUI gains into stables over time",
    icon: <Target className="w-5 h-5" />,
    inputToken: "SUI",
    outputToken: "USDC",
    amountPerOrder: "100",
    numOrders: "10",
    interval: "1",
    timeScale: "week",
    color: "from-green-500/10 to-emerald-500/10 border-green-500/20",
  },
  {
    id: "micro-dca",
    name: "Micro DCA",
    description: "Hourly micro-buys for volatile periods",
    icon: <Clock className="w-5 h-5" />,
    inputToken: "USDC",
    outputToken: "SUI",
    amountPerOrder: "5",
    numOrders: "24",
    interval: "1",
    timeScale: "hour",
    color: "from-pink-500/10 to-rose-500/10 border-pink-500/20",
  },
];

// Parse URL search params
function useURLParams() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  return {
    input: params.get("input"),
    output: params.get("output"),
    amount: params.get("amount"),
    orders: params.get("orders"),
    interval: params.get("interval"),
  };
}

export function CreateDCA() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();
  const urlParams = useURLParams();

  // Token selection
  const [inputToken, setInputToken] = useState<TokenInfo>(() => {
    if (urlParams.input && TOKENS[urlParams.input]) {
      return TOKENS[urlParams.input];
    }
    return TOKENS.USDC;
  });
  const [outputToken, setOutputToken] = useState<TokenInfo>(() => {
    if (urlParams.output && TOKENS[urlParams.output]) {
      return TOKENS[urlParams.output];
    }
    return TOKENS.SUI;
  });

  // Amount per order
  const [amountPerOrder, setAmountPerOrder] = useState(
    () => urlParams.amount || "",
  );
  const [numOrders, setNumOrders] = useState(() => urlParams.orders || "10");

  // Schedule
  const [interval, setInterval] = useState("1");
  const [timeScale, setTimeScale] = useState<TimeScale>(() => {
    if (
      urlParams.interval &&
      ["day", "week", "month"].includes(urlParams.interval)
    ) {
      return urlParams.interval as TimeScale;
    }
    return "day";
  });

  // Start time
  const [startOption, setStartOption] = useState<StartOption>("now");
  const [startDate, setStartDate] = useState(() =>
    dayjs().format("YYYY-MM-DD"),
  );
  const [startTime, setStartTime] = useState(() => {
    const now = dayjs();
    return `${now.hour().toString().padStart(2, "0")}:${(Math.ceil(now.minute() / 15) * 15) % 60}`.padEnd(
      5,
      "0",
    );
  });

  const [error, setError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const { contracts } = useNetwork();

  // Fetch prices for all tokens
  const { data: prices } = usePythPrices(TOKEN_LIST);
  const inputPrice = inputToken.pythPriceId
    ? prices?.get(inputToken.pythPriceId)
    : null;
  const outputPrice = outputToken.pythPriceId
    ? prices?.get(outputToken.pythPriceId)
    : null;
  const exchangeRate = calculateExchangeRate(inputPrice, outputPrice);

  // Fetch current terms version
  const { data: termsVersion } = useTermsVersion();

  // Fetch global config from on-chain (executor reward, fees, etc.)
  const { data: globalConfig } = useGlobalConfig();

  // Fetch user's balance of input token (with pagination)
  const { data: inputBalance } = useQuery({
    queryKey: ["token-balance", account?.address, inputToken.type],
    queryFn: async () => {
      if (!account)
        return {
          balance: 0n,
          coins: [] as { objectId: string; balance: bigint }[],
        };

      const allCoins: { objectId: string; balance: bigint }[] = [];
      let cursor: string | null | undefined;

      do {
        const response = await client.getCoins({
          owner: account.address,
          coinType: inputToken.type,
          cursor,
        });

        for (const c of response.data) {
          allCoins.push({
            objectId: c.coinObjectId,
            balance: BigInt(c.balance),
          });
        }

        cursor = response.hasNextPage ? response.nextCursor : null;
      } while (cursor);

      const totalBalance = allCoins.reduce((sum, c) => sum + c.balance, 0n);
      return { balance: totalBalance, coins: allCoins };
    },
    enabled: !!account,
    refetchInterval: 15000,
  });

  // Apply preset
  const applyPreset = (preset: StrategyPreset) => {
    setInputToken(TOKENS[preset.inputToken]);
    setOutputToken(TOKENS[preset.outputToken]);
    setAmountPerOrder(preset.amountPerOrder);
    setNumOrders(preset.numOrders);
    setInterval(preset.interval);
    setTimeScale(preset.timeScale);
    setSelectedPreset(preset.id);
  };

  // Flip tokens
  const handleFlip = () => {
    const temp = inputToken;
    setInputToken(outputToken);
    setOutputToken(temp);
    setSelectedPreset(null);
  };

  // Clear preset selection when user modifies form
  const handleInputChange =
    (setter: (val: string) => void) => (val: string) => {
      setter(val);
      setSelectedPreset(null);
    };

  // Calculate totals
  const totalAmount =
    amountPerOrder && numOrders
      ? parseFloat(amountPerOrder) * parseInt(numOrders)
      : 0;

  const totalAmountFormatted = totalAmount.toFixed(
    inputToken.decimals > 4 ? 4 : inputToken.decimals,
  );

  const totalAmountRaw = totalAmount
    ? BigInt(Math.floor(totalAmount * 10 ** inputToken.decimals))
    : 0n;

  const hasInsufficientBalance =
    inputBalance &&
    totalAmountRaw > 0n &&
    inputBalance.balance < totalAmountRaw;

  // Format schedule description
  const getScheduleDescription = () => {
    const n = parseInt(interval) || 1;
    const label =
      n === 1
        ? TIME_SCALE_LABELS[timeScale].singular
        : TIME_SCALE_LABELS[timeScale].plural;
    return `Every ${n} ${label}`;
  };

  // Format start time description
  const getStartDescription = () => {
    if (startOption === "now") {
      return "Starting immediately";
    }
    const scheduled = dayjs(`${startDate} ${startTime}`);
    if (scheduled.isBefore(dayjs())) {
      return "Start time is in the past";
    }
    return `Starting ${scheduled.format("MMM D, YYYY [at] h:mm A")}`;
  };

  const getStartTimeMs = (): bigint => {
    if (startOption === "now") {
      return 0n;
    }
    const scheduled = dayjs(`${startDate} ${startTime}`);
    return BigInt(scheduled.valueOf());
  };

  // Handle create button click
  const handleCreateClick = () => {
    if (!termsAccepted) {
      setShowTermsDialog(true);
      return;
    }
    executeCreate();
  };

  // Handle terms acceptance
  const handleTermsAccept = () => {
    setTermsAccepted(true);
    executeCreate();
  };

  async function executeCreate() {
    if (!account) return;
    if (!termsVersion) {
      setError("Failed to load terms version. Please refresh and try again.");
      return;
    }
    setError(null);

    try {
      const tx = new Transaction();

      const amountPerOrderRaw = BigInt(
        Math.floor(parseFloat(amountPerOrder) * 10 ** inputToken.decimals),
      );
      const ordersCount = BigInt(numOrders);
      const totalAmountRaw = amountPerOrderRaw * ordersCount;

      const startTimeMs = getStartTimeMs();
      const every = BigInt(interval);
      const ts = TIME_SCALE_VALUES[timeScale];

      // Use executor reward from on-chain config (fallback to default if not loaded)
      const executorRewardPerOrder =
        globalConfig?.executorRewardPerTrade ?? 25_000_000n;
      const totalExecutorReward = executorRewardPerOrder * ordersCount;

      const [rewardCoin] = tx.splitCoins(tx.gas, [totalExecutorReward]);
      let inputCoin;

      if (inputToken.type === "0x2::sui::SUI") {
        [inputCoin] = tx.splitCoins(tx.gas, [totalAmountRaw]);
      } else {
        if (!inputBalance || inputBalance.coins.length === 0) {
          throw new Error(`No ${inputToken.symbol} coins found in your wallet`);
        }

        if (inputBalance.balance < totalAmountRaw) {
          const available =
            Number(inputBalance.balance) / 10 ** inputToken.decimals;
          throw new Error(
            `Insufficient ${inputToken.symbol} balance. You have ${available.toFixed(4)} but need ${totalAmountFormatted}`,
          );
        }

        const [primaryCoin, ...otherCoins] = inputBalance.coins;
        const primaryCoinRef = tx.object(primaryCoin.objectId);

        if (otherCoins.length > 0) {
          tx.mergeCoins(
            primaryCoinRef,
            otherCoins.map((c) => tx.object(c.objectId)),
          );
        }

        [inputCoin] = tx.splitCoins(primaryCoinRef, [totalAmountRaw]);
      }

      initAccount(tx, [inputToken.type, outputToken.type], {
        globalConfig: contracts.globalConfig,
        termsRegistry: contracts.termsRegistry,
        clock: contracts.clock,
        delegatee:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        inputFunds: inputCoin,
        every,
        totalOrders: ordersCount,
        timeScale: ts,
        startTimeMs,
        acceptedTermsVersion: termsVersion.currentVersion,
        inputDecimals: inputToken.decimals,
        outputDecimals: outputToken.decimals,
        executorRewardFunds: rewardCoin,
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log("DCA created:", result.digest);
            setAmountPerOrder("");
            setNumOrders("10");
            setTermsAccepted(false);
            setSelectedPreset(null);
          },
          onError: (err) => {
            setError(err.message);
          },
        },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create DCA");
    }
  }

  const isStartInPast =
    startOption === "scheduled" &&
    dayjs(`${startDate} ${startTime}`).isBefore(dayjs());

  // Estimated output
  const estimatedOutput =
    amountPerOrder && exchangeRate
      ? parseFloat(amountPerOrder) * exchangeRate
      : null;

  const canCreate =
    amountPerOrder &&
    numOrders &&
    !hasInsufficientBalance &&
    !isStartInPast &&
    termsVersion;

  return (
    <>
      <div className="space-y-6">
        {/* Strategy Presets */}
        <div>
          <h2 className="text-lg font-serif text-foreground-primary mb-3">
            Quick Start Strategies
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {STRATEGY_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className={`relative text-left p-4 rounded-xl border transition-all ${
                  selectedPreset === preset.id
                    ? "border-accent bg-accent/5 ring-1 ring-accent"
                    : `bg-gradient-to-br ${preset.color} hover:border-foreground-muted`
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      selectedPreset === preset.id
                        ? "bg-accent text-foreground-inverse"
                        : "bg-background-primary/50"
                    }`}
                  >
                    {preset.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground-primary truncate">
                      {preset.name}
                    </p>
                    <p className="text-xs text-foreground-muted mt-0.5 line-clamp-2">
                      {preset.description}
                    </p>
                    <p className="text-xs font-mono text-foreground-tertiary mt-2">
                      {preset.amountPerOrder} {preset.inputToken} →{" "}
                      {preset.outputToken}
                    </p>
                  </div>
                </div>
                {selectedPreset === preset.id && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main Form Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {selectedPreset
                  ? STRATEGY_PRESETS.find((p) => p.id === selectedPreset)?.name
                  : "Custom Strategy"}
              </CardTitle>
              <Link href="/calculator">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Calculator className="w-4 h-4" />
                  Calculator
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Token Selection with Flip */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Spend</Label>
                <Select
                  value={inputToken.symbol}
                  onValueChange={(v) => {
                    setInputToken(TOKENS[v]);
                    setSelectedPreset(null);
                  }}
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
                  variant="secondary"
                  size="sm"
                  onClick={handleFlip}
                  className="rounded-full w-10 h-10 p-0"
                >
                  <ArrowUpDown className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Buy</Label>
                <Select
                  value={outputToken.symbol}
                  onValueChange={(v) => {
                    setOutputToken(TOKENS[v]);
                    setSelectedPreset(null);
                  }}
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

            {/* Amount Per Order */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Amount per Trade</Label>
                {inputBalance && (
                  <span className="text-xs text-foreground-muted">
                    Balance:{" "}
                    <span className="font-mono">
                      {(
                        Number(inputBalance.balance) /
                        10 ** inputToken.decimals
                      ).toFixed(4)}
                    </span>{" "}
                    {inputToken.symbol}
                  </span>
                )}
              </div>
              <div className="relative">
                <Input
                  type="number"
                  value={amountPerOrder}
                  onChange={(e) =>
                    handleInputChange(setAmountPerOrder)(e.target.value)
                  }
                  placeholder="50.00"
                  className="pr-16 font-mono"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-foreground-muted">
                  {inputToken.symbol}
                </span>
              </div>
              {estimatedOutput && (
                <p className="text-xs text-foreground-muted">
                  ≈{" "}
                  <span className="font-mono">
                    {estimatedOutput.toFixed(4)}
                  </span>{" "}
                  {outputToken.symbol} per trade
                </p>
              )}
            </div>

            {/* Amount Shortcuts */}
            <div className="flex gap-2">
              {["10", "25", "50", "100"].map((amount) => (
                <Button
                  key={amount}
                  variant={amountPerOrder === amount ? "default" : "secondary"}
                  size="sm"
                  onClick={() => handleInputChange(setAmountPerOrder)(amount)}
                  className="flex-1"
                >
                  {amount}
                </Button>
              ))}
            </div>

            {/* Frequency */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Every</Label>
                <Input
                  type="number"
                  value={interval}
                  onChange={(e) =>
                    handleInputChange(setInterval)(e.target.value)
                  }
                  min="1"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>Period</Label>
                <Select
                  value={timeScale}
                  onValueChange={(v) => {
                    setTimeScale(v as TimeScale);
                    setSelectedPreset(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minute">Minutes</SelectItem>
                    <SelectItem value="hour">Hours</SelectItem>
                    <SelectItem value="day">Days</SelectItem>
                    <SelectItem value="week">Weeks</SelectItem>
                    <SelectItem value="month">Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick Schedule Shortcuts */}
            <div className="flex gap-2">
              {[
                { label: "Hourly", interval: "1", scale: "hour" as TimeScale },
                { label: "Daily", interval: "1", scale: "day" as TimeScale },
                { label: "Weekly", interval: "1", scale: "week" as TimeScale },
              ].map((preset) => (
                <Button
                  key={preset.label}
                  variant={
                    interval === preset.interval && timeScale === preset.scale
                      ? "default"
                      : "secondary"
                  }
                  size="sm"
                  onClick={() => {
                    setInterval(preset.interval);
                    setTimeScale(preset.scale);
                    setSelectedPreset(null);
                  }}
                  className="flex-1"
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {/* Number of Orders */}
            <div className="space-y-2">
              <Label>Number of Trades</Label>
              <Input
                type="number"
                value={numOrders}
                onChange={(e) =>
                  handleInputChange(setNumOrders)(e.target.value)
                }
                min="1"
                max="1000"
                className="font-mono"
              />
            </div>

            {/* Trade count shortcuts */}
            <div className="flex gap-2">
              {["7", "14", "30", "52"].map((count) => (
                <Button
                  key={count}
                  variant={numOrders === count ? "default" : "secondary"}
                  size="sm"
                  onClick={() => handleInputChange(setNumOrders)(count)}
                  className="flex-1"
                >
                  {count}
                </Button>
              ))}
            </div>

            {/* Start Time */}
            <div className="space-y-3">
              <Label>Start</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={startOption === "now" ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setStartOption("now")}
                  className="flex-1"
                >
                  Now
                </Button>
                <Button
                  type="button"
                  variant={
                    startOption === "scheduled" ? "default" : "secondary"
                  }
                  size="sm"
                  onClick={() => setStartOption("scheduled")}
                  className="flex-1"
                >
                  Schedule
                </Button>
              </div>
              {startOption === "scheduled" && (
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={dayjs().format("YYYY-MM-DD")}
                    className="font-mono"
                  />
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="font-mono"
                  />
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="rounded-lg border border-border bg-background-secondary p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-foreground-tertiary mb-3">
                Summary
              </p>
              <div className="space-y-2 text-sm">
                <p className="text-foreground-primary">
                  Buy {outputToken.symbol} with{" "}
                  <span className="font-mono font-medium">
                    {amountPerOrder || "0"}
                  </span>{" "}
                  {inputToken.symbol}
                </p>
                <p className="text-foreground-secondary">
                  {getScheduleDescription()}
                </p>
                <p className="text-foreground-secondary">
                  {numOrders} trades &middot;{" "}
                  <span className="font-mono">{totalAmountFormatted}</span>{" "}
                  {inputToken.symbol} total
                </p>
                <p
                  className={`text-foreground-secondary ${isStartInPast ? "text-status-error" : ""}`}
                >
                  {getStartDescription()}
                </p>
                {exchangeRate && (
                  <p className="text-foreground-muted text-xs">
                    Rate: 1 {inputToken.symbol} = {exchangeRate.toFixed(6)}{" "}
                    {outputToken.symbol}
                  </p>
                )}
                <p className="text-xs text-foreground-muted pt-1 border-t border-border mt-2">
                  Executor fee:{" "}
                  <span className="font-mono">
                    {globalConfig
                      ? (
                          (Number(globalConfig.executorRewardPerTrade) /
                            1_000_000_000) *
                          parseInt(numOrders || "0")
                        ).toFixed(3)
                      : (0.025 * parseInt(numOrders || "0")).toFixed(3)}
                  </span>{" "}
                  SUI
                  {globalConfig && (
                    <span className="text-foreground-tertiary">
                      {" "}
                      (
                      {formatExecutorReward(
                        globalConfig.executorRewardPerTrade,
                      )}
                      /trade)
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Terms acceptance indicator */}
            {termsAccepted && (
              <div className="flex items-center gap-2 text-sm text-status-success">
                <CheckCircle2 className="w-4 h-4" />
                Terms & Conditions accepted
              </div>
            )}

            {/* Insufficient balance warning */}
            {hasInsufficientBalance && (
              <div className="rounded-lg border border-status-warning/20 bg-status-warning-bg p-3 text-sm text-status-warning">
                Insufficient {inputToken.symbol} balance. You have{" "}
                <span className="font-mono">
                  {(
                    Number(inputBalance.balance) /
                    10 ** inputToken.decimals
                  ).toFixed(4)}
                </span>{" "}
                but need{" "}
                <span className="font-mono">{totalAmountFormatted}</span>.
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-status-error/20 bg-status-error-bg p-3 text-sm text-status-error">
                {error}
              </div>
            )}

            {/* Submit */}
            <Button
              onClick={handleCreateClick}
              disabled={isPending || !canCreate}
              className="w-full gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  {termsAccepted ? "Create DCA" : "Review Terms & Create"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Terms Dialog */}
      <TermsDialog
        open={showTermsDialog}
        onOpenChange={setShowTermsDialog}
        onAccept={handleTermsAccept}
      />
    </>
  );
}
