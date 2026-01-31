import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ExternalLink, Shield, Activity, Wallet, Copy, Check, QrCode } from "lucide-react";
import { useExecutorHealth, getExecutorApiUrl } from "@/hooks/useExecutorHealth";
import { useState } from "react";
import { ConnectButton } from "@mysten/dapp-kit";
import { QRCodeSVG } from "qrcode.react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@/components/ui";
import { useNetwork } from "@/contexts/NetworkContext";

// Convert on-chain blob_id (number array) to base64url string for Walrus URL
function blobIdToString(blobId: number[]): string {
  const bytes = new Uint8Array(blobId);
  const base64 = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return base64;
}

// Executor Status Component
function ExecutorStatus() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutate: signAndExecute, isPending: isSending } = useSignAndExecuteTransaction();
  const { data: health, isLoading, isError, refetch } = useExecutorHealth();
  const [copied, setCopied] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const apiUrl = getExecutorApiUrl();

  const handleFundExecutor = () => {
    if (!account || !health?.executor?.address || !fundAmount) return;
    const amountInMist = BigInt(Math.floor(parseFloat(fundAmount) * 1_000_000_000));
    const tx = new Transaction();
    tx.transferObjects(
      [tx.splitCoins(tx.gas, [amountInMist])],
      health.executor.address
    );
    signAndExecute(
      { transaction: tx },
      {
        onSuccess: () => {
          setFundAmount("");
          refetch();
        },
      }
    );
  };

  const copyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Executor Status
          </CardTitle>
          <CardDescription>
            Automated trade executor service
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-foreground-muted">Checking executor status...</p>
          ) : isError || !health ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-status-error">
                <span className="w-2 h-2 rounded-full bg-status-error" />
                <span className="font-medium">Offline</span>
              </div>
              {apiUrl && (
                <div>
                  <p className="text-xs text-foreground-tertiary mb-1">API Endpoint</p>
                  <p className="font-mono text-xs text-foreground-muted break-all">{apiUrl}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-sm">
                <div>
                  <p className="text-foreground-tertiary mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-status-success" />
                    <Badge variant="success">Online</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-foreground-tertiary mb-1">Network</p>
                  <p className="font-mono">{health.network}</p>
                </div>
                <div>
                  <p className="text-foreground-tertiary mb-1">Runtime</p>
                  <p className="font-mono">{health.runtime}</p>
                </div>
                <div>
                  <p className="text-foreground-tertiary mb-1">Dry Run</p>
                  <Badge variant={health.dryRun ? "warning" : "secondary"}>
                    {health.dryRun ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-foreground-tertiary mb-2">Executor Wallet</p>
                <div className="flex items-center gap-3">
                  <Wallet className="w-4 h-4 text-foreground-muted" />
                  <code className="font-mono text-xs text-foreground-secondary break-all flex-1">
                    {health.executor.address}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyAddress(health.executor.address)}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-status-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQRDialog(true)}
                    className="shrink-0"
                    title="Show QR Code"
                  >
                    <QrCode className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-3 p-3 rounded-lg bg-black/[0.02]">
                  <span className="text-sm text-foreground-secondary">Balance</span>
                  <span className="font-mono font-medium text-foreground-primary">
                    {health.executor.balance}
                  </span>
                </div>
                <p className="text-xs text-foreground-muted mt-2">
                  Fund this address to ensure the executor can pay gas fees for trade execution.
                </p>
                {/* Fund Executor */}
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-foreground-tertiary mb-2">Fund Executor</p>
                  {account ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Amount in SUI"
                        className="font-mono flex-1"
                        step="0.1"
                        min="0"
                        value={fundAmount}
                        onChange={(e) => setFundAmount(e.target.value)}
                      />
                      <Button
                        size="sm"
                        onClick={handleFundExecutor}
                        disabled={isSending || !fundAmount || parseFloat(fundAmount) <= 0}
                      >
                        {isSending ? "Sending..." : "Send SUI"}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        placeholder="Amount in SUI"
                        className="font-mono flex-1"
                        disabled
                      />
                      <ConnectButton />
                    </div>
                  )}
                  {!account && (
                    <p className="text-xs text-foreground-muted mt-2">
                      Connect wallet to send SUI to the executor.
                    </p>
                  )}
                </div>
              </div>

              {apiUrl && (
                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-foreground-tertiary mb-1">API Endpoint</p>
                  <p className="font-mono text-xs text-foreground-muted break-all">{apiUrl}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      {health && (
        <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Fund Executor</DialogTitle>
              <DialogClose />
            </DialogHeader>
            <DialogBody className="flex flex-col items-center text-center">
              <div className="bg-white p-4 rounded-xl mb-4">
                <QRCodeSVG
                  value={health.executor.address}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <p className="text-sm text-foreground-secondary mb-2">
                Scan to send SUI to the executor wallet
              </p>
              <code className="font-mono text-xs text-foreground-muted break-all px-4">
                {health.executor.address}
              </code>
              <div className="flex items-center gap-2 mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => copyAddress(health.executor.address)}
                  className="gap-2"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-status-success" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  Copy Address
                </Button>
              </div>
            </DialogBody>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export function Admin() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const _queryClient = useQueryClient();
  const { contracts, network, explorerObjectUrl, walrusUrl } = useNetwork();
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();

  // Form state for admin actions
  const [feeBps, setFeeBps] = useState("");
  const [executorReward, setExecutorReward] = useState("");
  const [slippageBps, setSlippageBps] = useState("");
  const [minInterval, setMinInterval] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if connected account owns AdminCap
  const { data: adminCapId } = useQuery({
    queryKey: ["admin-cap", network, account?.address],
    queryFn: async () => {
      if (!account) return null;

      // First get the expected AdminCap ID from GlobalConfig
      const configObj = await client.getObject({
        id: contracts.globalConfig,
        options: { showContent: true },
      });

      if (
        !configObj.data?.content ||
        configObj.data.content.dataType !== "moveObject"
      ) {
        return null;
      }

      const expectedAdminId = (configObj.data.content as any).fields.admin;

      // Query user's owned objects to find AdminCap
      const ownedObjects = await client.getOwnedObjects({
        owner: account.address,
        filter: {
          StructType: `${contracts.packageId}::config::AdminCap`,
        },
        options: { showContent: true },
      });

      // Check if any of the user's AdminCaps match the expected one
      const matchingCap = ownedObjects.data.find(
        (obj) => obj.data?.objectId === expectedAdminId,
      );

      return matchingCap?.data?.objectId || null;
    },
    enabled: !!account,
  });

  const isAdmin = !!adminCapId;

  // Fetch current config
  const { data: config, refetch: refetchConfig } = useQuery({
    queryKey: ["global-config", network],
    queryFn: async () => {
      const obj = await client.getObject({
        id: contracts.globalConfig,
        options: { showContent: true },
      });

      if (!obj.data?.content || obj.data.content.dataType !== "moveObject") {
        return null;
      }

      const fields = (obj.data.content as any).fields;
      return {
        feeBps: parseInt(fields.fee_bps),
        executorReward: BigInt(fields.executor_reward_per_trade),
        maxOrders: parseInt(fields.max_orders_per_account),
        minFunding: BigInt(fields.min_funding_per_trade),
        defaultSlippage: parseInt(fields.default_slippage_bps),
        maxSlippage: parseInt(fields.max_slippage_bps),
        minInterval: parseInt(fields.min_interval_seconds),
        treasury: fields.treasury,
        paused: fields.paused,
        whitelistEnabled: fields.executor_whitelist_enabled,
        version: parseInt(fields.version),
      };
    },
  });

  // Fetch fee tracker balance
  const { data: feeTracker, refetch: refetchFeeTracker } = useQuery({
    queryKey: ["fee-tracker", network],
    queryFn: async () => {
      const obj = await client.getObject({
        id: contracts.feeTracker,
        options: { showContent: true },
      });

      if (!obj.data?.content || obj.data.content.dataType !== "moveObject") {
        return null;
      }

      const fields = (obj.data.content as any).fields;
      return {
        totalCollected: BigInt(fields.total_sui_collected),
        balance: BigInt(fields.sui_balance),
      };
    },
  });

  // Fetch terms registry
  const { data: terms } = useQuery({
    queryKey: ["terms-registry", network],
    queryFn: async () => {
      const obj = await client.getObject({
        id: contracts.termsRegistry,
        options: { showContent: true },
      });

      if (!obj.data?.content || obj.data.content.dataType !== "moveObject") {
        return null;
      }

      const fields = (obj.data.content as any).fields;
      return {
        currentVersion: parseInt(fields.version),
        minAcceptedVersion: parseInt(fields.min_accepted_version),
        blobId: fields.current_blob_id,
      };
    },
  });

  const executeAdminAction = (
    buildTx: (tx: Transaction) => void,
    successMsg: string,
  ) => {
    if (!adminCapId) return;

    setError(null);
    setSuccess(null);
    const tx = new Transaction();
    buildTx(tx);

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: () => {
          setSuccess(successMsg);
          refetchConfig();
          refetchFeeTracker();
        },
        onError: (err) => setError(err.message),
      },
    );
  };

  const handleSetFeeBps = () => {
    executeAdminAction((tx) => {
      tx.moveCall({
        target: `${contracts.packageId}::config::set_fee_bps`,
        arguments: [
          tx.object(contracts.globalConfig),
          tx.object(adminCapId!),
          tx.pure.u64(BigInt(feeBps)),
        ],
      });
    }, `Fee updated to ${feeBps} bps`);
    setFeeBps("");
  };

  const handleSetExecutorReward = () => {
    const rewardMist = BigInt(Math.floor(parseFloat(executorReward) * 1e9));
    executeAdminAction((tx) => {
      tx.moveCall({
        target: `${contracts.packageId}::config::set_executor_reward_per_trade`,
        arguments: [
          tx.object(contracts.globalConfig),
          tx.object(adminCapId!),
          tx.pure.u64(rewardMist),
        ],
      });
    }, `Executor reward updated to ${executorReward} SUI`);
    setExecutorReward("");
  };

  const handleSetSlippage = () => {
    executeAdminAction((tx) => {
      tx.moveCall({
        target: `${contracts.packageId}::config::set_default_slippage_bps`,
        arguments: [
          tx.object(contracts.globalConfig),
          tx.object(adminCapId!),
          tx.pure.u64(BigInt(slippageBps)),
        ],
      });
    }, `Default slippage updated to ${slippageBps} bps`);
    setSlippageBps("");
  };

  const handleSetMinInterval = () => {
    executeAdminAction((tx) => {
      tx.moveCall({
        target: `${contracts.packageId}::config::set_min_interval_seconds`,
        arguments: [
          tx.object(contracts.globalConfig),
          tx.object(adminCapId!),
          tx.pure.u64(BigInt(minInterval)),
        ],
      });
    }, `Min interval updated to ${minInterval} seconds`);
    setMinInterval("");
  };

  const handleTogglePause = () => {
    executeAdminAction(
      (tx) => {
        tx.moveCall({
          target: `${contracts.packageId}::config::set_paused`,
          arguments: [
            tx.object(contracts.globalConfig),
            tx.object(adminCapId!),
            tx.pure.bool(!config?.paused),
          ],
        });
      },
      config?.paused ? "Protocol unpaused" : "Protocol paused",
    );
  };

  const handleToggleWhitelist = () => {
    executeAdminAction(
      (tx) => {
        tx.moveCall({
          target: `${contracts.packageId}::config::set_whitelist_enabled`,
          arguments: [
            tx.object(contracts.globalConfig),
            tx.object(adminCapId!),
            tx.pure.bool(!config?.whitelistEnabled),
          ],
        });
      },
      config?.whitelistEnabled ? "Whitelist disabled" : "Whitelist enabled",
    );
  };

  const handleWithdrawFees = () => {
    executeAdminAction((tx) => {
      tx.moveCall({
        target: `${contracts.packageId}::config::withdraw_sui`,
        arguments: [tx.object(contracts.feeTracker), tx.object(adminCapId!)],
      });
    }, "Fees withdrawn successfully");
  };

  return (
    <div className="space-y-6">
      {/* Executor Status */}
      <ExecutorStatus />
      {/* Admin Status Banner - only show when admin */}
      {isAdmin && (
        <div className="flex items-center gap-3 rounded-lg border border-status-success/20 bg-status-success-bg p-4">
          <Shield className="w-5 h-5 text-status-success" />
          <div>
            <p className="font-medium text-status-success">
              Admin Access Granted
            </p>
            <p className="text-sm text-foreground-secondary">
              You own the AdminCap and can modify protocol settings
            </p>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="rounded-lg border border-status-error/20 bg-status-error-bg p-3 text-sm text-status-error">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-status-success/20 bg-status-success-bg p-3 text-sm text-status-success">
          {success}
        </div>
      )}

      {/* Protocol Status */}
      <Card>
        <CardHeader>
          <CardTitle>Protocol Status</CardTitle>
          <CardDescription>Current configuration</CardDescription>
        </CardHeader>
        <CardContent>
          {config ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-sm">
              <div>
                <p className="text-foreground-tertiary mb-1">Status</p>
                <Badge variant={config.paused ? "error" : "success"}>
                  {config.paused ? "Paused" : "Active"}
                </Badge>
              </div>
              <div>
                <p className="text-foreground-tertiary mb-1">Version</p>
                <p className="font-mono">{config.version}</p>
              </div>
              <div>
                <p className="text-foreground-tertiary mb-1">Fee</p>
                <p className="font-mono">
                  {config.feeBps} bps ({(config.feeBps / 100).toFixed(2)}%)
                </p>
              </div>
              <div>
                <p className="text-foreground-tertiary mb-1">Executor Reward</p>
                <p className="font-mono">
                  {Number(config.executorReward) / 1e9} SUI
                </p>
              </div>
              <div>
                <p className="text-foreground-tertiary mb-1">
                  Default Slippage
                </p>
                <p className="font-mono">
                  {config.defaultSlippage} bps (
                  {(config.defaultSlippage / 100).toFixed(1)}%)
                </p>
              </div>
              <div>
                <p className="text-foreground-tertiary mb-1">Max Slippage</p>
                <p className="font-mono">
                  {config.maxSlippage} bps (
                  {(config.maxSlippage / 100).toFixed(0)}%)
                </p>
              </div>
              <div>
                <p className="text-foreground-tertiary mb-1">Min Interval</p>
                <p className="font-mono">
                  {config.minInterval}s ({Math.floor(config.minInterval / 60)}{" "}
                  min)
                </p>
              </div>
              <div>
                <p className="text-foreground-tertiary mb-1">Max Orders</p>
                <p className="font-mono">{config.maxOrders.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-foreground-tertiary mb-1">Whitelist</p>
                <Badge
                  variant={config.whitelistEnabled ? "warning" : "secondary"}
                >
                  {config.whitelistEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="col-span-2 md:col-span-3">
                <p className="text-foreground-tertiary mb-1">Treasury</p>
                <a
                  href={explorerObjectUrl(config.treasury)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs break-all text-accent hover:underline inline-flex items-center gap-1"
                >
                  {config.treasury}
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              </div>
            </div>
          ) : (
            <p className="text-foreground-muted">Loading...</p>
          )}
        </CardContent>
      </Card>

      {/* Protocol Controls (Admin Only) */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Protocol Controls</CardTitle>
            <CardDescription>Emergency controls</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button
              variant={config?.paused ? "default" : "destructive"}
              onClick={handleTogglePause}
              disabled={isPending}
            >
              {config?.paused ? "Unpause Protocol" : "Pause Protocol"}
            </Button>
            <Button
              variant="secondary"
              onClick={handleToggleWhitelist}
              disabled={isPending}
            >
              {config?.whitelistEnabled
                ? "Disable Whitelist"
                : "Enable Whitelist"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Fee Tracker */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Tracker</CardTitle>
          <CardDescription>Accumulated executor reward surplus</CardDescription>
        </CardHeader>
        <CardContent>
          {feeTracker ? (
            <div className="flex items-center justify-between">
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="text-foreground-tertiary mb-1">
                    Current Balance
                  </p>
                  <p className="font-mono text-lg">
                    {(Number(feeTracker.balance) / 1e9).toFixed(4)} SUI
                  </p>
                </div>
                <div>
                  <p className="text-foreground-tertiary mb-1">
                    Total Collected
                  </p>
                  <p className="font-mono text-lg">
                    {(Number(feeTracker.totalCollected) / 1e9).toFixed(4)} SUI
                  </p>
                </div>
              </div>
              {isAdmin && (
                <Button
                  onClick={handleWithdrawFees}
                  disabled={isPending || feeTracker.balance === 0n}
                >
                  Withdraw Fees
                </Button>
              )}
            </div>
          ) : (
            <p className="text-foreground-muted">Loading...</p>
          )}
        </CardContent>
      </Card>

      {/* Update Settings (Admin Only) */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Update Settings</CardTitle>
            <CardDescription>Modify protocol parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fee (basis points)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={feeBps}
                    onChange={(e) => setFeeBps(e.target.value)}
                    placeholder={config?.feeBps.toString()}
                    className="font-mono"
                  />
                  <Button
                    onClick={handleSetFeeBps}
                    disabled={isPending || !feeBps}
                  >
                    Set
                  </Button>
                </div>
                <p className="text-xs text-foreground-muted">
                  Max: 500 bps (5%)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Executor Reward (SUI)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.001"
                    value={executorReward}
                    onChange={(e) => setExecutorReward(e.target.value)}
                    placeholder={(
                      Number(config?.executorReward || 0) / 1e9
                    ).toString()}
                    className="font-mono"
                  />
                  <Button
                    onClick={handleSetExecutorReward}
                    disabled={isPending || !executorReward}
                  >
                    Set
                  </Button>
                </div>
                <p className="text-xs text-foreground-muted">
                  Range: 0.01 - 0.1 SUI
                </p>
              </div>

              <div className="space-y-2">
                <Label>Default Slippage (basis points)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={slippageBps}
                    onChange={(e) => setSlippageBps(e.target.value)}
                    placeholder={config?.defaultSlippage.toString()}
                    className="font-mono"
                  />
                  <Button
                    onClick={handleSetSlippage}
                    disabled={isPending || !slippageBps}
                  >
                    Set
                  </Button>
                </div>
                <p className="text-xs text-foreground-muted">
                  Must be ≤ max slippage ({config?.maxSlippage} bps)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Min Interval (seconds)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={minInterval}
                    onChange={(e) => setMinInterval(e.target.value)}
                    placeholder={config?.minInterval.toString()}
                    className="font-mono"
                  />
                  <Button
                    onClick={handleSetMinInterval}
                    disabled={isPending || !minInterval}
                  >
                    Set
                  </Button>
                </div>
                <p className="text-xs text-foreground-muted">
                  Min: 60s (1 min), Max: 31,536,000s (1 year)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Terms Registry */}
      <Card>
        <CardHeader>
          <CardTitle>Terms Registry</CardTitle>
          <CardDescription>Protocol terms versioning</CardDescription>
        </CardHeader>
        <CardContent>
          {terms ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-sm">
                <div>
                  <p className="text-foreground-tertiary mb-1">Current Version</p>
                  <p className="font-mono">{terms.currentVersion}</p>
                </div>
                <div>
                  <p className="text-foreground-tertiary mb-1">Min Accepted</p>
                  <p className="font-mono">{terms.minAcceptedVersion}</p>
                </div>
                <div>
                  <p className="text-foreground-tertiary mb-1">Walrus Blob ID</p>
                  <a
                    href={walrusUrl(Array.isArray(terms.blobId) ? blobIdToString(terms.blobId) : terms.blobId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs truncate text-accent hover:underline inline-flex items-center gap-1"
                  >
                    {Array.isArray(terms.blobId) ? blobIdToString(terms.blobId) : terms.blobId}
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-foreground-muted">Loading...</p>
          )}
        </CardContent>
      </Card>

      {/* Contract Addresses */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Addresses</CardTitle>
          <CardDescription>Deployed object IDs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-foreground-tertiary mb-1">Package</p>
              <a
                href={explorerObjectUrl(contracts.packageId)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs break-all text-accent hover:underline inline-flex items-center gap-1"
              >
                {contracts.packageId}
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </div>
            <div>
              <p className="text-foreground-tertiary mb-1">Global Config</p>
              <a
                href={explorerObjectUrl(contracts.globalConfig)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs break-all text-accent hover:underline inline-flex items-center gap-1"
              >
                {contracts.globalConfig}
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </div>
            <div>
              <p className="text-foreground-tertiary mb-1">Fee Tracker</p>
              <a
                href={explorerObjectUrl(contracts.feeTracker)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs break-all text-accent hover:underline inline-flex items-center gap-1"
              >
                {contracts.feeTracker}
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </div>
            <div>
              <p className="text-foreground-tertiary mb-1">
                Price Feed Registry
              </p>
              <a
                href={explorerObjectUrl(contracts.priceFeedRegistry)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs break-all text-accent hover:underline inline-flex items-center gap-1"
              >
                {contracts.priceFeedRegistry}
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </div>
            <div>
              <p className="text-foreground-tertiary mb-1">Terms Registry</p>
              <a
                href={explorerObjectUrl(contracts.termsRegistry)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs break-all text-accent hover:underline inline-flex items-center gap-1"
              >
                {contracts.termsRegistry}
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </div>
            {isAdmin && adminCapId && (
              <div>
                <p className="text-foreground-tertiary mb-1">
                  Admin Cap (yours)
                </p>
                <a
                  href={explorerObjectUrl(adminCapId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs break-all text-accent hover:underline inline-flex items-center gap-1"
                >
                  {adminCapId}
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
