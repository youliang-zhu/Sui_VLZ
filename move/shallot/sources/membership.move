/// Membership module for Shallot decentralized forum voting system
/// Manages soul-bound NFT membership and member registry
module shallot::membership {
    use std::string::String;
    use sui::clock::{Self, Clock};
    use sui::table::{Self, Table};
    use shallot::forum::{Self, Forum};
    use shallot::verifier;
    use shallot::events;

    // ===== Error Constants =====
    
    /// Error: Password verification failed
    const E_VERIFICATION_FAILED: u64 = 1;
    
    /// Error: User already has membership in this forum
    const E_ALREADY_MEMBER: u64 = 2;
    
    /// Error: User is not a member of this forum
    const E_NOT_MEMBER: u64 = 3;

    // ===== Core Structures =====

    /// Soul-bound Membership NFT - cannot be transferred
    public struct Membership has key, store  {
        id: UID,
        forum_id: ID,
        member: address,
        joined_at: u64,
    }

    /// Member Registry for each Forum - tracks all members
    public struct MemberRegistry has key, store {
        id: UID,
        forum_id: ID,
        members: Table<address, bool>,  // address -> is_member
        member_list: vector<address>,   // ordered list for iteration
        total_count: u64,
    }

    // ===== Registry Management =====

    /// Initialize member registry for a Forum
    /// This should be called once per Forum after forum creation
    entry fun init_member_registry(
        forum_id: ID,
        ctx: &mut TxContext
    ) {
        let registry = MemberRegistry {
            id: object::new(ctx),
            forum_id,
            members: table::new(ctx),
            member_list: vector::empty(),
            total_count: 0,
        };
        
        // Share registry as shared object
        transfer::share_object(registry);
    }

    // ===== Membership Management =====

    /// Join a Forum by providing correct password
    /// Creates soul-bound Membership NFT and updates registry
    entry fun join_forum(
        forum: &mut Forum,
        registry: &mut MemberRegistry,
        password: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let member_addr = tx_context::sender(ctx);
        let forum_id = object::id(forum);
        let timestamp = clock::timestamp_ms(clock);
        
        // Verify registry belongs to this forum
        assert!(registry.forum_id == forum_id, E_VERIFICATION_FAILED);
        
        // Verify password using Forum's verifier
        let verifier = forum::get_verifier(forum);
        assert!(verifier::verify_user(verifier, password), E_VERIFICATION_FAILED);
        
        // Add member to registry (this will check for duplicates)
        add_member_to_registry(registry, member_addr);
        
        // Create membership NFT (soul-bound - no transfer capability)
        let membership_id = object::new(ctx);
        let membership_id_copy = object::uid_to_inner(&membership_id);
        
        let membership = Membership {
            id: membership_id,
            forum_id,
            member: member_addr,
            joined_at: timestamp,
        };
        
        // Update Forum member count
        forum::increment_member_count(forum);
        let new_member_count = forum::get_member_count(forum);
        
        // Emit member joined event
        events::emit_member_joined(
            forum_id,
            member_addr,
            membership_id_copy,
            new_member_count,
            timestamp
        );
        
        // Transfer membership to user (soul-bound, cannot be transferred again)
        transfer::transfer(membership, member_addr);
    }

    /// Add member to registry (called internally)
    public(package) fun add_member_to_registry(
        registry: &mut MemberRegistry,
        member: address
    ) {
        assert!(!table::contains(&registry.members, member), E_ALREADY_MEMBER);
        
        table::add(&mut registry.members, member, true);
        vector::push_back(&mut registry.member_list, member);
        registry.total_count = registry.total_count + 1;
    }

    // ===== Member Verification =====

    /// Check if an address is a member of a Forum
    /// This is used by voting system to verify voting rights
    public fun is_member(registry: &MemberRegistry, member: address): bool {
        table::contains(&registry.members, member)
    }

    /// Verify member has voting rights or abort
    public fun verify_member_or_abort(registry: &MemberRegistry, member: address) {
        assert!(is_member(registry, member), E_NOT_MEMBER);
    }

    /// Get total member count from registry
    public fun get_member_count(registry: &MemberRegistry): u64 {
        registry.total_count
    }

    /// Get all member addresses (for voting snapshot)
    public fun get_all_members(registry: &MemberRegistry): &vector<address> {
        &registry.member_list
    }

    /// Get member at specific index (for iteration)
    public fun get_member_at_index(registry: &MemberRegistry, index: u64): address {
        assert!(index < vector::length(&registry.member_list), E_NOT_MEMBER);
        *vector::borrow(&registry.member_list, index)
    }

    // ===== View Functions =====

    /// Get membership information
    public fun get_membership_info(membership: &Membership): (ID, address, u64) {
        (membership.forum_id, membership.member, membership.joined_at)
    }

    /// Verify membership belongs to specific forum
    public fun verify_membership_forum(membership: &Membership, forum_id: ID): bool {
        membership.forum_id == forum_id
    }

    /// Get registry forum ID
    public fun get_registry_forum_id(registry: &MemberRegistry): ID {
        registry.forum_id
    }

    /// Check if membership is valid for specific forum
    public fun verify_membership_for_forum(
        membership: &Membership, 
        registry: &MemberRegistry
    ): bool {
        membership.forum_id == registry.forum_id && 
        is_member(registry, membership.member)
    }

    // ===== Test Functions =====

    #[test_only]
    /// Create test membership for testing
    public fun create_test_membership(
        forum_id: ID,
        member: address,
        ctx: &mut TxContext
    ): Membership {
        Membership {
            id: object::new(ctx),
            forum_id,
            member,
            joined_at: 1000,
        }
    }

    #[test_only]
    /// Create test registry for testing
    public fun create_test_registry(
        forum_id: ID,
        ctx: &mut TxContext
    ): MemberRegistry {
        MemberRegistry {
            id: object::new(ctx),
            forum_id,
            members: table::new(ctx),
            member_list: vector::empty(),
            total_count: 0,
        }
    }

    #[test_only]
    /// Test membership verification
    public fun test_membership_verification() {
        use sui::test_scenario;
        
        let mut scenario_val = test_scenario::begin(@0x1);
        let scenario = &mut scenario_val;
        
        test_scenario::next_tx(scenario, @0x1);
        {
            let ctx = test_scenario::ctx(scenario);
            let forum_id = object::id_from_address(@0x999);
            let mut registry = create_test_registry(forum_id, ctx);
            
            // Test empty registry
            assert!(!is_member(&registry, @0x1), 0);
            assert!(get_member_count(&registry) == 0, 1);
            
            // Test adding member
            add_member_to_registry(&mut registry, @0x1);
            assert!(is_member(&registry, @0x1), 2);
            assert!(get_member_count(&registry) == 1, 3);
            
            // Test member list
            let members = get_all_members(&registry);
            assert!(vector::length(members) == 1, 4);
            assert!(*vector::borrow(members, 0) == @0x1, 5);
            
            transfer::share_object(registry);
        };
        
        test_scenario::end(scenario_val);
    }
}