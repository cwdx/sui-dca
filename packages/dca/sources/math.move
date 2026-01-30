module dca::math {
    const U64_MAX: u128 = 18446744073709551615;
    const EOverflow: u64 = 0;

    public fun mul(x: u64, y: u64): u64 {
        let x = (x as u128);
        let y = (y as u128);
        let result = x * y;
        assert!(result <= U64_MAX, EOverflow);
        (result as u64)
    }

    public fun div(x: u64, y: u64): u64 {
        let x = (x as u128);
        let y = (y as u128);
        ((x / y) as u64)
    }
}
