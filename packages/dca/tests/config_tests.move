#[test_only]
module dca::config_tests {
    use dca::config;
    use sui::test_scenario::{Self as ts, ctx};

    const ADMIN: address = @0x1;

    // === Test: Config Creation ===

    #[test]
    fun test_create_config() {
        let scenario = ts::begin(ADMIN);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );

        // Check default values
        assert!(config::fee_bps(&config) == 30, 0); // 0.30%
        assert!(config::executor_reward_per_trade(&config) == 25_000_000, 1);
        assert!(config::max_orders_per_account(&config) == 25_000, 2);
        assert!(config::min_funding_per_trade(&config) == 100_000, 3);
        assert!(config::is_paused(&config) == false, 4);
        assert!(config::version(&config) == 1, 5);
        assert!(config::sui_balance(&fee_tracker) == 0, 6);
        assert!(config::total_sui_collected(&fee_tracker) == 0, 7);
        assert!(config::default_slippage_bps(&config) == 100, 8); // 1%
        assert!(config::max_slippage_bps(&config) == 1000, 9); // 10% max
        assert!(config::treasury(&config) == ADMIN, 10); // deployer is initial treasury

        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // === Test: Config Snapshot ===

    #[test]
    fun test_config_snapshot() {
        let scenario = ts::begin(ADMIN);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );

        let snapshot = config::create_snapshot(&config);
        assert!(config::snapshot_fee_bps(&snapshot) == 30, 0);
        assert!(config::snapshot_executor_reward(&snapshot) == 25_000_000, 1);
        assert!(config::snapshot_slippage_bps(&snapshot) == 100, 2);
        assert!(config::snapshot_treasury(&snapshot) == ADMIN, 3);

        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // === Test: Set Fee BPS ===

    #[test]
    fun test_set_fee_bps() {
        let scenario = ts::begin(ADMIN);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );

        config::set_fee_bps(&mut config, &admin_cap, 100);
        assert!(config::fee_bps(&config) == 100, 0);

        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = config::EInvalidFee)]
    fun test_set_fee_bps_too_high() {
        let scenario = ts::begin(ADMIN);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );

        // Max is 500 bps (5%), try 501
        config::set_fee_bps(&mut config, &admin_cap, 501);

        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // === Test: Set Executor Reward ===

    #[test]
    fun test_set_executor_reward() {
        let scenario = ts::begin(ADMIN);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );

        config::set_executor_reward_per_trade(&mut config, &admin_cap, 50_000_000);
        assert!(config::executor_reward_per_trade(&config) == 50_000_000, 0);

        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = config::EInvalidExecutorReward)]
    fun test_set_executor_reward_too_low() {
        let scenario = ts::begin(ADMIN);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );

        // Min is 10_000_000, try 9_999_999
        config::set_executor_reward_per_trade(&mut config, &admin_cap, 9_999_999);

        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = config::EInvalidExecutorReward)]
    fun test_set_executor_reward_too_high() {
        let scenario = ts::begin(ADMIN);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );

        // Max is 100_000_000, try 100_000_001
        config::set_executor_reward_per_trade(&mut config, &admin_cap, 100_000_001);

        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // === Test: Set Max Orders ===

    #[test]
    fun test_set_max_orders() {
        let scenario = ts::begin(ADMIN);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );

        config::set_max_orders_per_account(&mut config, &admin_cap, 50_000);
        assert!(config::max_orders_per_account(&config) == 50_000, 0);

        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = config::EInvalidOrderLimit)]
    fun test_set_max_orders_zero() {
        let scenario = ts::begin(ADMIN);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );

        config::set_max_orders_per_account(&mut config, &admin_cap, 0);

        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // === Test: Set Min Funding ===

    #[test]
    fun test_set_min_funding() {
        let scenario = ts::begin(ADMIN);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );

        config::set_min_funding_per_trade(&mut config, &admin_cap, 200_000);
        assert!(config::min_funding_per_trade(&config) == 200_000, 0);

        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = config::EInvalidMinFunding)]
    fun test_set_min_funding_zero() {
        let scenario = ts::begin(ADMIN);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );

        config::set_min_funding_per_trade(&mut config, &admin_cap, 0);

        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // === Test: Set Default Slippage ===

    #[test]
    fun test_set_default_slippage() {
        let scenario = ts::begin(ADMIN);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );

        config::set_default_slippage_bps(&mut config, &admin_cap, 200);
        assert!(config::default_slippage_bps(&config) == 200, 0);

        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = config::EInvalidSlippage)]
    fun test_set_slippage_zero() {
        let scenario = ts::begin(ADMIN);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );

        config::set_default_slippage_bps(&mut config, &admin_cap, 0);

        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = config::EInvalidSlippage)]
    fun test_set_slippage_too_high() {
        let scenario = ts::begin(ADMIN);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );

        // Max is 5000 bps (50%), try 5001
        config::set_default_slippage_bps(&mut config, &admin_cap, 5001);

        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // === Test: Set Treasury ===

    #[test]
    fun test_set_treasury() {
        let scenario = ts::begin(ADMIN);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );

        let new_treasury: address = @0x999;
        config::set_treasury(&mut config, &admin_cap, new_treasury);
        assert!(config::treasury(&config) == new_treasury, 0);

        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = config::EInvalidTreasury)]
    fun test_set_treasury_zero() {
        let scenario = ts::begin(ADMIN);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );

        config::set_treasury(&mut config, &admin_cap, @0x0);

        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // === Test: Set Min Interval ===

    #[test]
    fun test_set_min_interval() {
        let scenario = ts::begin(ADMIN);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );

        // Test default is 60 (production default is 900)
        assert!(config::min_interval_seconds(&config) == 60, 0);

        // Set to 1 hour (3600 seconds)
        config::set_min_interval_seconds(&mut config, &admin_cap, 3600);
        assert!(config::min_interval_seconds(&config) == 3600, 1);

        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = config::EInvalidMinInterval)]
    fun test_set_min_interval_too_low() {
        let scenario = ts::begin(ADMIN);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );

        // Min floor is 60 seconds, try 59
        config::set_min_interval_seconds(&mut config, &admin_cap, 59);

        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = config::EInvalidMinInterval)]
    fun test_set_min_interval_too_high() {
        let scenario = ts::begin(ADMIN);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );

        // Max ceiling is 31536000 (1 year), try 31536001
        config::set_min_interval_seconds(&mut config, &admin_cap, 31_536_001);

        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // === Test: Set Max Slippage ===

    #[test]
    fun test_set_max_slippage() {
        let scenario = ts::begin(ADMIN);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );

        // Default is 1000 bps (10%)
        assert!(config::max_slippage_bps(&config) == 1000, 0);

        // Admin can increase max slippage to 2000 bps (20%)
        config::set_max_slippage_bps(&mut config, &admin_cap, 2000);
        assert!(config::max_slippage_bps(&config) == 2000, 1);

        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = config::EInvalidMaxSlippage)]
    fun test_set_max_slippage_too_low() {
        let scenario = ts::begin(ADMIN);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );

        // Min is 10 bps (0.1%), try 9
        config::set_max_slippage_bps(&mut config, &admin_cap, 9);

        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = config::EInvalidMaxSlippage)]
    fun test_set_max_slippage_too_high() {
        let scenario = ts::begin(ADMIN);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );

        // Max ceiling is 5000 bps (50%), try 5001
        config::set_max_slippage_bps(&mut config, &admin_cap, 5001);

        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = config::EInvalidMaxSlippage)]
    fun test_set_max_slippage_below_default() {
        let scenario = ts::begin(ADMIN);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );

        // Default slippage is 100 bps, try to set max to 50 (below default)
        config::set_max_slippage_bps(&mut config, &admin_cap, 50);

        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }

    // === Test: Pause ===

    #[test]
    fun test_pause_unpause() {
        let scenario = ts::begin(ADMIN);
        let (config, fee_tracker, admin_cap) = config::create_config_for_testing(
            ctx(&mut scenario),
        );

        assert!(config::is_paused(&config) == false, 0);

        config::set_paused(&mut config, &admin_cap, true);
        assert!(config::is_paused(&config) == true, 1);

        config::set_paused(&mut config, &admin_cap, false);
        assert!(config::is_paused(&config) == false, 2);

        config::destroy_config_for_testing(config);
        config::destroy_fee_tracker_for_testing(fee_tracker);
        config::destroy_admin_cap_for_testing(admin_cap);
        ts::end(scenario);
    }
}
