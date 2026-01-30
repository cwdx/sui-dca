module turbos_clmm::position_nft {
    use std::string::String;
    use std::type_name::TypeName;
    use sui::object::{ID, UID};
    use sui::url::Url;

    struct TurbosPositionNFT has key, store {
        id: UID,
        name: String,
        description: String,
        img_url: Url,
        pool_id: ID,
        position_id: ID,
        coin_type_a: TypeName,
        coin_type_b: TypeName,
        fee_type: TypeName,
    }

    public fun pool_id(nft: &TurbosPositionNFT): ID {
        abort (0)
    }

    public fun position_id(nft: &TurbosPositionNFT): ID {
        abort (0)
    }
}
