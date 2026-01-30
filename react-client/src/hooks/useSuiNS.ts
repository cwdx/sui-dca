import { useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";

/**
 * Hook to resolve a Sui address to its SuiNS name (if any)
 */
export function useSuiNSName(address: string | undefined) {
  const client = useSuiClient();

  return useQuery({
    queryKey: ["suins-name", address],
    queryFn: async (): Promise<string | null> => {
      if (!address) return null;

      try {
        // Use the built-in resolveNameServiceNames method
        const result = await client.resolveNameServiceNames({
          address,
        });

        // Return the first (primary) name if available
        return result.data?.[0] || null;
      } catch (error) {
        console.error("Failed to resolve SuiNS name:", error);
        return null;
      }
    },
    enabled: !!address,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });
}

/**
 * Hook to resolve a SuiNS name to an address
 */
export function useSuiNSAddress(name: string | undefined) {
  const client = useSuiClient();

  return useQuery({
    queryKey: ["suins-address", name],
    queryFn: async (): Promise<string | null> => {
      if (!name) return null;

      try {
        const result = await client.resolveNameServiceAddress({
          name,
        });

        return result || null;
      } catch (error) {
        console.error("Failed to resolve SuiNS address:", error);
        return null;
      }
    },
    enabled: !!name,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
