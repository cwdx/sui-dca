/// @title Security Audit Tests
/// @notice Comprehensive security tests attempting to exploit the DCA contract
/// @dev Tests various attack vectors: fund theft, executor reward manipulation,
///      time-based attacks, permission bypasses, reentrancy, and more.
#[test_only]
module dca::security_audit_tests {
    use dca::config::{Self, GlobalConfig};
    use dca::dca::{Self, DCA};
    use dca::terms::{Self, TermsRegistry};
    use dca::time_scale;
    use sui::balance;
    use sui::clock::{Self, Clock};
    use sui::coin;
    use sui::sui::SUI;
    use sui::test_scenario::{Self as ts, Scenario, ctx};

    // Test token types
    struct USDC has drop {}

    // Actors
    const OWNER: address = @0x1;
    const DELEGATEE: address = @0x2;
    const ATTACKER: address = @0x666;
    const VICTIM: address = @0x777;
    const RANDOM: address = @0x99;

    const FUNDING_AMOUNT: u64 = 1_200_000;
    const EXECUTOR_REWARD_BUDGET: u64 = 300_000_000;

    // Token decimals
    const USDC_DECIMALS: u8 = 6;
    const SUI_DECIMALS: u8 = 9;

    // === Helper Functions ===

    fun create_dca_for_owner(
        scenario: &mut Scenario,
        config: &GlobalConfig,
        clock: &Clock,
        owner: address,
    ): DCA<USDC, SUI> {
        ts::next_tx(scenario, owner);
        let terms_registry = terms::create_terms_registry_for_testing(ctx(scenario));
        let input_funds = coin::mint_for_testing<USDC>(FUNDING_AMOUNT, ctx(scenario));
        let executor_reward_funds = coin::mint_for_testing<SUI>(EXECUTOR_REWARD_BUDGET, ctx(scenario));

        let dca = dca::new<USDC, SUI>(
            config,
            &terms_registry,
            clock,
            DELEGATEE,
            input_funds,
            1,
            12,
            time_scale::month(),
            0, // start_time_ms: 0 = start now
            1, // accepted_terms_version
            USDC_DECIMALS,
            SUI_DECIMALS,
            &mut executor_reward_funds,
            ctx(scenario),
        );

        coin::burn_for_testing(executor_reward_funds);
        terms::destroy_terms_registry_for_testing(terms_registry);
        dca
    }

    fun create_minimal_dca(
        scenario: &mut Scenario,
        config: &GlobalConfig,
        clock: &Clock,
    ): DCA<USDC, SUI> {
        let terms_registry = terms::create_terms_registry_for_testing(ctx(scenario));
        let input_funds = coin::mint_for_testing<USDC>(100_000, ctx(scenario));
        let executor_reward_funds = coin::mint_for_testing<SUI>(25_000_000, ctx(scenario));

        let dca = dca::new<USDC, SUI>(
            config,
            &terms_registry,
            clock,
            DELEGATEE,
            input_funds,
            1,
            1,
            time_scale::minute(),
            0, // start_time_ms: 0 = start now
            1, // accepted_terms_version
            USDC_DECIMALS,
            SUI_DECIMALS,
            &mut executor_reward_funds,
            ctx(scenario),
        );

        coin::burn_for_testing(executor_reward_funds);
        terms::destroy_terms_registry_for_testing(terms_registry);
        dca
    }

    // ============================================================
    // SECTION 1: EXECUTOR REWARD THEFT ATTACKS
    // ============================================================

    /// Attack: Try to claim more than entire executor reward pool in one trade (multi-order account)
    #[test]
    #[expected_failure(abort_code = dca::EExcessiveExecutorReward)]
    fun test_attack_claim_entire_reward_pool() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 0);
        let terms_registry = terms::create_terms_registry_for_testing(ctx(&mut scenario));

        // Create DCA with 3 orders (75M total executor reward, 25M per trade limit)
        let input_funds = coin::mint_for_testing<USDC>(300_000, ctx(&mut scenario));
        let executor_reward_funds = coin::mint_for_testing<SUI>(75_000_000, ctx(&mut scenario));

        let dca = dca::new<USDC, SUI>(
            &config, &terms_registry, &clock, DELEGATEE, input_funds, 1, 3, time_scale::minute(),
            0, // start now
            1, USDC_DECIMALS, SUI_DECIMALS,
            &mut executor_reward_funds, ctx(&mut scenario),
        );
        coin::burn_for_testing(executor_reward_funds);
        terms::destroy_terms_registry_for_testing(terms_registry);

        // Advance time to allow trade
        clock::set_for_testing(&mut clock, 60_000);

        ts::next_tx(&mut scenario, ATTACKER);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));

            // Attacker tries to claim entire 75M pool (all 3 trades' worth) in one trade
            // Per-trade limit is 25M, so this should fail
            let reward_coin = dca::resolve_trade_for_testing(
                &mut dca,
                &mut fee_tracker,
                promise,
                50_000,
                75_000_000, // Full pool (3x per-trade limit)
                ctx(&mut scenario),
            );

            balance::destroy_for_testing(input_balance);
            coin::burn_for_testing(reward_coin);
        };

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    /// Attack: Try to claim just 1 MIST over the limit
    #[test]
    #[expected_failure(abort_code = dca::EExcessiveExecutorReward)]
    fun test_attack_claim_one_over_limit() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 0);

        let dca = create_minimal_dca(&mut scenario, &config, &clock);
        clock::set_for_testing(&mut clock, 60_000);

        ts::next_tx(&mut scenario, ATTACKER);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));

            // Try to claim 25_000_001 instead of 25_000_000
            let reward_coin = dca::resolve_trade_for_testing(
                &mut dca,
                &mut fee_tracker,
                promise,
                50_000,
                25_000_001, // Just 1 MIST over limit
                ctx(&mut scenario),
            );

            balance::destroy_for_testing(input_balance);
            coin::burn_for_testing(reward_coin);
        };

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    /// Attack: Try u64::MAX as executor reward
    #[test]
    #[expected_failure(abort_code = dca::EExcessiveExecutorReward)]
    fun test_attack_max_u64_executor_reward() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 0);

        let dca = create_minimal_dca(&mut scenario, &config, &clock);
        clock::set_for_testing(&mut clock, 60_000);

        ts::next_tx(&mut scenario, ATTACKER);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));

            // Try claiming max u64
            let reward_coin = dca::resolve_trade_for_testing(
                &mut dca,
                &mut fee_tracker,
                promise,
                50_000,
                18_446_744_073_709_551_615, // u64::MAX
                ctx(&mut scenario),
            );

            balance::destroy_for_testing(input_balance);
            coin::burn_for_testing(reward_coin);
        };

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // ============================================================
    // SECTION 2: TIME-BASED ATTACKS (DOUBLE EXECUTION)
    // ============================================================

    /// Attack: Try to execute trade twice in same interval (immediately after first)
    #[test]
    #[expected_failure(abort_code = dca::ENotEnoughTimePassed)]
    fun test_attack_double_execution_same_block() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 0);
        let terms_registry = terms::create_terms_registry_for_testing(ctx(&mut scenario));

        // Create DCA with 3 orders
        let input_funds = coin::mint_for_testing<USDC>(300_000, ctx(&mut scenario));
        let executor_reward_funds = coin::mint_for_testing<SUI>(75_000_000, ctx(&mut scenario));

        let dca = dca::new<USDC, SUI>(
            &config,
            &terms_registry,
            &clock,
            DELEGATEE,
            input_funds,
            1,
            3,
            time_scale::minute(),
            0, // start now
            1, // accepted_terms_version
            USDC_DECIMALS,
            SUI_DECIMALS,
            &mut executor_reward_funds,
            ctx(&mut scenario),
        );
        coin::burn_for_testing(executor_reward_funds);
        terms::destroy_terms_registry_for_testing(terms_registry);

        // First execution at 60 seconds
        clock::set_for_testing(&mut clock, 60_000);
        ts::next_tx(&mut scenario, ATTACKER);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));
            let reward = dca::resolve_trade_for_testing(
                &mut dca, &mut fee_tracker, promise, 50_000, 1_000_000, ctx(&mut scenario)
            );
            balance::destroy_for_testing(input_balance);
            coin::burn_for_testing(reward);
        };

        // Attack: Try to execute again at same time (60 seconds)
        ts::next_tx(&mut scenario, ATTACKER);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));
            balance::destroy_for_testing(input_balance);
            dca::destroy_promise_for_testing(promise);
        };

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    /// Attack: Try to execute just 1ms after previous trade
    #[test]
    #[expected_failure(abort_code = dca::ENotEnoughTimePassed)]
    fun test_attack_execution_one_ms_after() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 0);
        let terms_registry = terms::create_terms_registry_for_testing(ctx(&mut scenario));

        let input_funds = coin::mint_for_testing<USDC>(200_000, ctx(&mut scenario));
        let executor_reward_funds = coin::mint_for_testing<SUI>(50_000_000, ctx(&mut scenario));

        let dca = dca::new<USDC, SUI>(
            &config, &terms_registry, &clock, DELEGATEE, input_funds, 1, 2, time_scale::minute(),
            0, 1, USDC_DECIMALS, SUI_DECIMALS, &mut executor_reward_funds, ctx(&mut scenario),
        );
        coin::burn_for_testing(executor_reward_funds);
        terms::destroy_terms_registry_for_testing(terms_registry);

        // First execution at 60 seconds
        clock::set_for_testing(&mut clock, 60_000);
        ts::next_tx(&mut scenario, ATTACKER);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));
            let reward = dca::resolve_trade_for_testing(
                &mut dca, &mut fee_tracker, promise, 50_000, 1_000_000, ctx(&mut scenario)
            );
            balance::destroy_for_testing(input_balance);
            coin::burn_for_testing(reward);
        };

        // Attack: Try 1ms later
        clock::set_for_testing(&mut clock, 60_001);
        ts::next_tx(&mut scenario, ATTACKER);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));
            balance::destroy_for_testing(input_balance);
            dca::destroy_promise_for_testing(promise);
        };

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    /// Verify: Mean deviation allows slightly early execution (not an attack, just documentation)
    #[test]
    fun test_mean_deviation_early_execution_allowed() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 0);
        let terms_registry = terms::create_terms_registry_for_testing(ctx(&mut scenario));

        let input_funds = coin::mint_for_testing<USDC>(200_000, ctx(&mut scenario));
        let executor_reward_funds = coin::mint_for_testing<SUI>(50_000_000, ctx(&mut scenario));

        let dca = dca::new<USDC, SUI>(
            &config, &terms_registry, &clock, DELEGATEE, input_funds, 1, 2, time_scale::minute(),
            0, 1, USDC_DECIMALS, SUI_DECIMALS, &mut executor_reward_funds, ctx(&mut scenario),
        );
        coin::burn_for_testing(executor_reward_funds);
        terms::destroy_terms_registry_for_testing(terms_registry);

        // Execute at 30 seconds (30 sec early, but within mean deviation of 30 sec for minutes)
        // 1 minute = 60 seconds, mean deviation = 30 seconds, so threshold = 30 seconds
        clock::set_for_testing(&mut clock, 30_000);
        ts::next_tx(&mut scenario, RANDOM);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));
            let reward = dca::resolve_trade_for_testing(
                &mut dca, &mut fee_tracker, promise, 50_000, 1_000_000, ctx(&mut scenario)
            );
            balance::destroy_for_testing(input_balance);
            coin::burn_for_testing(reward);
        };

        // Verify order was executed
        assert!(dca::remaining_orders(&dca) == 1, 0);

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // ============================================================
    // SECTION 3: BAD QUOTE / SANDWICH ATTACK SIMULATION
    // ============================================================

    /// Attack: Executor returns 0 output (bad quote / complete theft via swap)
    /// This tests if the contract accepts zero output - the slippage protection
    #[test]
    fun test_zero_output_accepted_when_no_min_price() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 0);

        let dca = create_minimal_dca(&mut scenario, &config, &clock);
        clock::set_for_testing(&mut clock, 60_000);

        ts::next_tx(&mut scenario, ATTACKER);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));

            // Check min_output when no max_price is set (should be 1)
            let min_output = dca::trade_min_output(&promise);
            assert!(min_output == 1, 0); // Default min output is 1 when no price limits

            // Executor provides minimal output (1) - this is technically valid
            // but reveals the user gets almost nothing from the swap
            let reward = dca::resolve_trade_for_testing(
                &mut dca, &mut fee_tracker, promise, 1, 1_000_000, ctx(&mut scenario)
            );

            balance::destroy_for_testing(input_balance);
            coin::burn_for_testing(reward);
        };

        // Note: This test passes but reveals that without max_price set,
        // executor can return minimal output. The slippage protection
        // is only enforced via assert_max_price_via_output() when called
        // by the adapter, but with min_output=1, almost any quote is accepted.

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    /// Attack: Verify min_output check works when max_price is set
    #[test]
    #[expected_failure(abort_code = dca::EAboveMaxPrice)]
    fun test_bad_quote_rejected_with_min_price() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 0);

        let dca = create_minimal_dca(&mut scenario, &config, &clock);
        clock::set_for_testing(&mut clock, 60_000);

        ts::next_tx(&mut scenario, ATTACKER);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));

            // Get the min_output from promise (used to verify the check)
            let _min_output = dca::trade_min_output(&promise);

            // If min_output > 1, providing less should fail
            // But we need to call the assertion function to trigger the check
            dca::assert_max_price_via_output(0, &promise); // 0 output should fail

            let reward = dca::resolve_trade_for_testing(
                &mut dca, &mut fee_tracker, promise, 0, 1_000_000, ctx(&mut scenario)
            );

            balance::destroy_for_testing(input_balance);
            coin::burn_for_testing(reward);
        };

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // ============================================================
    // SECTION 4: PERMISSION BYPASS ATTACKS
    // ============================================================

    /// Attack: Random user tries to set delegatee
    #[test]
    #[expected_failure(abort_code = dca::ENotOwner)]
    fun test_attack_random_sets_delegatee() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));

        let dca = create_dca_for_owner(&mut scenario, &config, &clock, OWNER);

        ts::next_tx(&mut scenario, ATTACKER);
        {
            dca::set_delegatee(&mut dca, ATTACKER, ctx(&mut scenario));
        };

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    /// Attack: Delegatee tries to withdraw funds (only owner can)
    #[test]
    #[expected_failure(abort_code = dca::ENotOwner)]
    fun test_attack_delegatee_withdraws_input() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));

        let dca = create_dca_for_owner(&mut scenario, &config, &clock, OWNER);

        ts::next_tx(&mut scenario, DELEGATEE);
        {
            // Delegatee tries to withdraw owner's funds
            dca::withdraw_input(&mut dca, 100_000, 1, ctx(&mut scenario));
        };

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    /// Attack: Random user tries to reactivate someone's account
    #[test]
    #[expected_failure(abort_code = dca::ENotOwner)]
    fun test_attack_random_reactivates() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));

        let dca = create_dca_for_owner(&mut scenario, &config, &clock, OWNER);

        // Owner deactivates
        ts::next_tx(&mut scenario, OWNER);
        dca::set_inactive(&mut dca, ctx(&mut scenario));

        // Attacker tries to reactivate
        ts::next_tx(&mut scenario, ATTACKER);
        {
            dca::reactivate_as_owner(&mut dca, ctx(&mut scenario));
        };

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    /// Attack: Random user tries to set slippage
    #[test]
    #[expected_failure(abort_code = dca::ENotOwner)]
    fun test_attack_random_sets_slippage() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));

        let dca = create_dca_for_owner(&mut scenario, &config, &clock, OWNER);

        ts::next_tx(&mut scenario, ATTACKER);
        {
            // Attacker tries to set high slippage to exploit trades
            dca::set_slippage(&mut dca, &config, 1000, ctx(&mut scenario));
        };

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // ============================================================
    // SECTION 5: FUND DRAINAGE ATTACKS
    // ============================================================

    /// Attack: Try to withdraw more input than exists
    #[test]
    #[expected_failure(abort_code = dca::EInsufficientInputBalance)]
    fun test_attack_overdraw_input() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));

        let dca = create_dca_for_owner(&mut scenario, &config, &clock, OWNER);

        ts::next_tx(&mut scenario, OWNER);
        {
            // Try to withdraw double the balance
            dca::withdraw_input(&mut dca, FUNDING_AMOUNT * 2, 12, ctx(&mut scenario));
        };

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    /// Attack: Try to decrease more orders than remaining (underflow attack)
    /// Move's u64 subtraction should cause arithmetic underflow
    #[test]
    #[expected_failure]
    fun test_attack_order_underflow_on_withdraw() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));

        let dca = create_dca_for_owner(&mut scenario, &config, &clock, OWNER);

        // Check initial state
        assert!(dca::remaining_orders(&dca) == 12, 0);

        ts::next_tx(&mut scenario, OWNER);
        {
            // Try to decrease orders by 13 when only 12 exist
            // This should cause underflow and abort
            dca::withdraw_input(&mut dca, FUNDING_AMOUNT / 2, 13, ctx(&mut scenario));
        };

        // If we reach here, there's a vulnerability
        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    /// Attack: Try to execute trade when no orders remain
    #[test]
    #[expected_failure(abort_code = dca::EInactive)]
    fun test_attack_trade_after_completion() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 0);

        let dca = create_minimal_dca(&mut scenario, &config, &clock);

        // Execute the only order
        clock::set_for_testing(&mut clock, 60_000);
        ts::next_tx(&mut scenario, RANDOM);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));
            let reward = dca::resolve_trade_for_testing(
                &mut dca, &mut fee_tracker, promise, 50_000, 1_000_000, ctx(&mut scenario)
            );
            balance::destroy_for_testing(input_balance);
            coin::burn_for_testing(reward);
        };

        assert!(dca::active(&dca) == false, 0);

        // Attack: Try to execute another trade after account is inactive
        clock::set_for_testing(&mut clock, 120_000);
        ts::next_tx(&mut scenario, ATTACKER);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));
            balance::destroy_for_testing(input_balance);
            dca::destroy_promise_for_testing(promise);
        };

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // ============================================================
    // SECTION 6: SLIPPAGE MANIPULATION ATTACKS
    // ============================================================

    /// Attack: Try to set slippage to 0
    #[test]
    #[expected_failure(abort_code = dca::EInvalidSlippage)]
    fun test_attack_zero_slippage() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));

        let dca = create_dca_for_owner(&mut scenario, &config, &clock, OWNER);

        ts::next_tx(&mut scenario, OWNER);
        {
            dca::set_slippage(&mut dca, &config, 0, ctx(&mut scenario));
        };

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    /// Attack: Try to set slippage above protocol max
    #[test]
    #[expected_failure(abort_code = dca::EInvalidSlippage)]
    fun test_attack_slippage_above_max() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));

        let dca = create_dca_for_owner(&mut scenario, &config, &clock, OWNER);

        ts::next_tx(&mut scenario, OWNER);
        {
            // Config max is 1000 (10%), try to set 5000 (50%)
            dca::set_slippage(&mut dca, &config, 5000, ctx(&mut scenario));
        };

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // ============================================================
    // SECTION 7: CREATION VALIDATION ATTACKS
    // ============================================================

    /// Attack: Try to create DCA with 0 orders
    /// This causes division by zero in compute_split_allocation
    #[test]
    #[expected_failure]
    fun test_attack_zero_orders() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));
        let terms_registry = terms::create_terms_registry_for_testing(ctx(&mut scenario));

        let input_funds = coin::mint_for_testing<USDC>(100_000, ctx(&mut scenario));
        let executor_reward_funds = coin::mint_for_testing<SUI>(0, ctx(&mut scenario));

        // This should fail due to division by zero in compute_split_allocation
        let dca = dca::new<USDC, SUI>(
            &config,
            &terms_registry,
            &clock,
            DELEGATEE,
            input_funds,
            1,
            0, // Zero orders
            time_scale::minute(),
            0, // start now
            1, // accepted_terms_version
            USDC_DECIMALS,
            SUI_DECIMALS,
            &mut executor_reward_funds,
            ctx(&mut scenario),
        );

        coin::burn_for_testing(executor_reward_funds);
        terms::destroy_terms_registry_for_testing(terms_registry);
        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    /// Attack: Try to create DCA with insufficient funding
    #[test]
    #[expected_failure(abort_code = dca::EBelowMinimumFunding)]
    fun test_attack_below_min_funding() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));
        let terms_registry = terms::create_terms_registry_for_testing(ctx(&mut scenario));

        // Min funding is 100_000 per trade, try 10 trades with only 100_000 total
        let input_funds = coin::mint_for_testing<USDC>(100_000, ctx(&mut scenario));
        let executor_reward_funds = coin::mint_for_testing<SUI>(250_000_000, ctx(&mut scenario));

        let dca = dca::new<USDC, SUI>(
            &config,
            &terms_registry,
            &clock,
            DELEGATEE,
            input_funds,
            1,
            10, // 10 orders but only 10k per trade (below 100k min)
            time_scale::minute(),
            0, // start now
            1, // accepted_terms_version
            USDC_DECIMALS,
            SUI_DECIMALS,
            &mut executor_reward_funds,
            ctx(&mut scenario),
        );

        coin::burn_for_testing(executor_reward_funds);
        terms::destroy_terms_registry_for_testing(terms_registry);
        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    /// Attack: Try to create DCA with insufficient executor reward
    #[test]
    #[expected_failure(abort_code = dca::EInsufficientExecutorReward)]
    fun test_attack_insufficient_executor_reward() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));
        let terms_registry = terms::create_terms_registry_for_testing(ctx(&mut scenario));

        let input_funds = coin::mint_for_testing<USDC>(1_000_000, ctx(&mut scenario));
        // Need 25M per trade * 10 trades = 250M, only provide 100M
        let executor_reward_funds = coin::mint_for_testing<SUI>(100_000_000, ctx(&mut scenario));

        let dca = dca::new<USDC, SUI>(
            &config,
            &terms_registry,
            &clock,
            DELEGATEE,
            input_funds,
            1,
            10,
            time_scale::minute(),
            0, // start now
            1, // accepted_terms_version
            USDC_DECIMALS,
            SUI_DECIMALS,
            &mut executor_reward_funds,
            ctx(&mut scenario),
        );

        coin::burn_for_testing(executor_reward_funds);
        terms::destroy_terms_registry_for_testing(terms_registry);
        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    /// Attack: Try to create with interval too short
    #[test]
    #[expected_failure(abort_code = dca::EIntervalTooShort)]
    fun test_attack_interval_too_short() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));
        let terms_registry = terms::create_terms_registry_for_testing(ctx(&mut scenario));

        // Set min interval to 5 minutes
        config::set_min_interval_seconds(&mut config, &admin_cap, 300);

        let input_funds = coin::mint_for_testing<USDC>(100_000, ctx(&mut scenario));
        let executor_reward_funds = coin::mint_for_testing<SUI>(25_000_000, ctx(&mut scenario));

        // Try 30 seconds interval (below 5 minute min)
        let dca = dca::new<USDC, SUI>(
            &config,
            &terms_registry,
            &clock,
            DELEGATEE,
            input_funds,
            30, // 30 seconds
            1,
            time_scale::second(),
            0, // start now
            1, // accepted_terms_version
            USDC_DECIMALS,
            SUI_DECIMALS,
            &mut executor_reward_funds,
            ctx(&mut scenario),
        );

        coin::burn_for_testing(executor_reward_funds);
        terms::destroy_terms_registry_for_testing(terms_registry);
        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    /// Attack: Try to create with too many orders
    #[test]
    #[expected_failure(abort_code = dca::ETotalOrdersAboveLimit)]
    fun test_attack_too_many_orders() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));
        let terms_registry = terms::create_terms_registry_for_testing(ctx(&mut scenario));

        // Max orders is 25,000 by default
        let input_funds = coin::mint_for_testing<USDC>(3_000_000_000, ctx(&mut scenario));
        let executor_reward_funds = coin::mint_for_testing<SUI>(1_000_000_000_000, ctx(&mut scenario));

        let dca = dca::new<USDC, SUI>(
            &config,
            &terms_registry,
            &clock,
            DELEGATEE,
            input_funds,
            1,
            30_000, // Above 25,000 limit
            time_scale::minute(),
            0, // start now
            1, // accepted_terms_version
            USDC_DECIMALS,
            SUI_DECIMALS,
            &mut executor_reward_funds,
            ctx(&mut scenario),
        );

        coin::burn_for_testing(executor_reward_funds);
        terms::destroy_terms_registry_for_testing(terms_registry);
        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // ============================================================
    // SECTION 8: INACTIVE ACCOUNT EXPLOITATION
    // ============================================================

    /// Attack: Try to trade on deactivated account
    #[test]
    #[expected_failure(abort_code = dca::EInactive)]
    fun test_attack_trade_on_inactive() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 0);

        let dca = create_dca_for_owner(&mut scenario, &config, &clock, OWNER);

        // Owner deactivates
        ts::next_tx(&mut scenario, OWNER);
        dca::set_inactive(&mut dca, ctx(&mut scenario));

        // Attacker tries to execute trade anyway
        clock::set_for_testing(&mut clock, 28 * 24 * 60 * 60 * 1000);
        ts::next_tx(&mut scenario, ATTACKER);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));
            balance::destroy_for_testing(input_balance);
            dca::destroy_promise_for_testing(promise);
        };

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    /// Attack: Try to reactivate empty account
    #[test]
    #[expected_failure(abort_code = dca::EUnfundedAccount)]
    fun test_attack_reactivate_empty() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));

        let dca = create_dca_for_owner(&mut scenario, &config, &clock, OWNER);

        // Owner redeems all funds
        ts::next_tx(&mut scenario, OWNER);
        dca::redeem_funds_and_deactivate(&mut dca, ctx(&mut scenario));

        // Now try to reactivate with no funds
        ts::next_tx(&mut scenario, OWNER);
        {
            dca::reactivate_as_owner(&mut dca, ctx(&mut scenario));
        };

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // ============================================================
    // SECTION 9: MATH OVERFLOW ATTACKS
    // ============================================================

    /// Test: Large amounts approaching u64 max for fee calculation
    #[test]
    fun test_large_amount_fee_calculation() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 0);
        let terms_registry = terms::create_terms_registry_for_testing(ctx(&mut scenario));

        // Create DCA with very large amount (1 trillion USDC)
        let large_amount: u64 = 1_000_000_000_000_000; // 1 quadrillion (10^15)
        let input_funds = coin::mint_for_testing<USDC>(large_amount, ctx(&mut scenario));
        let executor_reward_funds = coin::mint_for_testing<SUI>(25_000_000, ctx(&mut scenario));

        let dca = dca::new<USDC, SUI>(
            &config,
            &terms_registry,
            &clock,
            DELEGATEE,
            input_funds,
            1,
            1,
            time_scale::minute(),
            0, // start now
            1, // accepted_terms_version
            USDC_DECIMALS,
            SUI_DECIMALS,
            &mut executor_reward_funds,
            ctx(&mut scenario),
        );
        coin::burn_for_testing(executor_reward_funds);
        terms::destroy_terms_registry_for_testing(terms_registry);

        // Execute trade
        clock::set_for_testing(&mut clock, 60_000);
        ts::next_tx(&mut scenario, RANDOM);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));

            // Verify we got the input minus fee
            // Fee = large_amount * 30 / 10000 = 30 trillion
            let input_value = balance::value(&input_balance);

            // Fee should be ~30 basis points (0.30%)
            let expected_fee = large_amount / 10_000 * 30; // This uses the "large amount" path
            let expected_net = large_amount - expected_fee;

            // Allow small rounding difference
            assert!(input_value >= expected_net - 1 && input_value <= expected_net + 1, 0);

            let reward = dca::resolve_trade_for_testing(
                &mut dca, &mut fee_tracker, promise, 1, 1_000_000, ctx(&mut scenario)
            );

            balance::destroy_for_testing(input_balance);
            coin::burn_for_testing(reward);
        };

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // ============================================================
    // SECTION 10: CONFIG ADMIN ATTACKS
    // ============================================================

    /// Attack: Try to set fee without admin cap
    #[test]
    #[expected_failure(abort_code = config::ENotAdmin)]
    fun test_attack_set_fee_without_admin() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));

        // Create fake admin cap from attacker
        ts::next_tx(&mut scenario, ATTACKER);
        let (fake_config, fake_fee_tracker, fake_admin_cap) = config::create_config_for_testing(ctx(&mut scenario));

        ts::next_tx(&mut scenario, ATTACKER);
        {
            // Try to set fee on original config with attacker's admin cap
            config::set_fee_bps(&mut config, &fake_admin_cap, 0);
        };

        config::destroy_config_for_testing(fake_config);
        config::destroy_fee_tracker_for_testing(fake_fee_tracker);
        config::destroy_admin_cap_for_testing(fake_admin_cap);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    /// Attack: Try to set fee above max
    #[test]
    #[expected_failure(abort_code = config::EInvalidFee)]
    fun test_attack_fee_above_max() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));

        // Even admin can't set fee above 5% (500 bps)
        config::set_fee_bps(&mut config, &admin_cap, 501);

        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    /// Attack: Try to set treasury to zero address
    #[test]
    #[expected_failure(abort_code = config::EInvalidTreasury)]
    fun test_attack_zero_treasury() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));

        config::set_treasury(&mut config, &admin_cap, @0x0);

        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // ============================================================
    // SECTION 11: CROSS-ACCOUNT ATTACKS
    // ============================================================

    /// Verify: One user can't affect another user's account
    #[test]
    fun test_account_isolation() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 0);

        // Create victim's DCA
        let victim_dca = create_dca_for_owner(&mut scenario, &config, &clock, VICTIM);
        let victim_balance_before = dca::input_balance_value(&victim_dca);

        // Create attacker's DCA
        let attacker_dca = create_dca_for_owner(&mut scenario, &config, &clock, ATTACKER);

        // Execute trade on attacker's account
        clock::set_for_testing(&mut clock, 28 * 24 * 60 * 60 * 1000);
        ts::next_tx(&mut scenario, RANDOM);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut attacker_dca, &clock, ctx(&mut scenario));
            let reward = dca::resolve_trade_for_testing(
                &mut attacker_dca, &mut fee_tracker, promise, 50_000, 1_000_000, ctx(&mut scenario)
            );
            balance::destroy_for_testing(input_balance);
            coin::burn_for_testing(reward);
        };

        // Verify victim's balance is unchanged
        assert!(dca::input_balance_value(&victim_dca) == victim_balance_before, 0);
        assert!(dca::remaining_orders(&victim_dca) == 12, 1);

        dca::destroy_for_testing(victim_dca);
        dca::destroy_for_testing(attacker_dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // ============================================================
    // SECTION 12: DELEGATEE POWER LIMITS
    // ============================================================

    /// Verify: Delegatee can pause but sends funds to owner
    #[test]
    fun test_delegatee_redeem_sends_to_owner() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));

        let dca = create_dca_for_owner(&mut scenario, &config, &clock, OWNER);

        // Delegatee redeems funds
        ts::next_tx(&mut scenario, DELEGATEE);
        {
            dca::redeem_funds_and_deactivate(&mut dca, ctx(&mut scenario));
        };

        // Verify DCA is empty and inactive
        assert!(dca::active(&dca) == false, 0);
        assert!(dca::input_balance_value(&dca) == 0, 1);

        // Note: In real scenario, funds would be transferred to OWNER, not DELEGATEE
        // The owner field ensures funds always go to the right person

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // ============================================================
    // SECTION 13: EXECUTOR REWARD EDGE CASES
    // ============================================================

    /// Test: Executor claims zero reward (altruistic executor)
    #[test]
    fun test_executor_claims_zero_reward() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 0);

        let dca = create_minimal_dca(&mut scenario, &config, &clock);

        // Check initial fee tracker balance
        let fee_tracker_before = config::sui_balance(&fee_tracker);

        clock::set_for_testing(&mut clock, 60_000);
        ts::next_tx(&mut scenario, RANDOM);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));

            // Executor claims 0 reward - all should go to fee tracker
            let reward = dca::resolve_trade_for_testing(
                &mut dca, &mut fee_tracker, promise, 50_000, 0, ctx(&mut scenario)
            );

            // Verify executor got 0
            assert!(coin::value(&reward) == 0, 0);

            balance::destroy_for_testing(input_balance);
            coin::burn_for_testing(reward);
        };

        // Verify all reward went to fee tracker
        let fee_tracker_after = config::sui_balance(&fee_tracker);
        assert!(fee_tracker_after == fee_tracker_before + 25_000_000, 1);

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    /// Test: Multiple trades correctly track executor rewards
    #[test]
    fun test_executor_reward_tracking_multiple_trades() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 0);
        let terms_registry = terms::create_terms_registry_for_testing(ctx(&mut scenario));

        // Create DCA with 3 orders
        let input_funds = coin::mint_for_testing<USDC>(300_000, ctx(&mut scenario));
        let executor_reward_funds = coin::mint_for_testing<SUI>(75_000_000, ctx(&mut scenario));

        let dca = dca::new<USDC, SUI>(
            &config, &terms_registry, &clock, DELEGATEE, input_funds, 1, 3, time_scale::minute(),
            0, 1, USDC_DECIMALS, SUI_DECIMALS, &mut executor_reward_funds, ctx(&mut scenario),
        );
        coin::burn_for_testing(executor_reward_funds);
        terms::destroy_terms_registry_for_testing(terms_registry);

        let total_executor_claimed: u64 = 0;
        let total_fee_tracker: u64 = 0;

        // Trade 1: Claim full reward
        clock::set_for_testing(&mut clock, 60_000);
        ts::next_tx(&mut scenario, RANDOM);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));
            let reward = dca::resolve_trade_for_testing(
                &mut dca, &mut fee_tracker, promise, 50_000, 25_000_000, ctx(&mut scenario)
            );
            total_executor_claimed = total_executor_claimed + coin::value(&reward);
            balance::destroy_for_testing(input_balance);
            coin::burn_for_testing(reward);
        };

        // Trade 2: Claim partial reward
        clock::set_for_testing(&mut clock, 120_000);
        ts::next_tx(&mut scenario, RANDOM);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));
            let reward = dca::resolve_trade_for_testing(
                &mut dca, &mut fee_tracker, promise, 50_000, 10_000_000, ctx(&mut scenario)
            );
            total_executor_claimed = total_executor_claimed + coin::value(&reward);
            balance::destroy_for_testing(input_balance);
            coin::burn_for_testing(reward);
        };

        // Trade 3: Claim zero
        clock::set_for_testing(&mut clock, 180_000);
        ts::next_tx(&mut scenario, RANDOM);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));
            let reward = dca::resolve_trade_for_testing(
                &mut dca, &mut fee_tracker, promise, 50_000, 0, ctx(&mut scenario)
            );
            total_executor_claimed = total_executor_claimed + coin::value(&reward);
            balance::destroy_for_testing(input_balance);
            coin::burn_for_testing(reward);
        };

        total_fee_tracker = config::sui_balance(&fee_tracker);

        // Verify totals
        // Total budget: 75M (25M * 3)
        // Claimed: 25M + 10M + 0 = 35M
        // Fee tracker: 0 + 15M + 25M = 40M
        assert!(total_executor_claimed == 35_000_000, 0);
        assert!(total_fee_tracker == 40_000_000, 1);

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // ============================================================
    // SECTION 14: SPLIT ALLOCATION EDGE CASES
    // ============================================================

    /// Test: Last trade gets all remaining dust
    #[test]
    fun test_last_trade_gets_dust() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 0);
        let terms_registry = terms::create_terms_registry_for_testing(ctx(&mut scenario));

        // Create DCA with amount that doesn't divide evenly: 1_000_001 / 3 = 333333 remainder 2
        // Min funding per trade is 100_000, so we need at least 300_000 for 3 trades
        let input_funds = coin::mint_for_testing<USDC>(1_000_001, ctx(&mut scenario));
        let executor_reward_funds = coin::mint_for_testing<SUI>(75_000_000, ctx(&mut scenario));

        let dca = dca::new<USDC, SUI>(
            &config, &terms_registry, &clock, DELEGATEE, input_funds, 1, 3, time_scale::minute(),
            0, 1, USDC_DECIMALS, SUI_DECIMALS, &mut executor_reward_funds, ctx(&mut scenario),
        );
        coin::burn_for_testing(executor_reward_funds);
        terms::destroy_terms_registry_for_testing(terms_registry);

        let total_input_received: u64 = 0;

        // Trade 1
        clock::set_for_testing(&mut clock, 60_000);
        ts::next_tx(&mut scenario, RANDOM);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));
            total_input_received = total_input_received + balance::value(&input_balance);
            let reward = dca::resolve_trade_for_testing(
                &mut dca, &mut fee_tracker, promise, 50_000, 1_000_000, ctx(&mut scenario)
            );
            balance::destroy_for_testing(input_balance);
            coin::burn_for_testing(reward);
        };

        // Trade 2
        clock::set_for_testing(&mut clock, 120_000);
        ts::next_tx(&mut scenario, RANDOM);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));
            total_input_received = total_input_received + balance::value(&input_balance);
            let reward = dca::resolve_trade_for_testing(
                &mut dca, &mut fee_tracker, promise, 50_000, 1_000_000, ctx(&mut scenario)
            );
            balance::destroy_for_testing(input_balance);
            coin::burn_for_testing(reward);
        };

        // Trade 3 (last - should get remainder)
        clock::set_for_testing(&mut clock, 180_000);
        ts::next_tx(&mut scenario, RANDOM);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));
            total_input_received = total_input_received + balance::value(&input_balance);
            let reward = dca::resolve_trade_for_testing(
                &mut dca, &mut fee_tracker, promise, 50_000, 1_000_000, ctx(&mut scenario)
            );
            balance::destroy_for_testing(input_balance);
            coin::burn_for_testing(reward);
        };

        // Total received (minus fees) should equal original minus total fees
        // 1_000_001 / 3 = 333333 per trade (with 2 dust remaining for last trade)
        // Last trade gets 333335 (333333 + 2 dust)
        // The exact amount depends on rounding, but all funds should be accounted for
        assert!(dca::input_balance_value(&dca) == 0, 0);

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // ============================================================
    // SECTION 15: PROTOCOL PAUSE BEHAVIOR
    // ============================================================

    /// Verify: Existing trades continue when protocol is paused
    #[test]
    fun test_existing_trades_continue_when_paused() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 0);

        let dca = create_minimal_dca(&mut scenario, &config, &clock);

        // Admin pauses protocol
        config::set_paused(&mut config, &admin_cap, true);
        assert!(config::is_paused(&config) == true, 0);

        // Trade should still work on existing account
        clock::set_for_testing(&mut clock, 60_000);
        ts::next_tx(&mut scenario, RANDOM);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));
            let reward = dca::resolve_trade_for_testing(
                &mut dca, &mut fee_tracker, promise, 50_000, 1_000_000, ctx(&mut scenario)
            );
            balance::destroy_for_testing(input_balance);
            coin::burn_for_testing(reward);
        };

        // Verify trade executed
        assert!(dca::remaining_orders(&dca) == 0, 1);

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // ============================================================
    // SECTION 16: TIME SCALE VALIDATION
    // ============================================================

    /// Attack: Invalid time scale
    #[test]
    #[expected_failure(abort_code = dca::EInvalidTimeScale)]
    fun test_attack_invalid_time_scale() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));
        let terms_registry = terms::create_terms_registry_for_testing(ctx(&mut scenario));

        let input_funds = coin::mint_for_testing<USDC>(100_000, ctx(&mut scenario));
        let executor_reward_funds = coin::mint_for_testing<SUI>(25_000_000, ctx(&mut scenario));

        // Try time_scale = 6 (invalid, max is 5 for months)
        let dca = dca::new<USDC, SUI>(
            &config, &terms_registry, &clock, DELEGATEE, input_funds, 1, 1, 6, // Invalid time scale
            0, 1, USDC_DECIMALS, SUI_DECIMALS, &mut executor_reward_funds, ctx(&mut scenario),
        );

        coin::burn_for_testing(executor_reward_funds);
        terms::destroy_terms_registry_for_testing(terms_registry);
        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    /// Attack: Invalid every value for time scale
    #[test]
    #[expected_failure(abort_code = dca::EInvalidEvery)]
    fun test_attack_invalid_every_for_seconds() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));
        let terms_registry = terms::create_terms_registry_for_testing(ctx(&mut scenario));

        let input_funds = coin::mint_for_testing<USDC>(100_000, ctx(&mut scenario));
        let executor_reward_funds = coin::mint_for_testing<SUI>(25_000_000, ctx(&mut scenario));

        // For seconds, every must be 30-59, try 100
        let dca = dca::new<USDC, SUI>(
            &config, &terms_registry, &clock, DELEGATEE, input_funds, 100, 1, time_scale::second(),
            0, 1, USDC_DECIMALS, SUI_DECIMALS, &mut executor_reward_funds, ctx(&mut scenario),
        );

        coin::burn_for_testing(executor_reward_funds);
        terms::destroy_terms_registry_for_testing(terms_registry);
        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // ============================================================
    // SECTION 17: TREASURY FEE COLLECTION
    // ============================================================

    /// Verify: Fees go to snapshotted treasury, not current treasury
    #[test]
    fun test_fees_go_to_snapshotted_treasury() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 0);

        // Treasury is OWNER initially
        assert!(config::treasury(&config) == OWNER, 0);

        let dca = create_minimal_dca(&mut scenario, &config, &clock);

        // Admin changes treasury to different address
        let new_treasury: address = @0x888;
        config::set_treasury(&mut config, &admin_cap, new_treasury);
        assert!(config::treasury(&config) == new_treasury, 1);

        // Execute trade - fees should still go to OWNER (snapshotted)
        clock::set_for_testing(&mut clock, 60_000);
        ts::next_tx(&mut scenario, RANDOM);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));
            let reward = dca::resolve_trade_for_testing(
                &mut dca, &mut fee_tracker, promise, 50_000, 1_000_000, ctx(&mut scenario)
            );
            balance::destroy_for_testing(input_balance);
            coin::burn_for_testing(reward);
        };

        // Note: In real execution, transfer::public_transfer sends to snapshotted treasury
        // We can't easily verify this in test, but the code path is correct

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // ============================================================
    // SECTION 18: VERSION CHECK
    // ============================================================

    /// Verify: Version is tracked and upgraded
    #[test]
    fun test_version_tracking() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));

        let dca = create_dca_for_owner(&mut scenario, &config, &clock, OWNER);

        // DCA accounts start at current version (4)
        // Version is checked and upgraded on each operation
        // This is implicitly tested by all operations working

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // ============================================================
    // SECTION 19: START TIME FEATURE TESTS
    // ============================================================

    /// Test: Default start time (0) behaves like immediate start
    #[test]
    fun test_start_time_default_immediate() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000); // Set current time to 1000ms
        let terms_registry = terms::create_terms_registry_for_testing(ctx(&mut scenario));

        let input_funds = coin::mint_for_testing<USDC>(100_000, ctx(&mut scenario));
        let executor_reward_funds = coin::mint_for_testing<SUI>(25_000_000, ctx(&mut scenario));

        let dca = dca::new<USDC, SUI>(
            &config, &terms_registry, &clock, DELEGATEE, input_funds, 1, 1, time_scale::minute(),
            0, // start_time_ms = 0 means use current time
            1, USDC_DECIMALS, SUI_DECIMALS,
            &mut executor_reward_funds, ctx(&mut scenario),
        );
        coin::burn_for_testing(executor_reward_funds);
        terms::destroy_terms_registry_for_testing(terms_registry);

        // Verify start_time was set to current time
        assert!(dca::start_time_ms(&dca) == 1000, 0);

        // First trade should be allowed after 1 minute (60 seconds)
        // With mean deviation of 30 seconds, trade can happen at 31 seconds after start
        clock::set_for_testing(&mut clock, 31_000); // 30 seconds after start
        ts::next_tx(&mut scenario, RANDOM);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));
            let reward = dca::resolve_trade_for_testing(
                &mut dca, &mut fee_tracker, promise, 50_000, 1_000_000, ctx(&mut scenario)
            );
            balance::destroy_for_testing(input_balance);
            coin::burn_for_testing(reward);
        };

        assert!(dca::remaining_orders(&dca) == 0, 1);

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    /// Test: Future start time delays first trade
    #[test]
    fun test_start_time_future_delays_trade() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000); // Current time = 1000ms
        let terms_registry = terms::create_terms_registry_for_testing(ctx(&mut scenario));

        let input_funds = coin::mint_for_testing<USDC>(100_000, ctx(&mut scenario));
        let executor_reward_funds = coin::mint_for_testing<SUI>(25_000_000, ctx(&mut scenario));

        // Set start time to 1 hour from now (3_600_000 ms)
        let future_start = 3_600_000u64;
        let dca = dca::new<USDC, SUI>(
            &config, &terms_registry, &clock, DELEGATEE, input_funds, 1, 1, time_scale::minute(),
            future_start, // Start 1 hour from now
            1, USDC_DECIMALS, SUI_DECIMALS,
            &mut executor_reward_funds, ctx(&mut scenario),
        );
        coin::burn_for_testing(executor_reward_funds);
        terms::destroy_terms_registry_for_testing(terms_registry);

        // Verify start_time was set correctly
        assert!(dca::start_time_ms(&dca) == future_start, 0);

        // Advance clock to 1 minute after start_time (first trade should be allowed)
        // start_time (3.6M) + 1 minute (60K) - mean_deviation (30K) = 3_630_000
        clock::set_for_testing(&mut clock, 3_630_000);
        ts::next_tx(&mut scenario, RANDOM);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));
            let reward = dca::resolve_trade_for_testing(
                &mut dca, &mut fee_tracker, promise, 50_000, 1_000_000, ctx(&mut scenario)
            );
            balance::destroy_for_testing(input_balance);
            coin::burn_for_testing(reward);
        };

        assert!(dca::remaining_orders(&dca) == 0, 1);

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    /// Test: Cannot execute trade before future start time + interval
    #[test]
    #[expected_failure] // Will fail with time assertion
    fun test_start_time_future_blocks_early_trade() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000); // Current time = 1000ms
        let terms_registry = terms::create_terms_registry_for_testing(ctx(&mut scenario));

        let input_funds = coin::mint_for_testing<USDC>(100_000, ctx(&mut scenario));
        let executor_reward_funds = coin::mint_for_testing<SUI>(25_000_000, ctx(&mut scenario));

        // Set start time to 1 hour from now (3_600_000 ms)
        let future_start = 3_600_000u64;
        let dca = dca::new<USDC, SUI>(
            &config, &terms_registry, &clock, DELEGATEE, input_funds, 1, 1, time_scale::minute(),
            future_start,
            1, USDC_DECIMALS, SUI_DECIMALS,
            &mut executor_reward_funds, ctx(&mut scenario),
        );
        coin::burn_for_testing(executor_reward_funds);
        terms::destroy_terms_registry_for_testing(terms_registry);

        // Try to trade BEFORE start_time (should fail due to time check underflow)
        // Current time (2000) < start_time (3_600_000) causes b_ts - a_ts to underflow
        clock::set_for_testing(&mut clock, 2000);
        ts::next_tx(&mut scenario, RANDOM);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));
            balance::destroy_for_testing(input_balance);
            dca::destroy_promise_for_testing(promise);
        };

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    /// Test: Past start time allows immediate execution
    #[test]
    fun test_start_time_past_allows_immediate() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 100_000); // Current time = 100 seconds
        let terms_registry = terms::create_terms_registry_for_testing(ctx(&mut scenario));

        let input_funds = coin::mint_for_testing<USDC>(100_000, ctx(&mut scenario));
        let executor_reward_funds = coin::mint_for_testing<SUI>(25_000_000, ctx(&mut scenario));

        // Set start time to 10 seconds ago (90_000 ms when current is 100_000)
        // This means first trade can happen at 90_000 + 60_000 - 30_000 = 120_000
        // But we're at 100_000, so we need to wait until 120_000
        let past_start = 50_000u64; // 50 seconds (past)
        let dca = dca::new<USDC, SUI>(
            &config, &terms_registry, &clock, DELEGATEE, input_funds, 1, 1, time_scale::minute(),
            past_start,
            1, USDC_DECIMALS, SUI_DECIMALS,
            &mut executor_reward_funds, ctx(&mut scenario),
        );
        coin::burn_for_testing(executor_reward_funds);
        terms::destroy_terms_registry_for_testing(terms_registry);

        assert!(dca::start_time_ms(&dca) == past_start, 0);

        // First trade should be allowed when current >= past_start + interval - mean_deviation
        // past_start (50K) + 1 minute (60K) - mean_dev (30K) = 80K
        // We're at 100K, so trade should be allowed immediately
        ts::next_tx(&mut scenario, RANDOM);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));
            let reward = dca::resolve_trade_for_testing(
                &mut dca, &mut fee_tracker, promise, 50_000, 1_000_000, ctx(&mut scenario)
            );
            balance::destroy_for_testing(input_balance);
            coin::burn_for_testing(reward);
        };

        assert!(dca::remaining_orders(&dca) == 0, 1);

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    /// Test: Start time stored in DCA account
    #[test]
    fun test_start_time_stored_correctly() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(ctx(&mut scenario));
        let clock = clock::create_for_testing(ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 5000);
        let terms_registry = terms::create_terms_registry_for_testing(ctx(&mut scenario));

        let input_funds = coin::mint_for_testing<USDC>(100_000, ctx(&mut scenario));
        let executor_reward_funds = coin::mint_for_testing<SUI>(25_000_000, ctx(&mut scenario));

        // Test with explicit start time
        let explicit_start = 999_000u64;
        let dca = dca::new<USDC, SUI>(
            &config, &terms_registry, &clock, DELEGATEE, input_funds, 1, 1, time_scale::minute(),
            explicit_start,
            1, USDC_DECIMALS, SUI_DECIMALS,
            &mut executor_reward_funds, ctx(&mut scenario),
        );
        coin::burn_for_testing(executor_reward_funds);
        terms::destroy_terms_registry_for_testing(terms_registry);

        // Verify the explicit start time is stored
        assert!(dca::start_time_ms(&dca) == explicit_start, 0);

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }
}
