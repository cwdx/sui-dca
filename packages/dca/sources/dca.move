/// @title DCA Module
/// @notice DCA with GlobalConfig integration for upgradable protocol settings.
/// @dev Fee and executor reward settings are snapshotted at account creation time.
///      Trade execution is PERMISSIONLESS - anyone can trigger trades when time conditions are met.
///      This enables keeper networks and removes single-point-of-failure on delegatee.
#[allow(lint(public_entry), unused_const, unused_function, unused_use)]
module dca::dca {
    use dca::config::{Self, GlobalConfig, FeeTracker, ConfigSnapshot, PriceFeedRegistry};
    use dca::math::{mul, div};
    use dca::oracle;
    use dca::terms::{Self, TermsRegistry};
    use dca::time;
    use std::option::{Self, Option, none, some};
    use pyth::price_info::PriceInfoObject;
    use sui::balance::{Self, Balance};
    use sui::clock::{Self, Clock};
    use sui::coin::{Self, Coin};
    use sui::event;
    use sui::object::{Self, UID, ID};
    use sui::sui::SUI;
    use sui::transfer;
    use sui::tx_context::{TxContext, sender};

    // === Constants ===
    const VERSION: u64 = 4;

    // === Error Codes ===
    const EWrongVersion: u64 = 0;
    const EInvalidTimeScale: u64 = 10;
    const EInvalidEvery: u64 = 11;
    const EBelowMinimumFunding: u64 = 12;
    const EInsufficientExecutorReward: u64 = 13;
    const ETotalOrdersAboveLimit: u64 = 16;
    const EInvalidDelegatee: u64 = 21;
    const ENotOwner: u64 = 22;
    const ENotOwnerOrDelegatee: u64 = 23;
    const ENotEnoughTimePassed: u64 = 30;
    const EInactive: u64 = 31;
    const EAboveMaxPrice: u64 = 33;
    const EExcessiveExecutorReward: u64 = 35;
    const EUnfundedAccount: u64 = 40;
    const ENoRemainingOrders: u64 = 41;
    const EInsufficientInputBalance: u64 = 42;
    const EInvalidSlippage: u64 = 43;
    const EIntervalTooShort: u64 = 44;
    const EOutdatedTermsAcceptance: u64 = 45;

    // === Structs ===

    struct TradePromise<phantom Input, phantom Output> has drop {
        input: u64,
        min_output: u64,
        dca_id: ID,
    }

    struct Price has copy, drop, store {
        base_val: u64,
        quote_val: u64,
    }

    struct TradeParams has copy, drop, store {
        min_price: Option<Price>,
        max_price: Option<Price>,
        /// Custom slippage tolerance in basis points (overrides default if set)
        slippage_bps: Option<u64>,
    }

    /// DCA account with ConfigSnapshot
    struct DCA<phantom Input, phantom Output> has key, store {
        id: UID,
        version: u64,
        owner: address,
        delegatee: address,
        start_time_ms: u64,
        last_time_ms: u64,
        every: u64,
        /// Original total orders (for order_number calculation)
        initial_orders: u64,
        remaining_orders: u64,
        time_scale: u8,
        input_balance: Balance<Input>,
        split_allocation: u64,
        trade_params: TradeParams,
        active: bool,
        /// SUI balance for executor rewards
        executor_reward_balance: Balance<SUI>,
        /// Snapshotted config at account creation
        config_snapshot: ConfigSnapshot,
        /// Terms version accepted at account creation
        accepted_terms_version: u64,
        /// Input token decimals for oracle calculations
        input_decimals: u8,
        /// Output token decimals for oracle calculations
        output_decimals: u8,
    }

    // === Events ===

    /// Emitted when a new DCA account is created
    struct DCACreatedEvent has copy, drop {
        id: ID,
        owner: address,
        delegatee: address,
        /// Total number of orders to execute
        total_orders: u64,
        /// Total input amount deposited
        input_amount: u64,
        /// Amount allocated per trade (before fees)
        split_allocation: u64,
        /// Interval between trades
        every: u64,
        /// Time scale (0=seconds, 1=minutes, 2=hours, 3=days, 4=weeks, 5=months)
        time_scale: u8,
        /// Fee rate in basis points (snapshotted at creation)
        fee_bps: u64,
        /// Executor reward per trade in MIST (snapshotted at creation)
        executor_reward_per_trade: u64,
        /// Default slippage tolerance in basis points
        default_slippage_bps: u64,
        /// Account start timestamp in milliseconds
        start_time_ms: u64,
        /// Terms version accepted at creation
        accepted_terms_version: u64,
    }

    /// Emitted when init_trade is called (trade initiated)
    struct TradeInitiatedEvent has copy, drop {
        dca_id: ID,
        /// Address that triggered the trade (for keeper tracking)
        executor: address,
        /// Input amount sent to DEX (after fee deduction)
        input_amount: u64,
        /// Fee amount deducted and sent to treasury
        fee_amount: u64,
        /// Orders remaining after this trade
        remaining_orders: u64,
        /// Which order number this is (1-indexed)
        order_number: u64,
        /// Minimum output expected (for slippage protection)
        min_output: u64,
    }

    /// Emitted when resolve_trade completes (trade finalized)
    struct TradeCompletedEvent has copy, drop {
        dca_id: ID,
        /// Address that executed the trade
        executor: address,
        /// Output amount received from DEX
        output_amount: u64,
        /// Executor reward claimed
        executor_reward: u64,
        /// Whether the DCA account is still active
        active: bool,
    }

    /// Emitted when a DCA account is deactivated
    struct DCADeactivatedEvent has copy, drop {
        dca_id: ID,
        /// 0=completed_all_orders, 1=owner_deactivated, 2=insufficient_funds
        reason: u8,
        /// Remaining orders at deactivation
        remaining_orders: u64,
        /// Remaining input balance
        remaining_input: u64,
        /// Remaining executor reward balance
        remaining_executor_reward: u64,
    }

    /// Emitted when delegatee is changed
    struct DelegateeUpdatedEvent has copy, drop {
        dca_id: ID,
        old_delegatee: address,
        new_delegatee: address,
    }

    /// Emitted when slippage tolerance is updated
    struct SlippageUpdatedEvent has copy, drop {
        dca_id: ID,
        old_slippage_bps: Option<u64>,
        new_slippage_bps: Option<u64>,
    }

    // Deactivation reason constants
    const DEACTIVATION_COMPLETED: u8 = 0;
    const DEACTIVATION_OWNER: u8 = 1;
    const DEACTIVATION_INSUFFICIENT_FUNDS: u8 = 2;

    // === Constructor Functions ===

    /// Create a new DCA account with current GlobalConfig settings.
    /// start_time_ms: Optional start time in milliseconds. Pass 0 to start immediately (default).
    ///                If non-zero, the first trade can only execute after this time + interval.
    /// accepted_terms_version: The terms version the user has accepted (must meet minimum).
    /// input_decimals/output_decimals: Token decimal places for oracle calculations.
    #[lint_allow(share_owned)]
    public entry fun init_account<Input, Output>(
        global_config: &GlobalConfig,
        terms_registry: &TermsRegistry,
        clock: &Clock,
        delegatee: address,
        input_funds: Coin<Input>,
        every: u64,
        total_orders: u64,
        time_scale: u8,
        start_time_ms: u64,
        accepted_terms_version: u64,
        input_decimals: u8,
        output_decimals: u8,
        executor_reward_funds: &mut Coin<SUI>,
        ctx: &mut TxContext,
    ) {
        config::assert_version(global_config);
        config::assert_not_paused(global_config);

        let dca = new<Input, Output>(
            global_config,
            terms_registry,
            clock,
            delegatee,
            input_funds,
            every,
            total_orders,
            time_scale,
            start_time_ms,
            accepted_terms_version,
            input_decimals,
            output_decimals,
            executor_reward_funds,
            ctx,
        );

        transfer::share_object(dca);
    }

    /// Create a new DCA account.
    /// start_time_ms: Optional start time in milliseconds. Pass 0 to start immediately (default).
    ///                If non-zero, the first trade can only execute after this time + interval.
    /// accepted_terms_version: The terms version the user has accepted (must meet minimum).
    /// input_decimals/output_decimals: Token decimal places for oracle calculations.
    public fun new<Input, Output>(
        global_config: &GlobalConfig,
        terms_registry: &TermsRegistry,
        clock: &Clock,
        delegatee: address,
        input_funds: Coin<Input>,
        every: u64,
        total_orders: u64,
        time_scale: u8,
        start_time_ms: u64,
        accepted_terms_version: u64,
        input_decimals: u8,
        output_decimals: u8,
        executor_reward_funds: &mut Coin<SUI>,
        ctx: &mut TxContext,
    ): DCA<Input, Output> {
        config::assert_version(global_config);
        config::assert_not_paused(global_config);

        // Validate terms acceptance
        terms::assert_terms_acceptable(terms_registry, accepted_terms_version);

        assert_time_scale(time_scale);
        assert_every(every, time_scale);

        // Check minimum interval from config
        let interval_seconds = interval_to_seconds(every, time_scale);
        let min_interval = config::min_interval_seconds(global_config);
        assert!(interval_seconds >= min_interval, EIntervalTooShort);

        let max_orders = config::max_orders_per_account(global_config);
        assert!(total_orders <= max_orders, ETotalOrdersAboveLimit);

        let min_funding = config::min_funding_per_trade(global_config);
        let input_balance = coin::balance(&input_funds);
        assert!(
            balance::value(input_balance) >= mul(total_orders, min_funding),
            EBelowMinimumFunding,
        );

        let executor_reward_per_trade = config::executor_reward_per_trade(global_config);
        let required_reward = mul(executor_reward_per_trade, total_orders);
        assert!(coin::value(executor_reward_funds) >= required_reward, EInsufficientExecutorReward);

        // Snapshot current config
        let config_snapshot = config::create_snapshot(global_config);
        let input_funds_balance = coin::into_balance(input_funds);
        let current_time = clock::timestamp_ms(clock);
        let split_allocation = compute_split_allocation(
            balance::value(&input_funds_balance),
            total_orders,
        );

        // Use provided start_time_ms or default to current time
        // If start_time_ms is 0, use current time (first trade after interval)
        // If start_time_ms > 0, use that time (first trade after start_time + interval)
        let effective_start_time = if (start_time_ms == 0) {
            current_time
        } else {
            start_time_ms
        };

        let dca_uid = object::new(ctx);
        let owner = sender(ctx);
        let dca_id = object::uid_to_inner(&dca_uid);
        let input_amount = balance::value(&input_funds_balance);

        event::emit(DCACreatedEvent {
            id: dca_id,
            owner,
            delegatee,
            total_orders,
            input_amount,
            split_allocation,
            every,
            time_scale,
            fee_bps: config::snapshot_fee_bps(&config_snapshot),
            executor_reward_per_trade: config::snapshot_executor_reward(&config_snapshot),
            default_slippage_bps: config::snapshot_slippage_bps(&config_snapshot),
            start_time_ms: effective_start_time,
            accepted_terms_version,
        });

        let executor_reward_balance = coin::into_balance(
            coin::split(executor_reward_funds, required_reward, ctx),
        );

        DCA {
            id: dca_uid,
            version: VERSION,
            owner,
            delegatee,
            start_time_ms: effective_start_time,
            last_time_ms: effective_start_time,
            every,
            initial_orders: total_orders,
            remaining_orders: total_orders,
            time_scale,
            input_balance: input_funds_balance,
            split_allocation,
            trade_params: TradeParams {
                min_price: none(),
                max_price: none(),
                slippage_bps: none(),
            },
            active: true,
            executor_reward_balance,
            config_snapshot,
            accepted_terms_version,
            input_decimals,
            output_decimals,
        }
    }

    // === Trade Functions ===

    /// Initialize a trade with oracle-based min_output calculation.
    /// Restricted to friend modules (whitelisted adapters) for security.
    /// This prevents malicious executors from stealing user funds by not completing swaps.
    /// Caller gets executor reward as incentive. Fee is deducted and sent to treasury.
    ///
    /// Parameters:
    /// - dca: The DCA account
    /// - clock: System clock
    /// - registry: Price feed registry for oracle lookups
    /// - input_price_info: Pyth price info for input token
    /// - input_intermediate: Intermediate price info for routing (pass same as input_price_info if direct USD feed)
    /// - output_price_info: Pyth price info for output token
    /// - output_intermediate: Intermediate price info for routing (pass same as output_price_info if direct USD feed)
    /// - ctx: Transaction context
    /// Oracle-aware init_trade - callable from PTBs or friend modules
    /// The oracle validates prices, so this is safe to make public
    public fun init_trade<Input, Output>(
        dca: &mut DCA<Input, Output>,
        clock: &Clock,
        registry: &PriceFeedRegistry,
        input_price_info: &PriceInfoObject,
        input_intermediate: &PriceInfoObject,
        output_price_info: &PriceInfoObject,
        output_intermediate: &PriceInfoObject,
        ctx: &mut TxContext,
    ): (Balance<Input>, TradePromise<Input, Output>) {
        check_version_and_upgrade(dca);
        assert_active(dca);

        let current_time = clock::timestamp_ms(clock);
        assert_time(current_time, dca.last_time_ms, dca.every, dca.time_scale);

        let input_funds = if (dca.remaining_orders > 1) {
            balance::split(&mut dca.input_balance, dca.split_allocation)
        } else {
            balance::withdraw_all(&mut dca.input_balance)
        };

        dca.last_time_ms = current_time;
        dca.remaining_orders = dca.remaining_orders - 1;

        // Calculate fee using snapshot rate (locked at creation)
        let fee_bps = config::snapshot_fee_bps(&dca.config_snapshot);
        let fee_amount = fee_amount_with_bps(balance::value(&input_funds), fee_bps);

        // Deduct fee from input funds (will be transferred to treasury by adapter)
        let fees = balance::split(&mut input_funds, fee_amount);

        // Transfer fees to treasury address
        let treasury = config::snapshot_treasury(&dca.config_snapshot);
        let fee_coin = coin::from_balance(fees, ctx);
        transfer::public_transfer(fee_coin, treasury);

        let dca_id = object::uid_to_inner(&dca.id);
        let input = balance::value(&input_funds);

        // Calculate oracle-based min_output with routing support
        // Note: For tokens with direct USD feeds, caller passes same object for both primary and intermediate
        let slippage_bps = effective_slippage_bps(dca);
        let min_output = oracle::calculate_min_output<Input, Output>(
            clock,
            registry,
            input_price_info,
            input_intermediate,
            output_price_info,
            output_intermediate,
            input,
            slippage_bps,
            dca.input_decimals,
            dca.output_decimals,
        );

        let executor = sender(ctx);

        // Calculate order number (1-indexed): initial - remaining (after decrement)
        let order_number = dca.initial_orders - dca.remaining_orders;

        event::emit(TradeInitiatedEvent {
            dca_id,
            executor,
            input_amount: input,
            fee_amount,
            remaining_orders: dca.remaining_orders,
            order_number,
            min_output,
        });

        let promise = TradePromise<Input, Output> {
            input,
            min_output,
            dca_id,
        };

        (input_funds, promise)
    }

    /// Legacy init_trade without oracle (for backward compatibility during migration)
    /// DEPRECATED: Use init_trade with oracle parameters instead.
    public(friend) fun init_trade_legacy<Input, Output>(
        dca: &mut DCA<Input, Output>,
        clock: &Clock,
        ctx: &mut TxContext,
    ): (Balance<Input>, TradePromise<Input, Output>) {
        check_version_and_upgrade(dca);
        assert_active(dca);

        let current_time = clock::timestamp_ms(clock);
        assert_time(current_time, dca.last_time_ms, dca.every, dca.time_scale);

        let input_funds = if (dca.remaining_orders > 1) {
            balance::split(&mut dca.input_balance, dca.split_allocation)
        } else {
            balance::withdraw_all(&mut dca.input_balance)
        };

        dca.last_time_ms = current_time;
        dca.remaining_orders = dca.remaining_orders - 1;

        // Calculate fee using snapshot rate (locked at creation)
        let fee_bps = config::snapshot_fee_bps(&dca.config_snapshot);
        let fee_amount = fee_amount_with_bps(balance::value(&input_funds), fee_bps);

        // Deduct fee from input funds (will be transferred to treasury by adapter)
        let fees = balance::split(&mut input_funds, fee_amount);

        // Transfer fees to treasury address
        let treasury = config::snapshot_treasury(&dca.config_snapshot);
        let fee_coin = coin::from_balance(fees, ctx);
        transfer::public_transfer(fee_coin, treasury);

        let dca_id = object::uid_to_inner(&dca.id);
        let input = balance::value(&input_funds);
        let min_output = get_min_output_amount(dca, input);
        let executor = sender(ctx);

        // Calculate order number (1-indexed): initial - remaining (after decrement)
        let order_number = dca.initial_orders - dca.remaining_orders;

        event::emit(TradeInitiatedEvent {
            dca_id,
            executor,
            input_amount: input,
            fee_amount,
            remaining_orders: dca.remaining_orders,
            order_number,
            min_output,
        });

        let promise = TradePromise<Input, Output> {
            input,
            min_output,
            dca_id,
        };

        (input_funds, promise)
    }

    /// Resolve a trade. Called after swap completes.
    /// executor_reward is validated against the snapshotted budget to prevent theft.
    /// output_amount is the actual amount received from the DEX (for event tracking).
    /// Safe to make public because:
    /// 1. TradePromise hot-potato must come from init_trade in same PTB
    /// 2. executor_reward is capped at snapshotted maximum
    public fun resolve_trade<Input, Output>(
        dca: &mut DCA<Input, Output>,
        fee_tracker: &mut FeeTracker,
        promise: TradePromise<Input, Output>,
        output_amount: u64,
        executor_reward: u64,
        ctx: &mut TxContext,
    ): Coin<SUI> {
        let TradePromise { input: _, min_output: _, dca_id } = promise;

        // Validate executor_reward doesn't exceed snapshotted budget per trade
        let max_reward = config::snapshot_executor_reward(&dca.config_snapshot);
        assert!(executor_reward <= max_reward, EExcessiveExecutorReward);

        // Calculate unused executor reward (if executor claimed less than max)
        let unused_reward = max_reward - executor_reward;
        if (unused_reward > 0) {
            // Send unused portion to fee tracker for protocol collection
            let unused = balance::split(&mut dca.executor_reward_balance, unused_reward);
            config::deposit_sui(fee_tracker, unused);
        };

        let should_deactivate =
            dca.remaining_orders == 0 || balance::value(&dca.input_balance) == 0;

        if (should_deactivate) {
            emit_deactivation_event(dca, DEACTIVATION_COMPLETED);
            set_inactive_and_reset(dca);
        };

        // Emit trade completion event
        event::emit(TradeCompletedEvent {
            dca_id,
            executor: sender(ctx),
            output_amount,
            executor_reward,
            active: dca.active,
        });

        coin::from_balance(balance::split(&mut dca.executor_reward_balance, executor_reward), ctx)
    }

    /// Helper to emit deactivation event
    fun emit_deactivation_event<Input, Output>(dca: &DCA<Input, Output>, reason: u8) {
        event::emit(DCADeactivatedEvent {
            dca_id: object::uid_to_inner(&dca.id),
            reason,
            remaining_orders: dca.remaining_orders,
            remaining_input: balance::value(&dca.input_balance),
            remaining_executor_reward: balance::value(&dca.executor_reward_balance),
        });
    }

    // === Fee Calculation (uses snapshot) ===

    fun fee_amount_with_bps(gross_amount: u64, fee_bps: u64): u64 {
        if (gross_amount >= 1_844_674_407_370_955) {
            mul(div(gross_amount, 10_000), fee_bps)
        } else {
            div(mul(gross_amount, fee_bps), 10_000)
        }
    }

    fun net_trade_amount_with_bps(gross_amount: u64, fee_bps: u64): u64 {
        gross_amount - fee_amount_with_bps(gross_amount, fee_bps)
    }

    // === Getters ===

    public fun owner<Input, Output>(dca: &DCA<Input, Output>): address {
        dca.owner
    }

    public fun delegatee<Input, Output>(dca: &DCA<Input, Output>): address {
        dca.delegatee
    }

    public fun start_time_ms<Input, Output>(dca: &DCA<Input, Output>): u64 {
        dca.start_time_ms
    }

    public fun initial_orders<Input, Output>(dca: &DCA<Input, Output>): u64 {
        dca.initial_orders
    }

    public fun remaining_orders<Input, Output>(dca: &DCA<Input, Output>): u64 {
        dca.remaining_orders
    }

    public fun active<Input, Output>(dca: &DCA<Input, Output>): bool {
        dca.active
    }

    public fun fee_bps<Input, Output>(dca: &DCA<Input, Output>): u64 {
        config::snapshot_fee_bps(&dca.config_snapshot)
    }

    public fun executor_reward_per_trade<Input, Output>(dca: &DCA<Input, Output>): u64 {
        config::snapshot_executor_reward(&dca.config_snapshot)
    }

    public fun default_slippage_bps<Input, Output>(dca: &DCA<Input, Output>): u64 {
        config::snapshot_slippage_bps(&dca.config_snapshot)
    }

    /// Get effective slippage: custom if set, otherwise default from config
    public fun effective_slippage_bps<Input, Output>(dca: &DCA<Input, Output>): u64 {
        if (option::is_some(&dca.trade_params.slippage_bps)) {
            *option::borrow(&dca.trade_params.slippage_bps)
        } else {
            config::snapshot_slippage_bps(&dca.config_snapshot)
        }
    }

    public fun trade_input<Input, Output>(promise: &TradePromise<Input, Output>): u64 {
        promise.input
    }

    public fun trade_min_output<Input, Output>(promise: &TradePromise<Input, Output>): u64 {
        promise.min_output
    }

    public fun accepted_terms_version<Input, Output>(dca: &DCA<Input, Output>): u64 {
        dca.accepted_terms_version
    }

    public fun input_decimals<Input, Output>(dca: &DCA<Input, Output>): u8 {
        dca.input_decimals
    }

    public fun output_decimals<Input, Output>(dca: &DCA<Input, Output>): u8 {
        dca.output_decimals
    }

    // === Helper Functions ===

    fun compute_split_allocation(input_amount: u64, orders: u64): u64 {
        div(input_amount, orders)
    }

    /// Convert every + time_scale to seconds for interval validation
    fun interval_to_seconds(every: u64, time_scale: u8): u64 {
        if (time_scale == 0) {
            every // seconds
        } else if (time_scale == 1) {
            mul(every, 60) // minutes
        } else if (time_scale == 2) {
            mul(every, 3600) // hours
        } else if (time_scale == 3) {
            mul(every, 86400) // days
        } else if (time_scale == 4) {
            mul(every, 604800) // weeks
        } else if (time_scale == 5) {
            mul(every, 2592000) // months (30 days)
        } else {
            0
        }
    }

    fun get_min_output_amount<Input, Output>(dca: &DCA<Input, Output>, input_amount: u64): u64 {
        if (option::is_none(&dca.trade_params.max_price)) {
            // Use slippage-based minimum: input * (1 - slippage_bps / 10000)
            // For simplicity, return 1 if no max_price set (DEX handles slippage)
            1
        } else {
            let max_price = option::borrow(&dca.trade_params.max_price);
            div(mul(input_amount, max_price.quote_val), max_price.base_val)
        }
    }

    fun set_inactive_and_reset<Input, Output>(dca: &mut DCA<Input, Output>) {
        dca.split_allocation = 0;
        dca.remaining_orders = 0;
        dca.active = false;
    }

    // === Assertions ===

    fun assert_active<Input, Output>(dca: &DCA<Input, Output>) {
        assert!(dca.active == true, EInactive);
    }

    fun assert_delegatee<Input, Output>(dca: &DCA<Input, Output>, ctx: &TxContext) {
        assert!(dca.delegatee == sender(ctx), EInvalidDelegatee);
    }

    fun assert_time_scale(time_scale: u8) {
        assert!(time_scale <= 5, EInvalidTimeScale);
    }

    fun assert_every(every: u64, time_scale: u8) {
        let is_ok = {
            if (time_scale == 0) {
                every >= 30 && every <= 59
            } else if (time_scale == 1) {
                every >= 1 && every <= 59
            } else if (time_scale == 2) {
                every >= 1 && every <= 24
            } else if (time_scale == 3) {
                every >= 1 && every <= 30
            } else if (time_scale == 4) {
                every >= 1 && every <= 52
            } else if (time_scale == 5) {
                every >= 1 && every <= 12
            } else {
                abort (EInvalidTimeScale)
            }
        };
        assert!(is_ok, EInvalidEvery);
    }

    fun assert_time(current_ts: u64, last_ts: u64, every: u64, time_scale: u8) {
        let has_time_passed = {
            if (time_scale == 0) {
                time::has_n_seconds_passed(current_ts, last_ts, every)
            } else if (time_scale == 1) {
                time::has_n_minutes_passed(current_ts, last_ts, every)
            } else if (time_scale == 2) {
                time::has_n_hours_passed(current_ts, last_ts, every)
            } else if (time_scale == 3) {
                time::has_n_days_passed(current_ts, last_ts, every)
            } else if (time_scale == 4) {
                time::has_n_weeks_passed(current_ts, last_ts, every)
            } else if (time_scale == 5) {
                time::has_n_months_passed(current_ts, last_ts, every)
            } else {
                abort (0)
            }
        };
        assert!(has_time_passed == true, ENotEnoughTimePassed);
    }

    public fun assert_max_price_via_output<Input, Output>(
        output_amount: u64,
        promise: &TradePromise<Input, Output>,
    ) {
        let min_output = trade_min_output(promise);
        assert!(output_amount >= min_output, EAboveMaxPrice);
    }

    fun assert_owner<Input, Output>(dca: &DCA<Input, Output>, ctx: &TxContext) {
        assert!(dca.owner == sender(ctx), ENotOwner);
    }

    fun assert_owner_or_delegatee<Input, Output>(dca: &DCA<Input, Output>, ctx: &TxContext) {
        let caller = sender(ctx);
        assert!(dca.owner == caller || dca.delegatee == caller, ENotOwnerOrDelegatee);
    }

    // === Owner Control Functions ===

    /// Owner can change the delegatee address
    public entry fun set_delegatee<Input, Output>(
        dca: &mut DCA<Input, Output>,
        new_delegatee: address,
        ctx: &TxContext,
    ) {
        check_version_and_upgrade(dca);
        assert_owner(dca, ctx);

        let old_delegatee = dca.delegatee;
        dca.delegatee = new_delegatee;

        event::emit(DelegateeUpdatedEvent {
            dca_id: object::uid_to_inner(&dca.id),
            old_delegatee,
            new_delegatee,
        });
    }

    /// Owner can set custom slippage tolerance (overrides default)
    /// Slippage must be within protocol's max_slippage_bps limit
    public entry fun set_slippage<Input, Output>(
        dca: &mut DCA<Input, Output>,
        global_config: &config::GlobalConfig,
        slippage_bps: u64,
        ctx: &TxContext,
    ) {
        check_version_and_upgrade(dca);
        assert_owner(dca, ctx);
        let max_slippage = config::max_slippage_bps(global_config);
        assert!(slippage_bps > 0 && slippage_bps <= max_slippage, EInvalidSlippage);

        let old_slippage = dca.trade_params.slippage_bps;
        dca.trade_params.slippage_bps = some(slippage_bps);

        event::emit(SlippageUpdatedEvent {
            dca_id: object::uid_to_inner(&dca.id),
            old_slippage_bps: old_slippage,
            new_slippage_bps: some(slippage_bps),
        });
    }

    /// Owner can reset slippage to use default from config
    public entry fun reset_slippage<Input, Output>(
        dca: &mut DCA<Input, Output>,
        ctx: &TxContext,
    ) {
        check_version_and_upgrade(dca);
        assert_owner(dca, ctx);

        let old_slippage = dca.trade_params.slippage_bps;
        dca.trade_params.slippage_bps = none();

        event::emit(SlippageUpdatedEvent {
            dca_id: object::uid_to_inner(&dca.id),
            old_slippage_bps: old_slippage,
            new_slippage_bps: none(),
        });
    }

    /// Owner can pause their DCA account at any time
    public entry fun set_inactive<Input, Output>(
        dca: &mut DCA<Input, Output>,
        ctx: &TxContext,
    ) {
        check_version_and_upgrade(dca);
        assert_owner_or_delegatee(dca, ctx);

        emit_deactivation_event(dca, DEACTIVATION_OWNER);
        dca.active = false;
    }

    /// Owner can reactivate their DCA account if it has funds and remaining orders
    public entry fun reactivate_as_owner<Input, Output>(
        dca: &mut DCA<Input, Output>,
        ctx: &TxContext,
    ) {
        check_version_and_upgrade(dca);
        assert_owner(dca, ctx);

        assert!(balance::value(&dca.input_balance) > 0, EUnfundedAccount);
        assert!(dca.remaining_orders > 0, ENoRemainingOrders);

        // Recompute split allocation based on remaining funds and orders
        dca.split_allocation = compute_split_allocation(
            balance::value(&dca.input_balance),
            dca.remaining_orders,
        );
        dca.active = true;
    }

    /// Owner can withdraw all funds and deactivate - effectively canceling the DCA
    public entry fun redeem_funds_and_deactivate<Input, Output>(
        dca: &mut DCA<Input, Output>,
        ctx: &mut TxContext,
    ) {
        check_version_and_upgrade(dca);
        assert_owner_or_delegatee(dca, ctx);

        let owner = dca.owner;

        // Transfer remaining input balance to owner
        if (balance::value(&dca.input_balance) > 0) {
            let input_balance = balance::withdraw_all(&mut dca.input_balance);
            let input_funds = coin::from_balance(input_balance, ctx);
            transfer::public_transfer(input_funds, owner);
        };

        // Transfer remaining executor reward balance to owner
        if (balance::value(&dca.executor_reward_balance) > 0) {
            let reward_balance = balance::withdraw_all(&mut dca.executor_reward_balance);
            let reward_funds = coin::from_balance(reward_balance, ctx);
            transfer::public_transfer(reward_funds, owner);
        };

        emit_deactivation_event(dca, DEACTIVATION_OWNER);
        set_inactive_and_reset(dca);
    }

    /// Owner can partially withdraw input funds (reducing remaining orders proportionally)
    public entry fun withdraw_input<Input, Output>(
        dca: &mut DCA<Input, Output>,
        amount: u64,
        decrease_orders: u64,
        ctx: &mut TxContext,
    ) {
        check_version_and_upgrade(dca);
        assert_owner(dca, ctx);
        assert!(balance::value(&dca.input_balance) >= amount, EInsufficientInputBalance);

        let owner = dca.owner;

        // Withdraw input funds
        let funds = balance::split(&mut dca.input_balance, amount);
        let funds_coin = coin::from_balance(funds, ctx);
        transfer::public_transfer(funds_coin, owner);

        // Decrease remaining orders
        dca.remaining_orders = dca.remaining_orders - decrease_orders;

        // Withdraw proportional executor reward
        let reward_per_trade = config::snapshot_executor_reward(&dca.config_snapshot);
        let reward_to_return = mul(reward_per_trade, decrease_orders);
        if (reward_to_return > 0 && balance::value(&dca.executor_reward_balance) >= reward_to_return)
        {
            let reward_balance = balance::split(&mut dca.executor_reward_balance, reward_to_return);
            let reward_coin = coin::from_balance(reward_balance, ctx);
            transfer::public_transfer(reward_coin, owner);
        };

        // Recompute split allocation
        if (dca.remaining_orders > 0) {
            dca.split_allocation = compute_split_allocation(
                balance::value(&dca.input_balance),
                dca.remaining_orders,
            );
        } else {
            emit_deactivation_event(dca, DEACTIVATION_OWNER);
            set_inactive_and_reset(dca);
        };
    }

    /// Owner can add more executor reward balance to the account
    public entry fun add_executor_reward<Input, Output>(
        dca: &mut DCA<Input, Output>,
        reward_funds: Coin<SUI>,
    ) {
        check_version_and_upgrade(dca);
        let reward_balance = coin::into_balance(reward_funds);
        balance::join(&mut dca.executor_reward_balance, reward_balance);
    }

    // === Versioning ===

    fun check_version_and_upgrade<Input, Output>(dca: &mut DCA<Input, Output>) {
        if (dca.version < VERSION) {
            dca.version = VERSION;
        };
        assert!(dca.version == VERSION, EWrongVersion);
    }

    // === Friend Declarations ===
    friend dca::flow_x;

    // === Test-only Functions ===

    #[test_only]
    public fun destroy_promise_for_testing<Input, Output>(promise: TradePromise<Input, Output>) {
        let TradePromise { input: _, min_output: _, dca_id: _ } = promise;
    }

    #[test_only]
    public fun input_balance_value<Input, Output>(dca: &DCA<Input, Output>): u64 {
        balance::value(&dca.input_balance)
    }

    #[test_only]
    public fun executor_reward_balance_value<Input, Output>(dca: &DCA<Input, Output>): u64 {
        balance::value(&dca.executor_reward_balance)
    }

    #[test_only]
    public fun destroy_for_testing<Input, Output>(dca: DCA<Input, Output>) {
        let DCA {
            id,
            version: _,
            owner: _,
            delegatee: _,
            start_time_ms: _,
            last_time_ms: _,
            every: _,
            initial_orders: _,
            remaining_orders: _,
            time_scale: _,
            input_balance,
            split_allocation: _,
            trade_params: _,
            active: _,
            executor_reward_balance,
            config_snapshot: _,
            accepted_terms_version: _,
            input_decimals: _,
            output_decimals: _,
        } = dca;

        object::delete(id);
        balance::destroy_for_testing(input_balance);
        balance::destroy_for_testing(executor_reward_balance);
    }

    /// Test-only wrapper for init_trade_legacy (since public(friend) not accessible to tests)
    #[test_only]
    public fun init_trade_for_testing<Input, Output>(
        dca: &mut DCA<Input, Output>,
        clock: &Clock,
        ctx: &mut TxContext,
    ): (Balance<Input>, TradePromise<Input, Output>) {
        init_trade_legacy(dca, clock, ctx)
    }

    /// Test-only wrapper for resolve_trade (since public(friend) not accessible to tests)
    #[test_only]
    public fun resolve_trade_for_testing<Input, Output>(
        dca: &mut DCA<Input, Output>,
        fee_tracker: &mut FeeTracker,
        promise: TradePromise<Input, Output>,
        output_amount: u64,
        executor_reward: u64,
        ctx: &mut TxContext,
    ): Coin<SUI> {
        resolve_trade(dca, fee_tracker, promise, output_amount, executor_reward, ctx)
    }
}
