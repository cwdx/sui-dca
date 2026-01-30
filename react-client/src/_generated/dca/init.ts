import type { StructClassLoader } from "../_framework/loader";
import * as config from "./config/structs";
import * as dca from "./dca/structs";
import * as terms from "./terms/structs";

export function registerClasses(loader: StructClassLoader): void {
  loader.register(config.AdminCap);
  loader.register(config.GlobalConfig);
  loader.register(config.FeeTracker);
  loader.register(config.PriceFeed);
  loader.register(config.PriceFeedRegistry);
  loader.register(config.ConfigSnapshot);
  loader.register(config.ConfigCreatedEvent);
  loader.register(config.ConfigUpdatedEvent);
  loader.register(config.TreasuryUpdatedEvent);
  loader.register(config.ProtocolPausedEvent);
  loader.register(config.FeesWithdrawnEvent);
  loader.register(config.PriceFeedRegistryCreatedEvent);
  loader.register(config.PriceFeedRegisteredEvent);
  loader.register(config.PriceFeedRemovedEvent);
  loader.register(config.ExecutorWhitelistUpdatedEvent);
  loader.register(config.ExecutorAddedEvent);
  loader.register(config.ExecutorRemovedEvent);
  loader.register(dca.TradePromise);
  loader.register(dca.Price);
  loader.register(dca.TradeParams);
  loader.register(dca.DCA);
  loader.register(dca.DCACreatedEvent);
  loader.register(dca.TradeInitiatedEvent);
  loader.register(dca.TradeCompletedEvent);
  loader.register(dca.DCADeactivatedEvent);
  loader.register(dca.DelegateeUpdatedEvent);
  loader.register(dca.SlippageUpdatedEvent);
  loader.register(terms.TermsVersion);
  loader.register(terms.TermsRegistry);
  loader.register(terms.TermsRegistryCreatedEvent);
  loader.register(terms.TermsUpdatedEvent);
  loader.register(terms.MinVersionUpdatedEvent);
}
