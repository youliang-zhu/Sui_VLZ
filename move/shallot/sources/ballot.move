/// Ballot module for Shallot decentralized forum voting system
/// Handles anonymous voting with privacy protection and anti-double-voting
module shallot::ballot {
    use std::hash;
    use sui::clock::{Self, Clock};
    use sui::table::{Self, Table};
    use shallot::poll::{Self, Poll};
    use shallot::membership::{Self, MemberRegistry};
    use shallot::events;
    use sui::bcs;

    // ===== Error Constants =====
    
    /// Error: User has already voted in this poll
    const E_ALREADY_VOTED: u64 = 1;
    
    /// Error: Poll has ended, voting closed
    const E_POLL_ENDED: u64 = 2;
    
    /// Error: Poll does not belong to this registry's forum
    const E_POLL_FORUM_MISMATCH: u64 = 3;

    // ===== Core Structures =====

    /// Anonymous ballot record
    public struct Ballot has key, store {
        id: UID,
        poll_id: ID,
        anonymous_voter_id: vector<u8>,  // hash(voter_address + poll_id)
        vote: bool,                      // true = yes, false = no
        timestamp: u64,
    }

    /// Vote registry to prevent double voting
    public struct VoteRegistry has key, store {
        id: UID,
        poll_id: ID,
        voted_addresses: Table<address, bool>,  // track who has voted
        total_votes: u64,
    }

    // ===== Vote Registry Management =====

    /// Initialize vote registry for a poll
    entry fun init_vote_registry(
        poll_id: ID,
        ctx: &mut TxContext
    ) {
        let registry = VoteRegistry {
            id: object::new(ctx),
            poll_id,
            voted_addresses: table::new(ctx),
            total_votes: 0,
        };
        
        transfer::public_share_object(registry);
    }

    // ===== Voting Functions =====

    /// Cast a vote on a poll (anonymous)
    entry fun vote(
        poll: &mut Poll,
        vote_registry: &mut VoteRegistry,
        member_registry: &MemberRegistry,
        vote_choice: bool,  // true = yes, false = no
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let voter = tx_context::sender(ctx);
        let poll_id = object::id(poll);
        let timestamp = clock::timestamp_ms(clock);
        
        // Verify vote registry belongs to this poll
        assert!(vote_registry.poll_id == poll_id, E_POLL_FORUM_MISMATCH);
        
        // Verify poll belongs to the same forum as member registry
        let poll_forum_id = poll::get_poll_forum_id(poll);
        let registry_forum_id = membership::get_registry_forum_id(member_registry);
        assert!(poll_forum_id == registry_forum_id, E_POLL_FORUM_MISMATCH);
        
        // Verify voter is a member
        membership::verify_member_or_abort(member_registry, voter);
        
        // Verify poll has not ended
        assert!(!poll::has_poll_ended(poll, clock), E_POLL_ENDED);
        
        // Verify voter hasn't already voted
        assert!(!table::contains(&vote_registry.voted_addresses, voter), E_ALREADY_VOTED);
        
        // Generate anonymous voter ID: hash(address + poll_id)
        let anonymous_id = generate_anonymous_id(voter, poll_id);
        
        // Record vote in registry (prevent double voting)
        table::add(&mut vote_registry.voted_addresses, voter, true);
        vote_registry.total_votes = vote_registry.total_votes + 1;
        
        // Update poll vote counts
        if (vote_choice) {
            poll::increment_yes_votes(poll);
        } else {
            poll::increment_no_votes(poll);
        };
        
        // Create anonymous ballot
        let ballot = Ballot {
            id: object::new(ctx),
            poll_id,
            anonymous_voter_id: anonymous_id,
            vote: vote_choice,
            timestamp,
        };
        
        // Emit anonymous vote event
        events::emit_vote_received(
            poll_id,
            anonymous_id,
            timestamp
        );
        
        // Store ballot as shared object for transparency
        transfer::public_share_object(ballot);
    }

    // ===== Anonymous ID Generation =====

    /// Generate anonymous voter ID using hash(address + poll_id)
    fun generate_anonymous_id(voter: address, poll_id: ID): vector<u8> {
        let mut data = vector::empty<u8>();
        
        // Convert address to bytes and append
        let addr_bytes = bcs::to_bytes(&voter);
        vector::append(&mut data, addr_bytes);
        
        // Convert poll_id to bytes and append
        let poll_id_bytes = bcs::to_bytes(&poll_id);
        vector::append(&mut data, poll_id_bytes);
        
        // Hash the combined data
        hash::sha2_256(data)
    }

    // ===== Verification Functions =====

    /// Check if an address has voted in a poll
    public fun has_voted(vote_registry: &VoteRegistry, voter: address): bool {
        table::contains(&vote_registry.voted_addresses, voter)
    }

    /// Get total vote count from registry
    public fun get_total_votes(vote_registry: &VoteRegistry): u64 {
        vote_registry.total_votes
    }

    /// Get vote registry poll ID
    public fun get_vote_registry_poll_id(vote_registry: &VoteRegistry): ID {
        vote_registry.poll_id
    }

    // ===== Ballot View Functions =====

    /// Get ballot information (anonymous)
    public fun get_ballot_info(ballot: &Ballot): (ID, vector<u8>, bool, u64) {
        (ballot.poll_id, ballot.anonymous_voter_id, ballot.vote, ballot.timestamp)
    }

    /// Verify ballot belongs to specific poll
    public fun verify_ballot_poll(ballot: &Ballot, poll_id: ID): bool {
        ballot.poll_id == poll_id
    }

    // ===== Test Functions =====

    #[test_only]
    /// Create test vote registry
    public fun create_test_vote_registry(
        poll_id: ID,
        ctx: &mut TxContext
    ): VoteRegistry {
        VoteRegistry {
            id: object::new(ctx),
            poll_id,
            voted_addresses: table::new(ctx),
            total_votes: 0,
        }
    }

    #[test_only]
    /// Create test ballot
    public fun create_test_ballot(
        poll_id: ID,
        voter: address,
        vote_choice: bool,
        ctx: &mut TxContext
    ): Ballot {
        let anonymous_id = generate_anonymous_id(voter, poll_id);
        
        Ballot {
            id: object::new(ctx),
            poll_id,
            anonymous_voter_id: anonymous_id,
            vote: vote_choice,
            timestamp: 1000,
        }
    }

    #[test_only]
    /// Test anonymous ID generation
    public fun test_anonymous_id_generation() {
        let voter1 = @0x1;
        let voter2 = @0x2;
        let poll_id = object::id_from_address(@0x999);
        
        let id1 = generate_anonymous_id(voter1, poll_id);
        let id2 = generate_anonymous_id(voter2, poll_id);
        let id1_repeat = generate_anonymous_id(voter1, poll_id);
        
        // Same voter + poll should generate same ID
        assert!(id1 == id1_repeat, 0);
        
        // Different voters should generate different IDs
        assert!(id1 != id2, 1);
        
        // IDs should be 32 bytes (SHA256 output)
        assert!(vector::length(&id1) == 32, 2);
        assert!(vector::length(&id2) == 32, 3);
    }

    #[test_only]
    /// Test vote registry functionality
    public fun test_vote_registry() {
        use sui::test_scenario;
        
        let mut scenario_val = test_scenario::begin(@0x1);
        let scenario = &mut scenario_val;
        
        test_scenario::next_tx(scenario, @0x1);
        {
            let ctx = test_scenario::ctx(scenario);
            let poll_id = object::id_from_address(@0x999);
            let mut registry = create_test_vote_registry(poll_id, ctx);
            
            // Test initial state
            assert!(!has_voted(&registry, @0x1), 0);
            assert!(!has_voted(&registry, @0x2), 1);
            assert!(get_total_votes(&registry) == 0, 2);
            assert!(get_vote_registry_poll_id(&registry) == poll_id, 3);
            
            // Simulate adding votes
            table::add(&mut registry.voted_addresses, @0x1, true);
            registry.total_votes = registry.total_votes + 1;
            
            // Test after vote
            assert!(has_voted(&registry, @0x1), 4);
            assert!(!has_voted(&registry, @0x2), 5);
            assert!(get_total_votes(&registry) == 1, 6);
            
            transfer::public_share_object(registry);
        };
        
        test_scenario::end(scenario_val);
    }

    #[test_only]
    /// Test ballot creation and verification
    public fun test_ballot_creation() {
        use sui::test_scenario;
        
        let mut scenario_val = test_scenario::begin(@0x1);
        let scenario = &mut scenario_val;
        
        test_scenario::next_tx(scenario, @0x1);
        {
            let ctx = test_scenario::ctx(scenario);
            let poll_id = object::id_from_address(@0x999);
            let voter = @0x1;
            let vote_choice = true;
            
            let ballot = create_test_ballot(poll_id, voter, vote_choice, ctx);
            
            // Test ballot properties
            let (ballot_poll_id, anonymous_id, vote, timestamp) = get_ballot_info(&ballot);
            assert!(ballot_poll_id == poll_id, 0);
            assert!(vote == vote_choice, 1);
            assert!(timestamp == 1000, 2);
            assert!(vector::length(&anonymous_id) == 32, 3); // SHA256 length
            
            // Test poll verification
            assert!(verify_ballot_poll(&ballot, poll_id), 4);
            
            let wrong_poll_id = object::id_from_address(@0x888);
            assert!(!verify_ballot_poll(&ballot, wrong_poll_id), 5);
            
            transfer::public_share_object(ballot);
        };
        
        test_scenario::end(scenario_val);
    }

    #[test_only]
    /// Test helper to generate anonymous ID
    public fun test_generate_anonymous_id(voter: address, poll_id: ID): vector<u8> {
        generate_anonymous_id(voter, poll_id)
    }

    #[test_only] 
    /// Test helper to add vote to registry
    public fun test_add_vote_to_registry(
        registry: &mut VoteRegistry,
        voter: address
    ) {
        table::add(&mut registry.voted_addresses, voter, true);
        registry.total_votes = registry.total_votes + 1;
    }
}