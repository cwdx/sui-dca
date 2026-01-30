#[test_only]
module dca::dca_tests {
    use dca::config::{Self, GlobalConfig, FeeTracker};
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
    struct ETH has drop {}

    const OWNER: address = @0x1;
    const DELEGATEE: address = @0x2;
    const NEW_DELEGATEE: address = @0x3;
    const ANYONE: address = @0x99;

    const FUNDING_AMOUNT: u64 = 1_200_000;
    const EXECUTOR_REWARD_BUDGET: u64 = 300_000_000; // 0.3 SUI for 12 orders

    // Token decimals
    const USDC_DECIMALS: u8 = 6;
    const SUI_DECIMALS: u8 = 9;

    // === Helper Functions ===

    fun create_dca_with_terms(
        scenario: &mut Scenario,
        config: &GlobalConfig,
        terms_registry: &TermsRegistry,
        clock: &Clock,
    ): DCA<USDC, SUI> {
        let input_funds = coin::mint_for_testing<USDC>(FUNDING_AMOUNT, ctx(scenario));
        let executor_reward_funds = coin::mint_for_testing<SUI>(EXECUTOR_REWARD_BUDGET, ctx(scenario));

        let dca = dca::new<USDC, SUI>(
            config,
            terms_registry,
            clock,
            DELEGATEE,
            input_funds,
            1, // every 1 month
            12, // for 12 months
            time_scale::month(),
            0, // start_time_ms: 0 = start now
            1, // accepted_terms_version
            USDC_DECIMALS,
            SUI_DECIMALS,
            &mut executor_reward_funds,
            ctx(scenario),
        );

        coin::burn_for_testing(executor_reward_funds);
        dca
    }

    // Legacy helper for backward compatibility
    fun create_dca(
        scenario: &mut Scenario,
        config: &GlobalConfig,
        clock: &Clock,
    ): DCA<USDC, SUI> {
        let terms_registry = terms::create_terms_registry_for_testing(ctx(scenario));
        let dca = create_dca_with_terms(scenario, config, &terms_registry, clock);
        terms::destroy_terms_registry_for_testing(terms_registry);
        dca
    }

    // === Test: Account Creation ===

    #[test]
    fun test_create_dca_account() {
        let scenario = ts::begin(OWNER);
        {
            let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
                ctx(&mut scenario),
            );
            let clock = clock::create_for_testing(ctx(&mut scenario));

            let dca = create_dca(&mut scenario, &config, &clock);

            // Verify account state
            assert!(dca::owner(&dca) == OWNER, 0);
            assert!(dca::delegatee(&dca) == DELEGATEE, 1);
            assert!(dca::remaining_orders(&dca) == 12, 2);
            assert!(dca::initial_orders(&dca) == 12, 3);
            assert!(dca::active(&dca) == true, 4);
            assert!(dca::fee_bps(&dca) == 30, 5); // Snapshotted from config (default 30 bps = 0.30%)
            assert!(dca::executor_reward_per_trade(&dca) == 25_000_000, 6);
            assert!(dca::default_slippage_bps(&dca) == 100, 7); // 1% default slippage

            dca::destroy_for_testing(dca);
            clock::destroy_for_testing(clock);
            config::destroy_config_for_testing(config);
            config::destroy_fee_tracker_for_testing(fee_tracker);
            config::destroy_admin_cap_for_testing(admin_cap);
        };
        ts::end(scenario);
    }

    // === Test: Config Snapshot Isolation ===

    #[test]
    fun test_config_snapshot_isolation() {
        let scenario = ts::begin(OWNER);
        {
            let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
                ctx(&mut scenario),
            );
            let clock = clock::create_for_testing(ctx(&mut scenario));

            // Create account with original fee (30 bps)
            let dca = create_dca(&mut scenario, &config, &clock);
            assert!(dca::fee_bps(&dca) == 30, 0);

            // Change global config fee to 100 bps
            config::set_fee_bps(&mut config, &admin_cap, 100);
            assert!(config::fee_bps(&config) == 100, 1);

            // Existing account should still have 30 bps (snapshotted)
            assert!(dca::fee_bps(&dca) == 30, 2);

            dca::destroy_for_testing(dca);
            clock::destroy_for_testing(clock);
            config::destroy_config_for_testing(config);
            config::destroy_fee_tracker_for_testing(fee_tracker);
            config::destroy_admin_cap_for_testing(admin_cap);
        };
        ts::end(scenario);
    }

    // === Test: Executor Reward Validation ===

    #[test]
    #[expected_failure(abort_code = dca::EExcessiveExecutorReward)]
    fun test_excessive_executor_reward_rejected() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );
        let clock = clock::create_for_testing(ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 0);

        let dca = create_dca(&mut scenario, &config, &clock);

        // Advance time
        clock::set_for_testing(&mut clock, 28 * 24 * 60 * 60 * 1000);

        ts::next_tx(&mut scenario, ANYONE);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));

            // Try to claim more reward than allowed (25_000_000 max per trade)
            let reward_coin = dca::resolve_trade_for_testing(
                &mut dca,
                &mut fee_tracker,
                promise,
                50_000, // output_amount
                26_000_000, // Exceeds snapshot budget
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

    // === Test: Time Validation ===

    #[test]
    #[expected_failure(abort_code = dca::ENotEnoughTimePassed)]
    fun test_trade_too_early() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );
        let clock = clock::create_for_testing(ctx(&mut scenario));

        let dca = create_dca(&mut scenario, &config, &clock);

        // Don't advance time - should fail
        ts::next_tx(&mut scenario, ANYONE);
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

    // === Test: Account Deactivation After All Orders ===

    #[test]
    fun test_account_deactivates_after_last_order() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );
        let clock = clock::create_for_testing(ctx(&mut scenario));
        let terms_registry = terms::create_terms_registry_for_testing(ctx(&mut scenario));

        // Create account with only 1 order
        let input_funds = coin::mint_for_testing<USDC>(100_000, ctx(&mut scenario));
        let executor_reward_funds = coin::mint_for_testing<SUI>(25_000_000, ctx(&mut scenario));

        let dca = dca::new<USDC, SUI>(
            &config,
            &terms_registry,
            &clock,
            DELEGATEE,
            input_funds,
            1, // every 1 minute (60 seconds - meets min interval)
            1, // only 1 order
            time_scale::minute(),
            0, // start_time_ms: 0 = start now
            1, // accepted_terms_version
            USDC_DECIMALS,
            SUI_DECIMALS,
            &mut executor_reward_funds,
            ctx(&mut scenario),
        );
        coin::burn_for_testing(executor_reward_funds);
        terms::destroy_terms_registry_for_testing(terms_registry);

        assert!(dca::active(&dca) == true, 0);
        assert!(dca::remaining_orders(&dca) == 1, 1);
        assert!(dca::initial_orders(&dca) == 1, 2);

        // Advance time and execute
        clock::set_for_testing(&mut clock, 60_000); // 60 seconds (1 minute)

        ts::next_tx(&mut scenario, ANYONE);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));
            let reward_coin = dca::resolve_trade_for_testing(
                &mut dca,
                &mut fee_tracker,
                promise,
                50_000, // output_amount
                1_000_000, // executor_reward
                ctx(&mut scenario),
            );

            balance::destroy_for_testing(input_balance);
            coin::burn_for_testing(reward_coin);
        };

        // Account should now be inactive
        assert!(dca::active(&dca) == false, 3);
        assert!(dca::remaining_orders(&dca) == 0, 4);

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // === Test: Paused Config Prevents Account Creation ===

    #[test]
    #[expected_failure(abort_code = config::EContractPaused)]
    fun test_cannot_create_when_paused() {
        let scenario = ts::begin(OWNER);
        {
            let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
                ctx(&mut scenario),
            );
            let clock = clock::create_for_testing(ctx(&mut scenario));

            // Pause the protocol
            config::set_paused(&mut config, &admin_cap, true);

            // Try to create account - should fail
            let dca = create_dca(&mut scenario, &config, &clock);

            dca::destroy_for_testing(dca);
            clock::destroy_for_testing(clock);
            config::destroy_config_for_testing(config);
            config::destroy_fee_tracker_for_testing(fee_tracker);
            config::destroy_admin_cap_for_testing(admin_cap);
        };
        ts::end(scenario);
    }

    // === Test: Fee Deduction ===

    #[test]
    fun test_fee_deduction() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );
        let clock = clock::create_for_testing(ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 0);

        let dca = create_dca(&mut scenario, &config, &clock);

        // Advance time
        clock::set_for_testing(&mut clock, 28 * 24 * 60 * 60 * 1000);

        ts::next_tx(&mut scenario, ANYONE);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));

            // Check that fee was deducted
            // split_allocation = 1_200_000 / 12 = 100_000
            // fee = 100_000 * 30 / 10_000 = 300 (0.30%)
            // net_input = 100_000 - 300 = 99_700
            let input_amount = balance::value(&input_balance);
            assert!(input_amount < 100_000, 0); // Less than split allocation due to fee
            assert!(dca::trade_input(&promise) == input_amount, 1);

            let reward_coin = dca::resolve_trade_for_testing(
                &mut dca,
                &mut fee_tracker,
                promise,
                50_000, // output_amount
                1_000_000, // executor_reward
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

    // === Test: Owner Control - Set Inactive ===

    #[test]
    fun test_owner_can_set_inactive() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );
        let clock = clock::create_for_testing(ctx(&mut scenario));

        let dca = create_dca(&mut scenario, &config, &clock);
        assert!(dca::active(&dca) == true, 0);

        // Owner can pause
        dca::set_inactive(&mut dca, ctx(&mut scenario));
        assert!(dca::active(&dca) == false, 1);

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    #[test]
    fun test_delegatee_can_set_inactive() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );
        let clock = clock::create_for_testing(ctx(&mut scenario));

        let dca = create_dca(&mut scenario, &config, &clock);
        assert!(dca::active(&dca) == true, 0);

        // Switch to delegatee
        ts::next_tx(&mut scenario, DELEGATEE);
        {
            dca::set_inactive(&mut dca, ctx(&mut scenario));
            assert!(dca::active(&dca) == false, 1);
        };

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = dca::ENotOwnerOrDelegatee)]
    fun test_random_cannot_set_inactive() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );
        let clock = clock::create_for_testing(ctx(&mut scenario));

        let dca = create_dca(&mut scenario, &config, &clock);

        // Switch to random address - should fail
        ts::next_tx(&mut scenario, ANYONE);
        {
            dca::set_inactive(&mut dca, ctx(&mut scenario));
        };

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // === Test: Owner Control - Reactivate ===

    #[test]
    fun test_owner_can_reactivate() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );
        let clock = clock::create_for_testing(ctx(&mut scenario));

        let dca = create_dca(&mut scenario, &config, &clock);

        // Pause
        dca::set_inactive(&mut dca, ctx(&mut scenario));
        assert!(dca::active(&dca) == false, 0);

        // Reactivate
        dca::reactivate_as_owner(&mut dca, ctx(&mut scenario));
        assert!(dca::active(&dca) == true, 1);

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = dca::ENotOwner)]
    fun test_delegatee_cannot_reactivate() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );
        let clock = clock::create_for_testing(ctx(&mut scenario));

        let dca = create_dca(&mut scenario, &config, &clock);
        dca::set_inactive(&mut dca, ctx(&mut scenario));

        // Switch to delegatee - should fail (only owner can reactivate)
        ts::next_tx(&mut scenario, DELEGATEE);
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

    // === Test: Owner Control - Redeem Funds ===

    #[test]
    fun test_owner_can_redeem_funds() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );
        let clock = clock::create_for_testing(ctx(&mut scenario));

        let dca = create_dca(&mut scenario, &config, &clock);
        assert!(dca::input_balance_value(&dca) == FUNDING_AMOUNT, 0);
        assert!(dca::executor_reward_balance_value(&dca) == EXECUTOR_REWARD_BUDGET, 1);

        // Redeem all funds
        dca::redeem_funds_and_deactivate(&mut dca, ctx(&mut scenario));

        assert!(dca::active(&dca) == false, 2);
        assert!(dca::input_balance_value(&dca) == 0, 3);
        assert!(dca::executor_reward_balance_value(&dca) == 0, 4);
        assert!(dca::remaining_orders(&dca) == 0, 5);

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    #[test]
    fun test_delegatee_can_redeem_funds() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );
        let clock = clock::create_for_testing(ctx(&mut scenario));

        let dca = create_dca(&mut scenario, &config, &clock);

        // Switch to delegatee
        ts::next_tx(&mut scenario, DELEGATEE);
        {
            dca::redeem_funds_and_deactivate(&mut dca, ctx(&mut scenario));
            assert!(dca::active(&dca) == false, 0);
            assert!(dca::input_balance_value(&dca) == 0, 1);
        };

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = dca::ENotOwnerOrDelegatee)]
    fun test_random_cannot_redeem_funds() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );
        let clock = clock::create_for_testing(ctx(&mut scenario));

        let dca = create_dca(&mut scenario, &config, &clock);

        // Switch to random address - should fail
        ts::next_tx(&mut scenario, ANYONE);
        {
            dca::redeem_funds_and_deactivate(&mut dca, ctx(&mut scenario));
        };

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // === Test: Owner Control - Withdraw Input ===

    #[test]
    fun test_owner_can_withdraw_partial_input() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );
        let clock = clock::create_for_testing(ctx(&mut scenario));

        let dca = create_dca(&mut scenario, &config, &clock);
        assert!(dca::remaining_orders(&dca) == 12, 0);
        assert!(dca::input_balance_value(&dca) == FUNDING_AMOUNT, 1);

        // Withdraw half the funding (6 orders worth)
        let withdraw_amount = FUNDING_AMOUNT / 2;
        dca::withdraw_input(&mut dca, withdraw_amount, 6, ctx(&mut scenario));

        assert!(dca::remaining_orders(&dca) == 6, 2);
        assert!(dca::input_balance_value(&dca) == FUNDING_AMOUNT - withdraw_amount, 3);
        assert!(dca::active(&dca) == true, 4);

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    #[test]
    fun test_withdraw_all_orders_deactivates() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );
        let clock = clock::create_for_testing(ctx(&mut scenario));

        let dca = create_dca(&mut scenario, &config, &clock);

        // Withdraw all funding and orders
        dca::withdraw_input(&mut dca, FUNDING_AMOUNT, 12, ctx(&mut scenario));

        assert!(dca::remaining_orders(&dca) == 0, 0);
        assert!(dca::active(&dca) == false, 1);

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = dca::EInsufficientInputBalance)]
    fun test_cannot_withdraw_more_than_balance() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );
        let clock = clock::create_for_testing(ctx(&mut scenario));

        let dca = create_dca(&mut scenario, &config, &clock);

        // Try to withdraw more than available
        dca::withdraw_input(&mut dca, FUNDING_AMOUNT + 1, 12, ctx(&mut scenario));

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = dca::ENotOwner)]
    fun test_delegatee_cannot_withdraw_input() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );
        let clock = clock::create_for_testing(ctx(&mut scenario));

        let dca = create_dca(&mut scenario, &config, &clock);

        // Switch to delegatee - should fail (only owner can partial withdraw)
        ts::next_tx(&mut scenario, DELEGATEE);
        {
            dca::withdraw_input(&mut dca, 100_000, 1, ctx(&mut scenario));
        };

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // === Test: Owner Control - Add Executor Reward ===

    #[test]
    fun test_can_add_executor_reward() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );
        let clock = clock::create_for_testing(ctx(&mut scenario));

        let dca = create_dca(&mut scenario, &config, &clock);
        let initial_reward = dca::executor_reward_balance_value(&dca);

        // Add more reward funds
        let additional_reward = coin::mint_for_testing<SUI>(50_000_000, ctx(&mut scenario));
        dca::add_executor_reward(&mut dca, additional_reward);

        assert!(dca::executor_reward_balance_value(&dca) == initial_reward + 50_000_000, 0);

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // === Test: Cannot trade when inactive ===

    #[test]
    #[expected_failure(abort_code = dca::EInactive)]
    fun test_cannot_trade_when_inactive() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );
        let clock = clock::create_for_testing(ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 0);

        let dca = create_dca(&mut scenario, &config, &clock);

        // Deactivate
        dca::set_inactive(&mut dca, ctx(&mut scenario));

        // Advance time and try to trade - should fail
        clock::set_for_testing(&mut clock, 28 * 24 * 60 * 60 * 1000);
        ts::next_tx(&mut scenario, ANYONE);
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

    // === Test: Order Number Tracking ===

    #[test]
    fun test_order_number_tracking() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );
        let clock = clock::create_for_testing(ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 0);
        let terms_registry = terms::create_terms_registry_for_testing(ctx(&mut scenario));

        // Create account with 3 orders
        let input_funds = coin::mint_for_testing<USDC>(300_000, ctx(&mut scenario));
        let executor_reward_funds = coin::mint_for_testing<SUI>(75_000_000, ctx(&mut scenario));

        let dca = dca::new<USDC, SUI>(
            &config,
            &terms_registry,
            &clock,
            DELEGATEE,
            input_funds,
            1, // every 1 minute (60 seconds - meets min interval)
            3, // 3 orders
            time_scale::minute(),
            0, // start_time_ms: 0 = start now
            1, // accepted_terms_version
            USDC_DECIMALS,
            SUI_DECIMALS,
            &mut executor_reward_funds,
            ctx(&mut scenario),
        );
        coin::burn_for_testing(executor_reward_funds);
        terms::destroy_terms_registry_for_testing(terms_registry);

        assert!(dca::initial_orders(&dca) == 3, 0);
        assert!(dca::remaining_orders(&dca) == 3, 1);

        // Execute first trade (at 1 minute)
        clock::set_for_testing(&mut clock, 60_000);
        ts::next_tx(&mut scenario, ANYONE);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));
            // After first trade: initial=3, remaining=2, order_number should be 1
            assert!(dca::remaining_orders(&dca) == 2, 2);

            let reward_coin = dca::resolve_trade_for_testing(
                &mut dca,
                &mut fee_tracker,
                promise,
                50_000,
                1_000_000,
                ctx(&mut scenario),
            );
            balance::destroy_for_testing(input_balance);
            coin::burn_for_testing(reward_coin);
        };

        // Execute second trade (at 2 minutes)
        clock::set_for_testing(&mut clock, 120_000);
        ts::next_tx(&mut scenario, ANYONE);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));
            // After second trade: initial=3, remaining=1, order_number should be 2
            assert!(dca::remaining_orders(&dca) == 1, 3);

            let reward_coin = dca::resolve_trade_for_testing(
                &mut dca,
                &mut fee_tracker,
                promise,
                50_000,
                1_000_000,
                ctx(&mut scenario),
            );
            balance::destroy_for_testing(input_balance);
            coin::burn_for_testing(reward_coin);
        };

        // Execute third (final) trade (at 3 minutes)
        clock::set_for_testing(&mut clock, 180_000);
        ts::next_tx(&mut scenario, ANYONE);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));
            // After third trade: initial=3, remaining=0, order_number should be 3
            assert!(dca::remaining_orders(&dca) == 0, 4);

            let reward_coin = dca::resolve_trade_for_testing(
                &mut dca,
                &mut fee_tracker,
                promise,
                50_000,
                1_000_000,
                ctx(&mut scenario),
            );
            balance::destroy_for_testing(input_balance);
            coin::burn_for_testing(reward_coin);
        };

        // Account should be deactivated
        assert!(dca::active(&dca) == false, 5);

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // === Test: Set Delegatee ===

    #[test]
    fun test_owner_can_set_delegatee() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );
        let clock = clock::create_for_testing(ctx(&mut scenario));

        let dca = create_dca(&mut scenario, &config, &clock);
        assert!(dca::delegatee(&dca) == DELEGATEE, 0);

        // Owner changes delegatee
        dca::set_delegatee(&mut dca, NEW_DELEGATEE, ctx(&mut scenario));
        assert!(dca::delegatee(&dca) == NEW_DELEGATEE, 1);

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = dca::ENotOwner)]
    fun test_delegatee_cannot_set_delegatee() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );
        let clock = clock::create_for_testing(ctx(&mut scenario));

        let dca = create_dca(&mut scenario, &config, &clock);

        // Switch to delegatee - should fail
        ts::next_tx(&mut scenario, DELEGATEE);
        {
            dca::set_delegatee(&mut dca, NEW_DELEGATEE, ctx(&mut scenario));
        };

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // === Test: Slippage Control ===

    #[test]
    fun test_owner_can_set_slippage() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );
        let clock = clock::create_for_testing(ctx(&mut scenario));

        let dca = create_dca(&mut scenario, &config, &clock);

        // Default slippage should be from config (100 bps = 1%)
        assert!(dca::effective_slippage_bps(&dca) == 100, 0);

        // Owner sets custom slippage (200 bps = 2%)
        dca::set_slippage(&mut dca, &config, 200, ctx(&mut scenario));
        assert!(dca::effective_slippage_bps(&dca) == 200, 1);

        // Owner resets to default
        dca::reset_slippage(&mut dca, ctx(&mut scenario));
        assert!(dca::effective_slippage_bps(&dca) == 100, 2);

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = dca::EInvalidSlippage)]
    fun test_invalid_slippage_rejected() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );
        let clock = clock::create_for_testing(ctx(&mut scenario));

        let dca = create_dca(&mut scenario, &config, &clock);

        // Try to set slippage above config max (1000 bps = 10% in test config)
        dca::set_slippage(&mut dca, &config, 1001, ctx(&mut scenario));

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = dca::ENotOwner)]
    fun test_delegatee_cannot_set_slippage() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );
        let clock = clock::create_for_testing(ctx(&mut scenario));

        let dca = create_dca(&mut scenario, &config, &clock);

        // Switch to delegatee - should fail
        ts::next_tx(&mut scenario, DELEGATEE);
        {
            dca::set_slippage(&mut dca, &config, 200, ctx(&mut scenario));
        };

        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // === Test: Unused Executor Reward Goes to Fee Tracker ===

    #[test]
    fun test_unused_executor_reward_collected() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );
        let clock = clock::create_for_testing(ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 0);
        let terms_registry = terms::create_terms_registry_for_testing(ctx(&mut scenario));

        // Create account with 1 order
        let input_funds = coin::mint_for_testing<USDC>(100_000, ctx(&mut scenario));
        let executor_reward_funds = coin::mint_for_testing<SUI>(25_000_000, ctx(&mut scenario));

        let dca = dca::new<USDC, SUI>(
            &config,
            &terms_registry,
            &clock,
            DELEGATEE,
            input_funds,
            1, // every 1 minute (60 seconds - meets min interval)
            1,
            time_scale::minute(),
            0, // start_time_ms: 0 = start now
            1, // accepted_terms_version
            USDC_DECIMALS,
            SUI_DECIMALS,
            &mut executor_reward_funds,
            ctx(&mut scenario),
        );
        coin::burn_for_testing(executor_reward_funds);
        terms::destroy_terms_registry_for_testing(terms_registry);

        assert!(config::sui_balance(&fee_tracker) == 0, 0);

        // Advance time and execute trade, claiming only 10M of 25M reward
        clock::set_for_testing(&mut clock, 60_000);
        ts::next_tx(&mut scenario, ANYONE);
        {
            let (input_balance, promise) = dca::init_trade_for_testing(&mut dca, &clock, ctx(&mut scenario));
            let reward_coin = dca::resolve_trade_for_testing(
                &mut dca,
                &mut fee_tracker,
                promise,
                50_000,
                10_000_000, // Only claim 10M of 25M
                ctx(&mut scenario),
            );

            // 15M unused should go to fee tracker
            assert!(config::sui_balance(&fee_tracker) == 15_000_000, 1);
            assert!(coin::value(&reward_coin) == 10_000_000, 2);

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

    // === Test: Treasury Setting ===

    #[test]
    fun test_treasury_settable() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );

        // Initial treasury is deployer (OWNER)
        assert!(config::treasury(&config) == OWNER, 0);

        // Admin can change treasury
        let new_treasury: address = @0x999;
        config::set_treasury(&mut config, &admin_cap, new_treasury);
        assert!(config::treasury(&config) == new_treasury, 1);

        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // === Test: Min Interval Validation ===

    #[test]
    #[expected_failure(abort_code = dca::EIntervalTooShort)]
    fun test_interval_below_min_rejected() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );
        let clock = clock::create_for_testing(ctx(&mut scenario));
        let terms_registry = terms::create_terms_registry_for_testing(ctx(&mut scenario));

        // Set min interval to 5 minutes (300 seconds)
        config::set_min_interval_seconds(&mut config, &admin_cap, 300);

        // Try to create DCA with 1 minute interval (60 seconds) - should fail
        let input_funds = coin::mint_for_testing<USDC>(100_000, ctx(&mut scenario));
        let executor_reward_funds = coin::mint_for_testing<SUI>(25_000_000, ctx(&mut scenario));

        let dca = dca::new<USDC, SUI>(
            &config,
            &terms_registry,
            &clock,
            DELEGATEE,
            input_funds,
            1, // every 1 minute = 60 seconds, below 300 second min
            1,
            time_scale::minute(),
            0, // start_time_ms: 0 = start now
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

    #[test]
    fun test_interval_at_min_allowed() {
        let scenario = ts::begin(OWNER);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );
        let clock = clock::create_for_testing(ctx(&mut scenario));
        let terms_registry = terms::create_terms_registry_for_testing(ctx(&mut scenario));

        // Set min interval to 5 minutes (300 seconds)
        config::set_min_interval_seconds(&mut config, &admin_cap, 300);

        // Create DCA with exactly 5 minutes interval - should succeed
        let input_funds = coin::mint_for_testing<USDC>(100_000, ctx(&mut scenario));
        let executor_reward_funds = coin::mint_for_testing<SUI>(25_000_000, ctx(&mut scenario));

        let dca = dca::new<USDC, SUI>(
            &config,
            &terms_registry,
            &clock,
            DELEGATEE,
            input_funds,
            5, // every 5 minutes = 300 seconds, exactly at min
            1,
            time_scale::minute(),
            0, // start_time_ms: 0 = start now
            1, // accepted_terms_version
            USDC_DECIMALS,
            SUI_DECIMALS,
            &mut executor_reward_funds,
            ctx(&mut scenario),
        );

        assert!(dca::active(&dca) == true, 0);

        coin::burn_for_testing(executor_reward_funds);
        terms::destroy_terms_registry_for_testing(terms_registry);
        dca::destroy_for_testing(dca);
        clock::destroy_for_testing(clock);
        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }
}
