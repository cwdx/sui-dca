/// @title Oracle Module
/// @notice Pyth oracle integration for calculating trustless min_output values
/// @dev Supports both direct USD price feeds and multi-hop routing (TOKEN→SUI→USD)
module dca::oracle {
    use dca::config::{Self, PriceFeed, PriceFeedRegistry};
    use pyth::price_info::PriceInfoObject;
    use pyth::pyth;
    use pyth::price::{Self, Price};
    use pyth::i64;
    use std::option;
    use sui::clock::Clock;

    // === Error Codes ===
    const ENegativePrice: u64 = 103;
    const EPriceFeedNotFound: u64 = 104;

    // === Constants ===
    /// Maximum price age in seconds before considered stale
    const MAX_PRICE_AGE_SECONDS: u64 = 60;

    /// Precision for intermediate calculations (18 decimals)
    const PRECISION: u128 = 1_000_000_000_000_000_000;

    // === Public Functions ===

    /// Calculate minimum output amount using Pyth oracle prices with slippage
    /// This is the main function called during trade execution
    ///
    /// Parameters:
    /// - clock: System clock for price staleness check
    /// - registry: Price feed registry
    /// - input_price_info: Pyth price info object for input token
    /// - input_intermediate: Intermediate price info for routing (pass same as input_price_info if direct USD feed)
    /// - output_price_info: Pyth price info object for output token
    /// - output_intermediate: Intermediate price info for routing (pass same as output_price_info if direct USD feed)
    /// - input_amount: Amount of input tokens to trade
    /// - slippage_bps: Slippage tolerance in basis points
    /// - input_decimals: Decimal places for input token
    /// - output_decimals: Decimal places for output token
    ///
    /// Note: For tokens with direct USD feeds, pass the same object as both primary and intermediate.
    /// The oracle checks the feed config to determine if routing is actually needed.
    ///
    /// Returns: Minimum output amount after slippage
    public fun calculate_min_output<Input, Output>(
        clock: &Clock,
        registry: &PriceFeedRegistry,
        input_price_info: &PriceInfoObject,
        input_intermediate: &PriceInfoObject,
        output_price_info: &PriceInfoObject,
        output_intermediate: &PriceInfoObject,
        input_amount: u64,
        slippage_bps: u64,
        input_decimals: u8,
        output_decimals: u8,
    ): u64 {
        // Get price feed configs
        let input_feed_opt = config::get_price_feed<Input>(registry);
        let output_feed_opt = config::get_price_feed<Output>(registry);

        assert!(option::is_some(&input_feed_opt), EPriceFeedNotFound);
        assert!(option::is_some(&output_feed_opt), EPriceFeedNotFound);

        let input_feed = option::borrow(&input_feed_opt);
        let output_feed = option::borrow(&output_feed_opt);

        // Get USD price for input token
        let (input_price_u64, input_expo) = get_usd_price(
            clock,
            input_price_info,
            input_feed,
            input_intermediate,
        );

        // Get USD price for output token
        let (output_price_u64, output_expo) = get_usd_price(
            clock,
            output_price_info,
            output_feed,
            output_intermediate,
        );

        // Calculate fair output amount with decimal normalization
        let fair_output = calculate_fair_output(
            input_amount,
            input_price_u64,
            input_expo,
            output_price_u64,
            output_expo,
            input_decimals,
            output_decimals,
        );

        // Apply slippage tolerance: fair_output * (10000 - slippage_bps) / 10000
        let min_output = (fair_output * (10000 - (slippage_bps as u128))) / 10000;

        (min_output as u64)
    }

    // === Internal Functions ===

    /// Get USD price for a token, handling routing if needed
    /// Returns (price, exponent) where actual_price = price * 10^exponent
    ///
    /// Note: intermediate_price_info is always passed but only used if feed_config requires routing.
    /// For direct USD feeds, the caller should pass the same object for both price_info and intermediate.
    fun get_usd_price(
        clock: &Clock,
        price_info: &PriceInfoObject,
        feed_config: &PriceFeed,
        intermediate_price_info: &PriceInfoObject,
    ): (u64, i64::I64) {
        // Get base price from Pyth (validates staleness)
        let base_price = pyth::get_price_no_older_than(
            price_info,
            clock,
            MAX_PRICE_AGE_SECONDS,
        );

        // Validate price is positive
        let price_i64 = price::get_price(&base_price);
        assert!(!i64::get_is_negative(&price_i64), ENegativePrice);
        let base_price_u64 = i64::get_magnitude_if_positive(&price_i64);

        if (config::requires_routing(feed_config)) {
            // Routed: TOKEN/SUI * SUI/USD = TOKEN/USD
            let sui_usd_price = pyth::get_price_no_older_than(
                intermediate_price_info,
                clock,
                MAX_PRICE_AGE_SECONDS,
            );

            // Validate intermediate price is positive
            let sui_price_i64 = price::get_price(&sui_usd_price);
            assert!(!i64::get_is_negative(&sui_price_i64), ENegativePrice);

            multiply_prices(base_price, sui_usd_price)
        } else {
            // Direct USD feed - intermediate_price_info is not used
            (base_price_u64, price::get_expo(&base_price))
        }
    }

    /// Multiply two prices together for routing
    /// token_sui * sui_usd = token_usd
    fun multiply_prices(price1: Price, price2: Price): (u64, i64::I64) {
        let p1_i64 = price::get_price(&price1);
        let p2_i64 = price::get_price(&price2);

        assert!(!i64::get_is_negative(&p1_i64), ENegativePrice);
        assert!(!i64::get_is_negative(&p2_i64), ENegativePrice);

        let p1 = i64::get_magnitude_if_positive(&p1_i64);
        let p2 = i64::get_magnitude_if_positive(&p2_i64);

        let e1 = price::get_expo(&price1);
        let e2 = price::get_expo(&price2);

        // Multiply prices
        let combined_price = ((p1 as u128) * (p2 as u128)) / PRECISION;

        // Add exponents and adjust for PRECISION division (18 decimals)
        let combined_expo = add_exponents(e1, e2, 18);

        ((combined_price as u64), combined_expo)
    }

    /// Add two I64 exponents and add an adjustment
    /// result = e1 + e2 + adjustment (adjustment compensates for PRECISION division)
    fun add_exponents(e1: i64::I64, e2: i64::I64, adjustment: u64): i64::I64 {
        let e1_neg = i64::get_is_negative(&e1);
        let e2_neg = i64::get_is_negative(&e2);
        let e1_mag = if (e1_neg) {
            i64::get_magnitude_if_negative(&e1)
        } else {
            i64::get_magnitude_if_positive(&e1)
        };
        let e2_mag = if (e2_neg) {
            i64::get_magnitude_if_negative(&e2)
        } else {
            i64::get_magnitude_if_positive(&e2)
        };

        // Calculate positive and negative sums
        // Positive contributions: non-negative exponents + adjustment
        // Negative contributions: negative exponents
        let pos_sum = adjustment;
        let neg_sum: u64 = 0;

        if (e1_neg) {
            neg_sum = neg_sum + e1_mag;
        } else {
            pos_sum = pos_sum + e1_mag;
        };

        if (e2_neg) {
            neg_sum = neg_sum + e2_mag;
        } else {
            pos_sum = pos_sum + e2_mag;
        };

        // Calculate final result
        if (pos_sum >= neg_sum) {
            i64::new(pos_sum - neg_sum, false)
        } else {
            i64::new(neg_sum - pos_sum, true)
        }
    }

    /// Calculate fair output amount with decimal normalization
    /// fair_output = input_amount * input_price / output_price * decimal_adjustment
    fun calculate_fair_output(
        input_amount: u64,
        input_price: u64,
        input_expo: i64::I64,
        output_price: u64,
        output_expo: i64::I64,
        input_decimals: u8,
        output_decimals: u8,
    ): u128 {
        // Use high precision arithmetic
        let input_u128 = (input_amount as u128);
        let input_price_u128 = (input_price as u128);
        let output_price_u128 = (output_price as u128);

        // Calculate: input_amount * input_price / output_price
        // Then adjust for exponents and decimals

        // First, calculate value in quote currency (USD)
        let input_value = input_u128 * input_price_u128;

        // Divide by output price to get output amount
        let raw_output = input_value / output_price_u128;

        // Adjust for price exponents
        let expo_adjusted = adjust_for_exponents(raw_output, input_expo, output_expo);

        // Adjust for token decimals
        adjust_for_decimals(expo_adjusted, input_decimals, output_decimals)
    }

    /// Adjust value for price exponent differences
    fun adjust_for_exponents(value: u128, input_expo: i64::I64, output_expo: i64::I64): u128 {
        let in_neg = i64::get_is_negative(&input_expo);
        let out_neg = i64::get_is_negative(&output_expo);

        let in_mag = if (in_neg) { i64::get_magnitude_if_negative(&input_expo) } else { i64::get_magnitude_if_positive(&input_expo) };
        let out_mag = if (out_neg) { i64::get_magnitude_if_negative(&output_expo) } else { i64::get_magnitude_if_positive(&output_expo) };

        // Calculate net exponent adjustment needed
        // If input_expo > output_expo, we need to multiply
        // If input_expo < output_expo, we need to divide

        let (multiply, adjust_amount) = if (in_neg == out_neg) {
            // Same sign - compare magnitudes
            if (in_neg) {
                // Both negative: e.g., -8 vs -6 means input is smaller, need to divide by 10^2
                if (in_mag > out_mag) {
                    (false, in_mag - out_mag)
                } else {
                    (true, out_mag - in_mag)
                }
            } else {
                // Both positive: e.g., 2 vs 4 means input is smaller, need to divide by 10^2
                if (in_mag > out_mag) {
                    (true, in_mag - out_mag)
                } else {
                    (false, out_mag - in_mag)
                }
            }
        } else {
            // Different signs
            if (in_neg) {
                // input negative, output positive: need to divide by 10^(in_mag + out_mag)
                (false, in_mag + out_mag)
            } else {
                // input positive, output negative: need to multiply by 10^(in_mag + out_mag)
                (true, in_mag + out_mag)
            }
        };

        if (adjust_amount == 0) {
            value
        } else if (multiply) {
            value * pow10(adjust_amount)
        } else {
            value / pow10(adjust_amount)
        }
    }

    /// Adjust for token decimal differences
    fun adjust_for_decimals(value: u128, input_decimals: u8, output_decimals: u8): u128 {
        if (input_decimals == output_decimals) {
            value
        } else if (output_decimals > input_decimals) {
            // Output has more decimals - multiply
            let diff = (output_decimals - input_decimals as u64);
            value * pow10(diff)
        } else {
            // Input has more decimals - divide
            let diff = (input_decimals - output_decimals as u64);
            value / pow10(diff)
        }
    }

    /// Power of 10 helper
    fun pow10(exp: u64): u128 {
        let result: u128 = 1;
        let i = 0;
        while (i < exp) {
            result = result * 10;
            i = i + 1;
        };
        result
    }

    // === Test-only Functions ===

    #[test_only]
    /// Test helper to calculate min_output without oracle objects
    public fun calculate_min_output_for_testing(
        input_amount: u64,
        input_price: u64,
        input_expo: u64,
        input_expo_negative: bool,
        output_price: u64,
        output_expo: u64,
        output_expo_negative: bool,
        slippage_bps: u64,
        input_decimals: u8,
        output_decimals: u8,
    ): u64 {
        let input_expo_i64 = i64::new(input_expo, input_expo_negative);
        let output_expo_i64 = i64::new(output_expo, output_expo_negative);

        let fair_output = calculate_fair_output(
            input_amount,
            input_price,
            input_expo_i64,
            output_price,
            output_expo_i64,
            input_decimals,
            output_decimals,
        );

        let min_output = (fair_output * (10000 - (slippage_bps as u128))) / 10000;
        (min_output as u64)
    }
}
