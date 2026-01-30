import {
  useAccounts,
  useCurrentAccount,
  useDisconnectWallet,
  useSuiClient,
  useSwitchAccount,
} from "@mysten/dapp-kit";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  LogOut,
  User,
} from "lucide-react";
import { useState } from "react";
import { useNetwork } from "@/contexts/NetworkContext";
import { cn } from "@/lib/utils";

export function AccountMenu() {
  const account = useCurrentAccount();
  const accounts = useAccounts();
  const { mutate: disconnect } = useDisconnectWallet();
  const { mutate: switchAccount } = useSwitchAccount();
  const client = useSuiClient();
  const { explorerAddressUrl } = useNetwork();
  const [copied, setCopied] = useState(false);

  // Fetch SUI balance
  const { data: balance } = useQuery({
    queryKey: ["sui-balance", account?.address],
    queryFn: async () => {
      if (!account) return null;
      const coins = await client.getBalance({
        owner: account.address,
        coinType: "0x2::sui::SUI",
      });
      return BigInt(coins.totalBalance);
    },
    enabled: !!account,
    refetchInterval: 30000,
  });

  if (!account) return null;

  const shortAddress = `${account.address.slice(0, 6)}...${account.address.slice(-4)}`;
  const formattedBalance = balance
    ? `${(Number(balance) / 1e9).toFixed(2)} SUI`
    : "...";

  const copyAddress = async () => {
    await navigator.clipboard.writeText(account.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openExplorer = () => {
    window.open(explorerAddressUrl(account.address), "_blank");
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 rounded-md border border-border bg-background-primary px-3 py-2",
            "text-sm text-foreground-primary hover:bg-background-secondary transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-accent/20",
          )}
        >
          <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
            <User className="w-3 h-3 text-foreground-inverse" />
          </div>
          <div className="text-left">
            <div className="font-mono text-xs">{shortAddress}</div>
            <div className="text-xs text-foreground-muted">
              {formattedBalance}
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-foreground-muted" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={cn(
            "z-50 min-w-[220px] rounded-md border border-border bg-background-primary p-1 shadow-lg",
            "animate-in fade-in-0 zoom-in-95",
          )}
          sideOffset={8}
          align="end"
        >
          {/* Account Info */}
          <div className="px-2 py-2 border-b border-border mb-1">
            <p className="text-xs text-foreground-tertiary">
              Connected Account
            </p>
            <p className="font-mono text-sm truncate">{account.address}</p>
            <p className="text-sm font-medium mt-1">{formattedBalance}</p>
          </div>

          {/* Switch Account (if multiple) */}
          {accounts.length > 1 && (
            <>
              <DropdownMenu.Label className="px-2 py-1 text-xs text-foreground-tertiary">
                Switch Account
              </DropdownMenu.Label>
              {accounts.map((acc) => (
                <DropdownMenu.Item
                  key={acc.address}
                  className={cn(
                    "flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none cursor-pointer",
                    acc.address === account.address
                      ? "bg-background-secondary"
                      : "hover:bg-background-tertiary",
                  )}
                  onClick={() => switchAccount({ account: acc })}
                >
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                    <User className="w-3 h-3" />
                  </div>
                  <span className="font-mono text-xs">
                    {acc.address.slice(0, 6)}...{acc.address.slice(-4)}
                  </span>
                  {acc.address === account.address && (
                    <Check className="w-3 h-3 ml-auto" />
                  )}
                </DropdownMenu.Item>
              ))}
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
            </>
          )}

          {/* Actions */}
          <DropdownMenu.Item
            className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none cursor-pointer hover:bg-background-tertiary"
            onClick={copyAddress}
          >
            {copied ? (
              <Check className="w-4 h-4 text-status-success" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copied ? "Copied!" : "Copy Address"}
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none cursor-pointer hover:bg-background-tertiary"
            onClick={openExplorer}
          >
            <ExternalLink className="w-4 h-4" />
            View on Explorer
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <DropdownMenu.Item
            className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none cursor-pointer hover:bg-background-tertiary text-status-error"
            onClick={() => disconnect()}
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
