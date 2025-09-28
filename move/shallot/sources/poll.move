/// Poll module for Shallot decentralized forum voting system
/// Manages voting proposals and their lifecycle
module shallot::poll {
    use std::string::{Self, String};
    use sui::clock::{Self, Clock};
    use shallot::forum::{Self, Forum};
    use shallot::membership::{Self, MemberRegistry};
    use shallot::events;

    // ===== Error Constants =====
    
    /// Error: Forum already has an active poll
    const E_FORUM_HAS_ACTIVE_POLL: u64 = 1;
    
    /// Error: Only Forum members can create polls
    const E_NOT_MEMBER: u64 = 2;
    
    /// Error: Poll has not ended yet
    const E_POLL_NOT_ENDED: u64 = 3;
    
    /// Error: Poll duration must be greater than 0
    const E_INVALID_DURATION: u64 = 4;
    
    /// Error: Poll title cannot be empty
    const E_EMPTY_TITLE: u64 = 5;

    // ===== Core Structures =====

    /// Poll object representing a metadata update proposal
    public struct Poll has key, store {
        id: UID,
        forum_id: ID,
        title: String,
        description: String,
        new_name: String,         // Proposed new Forum name
        new_description: String,  // Proposed new Forum description
        creator: address,
        start_time: u64,
        end_time: u64,
        yes_votes: u64,
        no_votes: u64,
        member_snapshot: u64,     // Total members when poll created
        is_executed: bool,
    }

    // ===== Poll Creation =====

    /// Create a new poll for Forum metadata update
    /// Only Forum members can create polls
    entry fun create_poll(
        forum: &mut Forum,
        registry: &MemberRegistry,
        title: String,
        description: String,
        new_name: String,
        new_description: String,
        duration_ms: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let creator = tx_context::sender(ctx);
        let forum_id = object::id(forum);
        let timestamp = clock::timestamp_ms(clock);
        
        // Validate inputs
        assert!(!string::is_empty(&title), E_EMPTY_TITLE);
        assert!(duration_ms > 0, E_INVALID_DURATION);
        
        // Verify registry belongs to this forum
        assert!(membership::get_registry_forum_id(registry) == forum_id, E_NOT_MEMBER);
        
        // Verify creator is a member
        membership::verify_member_or_abort(registry, creator);
        
        // Verify no active poll exists
        assert!(!forum::has_active_poll(forum), E_FORUM_HAS_ACTIVE_POLL);
        
        // Create poll
        let poll_id = object::new(ctx);
        let poll_id_copy = object::uid_to_inner(&poll_id);
        
        let poll = Poll {
            id: poll_id,
            forum_id,
            title: title,
            description: description,
            new_name: new_name,
            new_description: new_description,
            creator,
            start_time: timestamp,
            end_time: timestamp + duration_ms,
            yes_votes: 0,
            no_votes: 0,
            member_snapshot: membership::get_member_count(registry),
            is_executed: false,
        };
        
        // Set forum active poll
        forum::set_active_poll(forum, poll_id_copy);
        
        // Emit poll created event
        events::emit_poll_created(
            poll_id_copy,
            forum_id,
            title,
            description,
            creator,
            timestamp,
            timestamp + duration_ms,
            timestamp
        );
        
        // Share poll for voting
        transfer::public_share_object(poll);
    }

    // ===== Poll Execution =====

    /// Execute poll if it has ended and passed
    entry fun execute_poll(
        forum: &mut Forum,
        poll: &mut Poll,
        clock: &Clock,
    ) {
        let timestamp = clock::timestamp_ms(clock);
        let poll_id = object::id(poll);
        
        // Verify poll belongs to forum
        assert!(poll.forum_id == object::id(forum), E_NOT_MEMBER);
        
        // Verify poll has ended
        assert!(timestamp >= poll.end_time, E_POLL_NOT_ENDED);
        
        // Verify not already executed
        assert!(!poll.is_executed, E_POLL_NOT_ENDED);
        
        // Calculate results
        let total_votes = poll.yes_votes + poll.no_votes;
        let passed = poll.yes_votes > poll.no_votes && total_votes > 0;
        
        // Mark as executed
        poll.is_executed = true;
        
        // Clear forum active poll
        forum::clear_active_poll(forum);
        
        if (passed) {
            // Execute metadata update
            forum::update_metadata(
                forum,
                poll.new_name,
                poll.new_description,
                poll_id,
                clock
            );
            
            // Emit success event
            events::emit_poll_executed(
                poll_id,
                poll.forum_id,
                poll.yes_votes,
                poll.no_votes,
                total_votes,
                true,
                timestamp
            );
        } else {
            // Emit failure event
            events::emit_poll_executed(
                poll_id,
                poll.forum_id,
                poll.yes_votes,
                poll.no_votes,
                total_votes,
                false,
                timestamp
            );
        };
    }

    // ===== Vote Management =====

    /// Internal function to increment vote count
    public(package) fun increment_yes_votes(poll: &mut Poll) {
        poll.yes_votes = poll.yes_votes + 1;
    }

    /// Internal function to increment no vote count
    public(package) fun increment_no_votes(poll: &mut Poll) {
        poll.no_votes = poll.no_votes + 1;
    }

    // ===== View Functions =====

    /// Get poll basic information
    public fun get_poll_info(poll: &Poll): (String, String, address, u64, u64, u64, u64, bool) {
        (
            poll.title,
            poll.description,
            poll.creator,
            poll.start_time,
            poll.end_time,
            poll.yes_votes,
            poll.no_votes,
            poll.is_executed
        )
    }

    /// Get poll proposal details
    public fun get_poll_proposal(poll: &Poll): (String, String) {
        (poll.new_name, poll.new_description)
    }

    /// Check if poll has ended
    public fun has_poll_ended(poll: &Poll, clock: &Clock): bool {
        clock::timestamp_ms(clock) >= poll.end_time
    }

    /// Get poll results
    public fun get_poll_results(poll: &Poll): (u64, u64, u64, bool) {
        let total_votes = poll.yes_votes + poll.no_votes;
        let passed = poll.yes_votes > poll.no_votes && total_votes > 0;
        (poll.yes_votes, poll.no_votes, total_votes, passed)
    }

    /// Get poll forum ID
    public fun get_poll_forum_id(poll: &Poll): ID {
        poll.forum_id
    }

    /// Get member snapshot count
    public fun get_member_snapshot(poll: &Poll): u64 {
        poll.member_snapshot
    }

    /// Check if poll is executed
    public fun is_poll_executed(poll: &Poll): bool {
        poll.is_executed
    }

    /// Verify poll belongs to specific forum
    public fun verify_poll_forum(poll: &Poll, forum_id: ID): bool {
        poll.forum_id == forum_id
    }

    // ===== Test Functions =====

    #[test_only]
    /// Create test poll for testing
    public fun create_test_poll(
        forum_id: ID,
        creator: address,
        ctx: &mut TxContext
    ): Poll {
        let poll_id = object::new(ctx);
        
        Poll {
            id: poll_id,
            forum_id,
            title: string::utf8(b"Test Poll"),
            description: string::utf8(b"A test poll for metadata update"),
            new_name: string::utf8(b"New Forum Name"),
            new_description: string::utf8(b"New forum description"),
            creator,
            start_time: 1000,
            end_time: 2000,
            yes_votes: 0,
            no_votes: 0,
            member_snapshot: 5,
            is_executed: false,
        }
    }

    #[test_only]
    /// Test poll basic functionality
    public fun test_poll_basic() {
        use sui::test_scenario;
        
        let mut scenario_val = test_scenario::begin(@0x1);
        let scenario = &mut scenario_val;
        
        test_scenario::next_tx(scenario, @0x1);
        {
            let ctx = test_scenario::ctx(scenario);
            let forum_id = object::id_from_address(@0x999);
            let creator = @0x1;
            
            let poll = create_test_poll(forum_id, creator, ctx);
            
            // Test poll properties
            let (title, description, poll_creator, start_time, end_time, yes_votes, no_votes, is_executed) = get_poll_info(&poll);
            assert!(title == string::utf8(b"Test Poll"), 0);
            assert!(description == string::utf8(b"A test poll for metadata update"), 1);
            assert!(poll_creator == creator, 2);
            assert!(start_time == 1000, 3);
            assert!(end_time == 2000, 4);
            assert!(yes_votes == 0, 5);
            assert!(no_votes == 0, 6);
            assert!(!is_executed, 7);
            
            // Test proposal details
            let (new_name, new_description) = get_poll_proposal(&poll);
            assert!(new_name == string::utf8(b"New Forum Name"), 8);
            assert!(new_description == string::utf8(b"New forum description"), 9);
            
            // Test other properties
            assert!(get_poll_forum_id(&poll) == forum_id, 10);
            assert!(get_member_snapshot(&poll) == 5, 11);
            assert!(!is_poll_executed(&poll), 12);
            assert!(verify_poll_forum(&poll, forum_id), 13);
            
            transfer::public_share_object(poll);
        };
        
        test_scenario::end(scenario_val);
    }

    #[test_only]
    /// Test poll vote counting
    public fun test_poll_voting() {
        use sui::test_scenario;
        
        let mut scenario_val = test_scenario::begin(@0x1);
        let scenario = &mut scenario_val;
        
        test_scenario::next_tx(scenario, @0x1);
        {
            let ctx = test_scenario::ctx(scenario);
            let forum_id = object::id_from_address(@0x999);
            let mut poll = create_test_poll(forum_id, @0x1, ctx);
            
            // Test initial state
            let (yes_votes, no_votes, total_votes, passed) = get_poll_results(&poll);
            assert!(yes_votes == 0, 0);
            assert!(no_votes == 0, 1);
            assert!(total_votes == 0, 2);
            assert!(!passed, 3);
            
            // Add some votes
            increment_yes_votes(&mut poll);
            increment_yes_votes(&mut poll);
            increment_no_votes(&mut poll);
            
            // Test updated state
            let (yes_votes, no_votes, total_votes, passed) = get_poll_results(&poll);
            assert!(yes_votes == 2, 4);
            assert!(no_votes == 1, 5);
            assert!(total_votes == 3, 6);
            assert!(passed, 7); // yes > no
            
            transfer::public_share_object(poll);
        };
        
        test_scenario::end(scenario_val);
    }
}