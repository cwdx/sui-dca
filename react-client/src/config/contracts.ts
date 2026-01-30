/**
 * DCA Contract Configuration
 */

export const CONTRACTS = {
  mainnet: {
    packageId:
      import.meta.env.VITE_DCA_PACKAGE_ID ||
      "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
    globalConfig:
      import.meta.env.VITE_GLOBAL_CONFIG_ID ||
      "0xe9f6adaea71cee4a1d4a3e48e7a42be8d2aa66f1f21e02ffa38e447d6bf3c13a",
    feeTracker:
      import.meta.env.VITE_FEE_TRACKER_ID ||
      "0x5a840524e2c1cad27da155c6cdeff4652b76bcef1c7aad6f1ce51710e8397057",
    priceFeedRegistry:
      import.meta.env.VITE_PRICE_FEED_REGISTRY_ID ||
      "0xdb8054678f011b6a9d5dbe72b92817bfa904c00729b9c64cc0158ebc2c27d0e0",
    termsRegistry:
      import.meta.env.VITE_TERMS_REGISTRY_ID ||
      "0xb419b1189f3cf29808c20bc5660f228362b8af0044e707258d4a687fc9285c6a",
    clock: "0x0000000000000000000000000000000000000000000000000000000000000006",
  },
  testnet: {
    packageId: "",
    globalConfig: "",
    feeTracker: "",
    priceFeedRegistry: "",
    termsRegistry: "",
    clock: "0x0000000000000000000000000000000000000000000000000000000000000006",
  },
} as const;

export type Network = keyof typeof CONTRACTS;

export function getContracts(network: Network = "mainnet") {
  return CONTRACTS[network];
}
