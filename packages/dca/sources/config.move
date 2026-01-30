/// @title Config Module
/// @notice Global configuration for the DCA protocol with admin-controlled upgradable settings.
/// @dev Existing DCA accounts snapshot config at creation time, so changes only affect new accounts.
#[allow(lint(public_entry))]
module dca::config {
    use std::ascii::String;
    use std::option::{Self, Option};
    use std::type_name;
    use std::vector;
    use sui::balance::{Self, Balance};
    use sui::coin;
    use sui::event;
    use sui::object::{Self, UID, ID};
    use sui::sui::SUI;
    use sui::table::{Self, Table};
    use sui::transfer;
    use sui::tx_context::{TxContext, sender};

    // === Constants ===
    const CONFIG_VERSION: u64 = 1;

    // === Error Codes ===
    const ENotAdmin: u64 = 0;
    const EInvalidFee: u64 = 1;
    const EInvalidExecutorReward: u64 = 2;
    const EInvalidOrderLimit: u64 = 3;
    const EInvalidMinFunding: u64 = 4;
    const EContractPaused: u64 = 5;
    const EWrongVersion: u64 = 6;
    const ENotUpgrade: u64 = 7;
    const ENoFeesToCollect: u64 = 8;
    const EInvalidSlippage: u64 = 9;
    const EInvalidTreasury: u64 = 10;
    const EInvalidMinInterval: u64 = 11;
    const EInvalidMaxSlippage: u64 = 12;
    const EInvalidFeedId: u64 = 14;
    const EExecutorNotWhitelisted: u64 = 15;

    // === Bounds ===
    const MAX_FEE_BPS: u64 = 500; // Max 5% fee
    const MIN_EXECUTOR_REWARD: u64 = 10_000_000; // 0.01 SUI minimum
    const MAX_EXECUTOR_REWARD: u64 = 100_000_000; // 0.1 SUI maximum
    const MAX_ORDER_LIMIT: u64 = 100_000;
    const MAX_SLIPPAGE_BPS: u64 = 5000; // Absolute max 50% slippage tolerance
    const MIN_MAX_SLIPPAGE_BPS: u64 = 10; // Admin can set max_slippage as low as 0.1%
    const MIN_INTERVAL_FLOOR: u64 = 60; // Minimum 1 minute (absolute floor)
    const MAX_INTERVAL_CEILING: u64 = 31_536_000; // Maximum 1 year in seconds

    // === Structs ===

    /// Capability for admin operations. Created once at module init.
    /// Authorization is via object::id() comparison, not address checks.
    struct AdminCap has key, store {
        id: UID,
    }

    /// Global protocol configuration. Shared object.
    struct GlobalConfig has key {
        id: UID,
        /// Protocol version for upgrade tracking
        version: u64,
        /// AdminCap ID for authorization (not address!)
        admin: ID,
        /// Fee in basis points (1 bps = 0.01%). Default: 30 bps = 0.30%
        fee_bps: u64,
        /// Executor reward per trade in MIST (incentive for keepers)
        executor_reward_per_trade: u64,
        /// Maximum orders per DCA account
        max_orders_per_account: u64,
        /// Minimum funding per trade in MIST
        min_funding_per_trade: u64,
        /// Default slippage tolerance in basis points. Default: 100 bps = 1%
        default_slippage_bps: u64,
        /// Maximum slippage tolerance users can set. Default: 1000 bps = 10%
        max_slippage_bps: u64,
        /// Minimum interval between trades in seconds. Default: 900 = 15 minutes
        min_interval_seconds: u64,
        /// Treasury address for protocol fee collection
        treasury: address,
        /// Whether protocol is paused (emergency stop)
        paused: bool,
        /// Whether executor whitelist is enabled (disabled by default for permissionless execution)
        executor_whitelist_enabled: bool,
        /// Whitelisted executor addresses (only enforced if executor_whitelist_enabled is true)
        whitelisted_executors: vector<address>,
    }

    /// Tracks total fees collected per token type (for analytics only).
    /// Actual fees are transferred directly to treasury.
    struct FeeTracker has key {
        id: UID,
        /// AdminCap ID for authorization
        admin: ID,
        /// Total fees collected in SUI (from executor rewards returned)
        total_sui_collected: u64,
        /// Accumulated SUI from unused executor rewards
        sui_balance: Balance<SUI>,
    }

    // === Price Feed Registry ===

    /// Quote currency constants for price feeds
    const QUOTE_USD: u8 = 0;
    const QUOTE_SUI: u8 = 1;

    /// Price feed configuration for a token
    /// Supports direct USD feeds or routing through intermediate (e.g., TOKEN→SUI→USD)
    struct PriceFeed has copy, drop, store {
        /// Pyth price feed ID (32 bytes)
        feed_id: vector<u8>,
        /// Quote currency: 0=USD (direct), 1=SUI (needs routing)
        quote_currency: u8,
        /// Intermediate feed ID for routing (e.g., SUI/USD feed when token has TOKEN/SUI feed)
        intermediate_feed_id: Option<vector<u8>>,
    }

    /// Registry mapping coin types to their Pyth price feed configurations
    struct PriceFeedRegistry has key {
        id: UID,
        /// AdminCap ID for authorization
        admin: ID,
        /// TypeName string -> PriceFeed config
        feeds: Table<String, PriceFeed>,
        /// Cached SUI/USD feed ID for routing lookups
        sui_usd_feed_id: vector<u8>,
    }

    /// Snapshot of config values at DCA account creation time.
    /// Stored in DCA account so config changes don't affect existing accounts.
    struct ConfigSnapshot has copy, drop, store {
        fee_bps: u64,
        executor_reward_per_trade: u64,
        default_slippage_bps: u64,
        treasury: address,
    }

    // === Events ===

    struct ConfigCreatedEvent has copy, drop {
        config_id: ID,
        fee_tracker_id: ID,
        admin_cap_id: ID,
        treasury: address,
    }

    struct ConfigUpdatedEvent has copy, drop {
        config_id: ID,
        fee_bps: u64,
        executor_reward_per_trade: u64,
        max_orders_per_account: u64,
        min_funding_per_trade: u64,
        default_slippage_bps: u64,
        max_slippage_bps: u64,
        min_interval_seconds: u64,
    }

    struct TreasuryUpdatedEvent has copy, drop {
        config_id: ID,
        old_treasury: address,
        new_treasury: address,
    }

    struct ProtocolPausedEvent has copy, drop {
        config_id: ID,
        paused: bool,
    }

    struct FeesWithdrawnEvent has copy, drop {
        fee_tracker_id: ID,
        amount: u64,
        recipient: address,
    }

    struct PriceFeedRegistryCreatedEvent has copy, drop {
        registry_id: ID,
        admin_cap_id: ID,
    }

    struct PriceFeedRegisteredEvent has copy, drop {
        registry_id: ID,
        coin_type: String,
        feed_id: vector<u8>,
        quote_currency: u8,
        is_routed: bool,
    }

    struct PriceFeedRemovedEvent has copy, drop {
        registry_id: ID,
        coin_type: String,
    }

    struct ExecutorWhitelistUpdatedEvent has copy, drop {
        config_id: ID,
        enabled: bool,
    }

    struct ExecutorAddedEvent has copy, drop {
        config_id: ID,
        executor: address,
    }

    struct ExecutorRemovedEvent has copy, drop {
        config_id: ID,
        executor: address,
    }

    // === Init ===

    /// Called once when module is published.
    fun init(ctx: &mut TxContext) {
        let admin_cap = AdminCap { id: object::new(ctx) };
        let admin_cap_id = object::id(&admin_cap);
        let deployer = sender(ctx);

        let config_uid = object::new(ctx);
        let config_id = object::uid_to_inner(&config_uid);

        let fee_tracker_uid = object::new(ctx);
        let fee_tracker_id = object::uid_to_inner(&fee_tracker_uid);

        let config = GlobalConfig {
            id: config_uid,
            version: CONFIG_VERSION,
            admin: admin_cap_id,
            fee_bps: 30, // 0.30% default
            executor_reward_per_trade: 25_000_000, // 0.025 SUI
            max_orders_per_account: 25_000,
            min_funding_per_trade: 100_000,
            default_slippage_bps: 100, // 1% default
            max_slippage_bps: 1000, // 10% max user-settable slippage
            min_interval_seconds: 900, // 15 minutes default
            treasury: deployer, // deployer is initial treasury
            paused: false,
            executor_whitelist_enabled: false, // Permissionless by default
            whitelisted_executors: vector::empty(),
        };

        let fee_tracker = FeeTracker {
            id: fee_tracker_uid,
            admin: admin_cap_id,
            total_sui_collected: 0,
            sui_balance: balance::zero(),
        };

        event::emit(ConfigCreatedEvent {
            config_id,
            fee_tracker_id,
            admin_cap_id,
            treasury: deployer,
        });

        transfer::transfer(admin_cap, deployer);
        transfer::share_object(config);
        transfer::share_object(fee_tracker);
    }

    // === Version Guard ===

    public fun assert_version(config: &GlobalConfig) {
        assert!(config.version == CONFIG_VERSION, EWrongVersion);
    }

    public fun assert_not_paused(config: &GlobalConfig) {
        assert!(!config.paused, EContractPaused);
    }

    // === Public View Functions ===

    public fun fee_bps(config: &GlobalConfig): u64 {
        config.fee_bps
    }

    public fun executor_reward_per_trade(config: &GlobalConfig): u64 {
        config.executor_reward_per_trade
    }

    public fun max_orders_per_account(config: &GlobalConfig): u64 {
        config.max_orders_per_account
    }

    public fun min_funding_per_trade(config: &GlobalConfig): u64 {
        config.min_funding_per_trade
    }

    public fun default_slippage_bps(config: &GlobalConfig): u64 {
        config.default_slippage_bps
    }

    public fun max_slippage_bps(config: &GlobalConfig): u64 {
        config.max_slippage_bps
    }

    public fun min_interval_seconds(config: &GlobalConfig): u64 {
        config.min_interval_seconds
    }

    public fun treasury(config: &GlobalConfig): address {
        config.treasury
    }

    public fun is_paused(config: &GlobalConfig): bool {
        config.paused
    }

    public fun version(config: &GlobalConfig): u64 {
        config.version
    }

    public fun executor_whitelist_enabled(config: &GlobalConfig): bool {
        config.executor_whitelist_enabled
    }

    public fun whitelisted_executors(config: &GlobalConfig): &vector<address> {
        &config.whitelisted_executors
    }

    /// Check if an executor is allowed to execute trades
    /// Returns true if whitelist is disabled OR if executor is on the whitelist
    public fun is_executor_allowed(config: &GlobalConfig, executor: address): bool {
        if (!config.executor_whitelist_enabled) {
            return true
        };
        vector::contains(&config.whitelisted_executors, &executor)
    }

    /// Assert that executor is allowed (for use in adapters)
    public fun assert_executor_allowed(config: &GlobalConfig, executor: address) {
        assert!(is_executor_allowed(config, executor), EExecutorNotWhitelisted);
    }

    public fun total_sui_collected(fee_tracker: &FeeTracker): u64 {
        fee_tracker.total_sui_collected
    }

    public fun sui_balance(fee_tracker: &FeeTracker): u64 {
        balance::value(&fee_tracker.sui_balance)
    }

    /// Create a snapshot of current config for storing in DCA account.
    public fun create_snapshot(config: &GlobalConfig): ConfigSnapshot {
        ConfigSnapshot {
            fee_bps: config.fee_bps,
            executor_reward_per_trade: config.executor_reward_per_trade,
            default_slippage_bps: config.default_slippage_bps,
            treasury: config.treasury,
        }
    }

    public fun snapshot_fee_bps(snapshot: &ConfigSnapshot): u64 {
        snapshot.fee_bps
    }

    public fun snapshot_executor_reward(snapshot: &ConfigSnapshot): u64 {
        snapshot.executor_reward_per_trade
    }

    public fun snapshot_slippage_bps(snapshot: &ConfigSnapshot): u64 {
        snapshot.default_slippage_bps
    }

    public fun snapshot_treasury(snapshot: &ConfigSnapshot): address {
        snapshot.treasury
    }

    // === Fee Tracking (called by DCA module) ===

    /// Track SUI collected from unused executor rewards.
    public(friend) fun deposit_sui(
        fee_tracker: &mut FeeTracker,
        sui: Balance<SUI>,
    ) {
        let amount = balance::value(&sui);
        fee_tracker.total_sui_collected = fee_tracker.total_sui_collected + amount;
        balance::join(&mut fee_tracker.sui_balance, sui);
    }

    // === Admin Functions ===

    fun assert_admin(config: &GlobalConfig, cap: &AdminCap) {
        assert!(config.admin == object::id(cap), ENotAdmin);
    }

    fun assert_fee_tracker_admin(fee_tracker: &FeeTracker, cap: &AdminCap) {
        assert!(fee_tracker.admin == object::id(cap), ENotAdmin);
    }

    public entry fun set_fee_bps(config: &mut GlobalConfig, cap: &AdminCap, new_fee_bps: u64) {
        assert_version(config);
        assert_admin(config, cap);
        assert!(new_fee_bps <= MAX_FEE_BPS, EInvalidFee);

        config.fee_bps = new_fee_bps;
        emit_config_updated(config);
    }

    public entry fun set_executor_reward_per_trade(
        config: &mut GlobalConfig,
        cap: &AdminCap,
        new_reward: u64,
    ) {
        assert_version(config);
        assert_admin(config, cap);
        assert!(
            new_reward >= MIN_EXECUTOR_REWARD && new_reward <= MAX_EXECUTOR_REWARD,
            EInvalidExecutorReward,
        );

        config.executor_reward_per_trade = new_reward;
        emit_config_updated(config);
    }

    public entry fun set_max_orders_per_account(
        config: &mut GlobalConfig,
        cap: &AdminCap,
        new_limit: u64,
    ) {
        assert_version(config);
        assert_admin(config, cap);
        assert!(new_limit > 0 && new_limit <= MAX_ORDER_LIMIT, EInvalidOrderLimit);

        config.max_orders_per_account = new_limit;
        emit_config_updated(config);
    }

    public entry fun set_min_funding_per_trade(
        config: &mut GlobalConfig,
        cap: &AdminCap,
        new_minimum: u64,
    ) {
        assert_version(config);
        assert_admin(config, cap);
        assert!(new_minimum > 0, EInvalidMinFunding);

        config.min_funding_per_trade = new_minimum;
        emit_config_updated(config);
    }

    public entry fun set_default_slippage_bps(
        config: &mut GlobalConfig,
        cap: &AdminCap,
        new_slippage_bps: u64,
    ) {
        assert_version(config);
        assert_admin(config, cap);
        assert!(new_slippage_bps > 0 && new_slippage_bps <= config.max_slippage_bps, EInvalidSlippage);

        config.default_slippage_bps = new_slippage_bps;
        emit_config_updated(config);
    }

    public entry fun set_max_slippage_bps(
        config: &mut GlobalConfig,
        cap: &AdminCap,
        new_max_slippage_bps: u64,
    ) {
        assert_version(config);
        assert_admin(config, cap);
        assert!(
            new_max_slippage_bps >= MIN_MAX_SLIPPAGE_BPS && new_max_slippage_bps <= MAX_SLIPPAGE_BPS,
            EInvalidMaxSlippage,
        );
        // Ensure default doesn't exceed new max
        assert!(config.default_slippage_bps <= new_max_slippage_bps, EInvalidMaxSlippage);

        config.max_slippage_bps = new_max_slippage_bps;
        emit_config_updated(config);
    }

    public entry fun set_min_interval_seconds(
        config: &mut GlobalConfig,
        cap: &AdminCap,
        new_interval: u64,
    ) {
        assert_version(config);
        assert_admin(config, cap);
        assert!(
            new_interval >= MIN_INTERVAL_FLOOR && new_interval <= MAX_INTERVAL_CEILING,
            EInvalidMinInterval,
        );

        config.min_interval_seconds = new_interval;
        emit_config_updated(config);
    }

    public entry fun set_treasury(
        config: &mut GlobalConfig,
        cap: &AdminCap,
        new_treasury: address,
    ) {
        assert_version(config);
        assert_admin(config, cap);
        assert!(new_treasury != @0x0, EInvalidTreasury);

        let old_treasury = config.treasury;
        config.treasury = new_treasury;

        event::emit(TreasuryUpdatedEvent {
            config_id: object::uid_to_inner(&config.id),
            old_treasury,
            new_treasury,
        });
    }

    public entry fun set_paused(config: &mut GlobalConfig, cap: &AdminCap, paused: bool) {
        assert_admin(config, cap);
        config.paused = paused;

        event::emit(ProtocolPausedEvent {
            config_id: object::uid_to_inner(&config.id),
            paused,
        });
    }

    // === Executor Whitelist Admin Functions ===

    /// Enable or disable executor whitelist enforcement
    public entry fun set_whitelist_enabled(config: &mut GlobalConfig, cap: &AdminCap, enabled: bool) {
        assert_version(config);
        assert_admin(config, cap);
        config.executor_whitelist_enabled = enabled;

        event::emit(ExecutorWhitelistUpdatedEvent {
            config_id: object::uid_to_inner(&config.id),
            enabled,
        });
    }

    /// Add an executor to the whitelist
    public entry fun add_executor(config: &mut GlobalConfig, cap: &AdminCap, executor: address) {
        assert_version(config);
        assert_admin(config, cap);

        if (!vector::contains(&config.whitelisted_executors, &executor)) {
            vector::push_back(&mut config.whitelisted_executors, executor);

            event::emit(ExecutorAddedEvent {
                config_id: object::uid_to_inner(&config.id),
                executor,
            });
        };
    }

    /// Remove an executor from the whitelist
    public entry fun remove_executor(config: &mut GlobalConfig, cap: &AdminCap, executor: address) {
        assert_version(config);
        assert_admin(config, cap);

        let (found, index) = vector::index_of(&config.whitelisted_executors, &executor);
        if (found) {
            vector::remove(&mut config.whitelisted_executors, index);

            event::emit(ExecutorRemovedEvent {
                config_id: object::uid_to_inner(&config.id),
                executor,
            });
        };
    }

    /// Admin withdraws accumulated SUI from fee tracker
    public entry fun withdraw_sui(
        fee_tracker: &mut FeeTracker,
        cap: &AdminCap,
        ctx: &mut TxContext,
    ) {
        assert_fee_tracker_admin(fee_tracker, cap);

        let amount = balance::value(&fee_tracker.sui_balance);
        assert!(amount > 0, ENoFeesToCollect);

        let withdrawn = balance::withdraw_all(&mut fee_tracker.sui_balance);
        let sui_coin = coin::from_balance(withdrawn, ctx);

        event::emit(FeesWithdrawnEvent {
            fee_tracker_id: object::uid_to_inner(&fee_tracker.id),
            amount,
            recipient: sender(ctx),
        });

        transfer::public_transfer(sui_coin, sender(ctx));
    }

    /// Migration function - call after package upgrade
    public entry fun migrate(config: &mut GlobalConfig, cap: &AdminCap) {
        assert_admin(config, cap);
        assert!(config.version < CONFIG_VERSION, ENotUpgrade);
        config.version = CONFIG_VERSION;
    }

    // === Price Feed Registry Functions ===

    /// Create a new PriceFeedRegistry (call once after deployment)
    public entry fun create_price_feed_registry(
        cap: &AdminCap,
        sui_usd_feed_id: vector<u8>,
        ctx: &mut TxContext,
    ) {
        assert!(vector::length(&sui_usd_feed_id) == 32, EInvalidFeedId);

        let registry_uid = object::new(ctx);
        let registry_id = object::uid_to_inner(&registry_uid);
        let admin_cap_id = object::id(cap);

        let registry = PriceFeedRegistry {
            id: registry_uid,
            admin: admin_cap_id,
            feeds: table::new(ctx),
            sui_usd_feed_id,
        };

        event::emit(PriceFeedRegistryCreatedEvent {
            registry_id,
            admin_cap_id,
        });

        transfer::share_object(registry);
    }

    fun assert_registry_admin(registry: &PriceFeedRegistry, cap: &AdminCap) {
        assert!(registry.admin == object::id(cap), ENotAdmin);
    }

    /// Register a direct USD price feed for a token
    public entry fun register_direct_feed<CoinType>(
        registry: &mut PriceFeedRegistry,
        cap: &AdminCap,
        feed_id: vector<u8>,
    ) {
        assert_registry_admin(registry, cap);
        assert!(vector::length(&feed_id) == 32, EInvalidFeedId);

        let coin_type = type_name::into_string(type_name::get<CoinType>());
        let feed = PriceFeed {
            feed_id,
            quote_currency: QUOTE_USD,
            intermediate_feed_id: option::none(),
        };

        if (table::contains(&registry.feeds, coin_type)) {
            table::remove(&mut registry.feeds, coin_type);
        };
        table::add(&mut registry.feeds, coin_type, feed);

        event::emit(PriceFeedRegisteredEvent {
            registry_id: object::uid_to_inner(&registry.id),
            coin_type,
            feed_id,
            quote_currency: QUOTE_USD,
            is_routed: false,
        });
    }

    /// Register a routed price feed (e.g., TOKEN/SUI feed that routes through SUI/USD)
    public entry fun register_routed_feed<CoinType>(
        registry: &mut PriceFeedRegistry,
        cap: &AdminCap,
        feed_id: vector<u8>,
    ) {
        assert_registry_admin(registry, cap);
        assert!(vector::length(&feed_id) == 32, EInvalidFeedId);

        let coin_type = type_name::into_string(type_name::get<CoinType>());
        let feed = PriceFeed {
            feed_id,
            quote_currency: QUOTE_SUI,
            intermediate_feed_id: option::some(registry.sui_usd_feed_id),
        };

        if (table::contains(&registry.feeds, coin_type)) {
            table::remove(&mut registry.feeds, coin_type);
        };
        table::add(&mut registry.feeds, coin_type, feed);

        event::emit(PriceFeedRegisteredEvent {
            registry_id: object::uid_to_inner(&registry.id),
            coin_type,
            feed_id,
            quote_currency: QUOTE_SUI,
            is_routed: true,
        });
    }

    /// Remove a price feed from the registry
    public entry fun remove_price_feed<CoinType>(
        registry: &mut PriceFeedRegistry,
        cap: &AdminCap,
    ) {
        assert_registry_admin(registry, cap);

        let coin_type = type_name::into_string(type_name::get<CoinType>());
        if (table::contains(&registry.feeds, coin_type)) {
            table::remove(&mut registry.feeds, coin_type);

            event::emit(PriceFeedRemovedEvent {
                registry_id: object::uid_to_inner(&registry.id),
                coin_type,
            });
        };
    }

    /// Update the SUI/USD feed ID used for routing
    public entry fun set_sui_usd_feed(
        registry: &mut PriceFeedRegistry,
        cap: &AdminCap,
        feed_id: vector<u8>,
    ) {
        assert_registry_admin(registry, cap);
        assert!(vector::length(&feed_id) == 32, EInvalidFeedId);
        registry.sui_usd_feed_id = feed_id;
    }

    // === Price Feed Registry View Functions ===

    /// Get price feed configuration for a token type
    public fun get_price_feed<CoinType>(registry: &PriceFeedRegistry): Option<PriceFeed> {
        let coin_type = type_name::into_string(type_name::get<CoinType>());
        if (table::contains(&registry.feeds, coin_type)) {
            option::some(*table::borrow(&registry.feeds, coin_type))
        } else {
            option::none()
        }
    }

    /// Check if a price feed exists for a token type
    public fun has_price_feed<CoinType>(registry: &PriceFeedRegistry): bool {
        let coin_type = type_name::into_string(type_name::get<CoinType>());
        table::contains(&registry.feeds, coin_type)
    }

    /// Check if a price feed requires routing (quote is SUI, not USD)
    public fun requires_routing(feed: &PriceFeed): bool {
        feed.quote_currency == QUOTE_SUI
    }

    /// Get the feed ID from a PriceFeed
    public fun feed_id(feed: &PriceFeed): vector<u8> {
        feed.feed_id
    }

    /// Get the intermediate feed ID for routing (if any)
    public fun intermediate_feed_id(feed: &PriceFeed): Option<vector<u8>> {
        feed.intermediate_feed_id
    }

    /// Get the quote currency from a PriceFeed
    public fun quote_currency(feed: &PriceFeed): u8 {
        feed.quote_currency
    }

    /// Get the SUI/USD feed ID from the registry
    public fun sui_usd_feed_id(registry: &PriceFeedRegistry): vector<u8> {
        registry.sui_usd_feed_id
    }

    // === Private Functions ===

    fun emit_config_updated(config: &GlobalConfig) {
        event::emit(ConfigUpdatedEvent {
            config_id: object::uid_to_inner(&config.id),
            fee_bps: config.fee_bps,
            executor_reward_per_trade: config.executor_reward_per_trade,
            max_orders_per_account: config.max_orders_per_account,
            min_funding_per_trade: config.min_funding_per_trade,
            default_slippage_bps: config.default_slippage_bps,
            max_slippage_bps: config.max_slippage_bps,
            min_interval_seconds: config.min_interval_seconds,
        });
    }

    // === Friend Declarations ===
    friend dca::dca;
    friend dca::flow_x;
    friend dca::oracle;
    friend dca::terms;

    // === Test-only Functions ===

    #[test_only]
    public fun create_config_for_testing(
        ctx: &mut TxContext,
    ): (GlobalConfig, FeeTracker, AdminCap) {
        let admin_cap = AdminCap { id: object::new(ctx) };
        let admin_cap_id = object::id(&admin_cap);

        let config = GlobalConfig {
            id: object::new(ctx),
            version: CONFIG_VERSION,
            admin: admin_cap_id,
            fee_bps: 30,
            executor_reward_per_trade: 25_000_000,
            max_orders_per_account: 25_000,
            min_funding_per_trade: 100_000,
            default_slippage_bps: 100,
            max_slippage_bps: 1000, // 10% max for testing
            min_interval_seconds: 60, // Low for testing (production default is 900)
            treasury: sender(ctx),
            paused: false,
            executor_whitelist_enabled: false,
            whitelisted_executors: vector::empty(),
        };

        let fee_tracker = FeeTracker {
            id: object::new(ctx),
            admin: admin_cap_id,
            total_sui_collected: 0,
            sui_balance: balance::zero(),
        };

        (config, fee_tracker, admin_cap)
    }

    #[test_only]
    public fun destroy_config_for_testing(config: GlobalConfig) {
        let GlobalConfig {
            id,
            version: _,
            admin: _,
            fee_bps: _,
            executor_reward_per_trade: _,
            max_orders_per_account: _,
            min_funding_per_trade: _,
            default_slippage_bps: _,
            max_slippage_bps: _,
            min_interval_seconds: _,
            treasury: _,
            paused: _,
            executor_whitelist_enabled: _,
            whitelisted_executors: _,
        } = config;
        object::delete(id);
    }

    #[test_only]
    public fun destroy_fee_tracker_for_testing(fee_tracker: FeeTracker) {
        let FeeTracker { id, admin: _, total_sui_collected: _, sui_balance } = fee_tracker;
        balance::destroy_for_testing(sui_balance);
        object::delete(id);
    }

    #[test_only]
    public fun destroy_admin_cap_for_testing(cap: AdminCap) {
        let AdminCap { id } = cap;
        object::delete(id);
    }

    #[test_only]
    public fun create_price_feed_registry_for_testing(
        ctx: &mut TxContext,
    ): PriceFeedRegistry {
        // Dummy SUI/USD feed ID (32 bytes) for testing
        let sui_usd_feed_id = x"23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744";

        PriceFeedRegistry {
            id: object::new(ctx),
            admin: object::id_from_address(@0x0), // Dummy admin ID for testing
            feeds: table::new(ctx),
            sui_usd_feed_id,
        }
    }

    #[test_only]
    public fun destroy_price_feed_registry_for_testing(registry: PriceFeedRegistry) {
        let PriceFeedRegistry { id, admin: _, feeds, sui_usd_feed_id: _ } = registry;
        table::drop(feeds);
        object::delete(id);
    }

    #[test_only]
    public fun register_test_feed<CoinType>(
        registry: &mut PriceFeedRegistry,
        feed_id: vector<u8>,
        is_routed: bool,
    ) {
        let coin_type = type_name::into_string(type_name::get<CoinType>());
        let feed = if (is_routed) {
            PriceFeed {
                feed_id,
                quote_currency: QUOTE_SUI,
                intermediate_feed_id: option::some(registry.sui_usd_feed_id),
            }
        } else {
            PriceFeed {
                feed_id,
                quote_currency: QUOTE_USD,
                intermediate_feed_id: option::none(),
            }
        };

        if (table::contains(&registry.feeds, coin_type)) {
            table::remove(&mut registry.feeds, coin_type);
        };
        table::add(&mut registry.feeds, coin_type, feed);
    }
}
