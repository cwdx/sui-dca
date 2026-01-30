import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { getContracts, type Network } from "@/config/contracts";

interface NetworkContextValue {
  network: Network;
  setNetwork: (network: Network) => void;
  contracts: ReturnType<typeof getContracts>;
  explorerUrl: string;
  explorerTxUrl: (digest: string) => string;
  explorerAddressUrl: (address: string) => string;
  explorerObjectUrl: (objectId: string) => string;
}

const EXPLORER_URLS: Record<Network, string> = {
  mainnet: "https://suiscan.xyz/mainnet",
  testnet: "https://suiscan.xyz/testnet",
};

const NetworkContext = createContext<NetworkContextValue | null>(null);

export function NetworkProvider({ children }: { children: ReactNode }) {
  // Default to mainnet, could be persisted in localStorage
  const [network, setNetworkState] = useState<Network>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("dca-network");
      if (stored === "mainnet" || stored === "testnet") {
        return stored;
      }
    }
    return "mainnet";
  });

  const setNetwork = useCallback((newNetwork: Network) => {
    setNetworkState(newNetwork);
    if (typeof window !== "undefined") {
      localStorage.setItem("dca-network", newNetwork);
    }
  }, []);

  const contracts = getContracts(network);
  const explorerUrl = EXPLORER_URLS[network];

  const explorerTxUrl = useCallback(
    (digest: string) => `${explorerUrl}/tx/${digest}`,
    [explorerUrl],
  );

  const explorerAddressUrl = useCallback(
    (address: string) => `${explorerUrl}/account/${address}`,
    [explorerUrl],
  );

  const explorerObjectUrl = useCallback(
    (objectId: string) => `${explorerUrl}/object/${objectId}`,
    [explorerUrl],
  );

  return (
    <NetworkContext.Provider
      value={{
        network,
        setNetwork,
        contracts,
        explorerUrl,
        explorerTxUrl,
        explorerAddressUrl,
        explorerObjectUrl,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
}
