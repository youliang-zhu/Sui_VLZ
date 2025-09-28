#[test_only]
module shallot::ballot_tests_simple {
    use shallot::ballot;

    // ===== Test Anonymous ID Generation =====

    #[test]
    fun test_anonymous_id_basic() {
        let voter1 = @0x1;
        let voter2 = @0x2;
        let poll_id = sui::object::id_from_address(@0x999);

        let id1 = ballot::test_generate_anonymous_id(voter1, poll_id);
        let id2 = ballot::test_generate_anonymous_id(voter2, poll_id);
        let id1_repeat = ballot::test_generate_anonymous_id(voter1, poll_id);
        
        // Same voter + poll should generate same ID
        assert!(id1 == id1_repeat, 0);
        
        // Different voters should generate different IDs
        assert!(id1 != id2, 1);
        
        // IDs should be 32 bytes (SHA256 output)
        assert!(std::vector::length(&id1) == 32, 2);
        assert!(std::vector::length(&id2) == 32, 3);
    }

    #[test]
    fun test_anonymous_id_different_polls() {
        let voter = @0x1;
        let poll_id1 = sui::object::id_from_address(@0x999);
        let poll_id2 = sui::object::id_from_address(@0x888);

        let id1 = ballot::test_generate_anonymous_id(voter, poll_id1);
        let id2 = ballot::test_generate_anonymous_id(voter, poll_id2);
        
        // Same voter with different polls should generate different IDs
        assert!(id1 != id2, 0);
        assert!(std::vector::length(&id1) == 32, 1);
        assert!(std::vector::length(&id2) == 32, 2);
    }

    // ===== Test Vote Registry =====

    #[test]
    fun test_vote_registry_empty() {
        let mut scenario = sui::test_scenario::begin(@0x1);
        
        sui::test_scenario::next_tx(&mut scenario, @0x1);
        {
            let ctx = sui::test_scenario::ctx(&mut scenario);
            let poll_id = sui::object::id_from_address(@0x999);
            
            let registry = ballot::create_test_vote_registry(poll_id, ctx);
            
            // Test initial state
            assert!(!ballot::has_voted(&registry, @0x1), 0);
            assert!(!ballot::has_voted(&registry, @0x2), 1);
            assert!(ballot::get_total_votes(&registry) == 0, 2);
            assert!(ballot::get_vote_registry_poll_id(&registry) == poll_id, 3);
            
            sui::transfer::public_share_object(registry);
        };
        
        sui::test_scenario::end(scenario);
    }

    #[test]
    fun test_vote_registry_tracking() {
        let mut scenario = sui::test_scenario::begin(@0x1);
        
        sui::test_scenario::next_tx(&mut scenario, @0x1);
        {
            let ctx = sui::test_scenario::ctx(&mut scenario);
            let poll_id = sui::object::id_from_address(@0x999);
            let mut registry = ballot::create_test_vote_registry(poll_id, ctx);
            
            // Test initial state
            assert!(ballot::get_total_votes(&registry) == 0, 0);
            assert!(!ballot::has_voted(&registry, @0x1), 1);
            
            // Simulate adding a vote (internal logic)
            ballot::test_add_vote_to_registry(&mut registry, @0x1);
            
            // Test after vote
            assert!(ballot::has_voted(&registry, @0x1), 2);
            assert!(!ballot::has_voted(&registry, @0x2), 3);
            assert!(ballot::get_total_votes(&registry) == 1, 4);
            
            sui::transfer::public_share_object(registry);
        };
        
        sui::test_scenario::end(scenario);
    }

    // ===== Test Ballot Creation =====

    #[test]
    fun test_ballot_creation_yes_vote() {
        let mut scenario = sui::test_scenario::begin(@0x1);
        
        sui::test_scenario::next_tx(&mut scenario, @0x1);
        {
            let ctx = sui::test_scenario::ctx(&mut scenario);
            let poll_id = sui::object::id_from_address(@0x999);
            let voter = @0x1;
            let vote_choice = true; // yes vote
            
            let ballot = ballot::create_test_ballot(poll_id, voter, vote_choice, ctx);
            
            // Test ballot properties
            let (ballot_poll_id, anonymous_id, vote, timestamp) = ballot::get_ballot_info(&ballot);
            assert!(ballot_poll_id == poll_id, 0);
            assert!(vote == vote_choice, 1);
            assert!(timestamp == 1000, 2);
            assert!(std::vector::length(&anonymous_id) == 32, 3);
            
            // Test poll verification
            assert!(ballot::verify_ballot_poll(&ballot, poll_id), 4);
            
            sui::transfer::public_share_object(ballot);
        };
        
        sui::test_scenario::end(scenario);
    }

    #[test]
    fun test_ballot_creation_no_vote() {
        let mut scenario = sui::test_scenario::begin(@0x1);
        
        sui::test_scenario::next_tx(&mut scenario, @0x1);
        {
            let ctx = sui::test_scenario::ctx(&mut scenario);
            let poll_id = sui::object::id_from_address(@0x999);
            let voter = @0x2;
            let vote_choice = false; // no vote
            
            let ballot = ballot::create_test_ballot(poll_id, voter, vote_choice, ctx);
            
            // Test ballot properties
            let (ballot_poll_id, anonymous_id, vote, timestamp) = ballot::get_ballot_info(&ballot);
            assert!(ballot_poll_id == poll_id, 0);
            assert!(vote == vote_choice, 1); // should be false
            assert!(timestamp == 1000, 2);
            assert!(std::vector::length(&anonymous_id) == 32, 3);
            
            sui::transfer::public_share_object(ballot);
        };
        
        sui::test_scenario::end(scenario);
    }

    #[test]
    fun test_ballot_poll_verification() {
        let mut scenario = sui::test_scenario::begin(@0x1);
        
        sui::test_scenario::next_tx(&mut scenario, @0x1);
        {
            let ctx = sui::test_scenario::ctx(&mut scenario);
            let poll_id = sui::object::id_from_address(@0x999);
            let wrong_poll_id = sui::object::id_from_address(@0x888);
            let voter = @0x1;
            
            let ballot = ballot::create_test_ballot(poll_id, voter, true, ctx);
            
            // Test correct poll verification
            assert!(ballot::verify_ballot_poll(&ballot, poll_id), 0);
            
            // Test wrong poll verification
            assert!(!ballot::verify_ballot_poll(&ballot, wrong_poll_id), 1);
            
            sui::transfer::public_share_object(ballot);
        };
        
        sui::test_scenario::end(scenario);
    }

    // ===== Test Anonymity Properties =====

    #[test]
    fun test_ballot_anonymity_preservation() {
        let mut scenario = sui::test_scenario::begin(@0x1);
        
        sui::test_scenario::next_tx(&mut scenario, @0x1);
        {
            let ctx = sui::test_scenario::ctx(&mut scenario);
            let poll_id = sui::object::id_from_address(@0x999);
            let voter1 = @0x1;
            let voter2 = @0x2;
            
            let ballot1 = ballot::create_test_ballot(poll_id, voter1, true, ctx);
            let ballot2 = ballot::create_test_ballot(poll_id, voter2, false, ctx);
            
            // Get anonymous IDs
            let (_, anonymous_id1, vote1, _) = ballot::get_ballot_info(&ballot1);
            let (_, anonymous_id2, vote2, _) = ballot::get_ballot_info(&ballot2);
            
            // Different voters should have different anonymous IDs
            assert!(anonymous_id1 != anonymous_id2, 0);
            
            // Votes should be preserved correctly
            assert!(vote1 == true, 1);
            assert!(vote2 == false, 2);
            
            // Both should be valid for the same poll
            assert!(ballot::verify_ballot_poll(&ballot1, poll_id), 3);
            assert!(ballot::verify_ballot_poll(&ballot2, poll_id), 4);
            
            sui::transfer::public_share_object(ballot1);
            sui::transfer::public_share_object(ballot2);
        };
        
        sui::test_scenario::end(scenario);
    }

    // ===== Test Integration Scenarios =====

    #[test]
    fun test_vote_registry_ballot_integration() {
        let mut scenario = sui::test_scenario::begin(@0x1);
        
        sui::test_scenario::next_tx(&mut scenario, @0x1);
        {
            let ctx = sui::test_scenario::ctx(&mut scenario);
            let poll_id = sui::object::id_from_address(@0x999);
            let voter = @0x1;
            
            // Create vote registry and ballot for same poll
            let registry = ballot::create_test_vote_registry(poll_id, ctx);
            let ballot = ballot::create_test_ballot(poll_id, voter, true, ctx);
            
            // Verify they belong to same poll
            assert!(ballot::get_vote_registry_poll_id(&registry) == poll_id, 0);
            assert!(ballot::verify_ballot_poll(&ballot, poll_id), 1);
            
            // Verify registry poll ID matches ballot poll ID
            let (ballot_poll_id, _, _, _) = ballot::get_ballot_info(&ballot);
            assert!(ballot::get_vote_registry_poll_id(&registry) == ballot_poll_id, 2);
            
            sui::transfer::public_share_object(registry);
            sui::transfer::public_share_object(ballot);
        };
        
        sui::test_scenario::end(scenario);
    }

    // ===== Test Multiple Voters Scenario =====

    #[test]
    fun test_multiple_voters_anonymity() {
        let mut scenario = sui::test_scenario::begin(@0x1);
        
        sui::test_scenario::next_tx(&mut scenario, @0x1);
        {
            let ctx = sui::test_scenario::ctx(&mut scenario);
            let poll_id = sui::object::id_from_address(@0x999);
            
            // Create ballots for multiple voters
            let ballot1 = ballot::create_test_ballot(poll_id, @0x1, true, ctx);
            let ballot2 = ballot::create_test_ballot(poll_id, @0x2, false, ctx);
            let ballot3 = ballot::create_test_ballot(poll_id, @0x3, true, ctx);
            
            // Get all anonymous IDs
            let (_, id1, vote1, _) = ballot::get_ballot_info(&ballot1);
            let (_, id2, vote2, _) = ballot::get_ballot_info(&ballot2);
            let (_, id3, vote3, _) = ballot::get_ballot_info(&ballot3);
            
            // All anonymous IDs should be different
            assert!(id1 != id2, 0);
            assert!(id1 != id3, 1);
            assert!(id2 != id3, 2);
            
            // All should be 32 bytes
            assert!(std::vector::length(&id1) == 32, 3);
            assert!(std::vector::length(&id2) == 32, 4);
            assert!(std::vector::length(&id3) == 32, 5);
            
            // Votes should be preserved
            assert!(vote1 == true, 6);
            assert!(vote2 == false, 7);
            assert!(vote3 == true, 8);
            
            sui::transfer::public_share_object(ballot1);
            sui::transfer::public_share_object(ballot2);
            sui::transfer::public_share_object(ballot3);
        };
        
        sui::test_scenario::end(scenario);
    }
}