/// @title FlowX DEX Adapter
/// @notice Adapter for executing DCA trades through FlowX AMM with oracle-based pricing
/// @dev Router functions: https://github.com/FlowX-Finance/ts-sdk/blob/001d2b549931001fe01f4547c311b9639182e0af/src/constants.ts#L55
///
/// Oracle Integration:
/// For routed price feeds (e.g., TOKEN/SUI that needs SUI/USD), pass the SUI/USD
/// PriceInfoObject as the intermediate parameter. If the token has a direct USD feed,
/// pass the same object as the primary price info (the oracle module checks the feed
/// config to determine if routing is needed).
#[allow(lint(self_transfer))]
module dca::flow_x {
    use dca::config::{Self, GlobalConfig, FeeTracker, PriceFeedRegistry};
    use dca::dca::{Self, DCA, init_trade, resolve_trade};
    use flowx_amm::factory::Container;
    use flowx_amm::router;
    use pyth::price_info::PriceInfoObject;
    use std::option;
    use sui::balance;
    use sui::clock::Clock;
    use sui::coin::{Self, Coin};
    use sui::transfer;
    use sui::tx_context::{TxContext, sender};

    // === Error Codes ===
    const EAmountParamNotEqualToTradeAmount: u64 = 0;
    const ECoinInputMustBeEmpty: u64 = 1;
    const ERecipientAddressNotDcaOwner: u64 = 2;

    // === Single Hop ===

    /// Swap exact output with oracle-based pricing
    ///
    /// For input/output_intermediate: If the token has a direct USD feed, pass the same
    /// object as input/output_price_info. If the token routes through SUI, pass the
    /// SUI/USD PriceInfoObject.
    public entry fun swap_exact_output<INPUT, OUTPUT>(
        clock: &Clock,
        global_config: &GlobalConfig,
        pools: &mut Container,
        fee_tracker: &mut FeeTracker,
        registry: &PriceFeedRegistry,
        input_price_info: &PriceInfoObject,
        input_intermediate: &PriceInfoObject,
        output_price_info: &PriceInfoObject,
        output_intermediate: &PriceInfoObject,
        input_funds: Coin<INPUT>,
        input_amount: u64,
        exact_output: u64,
        recipient: address,
        sqrt_price: u64,
        dca: &mut DCA<INPUT, OUTPUT>,
        executor_reward: u64,
        ctx: &mut TxContext,
    ) {
        // Check executor whitelist
        config::assert_executor_allowed(global_config, sender(ctx));

        assert!(coin::value(&input_funds) == 0, ECoinInputMustBeEmpty);
        assert!(recipient == dca::owner(dca), ERecipientAddressNotDcaOwner);

        let (funds, promise) = init_trade(
            dca,
            clock,
            registry,
            input_price_info,
            input_intermediate,
            output_price_info,
            output_intermediate,
            ctx
        );
        let real_input_amount = balance::value(&funds);
        assert!(input_amount == real_input_amount, EAmountParamNotEqualToTradeAmount);
        balance::join(coin::balance_mut(&mut input_funds), funds);

        dca::assert_max_price_via_output(exact_output, &promise);
        router::swap_exact_output<INPUT, OUTPUT>(
            clock,
            pools,
            input_funds,
            input_amount,
            exact_output,
            dca::owner(dca),
            sqrt_price,
            ctx,
        );

        let reward_coin = resolve_trade(dca, fee_tracker, promise, exact_output, executor_reward, ctx);
        transfer::public_transfer(reward_coin, sender(ctx));
    }

    /// Swap exact input with oracle-based pricing
    public entry fun swap_exact_input<INPUT, OUTPUT>(
        clock: &Clock,
        global_config: &GlobalConfig,
        pools: &mut Container,
        fee_tracker: &mut FeeTracker,
        registry: &PriceFeedRegistry,
        input_price_info: &PriceInfoObject,
        input_intermediate: &PriceInfoObject,
        output_price_info: &PriceInfoObject,
        output_intermediate: &PriceInfoObject,
        input_funds: Coin<INPUT>,
        min_output: u64,
        recipient: address,
        sqrt_price: u64,
        dca: &mut DCA<INPUT, OUTPUT>,
        executor_reward: u64,
        ctx: &mut TxContext,
    ) {
        // Check executor whitelist
        config::assert_executor_allowed(global_config, sender(ctx));

        assert!(coin::value(&input_funds) == 0, ECoinInputMustBeEmpty);
        assert!(recipient == dca::owner(dca), ERecipientAddressNotDcaOwner);

        let (funds, promise) = init_trade(
            dca,
            clock,
            registry,
            input_price_info,
            input_intermediate,
            output_price_info,
            output_intermediate,
            ctx
        );
        balance::join(coin::balance_mut(&mut input_funds), funds);

        dca::assert_max_price_via_output(min_output, &promise);
        router::swap_exact_input<INPUT, OUTPUT>(
            clock,
            pools,
            input_funds,
            min_output,
            dca::owner(dca),
            sqrt_price,
            ctx,
        );

        // min_output is used as output_amount since we know at least this much was received
        let reward_coin = resolve_trade(dca, fee_tracker, promise, min_output, executor_reward, ctx);
        transfer::public_transfer(reward_coin, sender(ctx));
    }

    // === Double Hop ===

    public entry fun swap_exact_output_doublehop<INPUT, HOP1, OUTPUT>(
        clock: &Clock,
        global_config: &GlobalConfig,
        pools: &mut Container,
        fee_tracker: &mut FeeTracker,
        registry: &PriceFeedRegistry,
        input_price_info: &PriceInfoObject,
        input_intermediate: &PriceInfoObject,
        output_price_info: &PriceInfoObject,
        output_intermediate: &PriceInfoObject,
        input_funds: Coin<INPUT>,
        input_amount: u64,
        exact_output: u64,
        recipient: address,
        sqrt_price: u64,
        dca: &mut DCA<INPUT, OUTPUT>,
        executor_reward: u64,
        ctx: &mut TxContext,
    ) {
        // Check executor whitelist
        config::assert_executor_allowed(global_config, sender(ctx));

        assert!(coin::value(&input_funds) == 0, ECoinInputMustBeEmpty);
        assert!(recipient == dca::owner(dca), ERecipientAddressNotDcaOwner);

        let (funds, promise) = init_trade(
            dca,
            clock,
            registry,
            input_price_info,
            input_intermediate,
            output_price_info,
            output_intermediate,
            ctx
        );
        let real_input_amount = balance::value(&funds);
        assert!(input_amount == real_input_amount, EAmountParamNotEqualToTradeAmount);
        balance::join(coin::balance_mut(&mut input_funds), funds);

        dca::assert_max_price_via_output(exact_output, &promise);
        router::swap_exact_output_doublehop<INPUT, HOP1, OUTPUT>(
            clock,
            pools,
            input_funds,
            real_input_amount,
            exact_output,
            dca::owner(dca),
            sqrt_price,
            ctx,
        );

        let reward_coin = resolve_trade(dca, fee_tracker, promise, exact_output, executor_reward, ctx);
        transfer::public_transfer(reward_coin, sender(ctx));
    }

    public entry fun swap_exact_input_doublehop<INPUT, HOP, OUTPUT>(
        clock: &Clock,
        global_config: &GlobalConfig,
        pools: &mut Container,
        fee_tracker: &mut FeeTracker,
        registry: &PriceFeedRegistry,
        input_price_info: &PriceInfoObject,
        input_intermediate: &PriceInfoObject,
        output_price_info: &PriceInfoObject,
        output_intermediate: &PriceInfoObject,
        input_funds: Coin<INPUT>,
        min_output: u64,
        recipient: address,
        sqrt_price: u64,
        dca: &mut DCA<INPUT, OUTPUT>,
        executor_reward: u64,
        ctx: &mut TxContext,
    ) {
        // Check executor whitelist
        config::assert_executor_allowed(global_config, sender(ctx));

        assert!(coin::value(&input_funds) == 0, ECoinInputMustBeEmpty);
        assert!(recipient == dca::owner(dca), ERecipientAddressNotDcaOwner);

        let (funds, promise) = init_trade(
            dca,
            clock,
            registry,
            input_price_info,
            input_intermediate,
            output_price_info,
            output_intermediate,
            ctx
        );
        balance::join(coin::balance_mut(&mut input_funds), funds);

        dca::assert_max_price_via_output(min_output, &promise);
        router::swap_exact_input_doublehop<INPUT, HOP, OUTPUT>(
            clock,
            pools,
            input_funds,
            min_output,
            dca::owner(dca),
            sqrt_price,
            ctx,
        );

        let reward_coin = resolve_trade(dca, fee_tracker, promise, min_output, executor_reward, ctx);
        transfer::public_transfer(reward_coin, sender(ctx));
    }

    // === Triple Hop ===

    public entry fun swap_exact_output_triplehop<INPUT, HOP1, HOP2, OUTPUT>(
        clock: &Clock,
        global_config: &GlobalConfig,
        pools: &mut Container,
        fee_tracker: &mut FeeTracker,
        registry: &PriceFeedRegistry,
        input_price_info: &PriceInfoObject,
        input_intermediate: &PriceInfoObject,
        output_price_info: &PriceInfoObject,
        output_intermediate: &PriceInfoObject,
        input_funds: Coin<INPUT>,
        input_amount: u64,
        exact_output: u64,
        recipient: address,
        sqrt_price: u64,
        dca: &mut DCA<INPUT, OUTPUT>,
        executor_reward: u64,
        ctx: &mut TxContext,
    ) {
        // Check executor whitelist
        config::assert_executor_allowed(global_config, sender(ctx));

        assert!(coin::value(&input_funds) == 0, ECoinInputMustBeEmpty);
        assert!(recipient == dca::owner(dca), ERecipientAddressNotDcaOwner);

        let (funds, promise) = init_trade(
            dca,
            clock,
            registry,
            input_price_info,
            input_intermediate,
            output_price_info,
            output_intermediate,
            ctx
        );
        let real_input_amount = balance::value(&funds);
        assert!(input_amount == real_input_amount, EAmountParamNotEqualToTradeAmount);
        balance::join(coin::balance_mut(&mut input_funds), funds);

        dca::assert_max_price_via_output(exact_output, &promise);
        router::swap_exact_output_triplehop<INPUT, HOP1, HOP2, OUTPUT>(
            clock,
            pools,
            input_funds,
            real_input_amount,
            exact_output,
            dca::owner(dca),
            sqrt_price,
            ctx,
        );

        let reward_coin = resolve_trade(dca, fee_tracker, promise, exact_output, executor_reward, ctx);
        transfer::public_transfer(reward_coin, sender(ctx));
    }

    public entry fun swap_exact_input_triplehop<INPUT, HOP1, HOP2, OUTPUT>(
        clock: &Clock,
        global_config: &GlobalConfig,
        pools: &mut Container,
        fee_tracker: &mut FeeTracker,
        registry: &PriceFeedRegistry,
        input_price_info: &PriceInfoObject,
        input_intermediate: &PriceInfoObject,
        output_price_info: &PriceInfoObject,
        output_intermediate: &PriceInfoObject,
        input_funds: Coin<INPUT>,
        min_output: u64,
        recipient: address,
        sqrt_price: u64,
        dca: &mut DCA<INPUT, OUTPUT>,
        executor_reward: u64,
        ctx: &mut TxContext,
    ) {
        // Check executor whitelist
        config::assert_executor_allowed(global_config, sender(ctx));

        assert!(coin::value(&input_funds) == 0, ECoinInputMustBeEmpty);
        assert!(recipient == dca::owner(dca), ERecipientAddressNotDcaOwner);

        let (funds, promise) = init_trade(
            dca,
            clock,
            registry,
            input_price_info,
            input_intermediate,
            output_price_info,
            output_intermediate,
            ctx
        );
        balance::join(coin::balance_mut(&mut input_funds), funds);

        dca::assert_max_price_via_output(min_output, &promise);
        router::swap_exact_input_triplehop<INPUT, HOP1, HOP2, OUTPUT>(
            clock,
            pools,
            input_funds,
            min_output,
            dca::owner(dca),
            sqrt_price,
            ctx,
        );

        let reward_coin = resolve_trade(dca, fee_tracker, promise, min_output, executor_reward, ctx);
        transfer::public_transfer(reward_coin, sender(ctx));
    }
}
