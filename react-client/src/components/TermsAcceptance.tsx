import { useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, FileText, Loader2, ScrollText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { useNetwork } from "@/contexts/NetworkContext";

// Walrus aggregator URLs by network
const WALRUS_AGGREGATORS: Record<string, string> = {
  mainnet: "https://aggregator.walrus-mainnet.walrus.space/v1/blobs",
  testnet: "https://aggregator.walrus-testnet.walrus.space/v1/blobs",
};

// Convert on-chain blob_id (number array) to base64 string for Walrus URL
function blobIdToString(blobId: number[]): string {
  const bytes = new Uint8Array(blobId);
  const base64 = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return base64;
}

interface TermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
}

export function TermsDialog({
  open,
  onOpenChange,
  onAccept,
}: TermsDialogProps) {
  const client = useSuiClient();
  const { contracts, network } = useNetwork();
  const walrusAggregator =
    WALRUS_AGGREGATORS[network] || WALRUS_AGGREGATORS.mainnet;

  // Fetch terms registry
  const { data: termsInfo } = useQuery({
    queryKey: ["terms-registry-info", network, contracts.termsRegistry],
    queryFn: async () => {
      const obj = await client.getObject({
        id: contracts.termsRegistry,
        options: { showContent: true },
      });

      if (!obj.data?.content || obj.data.content.dataType !== "moveObject") {
        throw new Error("Failed to fetch terms registry");
      }

      const fields = (obj.data.content as any).fields;
      return {
        version: parseInt(fields.version),
        blobId: fields.current_blob_id as number[],
      };
    },
    staleTime: 60000,
  });

  // Fetch terms content from Walrus
  const { data: termsContent, isLoading: isLoadingContent } = useQuery({
    queryKey: ["terms-content", termsInfo?.blobId],
    queryFn: async () => {
      if (!termsInfo?.blobId) throw new Error("No blob ID");

      const blobIdStr = blobIdToString(termsInfo.blobId);
      const url = `${walrusAggregator}/${blobIdStr}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch terms: ${response.status}`);
      }

      return response.text();
    },
    enabled: !!termsInfo?.blobId && open,
    staleTime: 300000,
    retry: 2,
  });

  const walrusUrl = termsInfo?.blobId
    ? `${walrusAggregator}/${blobIdToString(termsInfo.blobId)}`
    : null;

  const handleAccept = () => {
    onAccept();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-background-secondary flex items-center justify-center">
              <ScrollText className="w-5 h-5 text-foreground-secondary" />
            </div>
            <div>
              <DialogTitle>Terms & Conditions</DialogTitle>
              {termsInfo && (
                <p className="text-xs text-foreground-muted mt-0.5">
                  Version {termsInfo.version}
                </p>
              )}
            </div>
          </div>
          <DialogClose />
        </DialogHeader>

        <DialogBody className="max-h-[60vh] overflow-y-auto">
          {isLoadingContent ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-foreground-muted" />
            </div>
          ) : termsContent ? (
            <article
              className="prose prose-sm prose-neutral max-w-none
              prose-headings:prose-headings:text-foreground-primary prose-headings:font-medium
              prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
              prose-p:text-foreground-secondary prose-p:leading-relaxed
              prose-li:text-foreground-secondary prose-li:marker:text-foreground-muted
              prose-strong:text-foreground-primary prose-strong:font-medium
              prose-a:text-accent prose-a:no-underline hover:prose-a:underline
              prose-blockquote:border-l-accent prose-blockquote:text-foreground-tertiary
              prose-code:text-foreground-primary prose-code:bg-background-tertiary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
              prose-pre:bg-background-tertiary prose-pre:border prose-pre:border-border
              prose-hr:border-border
            "
            >
              <ReactMarkdown>{termsContent}</ReactMarkdown>
            </article>
          ) : (
            <div className="text-center py-12">
              <p className="text-foreground-muted">
                Unable to load terms content. Please try again.
              </p>
            </div>
          )}
        </DialogBody>

        <DialogFooter className="flex-col sm:flex-row gap-3">
          {walrusUrl && (
            <a
              href={walrusUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-foreground-muted hover:text-foreground-secondary flex items-center gap-1 mr-auto"
            >
              <FileText className="w-3 h-3" />
              View on Walrus
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAccept}
              disabled={isLoadingContent || !termsContent}
            >
              I Accept the Terms
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook to get current terms version
export function useTermsVersion() {
  const client = useSuiClient();
  const { contracts, network } = useNetwork();

  return useQuery({
    queryKey: ["terms-version", network, contracts.termsRegistry],
    queryFn: async () => {
      if (!contracts.termsRegistry) {
        throw new Error("Terms registry not configured for this network");
      }

      const obj = await client.getObject({
        id: contracts.termsRegistry,
        options: { showContent: true },
      });

      if (!obj.data?.content || obj.data.content.dataType !== "moveObject") {
        throw new Error("Failed to fetch terms registry");
      }

      const fields = (obj.data.content as any).fields;
      return {
        currentVersion: BigInt(fields.version),
        minAcceptedVersion: BigInt(fields.min_accepted_version),
        blobId: fields.current_blob_id as number[],
      };
    },
    enabled: !!contracts.termsRegistry,
    staleTime: 60000,
  });
}
