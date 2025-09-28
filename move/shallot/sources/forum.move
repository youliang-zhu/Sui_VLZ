/// Forum module for Shallot decentralized forum voting system
/// Manages Forum lifecycle, metadata, and governance state
module shallot::forum {
    use std::string::{Self, String};
    use sui::clock::{Self, Clock};
    use shallot::verifier::{Self, SimplePasswordVerifier};
    use shallot::events;

    // ===== Error Constants =====
     
    /// Error: Forum already has an active poll
    const E_ACTIVE_POLL_EXISTS: u64 = 1;
    
    /// Error: No active poll to clear
    const E_NO_ACTIVE_POLL: u64 = 2;
    
    /// Error: Forum name cannot be empty
    const E_EMPTY_NAME: u64 = 3;

    // ===== Core Structures =====

    /// Main Forum object - the heart of decentralized governance
    /// Note: Creator has NO special privileges after creation
    public struct Forum has key, store {
        id: UID,
        name: String,
        description: String,
        creator: address,  // Only for historical record, no special rights
        verifier: SimplePasswordVerifier,
        member_count: u64,
        active_poll: option::Option<ID>,  // Ensures only one poll at a time
        created_at: u64,
    }

    // ===== Forum Creation =====

    /// Create a new Forum with password verification
    /// Creator gets NO special rights and must join like everyone else
    entry fun create_forum(
        name: String,
        description: String,
        password: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Validate inputs
        assert!(!string::is_empty(&name), E_EMPTY_NAME);
        
        let creator = tx_context::sender(ctx);
        let timestamp = clock::timestamp_ms(clock);
        
        // Create verifier with password
        let verifier = verifier::create_simple_password_verifier(password, timestamp);
        
        // Create Forum object
        let forum_id = object::new(ctx);
        let forum_id_copy = object::uid_to_inner(&forum_id);
        
        let forum = Forum {
            id: forum_id,
            name: name,
            description: description,
            creator,  // Only for historical record
            verifier,
            member_count: 0,
            active_poll: option::none(),
            created_at: timestamp,
        };
        
        // Emit creation event
        events::emit_forum_created(
            forum_id_copy,
            name,
            description,
            creator,
            timestamp
        );
        
        // Share Forum as shared object for multi-user access
        // Creator has no special access after this point
        transfer::share_object(forum);
    }

    // ===== Forum State Management =====

    /// Set active poll (called by poll module)
    public(package) fun set_active_poll(forum: &mut Forum, poll_id: ID) {
        assert!(option::is_none(&forum.active_poll), E_ACTIVE_POLL_EXISTS);
        forum.active_poll = option::some(poll_id);
    }

    /// Clear active poll (called when poll ends)
    public(package) fun clear_active_poll(forum: &mut Forum) {
        assert!(option::is_some(&forum.active_poll), E_NO_ACTIVE_POLL);
        forum.active_poll = option::none();
    }

    /// Increment member count (called by membership module)
    public(package) fun increment_member_count(forum: &mut Forum) {
        forum.member_count = forum.member_count + 1;
    }

    // ===== Metadata Updates (via voting) =====

    /// Update Forum metadata after successful poll
    /// This is the ONLY way to change Forum properties - through democratic voting
    public(package) fun update_metadata(
        forum: &mut Forum,
        new_name: String,
        new_description: String,
        poll_id: ID,
        clock: &Clock,
    ) {
        let old_name = forum.name;
        let old_description = forum.description;
        
        // Update metadata
        forum.name = new_name;
        forum.description = new_description;
        
        // Emit metadata update event
        events::emit_forum_metadata_updated(
            object::id(forum),
            poll_id,
            old_name,
            new_name,
            old_description,
            new_description,
            clock::timestamp_ms(clock)
        );
    }

    // ===== View Functions =====

    /// Get Forum basic information
    public fun get_forum_info(forum: &Forum): (String, String, address, u64, u64) {
        (
            forum.name,
            forum.description,
            forum.creator,
            forum.member_count,
            forum.created_at
        )
    }

    /// Check if Forum has active poll
    public fun has_active_poll(forum: &Forum): bool {
        option::is_some(&forum.active_poll)
    }

    /// Get active poll ID (if any)
    public fun get_active_poll(forum: &Forum): option::Option<ID> {
        forum.active_poll
    }

    /// Get member count
    public fun get_member_count(forum: &Forum): u64 {
        forum.member_count
    }

    /// Get Forum creator (for historical record only)
    public fun get_creator(forum: &Forum): address {
        forum.creator
    }

    /// Get verifier for membership checks
    public(package) fun get_verifier(forum: &Forum): &SimplePasswordVerifier {
        &forum.verifier
    }

    // ===== Test Functions =====

    #[test_only]
    /// Create a test forum with known parameters
    public fun create_test_forum(ctx: &mut TxContext): Forum {
        let verifier = verifier::create_test_verifier();
        let forum_id = object::new(ctx);
        
        Forum {
            id: forum_id,
            name: string::utf8(b"Test Forum"),
            description: string::utf8(b"A test forum"),
            creator: @0x1,
            verifier,
            member_count: 0,
            active_poll: option::none(),
            created_at: 1000,
        }
    }

    #[test_only]
    /// Test forum creation
    public fun test_forum_creation() {
        use sui::test_scenario;
        
        let mut scenario_val = test_scenario::begin(@0x1);
        let scenario = &mut scenario_val;
        
        test_scenario::next_tx(scenario, @0x1);
        {
            let ctx = test_scenario::ctx(scenario);
            let forum = create_test_forum(ctx);
            
            // Test forum properties
            let (name, _description, creator, member_count, _) = get_forum_info(&forum);
            assert!(name == string::utf8(b"Test Forum"), 0);
            assert!(creator == @0x1, 1);
            assert!(member_count == 0, 2);
            assert!(!has_active_poll(&forum), 3);
            
            transfer::share_object(forum);
        };
        
        test_scenario::end(scenario_val);
    }
}