import type { TokenInfo } from "@/config/tokens";
import { useTokenMetadata } from "@/hooks/useTokenMetadata";
import { cn } from "@/lib/utils";

interface TokenIconProps {
  token: TokenInfo;
  size?: "sm" | "md" | "lg";
  className?: string;
  showSymbol?: boolean;
}

const sizeClasses = {
  sm: "w-5 h-5",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

const textSizes = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export function TokenIcon({
  token,
  size = "md",
  className,
  showSymbol = false,
}: TokenIconProps) {
  const { data: metadata } = useTokenMetadata(token);

  const iconUrl = metadata?.iconUrl || token.iconUrl;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {iconUrl ? (
        <img
          src={iconUrl}
          alt={token.symbol}
          className={cn(sizeClasses[size], "rounded-full object-cover")}
          onError={(e) => {
            // Fallback to initials on error
            e.currentTarget.style.display = "none";
            e.currentTarget.nextElementSibling?.classList.remove("hidden");
          }}
        />
      ) : null}
      {/* Fallback initials */}
      <div
        className={cn(
          sizeClasses[size],
          "rounded-full bg-background-tertiary flex items-center justify-center text-foreground-secondary font-medium",
          textSizes[size],
          iconUrl ? "hidden" : "",
        )}
      >
        {token.symbol.slice(0, 2)}
      </div>
      {showSymbol && (
        <span className={cn("font-medium", textSizes[size])}>
          {token.symbol}
        </span>
      )}
    </div>
  );
}

interface TokenSelectDisplayProps {
  token: TokenInfo;
  price?: number | null;
  className?: string;
}

export function TokenSelectDisplay({
  token,
  price,
  className,
}: TokenSelectDisplayProps) {
  const { data: metadata } = useTokenMetadata(token);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <TokenIcon token={token} size="md" />
      <div className="flex flex-col">
        <span className="font-medium text-foreground-primary">
          {token.symbol}
        </span>
        <span className="text-xs text-foreground-muted">
          {metadata?.name || token.name}
          {price != null && (
            <span className="ml-1">
              · ${price < 0.01 ? price.toExponential(2) : price.toFixed(2)}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
