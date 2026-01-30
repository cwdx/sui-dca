import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ExternalLink, FileText, Shield } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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

  if (!account) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-foreground-secondary">
            Connect wallet to view protocol status
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Status Banner */}
      {isAdmin ? (
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
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-background-secondary p-4">
          <AlertTriangle className="w-5 h-5 text-foreground-tertiary" />
          <div>
            <p className="font-medium text-foreground-secondary">
              Read-Only Mode
            </p>
            <p className="text-sm text-foreground-muted">
              Connect with the admin wallet to modify settings
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
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
              <div className="grid grid-cols-3 gap-6 text-sm">
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
