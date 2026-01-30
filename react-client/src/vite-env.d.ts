/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DCA_PACKAGE_ID: string;
  readonly VITE_GLOBAL_CONFIG_ID: string;
  readonly VITE_FEE_TRACKER_ID: string;
  readonly VITE_PRICE_FEED_REGISTRY_ID: string;
  readonly VITE_TERMS_REGISTRY_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
