#[test_only]
module shallot::poll_tests_simple {
    use shallot::poll;

    // ===== Test Poll Creation =====

    #[test]
    fun test_poll_basic_properties() {
        let mut scenario = sui::test_scenario::begin(@0x1);
        
        sui::test_scenario::next_tx(&mut scenario, @0x1);
        {
            let ctx = sui::test_scenario::ctx(&mut scenario);
            let forum_id = sui::object::id_from_address(@0x999);
            let creator = @0x1;
            
            let poll = poll::create_test_poll(forum_id, creator, ctx);
            
            // Test basic poll properties
            let (title, description, poll_creator, start_time, end_time, yes_votes, no_votes, is_executed) = poll::get_poll_info(&poll);
            assert!(title == std::string::utf8(b"Test Poll"), 0);
            assert!(description == std::string::utf8(b"A test poll for metadata update"), 1);
            assert!(poll_creator == creator, 2);
            assert!(start_time == 1000, 3);
            assert!(end_time == 2000, 4);
            assert!(yes_votes == 0, 5);
            assert!(no_votes == 0, 6);
            assert!(!is_executed, 7);
            
            // Test proposal details
            let (new_name, new_description) = poll::get_poll_proposal(&poll);
            assert!(new_name == std::string::utf8(b"New Forum Name"), 8);
            assert!(new_description == std::string::utf8(b"New forum description"), 9);
            
            sui::transfer::public_share_object(poll);
        };
        
        sui::test_scenario::end(scenario);
    }

    #[test]
    fun test_poll_forum_verification() {
        let mut scenario = sui::test_scenario::begin(@0x1);
        
        sui::test_scenario::next_tx(&mut scenario, @0x1);
        {
            let ctx = sui::test_scenario::ctx(&mut scenario);
            let forum_id = sui::object::id_from_address(@0x999);
            let wrong_forum_id = sui::object::id_from_address(@0x888);
            
            let poll = poll::create_test_poll(forum_id, @0x1, ctx);
            
            // Test forum verification
            assert!(poll::get_poll_forum_id(&poll) == forum_id, 0);
            assert!(poll::verify_poll_forum(&poll, forum_id), 1);
            assert!(!poll::verify_poll_forum(&poll, wrong_forum_id), 2);
            
            sui::transfer::public_share_object(poll);
        };
        
        sui::test_scenario::end(scenario);
    }

    // ===== Test Poll Voting =====

    #[test]
    fun test_poll_vote_counting() {
        let mut scenario = sui::test_scenario::begin(@0x1);
        
        sui::test_scenario::next_tx(&mut scenario, @0x1);
        {
            let ctx = sui::test_scenario::ctx(&mut scenario);
            let forum_id = sui::object::id_from_address(@0x999);
            let mut poll = poll::create_test_poll(forum_id, @0x1, ctx);
            
            // Test initial vote counts
            let (yes_votes, no_votes, total_votes, passed) = poll::get_poll_results(&poll);
            assert!(yes_votes == 0, 0);
            assert!(no_votes == 0, 1);
            assert!(total_votes == 0, 2);
            assert!(!passed, 3); // no votes = not passed
            
            // Add yes votes
            poll::increment_yes_votes(&mut poll);
            poll::increment_yes_votes(&mut poll);
            
            let (yes_votes, no_votes, total_votes, passed) = poll::get_poll_results(&poll);
            assert!(yes_votes == 2, 4);
            assert!(no_votes == 0, 5);
            assert!(total_votes == 2, 6);
            assert!(passed, 7); // yes > no
            
            // Add no vote
            poll::increment_no_votes(&mut poll);
            
            let (yes_votes, no_votes, total_votes, passed) = poll::get_poll_results(&poll);
            assert!(yes_votes == 2, 8);
            assert!(no_votes == 1, 9);
            assert!(total_votes == 3, 10);
            assert!(passed, 11); // 2 > 1, still passed
            
            sui::transfer::public_share_object(poll);
        };
        
        sui::test_scenario::end(scenario);
    }

    #[test]
    fun test_poll_vote_tie_fails() {
        let mut scenario = sui::test_scenario::begin(@0x1);
        
        sui::test_scenario::next_tx(&mut scenario, @0x1);
        {
            let ctx = sui::test_scenario::ctx(&mut scenario);
            let forum_id = sui::object::id_from_address(@0x999);
            let mut poll = poll::create_test_poll(forum_id, @0x1, ctx);
            
            // Create tie: equal yes and no votes
            poll::increment_yes_votes(&mut poll);
            poll::increment_no_votes(&mut poll);
            
            let (yes_votes, no_votes, total_votes, passed) = poll::get_poll_results(&poll);
            assert!(yes_votes == 1, 0);
            assert!(no_votes == 1, 1);
            assert!(total_votes == 2, 2);
            assert!(!passed, 3); // tie = not passed (need yes > no)
            
            sui::transfer::public_share_object(poll);
        };
        
        sui::test_scenario::end(scenario);
    }

    // ===== Test Poll Status =====

    #[test]
    fun test_poll_execution_status() {
        let mut scenario = sui::test_scenario::begin(@0x1);
        
        sui::test_scenario::next_tx(&mut scenario, @0x1);
        {
            let ctx = sui::test_scenario::ctx(&mut scenario);
            let forum_id = sui::object::id_from_address(@0x999);
            let poll = poll::create_test_poll(forum_id, @0x1, ctx);
            
            // Test initial execution status
            assert!(!poll::is_poll_executed(&poll), 0);
            
            // Test member snapshot
            assert!(poll::get_member_snapshot(&poll) == 5, 1);
            
            sui::transfer::public_share_object(poll);
        };
        
        sui::test_scenario::end(scenario);
    }

    #[test]
    fun test_poll_time_checking() {
        let mut scenario = sui::test_scenario::begin(@0x1);
        
        sui::test_scenario::next_tx(&mut scenario, @0x1);
        {
            let ctx = sui::test_scenario::ctx(&mut scenario);
            let forum_id = sui::object::id_from_address(@0x999);
            let poll = poll::create_test_poll(forum_id, @0x1, ctx);
            
            // Create clocks for testing
            let mut clock_before = sui::clock::create_for_testing(ctx);
            let mut clock_after = sui::clock::create_for_testing(ctx);
            
            // Set times relative to poll times (start: 1000, end: 2000)
            sui::clock::set_for_testing(&mut clock_before, 1500); // during poll
            sui::clock::set_for_testing(&mut clock_after, 2500);  // after poll
            
            // Test poll timing
            assert!(!poll::has_poll_ended(&poll, &clock_before), 0); // not ended yet
            assert!(poll::has_poll_ended(&poll, &clock_after), 1);   // ended
            
            sui::clock::destroy_for_testing(clock_before);
            sui::clock::destroy_for_testing(clock_after);
            sui::transfer::public_share_object(poll);
        };
        
        sui::test_scenario::end(scenario);
    }

    // ===== Test Poll Results Scenarios =====

    #[test]
    fun test_poll_no_majority_fails() {
        let mut scenario = sui::test_scenario::begin(@0x1);
        
        sui::test_scenario::next_tx(&mut scenario, @0x1);
        {
            let ctx = sui::test_scenario::ctx(&mut scenario);
            let forum_id = sui::object::id_from_address(@0x999);
            let mut poll = poll::create_test_poll(forum_id, @0x1, ctx);
            
            // No votes > yes votes
            poll::increment_yes_votes(&mut poll);
            poll::increment_no_votes(&mut poll);
            poll::increment_no_votes(&mut poll);
            
            let (yes_votes, no_votes, total_votes, passed) = poll::get_poll_results(&poll);
            assert!(yes_votes == 1, 0);
            assert!(no_votes == 2, 1);
            assert!(total_votes == 3, 2);
            assert!(!passed, 3); // 1 < 2, failed
            
            sui::transfer::public_share_object(poll);
        };
        
        sui::test_scenario::end(scenario);
    }

    #[test]
    fun test_poll_clear_majority_passes() {
        let mut scenario = sui::test_scenario::begin(@0x1);
        
        sui::test_scenario::next_tx(&mut scenario, @0x1);
        {
            let ctx = sui::test_scenario::ctx(&mut scenario);
            let forum_id = sui::object::id_from_address(@0x999);
            let mut poll = poll::create_test_poll(forum_id, @0x1, ctx);
            
            // Clear yes majority
            poll::increment_yes_votes(&mut poll);
            poll::increment_yes_votes(&mut poll);
            poll::increment_yes_votes(&mut poll);
            poll::increment_no_votes(&mut poll);
            
            let (yes_votes, no_votes, total_votes, passed) = poll::get_poll_results(&poll);
            assert!(yes_votes == 3, 0);
            assert!(no_votes == 1, 1);
            assert!(total_votes == 4, 2);
            assert!(passed, 3); // 3 > 1, passed
            
            sui::transfer::public_share_object(poll);
        };
        
        sui::test_scenario::end(scenario);
    }

    // ===== Test Poll Lifecycle =====

    #[test]
    fun test_poll_complete_lifecycle() {
        let mut scenario = sui::test_scenario::begin(@0x1);
        
        sui::test_scenario::next_tx(&mut scenario, @0x1);
        {
            let ctx = sui::test_scenario::ctx(&mut scenario);
            let forum_id = sui::object::id_from_address(@0x999);
            let mut poll = poll::create_test_poll(forum_id, @0x1, ctx);
            
            // 1. Initial state
            assert!(!poll::is_poll_executed(&poll), 0);
            let (_, _, _, passed) = poll::get_poll_results(&poll);
            assert!(!passed, 1);
            
            // 2. Voting phase
            poll::increment_yes_votes(&mut poll);
            poll::increment_yes_votes(&mut poll);
            poll::increment_no_votes(&mut poll);
            
            // 3. Check results
            let (yes_votes, no_votes, total_votes, passed) = poll::get_poll_results(&poll);
            assert!(yes_votes == 2, 2);
            assert!(no_votes == 1, 3);
            assert!(total_votes == 3, 4);
            assert!(passed, 5);
            
            // 4. Verify poll properties remain consistent
            assert!(poll::get_member_snapshot(&poll) == 5, 6);
            assert!(poll::verify_poll_forum(&poll, forum_id), 7);
            
            sui::transfer::public_share_object(poll);
        };
        
        sui::test_scenario::end(scenario);
    }
}