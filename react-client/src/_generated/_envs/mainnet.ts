import type { EnvConfig } from "../_framework/env";

export const mainnetEnv: EnvConfig = {
  packages: {
    dca: {
      originalId:
        "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
      publishedAt:
        "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
      typeOrigins: {
        "config::AdminCap":
          "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
        "config::ConfigCreatedEvent":
          "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
        "config::ConfigSnapshot":
          "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
        "config::ConfigUpdatedEvent":
          "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
        "config::ExecutorAddedEvent":
          "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
        "config::ExecutorRemovedEvent":
          "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
        "config::ExecutorWhitelistUpdatedEvent":
          "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
        "config::FeeTracker":
          "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
        "config::FeesWithdrawnEvent":
          "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
        "config::GlobalConfig":
          "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
        "config::PriceFeed":
          "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
        "config::PriceFeedRegisteredEvent":
          "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
        "config::PriceFeedRegistry":
          "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
        "config::PriceFeedRegistryCreatedEvent":
          "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
        "config::PriceFeedRemovedEvent":
          "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
        "config::ProtocolPausedEvent":
          "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
        "config::TreasuryUpdatedEvent":
          "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
        "dca::DCA":
          "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
        "dca::DCACreatedEvent":
          "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
        "dca::DCADeactivatedEvent":
          "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
        "dca::DelegateeUpdatedEvent":
          "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
        "dca::Price":
          "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
        "dca::SlippageUpdatedEvent":
          "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
        "dca::TradeCompletedEvent":
          "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
        "dca::TradeInitiatedEvent":
          "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
        "dca::TradeParams":
          "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
        "dca::TradePromise":
          "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
        "terms::MinVersionUpdatedEvent":
          "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
        "terms::TermsRegistry":
          "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
        "terms::TermsRegistryCreatedEvent":
          "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
        "terms::TermsUpdatedEvent":
          "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
        "terms::TermsVersion":
          "0x19852a2e3d8caf1fbc7452d5290d6f71b3df573b7ab3252183756491c45047b4",
      },
    },
  },
  dependencies: {
    std: {
      originalId: "0x1",
      publishedAt: "0x1",
      typeOrigins: {
        "ascii::Char": "0x1",
        "ascii::String": "0x1",
        "bit_vector::BitVector": "0x1",
        "fixed_point32::FixedPoint32": "0x1",
        "internal::Permit": "0x1",
        "option::Option": "0x1",
        "string::String": "0x1",
        "type_name::TypeName": "0x1",
        "uq32_32::UQ32_32": "0x1",
        "uq64_64::UQ64_64": "0x1",
      },
    },
    sui: {
      originalId: "0x2",
      publishedAt: "0x2",
      typeOrigins: {
        "accumulator::AccumulatorRoot": "0x2",
        "accumulator::Key": "0x2",
        "accumulator::U128": "0x2",
        "accumulator_metadata::AccumulatorObjectCountKey": "0x2",
        "accumulator_metadata::Metadata": "0x2",
        "accumulator_metadata::MetadataKey": "0x2",
        "accumulator_metadata::Owner": "0x2",
        "accumulator_metadata::OwnerKey": "0x2",
        "accumulator_settlement::EventStreamHead": "0x2",
        "address_alias::AddressAliasState": "0x2",
        "address_alias::AddressAliases": "0x2",
        "address_alias::AliasKey": "0x2",
        "authenticator_state::ActiveJwk": "0x2",
        "authenticator_state::AuthenticatorState": "0x2",
        "authenticator_state::AuthenticatorStateInner": "0x2",
        "authenticator_state::JWK": "0x2",
        "authenticator_state::JwkId": "0x2",
        "bag::Bag": "0x2",
        "balance::Balance": "0x2",
        "balance::Supply": "0x2",
        "bcs::BCS": "0x2",
        "bls12381::G1": "0x2",
        "bls12381::G2": "0x2",
        "bls12381::GT": "0x2",
        "bls12381::Scalar": "0x2",
        "bls12381::UncompressedG1": "0x2",
        "borrow::Borrow": "0x2",
        "borrow::Referent": "0x2",
        "clock::Clock": "0x2",
        "coin::Coin": "0x2",
        "coin::CoinMetadata": "0x2",
        "coin::CurrencyCreated": "0x2",
        "coin::DenyCap": "0x2",
        "coin::DenyCapV2": "0x2",
        "coin::RegulatedCoinMetadata": "0x2",
        "coin::TreasuryCap": "0x2",
        "coin_registry::Borrow": "0x2",
        "coin_registry::CoinRegistry": "0x2",
        "coin_registry::Currency": "0x2",
        "coin_registry::CurrencyInitializer": "0x2",
        "coin_registry::CurrencyKey": "0x2",
        "coin_registry::ExtraField": "0x2",
        "coin_registry::LegacyMetadataKey": "0x2",
        "coin_registry::MetadataCap": "0x2",
        "coin_registry::MetadataCapState": "0x2",
        "coin_registry::RegulatedState": "0x2",
        "coin_registry::SupplyState": "0x2",
        "config::Config": "0x2",
        "config::Setting": "0x2",
        "config::SettingData": "0x2",
        "deny_list::AddressKey": "0x2",
        "deny_list::ConfigKey": "0x2",
        "deny_list::ConfigWriteCap": "0x2",
        "deny_list::DenyList": "0x2",
        "deny_list::GlobalPauseKey": "0x2",
        "deny_list::PerTypeConfigCreated": "0x2",
        "deny_list::PerTypeList": "0x2",
        "derived_object::Claimed": "0x2",
        "derived_object::ClaimedStatus": "0x2",
        "derived_object::DerivedObjectKey": "0x2",
        "display::Display": "0x2",
        "display::DisplayCreated": "0x2",
        "display::VersionUpdated": "0x2",
        "dynamic_field::Field": "0x2",
        "dynamic_object_field::Wrapper": "0x2",
        "funds_accumulator::Withdrawal": "0x2",
        "groth16::Curve": "0x2",
        "groth16::PreparedVerifyingKey": "0x2",
        "groth16::ProofPoints": "0x2",
        "groth16::PublicProofInputs": "0x2",
        "group_ops::Element": "0x2",
        "kiosk::Borrow": "0x2",
        "kiosk::Item": "0x2",
        "kiosk::ItemDelisted": "0x2",
        "kiosk::ItemListed": "0x2",
        "kiosk::ItemPurchased": "0x2",
        "kiosk::Kiosk": "0x2",
        "kiosk::KioskOwnerCap": "0x2",
        "kiosk::Listing": "0x2",
        "kiosk::Lock": "0x2",
        "kiosk::PurchaseCap": "0x2",
        "kiosk_extension::Extension": "0x2",
        "kiosk_extension::ExtensionKey": "0x2",
        "linked_table::LinkedTable": "0x2",
        "linked_table::Node": "0x2",
        "nitro_attestation::NitroAttestationDocument": "0x2",
        "nitro_attestation::PCREntry": "0x2",
        "object::ID": "0x2",
        "object::UID": "0x2",
        "object_bag::ObjectBag": "0x2",
        "object_table::ObjectTable": "0x2",
        "package::Publisher": "0x2",
        "package::UpgradeCap": "0x2",
        "package::UpgradeReceipt": "0x2",
        "package::UpgradeTicket": "0x2",
        "party::Party": "0x2",
        "party::Permissions": "0x2",
        "priority_queue::Entry": "0x2",
        "priority_queue::PriorityQueue": "0x2",
        "random::Random": "0x2",
        "random::RandomGenerator": "0x2",
        "random::RandomInner": "0x2",
        "sui::SUI": "0x2",
        "table::Table": "0x2",
        "table_vec::TableVec": "0x2",
        "token::ActionRequest": "0x2",
        "token::RuleKey": "0x2",
        "token::Token": "0x2",
        "token::TokenPolicy": "0x2",
        "token::TokenPolicyCap": "0x2",
        "token::TokenPolicyCreated": "0x2",
        "transfer::Receiving": "0x2",
        "transfer_policy::RuleKey": "0x2",
        "transfer_policy::TransferPolicy": "0x2",
        "transfer_policy::TransferPolicyCap": "0x2",
        "transfer_policy::TransferPolicyCreated": "0x2",
        "transfer_policy::TransferPolicyDestroyed": "0x2",
        "transfer_policy::TransferRequest": "0x2",
        "tx_context::TxContext": "0x2",
        "url::Url": "0x2",
        "vec_map::Entry": "0x2",
        "vec_map::VecMap": "0x2",
        "vec_set::VecSet": "0x2",
        "versioned::VersionChangeCap": "0x2",
        "versioned::Versioned": "0x2",
        "zklogin_verified_id::VerifiedID": "0x2",
        "zklogin_verified_issuer::VerifiedIssuer": "0x2",
      },
    },
    wormhole: {
      originalId:
        "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
      publishedAt:
        "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
      typeOrigins: {
        "bytes20::Bytes20":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "bytes32::Bytes32":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "consumed_vaas::ConsumedVAAs":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "cursor::Cursor":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "emitter::EmitterCap":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "emitter::EmitterCreated":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "emitter::EmitterDestroyed":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "external_address::ExternalAddress":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "fee_collector::FeeCollector":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "governance_message::DecreeReceipt":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "governance_message::DecreeTicket":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "guardian::Guardian":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "guardian_set::GuardianSet":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "guardian_signature::GuardianSignature":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "migrate::MigrateComplete":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "package_utils::CurrentPackage":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "package_utils::CurrentVersion":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "package_utils::PackageInfo":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "package_utils::PendingPackage":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "publish_message::MessageTicket":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "publish_message::WormholeMessage":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "set::Empty":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "set::Set":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "set_fee::GovernanceWitness":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "set_fee::SetFee":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "setup::DeployerCap":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "state::LatestOnly":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "state::State":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "transfer_fee::GovernanceWitness":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "transfer_fee::TransferFee":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "update_guardian_set::GovernanceWitness":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "update_guardian_set::GuardianSetAdded":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "update_guardian_set::UpdateGuardianSet":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "upgrade_contract::ContractUpgraded":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "upgrade_contract::GovernanceWitness":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "upgrade_contract::UpgradeContract":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "vaa::VAA":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "version_control::V__0_2_0":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
        "version_control::V__DUMMY":
          "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a",
      },
    },
    pyth: {
      originalId:
        "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
      publishedAt:
        "0x4e20ddf36af412a4096f9014f4a565af9e812db9a05cc40254846cf6ed0ad91",
      typeOrigins: {
        "batch_price_attestation::BatchPriceAttestation":
          "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
        "batch_price_attestation::Header":
          "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
        "contract_upgrade::ContractUpgraded":
          "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
        "contract_upgrade::UpgradeContract":
          "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
        "data_source::DataSource":
          "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
        "event::PriceFeedUpdateEvent":
          "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
        "event::PythInitializationEvent":
          "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
        "governance::WormholeVAAVerificationReceipt":
          "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
        "governance_action::GovernanceAction":
          "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
        "governance_instruction::GovernanceInstruction":
          "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
        "hot_potato_vector::HotPotatoVector":
          "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
        "i64::I64":
          "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
        "migrate::MigrateComplete":
          "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
        "price::Price":
          "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
        "price_feed::PriceFeed":
          "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
        "price_identifier::PriceIdentifier":
          "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
        "price_info::PriceInfo":
          "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
        "price_info::PriceInfoObject":
          "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
        "price_status::PriceStatus":
          "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
        "set::Set":
          "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
        "set::Unit":
          "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
        "set_data_sources::DataSources":
          "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
        "set_fee_recipient::PythFeeRecipient":
          "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
        "set_governance_data_source::GovernanceDataSource":
          "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
        "set_stale_price_threshold::StalePriceThreshold":
          "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
        "set_update_fee::UpdateFee":
          "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
        "setup::DeployerCap":
          "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
        "state::CurrentDigest":
          "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
        "state::LatestOnly":
          "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
        "state::State":
          "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
        "version_control::V__0_1_1":
          "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
        "version_control::V__0_1_2":
          "0x4e20ddf36af412a4096f9014f4a565af9e812db9a05cc40254846cf6ed0ad91",
        "version_control::V__DUMMY":
          "0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e",
      },
    },
    "flowx-amm": {
      originalId:
        "0xba153169476e8c3114962261d1edc70de5ad9781b83cc617ecc8c1923191cae0",
      publishedAt:
        "0xba153169476e8c3114962261d1edc70de5ad9781b83cc617ecc8c1923191cae0",
      typeOrigins: {
        "comparator::Result":
          "0xba153169476e8c3114962261d1edc70de5ad9781b83cc617ecc8c1923191cae0",
        "factory::AdminCap":
          "0xba153169476e8c3114962261d1edc70de5ad9781b83cc617ecc8c1923191cae0",
        "factory::Container":
          "0xba153169476e8c3114962261d1edc70de5ad9781b83cc617ecc8c1923191cae0",
        "factory::FeeChanged":
          "0xba153169476e8c3114962261d1edc70de5ad9781b83cc617ecc8c1923191cae0",
        "factory::PairCreated":
          "0xba153169476e8c3114962261d1edc70de5ad9781b83cc617ecc8c1923191cae0",
        "pair::LP":
          "0xba153169476e8c3114962261d1edc70de5ad9781b83cc617ecc8c1923191cae0",
        "pair::LiquidityAdded":
          "0xba153169476e8c3114962261d1edc70de5ad9781b83cc617ecc8c1923191cae0",
        "pair::LiquidityRemoved":
          "0xba153169476e8c3114962261d1edc70de5ad9781b83cc617ecc8c1923191cae0",
        "pair::PairMetadata":
          "0xba153169476e8c3114962261d1edc70de5ad9781b83cc617ecc8c1923191cae0",
        "pair::Swapped":
          "0xba153169476e8c3114962261d1edc70de5ad9781b83cc617ecc8c1923191cae0",
        "treasury::Treasury":
          "0xba153169476e8c3114962261d1edc70de5ad9781b83cc617ecc8c1923191cae0",
      },
    },
  },
};
