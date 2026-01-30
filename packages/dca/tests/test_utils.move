/// @title Test Utilities
/// @notice Shared helper functions for DCA tests
#[test_only]
module dca::test_utils {
    use dca::config::{Self, GlobalConfig, FeeTracker, AdminCap};
    use dca::dca::{Self, DCA};
    use dca::terms::{Self, TermsRegistry};
    use dca::time_scale;
    use sui::clock::{Self, Clock};
    use sui::coin;
    use sui::sui::SUI;
    use sui::test_scenario::{Self as ts, Scenario, ctx};

    // Token decimals
    const USDC_DECIMALS: u8 = 6;
    const SUI_DECIMALS: u8 = 9;

    // Default addresses
    const DEFAULT_DELEGATEE: address = @0x2;

    // Test token types
    struct USDC has drop {}

    /// Create a standard DCA account for testing
    public fun create_standard_dca(
        scenario: &mut Scenario,
        config: &GlobalConfig,
        clock: &Clock,
        delegatee: address,
        input_amount: u64,
        total_orders: u64,
        every: u64,
        time_scale: u8,
    ): (DCA<USDC, SUI>, TermsRegistry) {
        let terms_registry = terms::create_terms_registry_for_testing(ctx(scenario));

        let input_funds = coin::mint_for_testing<USDC>(input_amount, ctx(scenario));
        let executor_reward_per_trade = config::executor_reward_per_trade(config);
        let executor_reward_funds = coin::mint_for_testing<SUI>(executor_reward_per_trade * total_orders, ctx(scenario));

        let dca = dca::new<USDC, SUI>(
            config,
            &terms_registry,
            clock,
            delegatee,
            input_funds,
            every,
            total_orders,
            time_scale,
            0, // start_time_ms: 0 = start now
            1, // accepted_terms_version
            USDC_DECIMALS,
            SUI_DECIMALS,
            &mut executor_reward_funds,
            ctx(scenario),
        );

        coin::burn_for_testing(executor_reward_funds);
        (dca, terms_registry)
    }

    /// Create a minimal DCA account (1 order, 1 minute interval)
    public fun create_minimal_dca(
        scenario: &mut Scenario,
        config: &GlobalConfig,
        clock: &Clock,
    ): (DCA<USDC, SUI>, TermsRegistry) {
        create_standard_dca(
            scenario,
            config,
            clock,
            DEFAULT_DELEGATEE,
            100_000,
            1,
            1,
            time_scale::minute(),
        )
    }

    /// Create a monthly DCA account (12 orders)
    public fun create_monthly_dca(
        scenario: &mut Scenario,
        config: &GlobalConfig,
        clock: &Clock,
    ): (DCA<USDC, SUI>, TermsRegistry) {
        create_standard_dca(
            scenario,
            config,
            clock,
            DEFAULT_DELEGATEE,
            1_200_000,
            12,
            1,
            time_scale::month(),
        )
    }

    /// Create test infrastructure (config, fee_tracker, admin_cap, clock)
    public fun create_test_infra(
        scenario: &mut Scenario,
    ): (GlobalConfig, FeeTracker, AdminCap, Clock) {
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(scenario));
        let clock = clock::create_for_testing(ctx(scenario));
        (config, fee_tracker, admin_cap, clock)
    }

    /// Destroy test infrastructure
    public fun destroy_test_infra(
        config: GlobalConfig,
        fee_tracker: FeeTracker,
        admin_cap: AdminCap,
        clock: Clock,
    ) {
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        clock::destroy_for_testing(clock);
    }

    /// Advance clock to the next valid execution time for a monthly DCA
    public fun advance_to_next_month(clock: &mut Clock) {
        let current = sui::clock::timestamp_ms(clock);
        // Advance by 30 days + 1 second to ensure we're past the interval
        clock::set_for_testing(clock, current + 30 * 24 * 60 * 60 * 1000 + 1000);
    }

    /// Advance clock to the next valid execution time for a minute DCA
    public fun advance_to_next_minute(clock: &mut Clock) {
        let current = sui::clock::timestamp_ms(clock);
        // Advance by 60 seconds + 1 second
        clock::set_for_testing(clock, current + 61_000);
    }
}
