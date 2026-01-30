/// @title Terms Registry Module
/// @notice Registry for tracking protocol terms stored on Walrus
/// @dev Users must accept current terms when creating DCA accounts
module dca::terms {
    use dca::config::AdminCap;
    use sui::clock::{Self, Clock};
    use sui::event;
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{TxContext};
    use std::vector;

    // === Error Codes ===
    const ENotAdmin: u64 = 0;
    const EOutdatedTermsAcceptance: u64 = 1;
    const EInvalidBlobId: u64 = 2;
    const EVersionTooLow: u64 = 3;

    // === Structs ===

    /// Historical record of a terms version
    struct TermsVersion has copy, drop, store {
        /// Walrus blob ID containing the terms document
        blob_id: vector<u8>,
        /// Version number
        version: u64,
        /// Timestamp when this version was published
        timestamp: u64,
    }

    /// Registry tracking protocol terms and versions
    struct TermsRegistry has key {
        id: UID,
        /// AdminCap ID for authorization
        admin: ID,
        /// Current Walrus blob ID for the terms document
        current_blob_id: vector<u8>,
        /// Current version number
        version: u64,
        /// Minimum version users must accept (can be lower than current)
        min_accepted_version: u64,
        /// History of all terms versions
        history: vector<TermsVersion>,
    }

    // === Events ===

    struct TermsRegistryCreatedEvent has copy, drop {
        registry_id: ID,
        admin_cap_id: ID,
        initial_blob_id: vector<u8>,
    }

    struct TermsUpdatedEvent has copy, drop {
        registry_id: ID,
        old_version: u64,
        new_version: u64,
        new_blob_id: vector<u8>,
        timestamp: u64,
    }

    struct MinVersionUpdatedEvent has copy, drop {
        registry_id: ID,
        old_min_version: u64,
        new_min_version: u64,
    }

    // === Constructor ===

    /// Create a new TermsRegistry (call once after deployment)
    public entry fun create_terms_registry(
        cap: &AdminCap,
        clock: &Clock,
        initial_blob_id: vector<u8>,
        ctx: &mut TxContext,
    ) {
        assert!(vector::length(&initial_blob_id) > 0, EInvalidBlobId);

        let admin_cap_id = object::id(cap);
        let registry_uid = object::new(ctx);
        let registry_id = object::uid_to_inner(&registry_uid);
        let timestamp = clock::timestamp_ms(clock);

        let initial_terms = TermsVersion {
            blob_id: initial_blob_id,
            version: 1,
            timestamp,
        };

        let registry = TermsRegistry {
            id: registry_uid,
            admin: admin_cap_id,
            current_blob_id: initial_blob_id,
            version: 1,
            min_accepted_version: 1,
            history: vector::singleton(initial_terms),
        };

        event::emit(TermsRegistryCreatedEvent {
            registry_id,
            admin_cap_id,
            initial_blob_id,
        });

        transfer::share_object(registry);
    }

    // === Admin Functions ===

    fun assert_admin(registry: &TermsRegistry, cap: &AdminCap) {
        assert!(registry.admin == object::id(cap), ENotAdmin);
    }

    /// Update the terms document with a new Walrus blob
    public entry fun update_terms(
        registry: &mut TermsRegistry,
        cap: &AdminCap,
        clock: &Clock,
        new_blob_id: vector<u8>,
    ) {
        assert_admin(registry, cap);
        assert!(vector::length(&new_blob_id) > 0, EInvalidBlobId);

        let old_version = registry.version;
        let new_version = old_version + 1;
        let timestamp = clock::timestamp_ms(clock);

        // Create history entry
        let terms_version = TermsVersion {
            blob_id: new_blob_id,
            version: new_version,
            timestamp,
        };

        // Update registry
        registry.current_blob_id = new_blob_id;
        registry.version = new_version;
        vector::push_back(&mut registry.history, terms_version);

        event::emit(TermsUpdatedEvent {
            registry_id: object::uid_to_inner(&registry.id),
            old_version,
            new_version,
            new_blob_id,
            timestamp,
        });
    }

    /// Set the minimum accepted version for new DCA accounts
    /// This allows a grace period after terms updates
    public entry fun set_min_accepted_version(
        registry: &mut TermsRegistry,
        cap: &AdminCap,
        min_version: u64,
    ) {
        assert_admin(registry, cap);
        assert!(min_version > 0 && min_version <= registry.version, EVersionTooLow);

        let old_min = registry.min_accepted_version;
        registry.min_accepted_version = min_version;

        event::emit(MinVersionUpdatedEvent {
            registry_id: object::uid_to_inner(&registry.id),
            old_min_version: old_min,
            new_min_version: min_version,
        });
    }

    // === View Functions ===

    /// Get the current Walrus blob ID for the terms document
    public fun current_blob_id(registry: &TermsRegistry): vector<u8> {
        registry.current_blob_id
    }

    /// Get the current terms version number
    public fun current_version(registry: &TermsRegistry): u64 {
        registry.version
    }

    /// Get the minimum accepted version for new DCA accounts
    public fun min_accepted_version(registry: &TermsRegistry): u64 {
        registry.min_accepted_version
    }

    /// Get the number of terms versions in history
    public fun history_length(registry: &TermsRegistry): u64 {
        vector::length(&registry.history)
    }

    /// Check if a version is acceptable for creating new DCA accounts
    public fun is_version_acceptable(registry: &TermsRegistry, version: u64): bool {
        version >= registry.min_accepted_version
    }

    /// Assert that a terms version is acceptable
    public fun assert_terms_acceptable(registry: &TermsRegistry, accepted_version: u64) {
        assert!(
            accepted_version >= registry.min_accepted_version,
            EOutdatedTermsAcceptance
        );
    }

    // === Test-only Functions ===

    #[test_only]
    public fun create_terms_registry_for_testing(ctx: &mut TxContext): TermsRegistry {
        let initial_blob_id = b"test-blob-id-12345";
        let initial_terms = TermsVersion {
            blob_id: initial_blob_id,
            version: 1,
            timestamp: 0,
        };

        TermsRegistry {
            id: object::new(ctx),
            admin: object::id_from_address(@0x0),
            current_blob_id: initial_blob_id,
            version: 1,
            min_accepted_version: 1,
            history: vector::singleton(initial_terms),
        }
    }

    #[test_only]
    public fun destroy_terms_registry_for_testing(registry: TermsRegistry) {
        let TermsRegistry {
            id,
            admin: _,
            current_blob_id: _,
            version: _,
            min_accepted_version: _,
            history: _,
        } = registry;
        object::delete(id);
    }

    #[test_only]
    public fun set_min_version_for_testing(registry: &mut TermsRegistry, min_version: u64) {
        registry.min_accepted_version = min_version;
    }

    #[test_only]
    public fun increment_version_for_testing(registry: &mut TermsRegistry) {
        registry.version = registry.version + 1;
    }
}
