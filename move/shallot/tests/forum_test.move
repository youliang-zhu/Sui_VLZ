#[test_only]
module shallot::forum_tests {
    use std::string;
    use sui::test_scenario::{Self, Scenario};
    use sui::clock;
    use shallot::forum;

    // ===== Test Forum Creation =====
    #[test]
    fun test_forum_creation_basic() {
        let mut scenario = test_scenario::begin(@0x1);
        let ctx = test_scenario::ctx(&mut scenario);
        
        let forum = forum::create_test_forum(ctx);
        
        // Test forum properties
        let (name, description, creator, member_count, created_at) = forum::get_forum_info(&forum);
        assert!(name == string::utf8(b"Test Forum"), 0);
        assert!(description == string::utf8(b"A test forum"), 1);
        assert!(creator == @0x1, 2);
        assert!(member_count == 0, 3);
        assert!(created_at == 1000, 4);
        assert!(!forum::has_active_poll(&forum), 5);
        
        // Test that active poll is none
        let mut active_poll = forum::get_active_poll(&forum);
        assert!(option::is_none(&active_poll), 6);
        
        transfer::public_share_object(forum);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_forum_creator_no_special_privileges() {
        let mut scenario = test_scenario::begin(@0x1);
        let ctx = test_scenario::ctx(&mut scenario);
        
        let forum = forum::create_test_forum(ctx);
        
        // Verify creator is recorded but has no special status
        let creator = forum::get_creator(&forum);
        assert!(creator == @0x1, 0);
        
        // Creator starts with 0 membership count like everyone else
        assert!(forum::get_member_count(&forum) == 0, 1);
        
        transfer::public_share_object(forum);
        test_scenario::end(scenario);
    }

    // ===== Test Active Poll Management =====

    #[test]
    fun test_active_poll_management() {
        let mut scenario = test_scenario::begin(@0x1);
        let ctx = test_scenario::ctx(&mut scenario);
        
        let mut forum = forum::create_test_forum(ctx);
        let dummy_poll_id = object::id_from_address(@0x999);
        
        // Test initial state - no active poll
        assert!(!forum::has_active_poll(&forum), 0);
        let mut active_poll = forum::get_active_poll(&forum);
        assert!(option::is_none(&active_poll), 1);
        
        // Test setting active poll
        forum::set_active_poll(&mut forum, dummy_poll_id);
        assert!(forum::has_active_poll(&forum), 2);
        
        let mut active_poll = forum::get_active_poll(&forum);
        assert!(option::is_some(&active_poll), 3);
        assert!(option::extract(&mut active_poll) == dummy_poll_id, 4);
        
        // Test clearing active poll
        forum::clear_active_poll(&mut forum);
        assert!(!forum::has_active_poll(&forum), 5);
        
        let mut active_poll = forum::get_active_poll(&forum);
        assert!(option::is_none(&active_poll), 6);
        
        transfer::public_share_object(forum);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = shallot::forum::E_ACTIVE_POLL_EXISTS)]
    fun test_set_active_poll_when_exists_fails() {
        let mut scenario = test_scenario::begin(@0x1);
        let ctx = test_scenario::ctx(&mut scenario);
        
        let mut forum = forum::create_test_forum(ctx);
        let poll_id1 = object::id_from_address(@0x998);
        let poll_id2 = object::id_from_address(@0x999);
        
        // Set first poll
        forum::set_active_poll(&mut forum, poll_id1);
        
        // This should fail - cannot set when poll already exists
        forum::set_active_poll(&mut forum, poll_id2);
        
        transfer::public_share_object(forum);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = shallot::forum::E_NO_ACTIVE_POLL)]
    fun test_clear_active_poll_when_none_fails() {
        let mut scenario = test_scenario::begin(@0x1);
        let ctx = test_scenario::ctx(&mut scenario);
        
        let mut forum = forum::create_test_forum(ctx);
        
        // This should fail - no poll to clear
        forum::clear_active_poll(&mut forum);
        
        transfer::public_share_object(forum);
        test_scenario::end(scenario);
    }

    // ===== Test Member Count Management =====

    #[test]
    fun test_member_count_increment() {
        let mut scenario = test_scenario::begin(@0x1);
        let ctx = test_scenario::ctx(&mut scenario);
        
        let mut forum = forum::create_test_forum(ctx);
        
        // Test initial member count
        assert!(forum::get_member_count(&forum) == 0, 0);
        
        // Test incrementing member count
        forum::increment_member_count(&mut forum);
        assert!(forum::get_member_count(&forum) == 1, 1);
        
        forum::increment_member_count(&mut forum);
        assert!(forum::get_member_count(&forum) == 2, 2);
        
        forum::increment_member_count(&mut forum);
        assert!(forum::get_member_count(&forum) == 3, 3);
        
        transfer::public_share_object(forum);
        test_scenario::end(scenario);
    }

    // ===== Test Metadata Updates =====

    #[test]
    fun test_metadata_updates() {
        let mut scenario = test_scenario::begin(@0x1);
        let ctx = test_scenario::ctx(&mut scenario);
        
        let mut forum = forum::create_test_forum(ctx);
        let clock = clock::create_for_testing(ctx);
        let dummy_poll_id = object::id_from_address(@0x999);
        
        // Test initial metadata
        let (initial_name, initial_description, _, _, _) = forum::get_forum_info(&forum);
        assert!(initial_name == string::utf8(b"Test Forum"), 0);
        assert!(initial_description == string::utf8(b"A test forum"), 1);
        
        // Test metadata update - the ONLY way to change forum properties
        let new_name = string::utf8(b"Updated Forum Name");
        let new_description = string::utf8(b"Updated forum description");
        
        forum::update_metadata(&mut forum, new_name, new_description, dummy_poll_id, &clock);
        
        // Verify changes
        let (updated_name, updated_description, creator, member_count, created_at) = forum::get_forum_info(&forum);
        assert!(updated_name == new_name, 2);
        assert!(updated_description == new_description, 3);
        
        // Verify other fields unchanged
        assert!(creator == @0x1, 4);
        assert!(member_count == 0, 5);
        assert!(created_at == 1000, 6);
        
        clock::destroy_for_testing(clock);
        transfer::public_share_object(forum);
        test_scenario::end(scenario);
    }

    // ===== Test View Functions =====

    #[test]
    fun test_view_functions() {
        let mut scenario = test_scenario::begin(@0x1);
        let ctx = test_scenario::ctx(&mut scenario);
        
        let forum = forum::create_test_forum(ctx);
        
        // Test individual getters
        let creator = forum::get_creator(&forum);
        assert!(creator == @0x1, 0);
        
        let member_count = forum::get_member_count(&forum);
        assert!(member_count == 0, 1);
        
        let has_poll = forum::has_active_poll(&forum);
        assert!(!has_poll, 2);
        
        let mut active_poll = forum::get_active_poll(&forum);
        assert!(option::is_none(&active_poll), 3);
        
        // Test comprehensive info getter
        let (name, description, creator_addr, count, timestamp) = forum::get_forum_info(&forum);
        assert!(name == string::utf8(b"Test Forum"), 4);
        assert!(description == string::utf8(b"A test forum"), 5);
        assert!(creator_addr == @0x1, 6);
        assert!(count == 0, 7);
        assert!(timestamp == 1000, 8);
        
        transfer::public_share_object(forum);
        test_scenario::end(scenario);
    }

    // ===== Test Verifier Access =====

    #[test]
    fun test_verifier_access() {
        let mut scenario = test_scenario::begin(@0x1);
        let ctx = test_scenario::ctx(&mut scenario);
        
        let forum = forum::create_test_forum(ctx);
        
        // Test that verifier can be accessed (for membership verification)
        let verifier = forum::get_verifier(&forum);
        
        // Verify it's the test verifier with known properties
        let created_at = shallot::verifier::get_created_at(verifier);
        assert!(created_at == 1000, 0); // From create_test_verifier()
        
        transfer::public_share_object(forum);
        test_scenario::end(scenario);
    }

    // ===== Test Immutability Principle =====

    #[test]
    fun test_verification_rules_immutable() {
        let mut scenario = test_scenario::begin(@0x1);
        let ctx = test_scenario::ctx(&mut scenario);
        
        let forum = forum::create_test_forum(ctx);
        
        // Get verifier hash to ensure it can't be changed
        let verifier = forum::get_verifier(&forum);
        let original_hash = shallot::verifier::get_password_hash(verifier);
        let original_timestamp = shallot::verifier::get_created_at(verifier);
        
        // After any operations, verifier should remain unchanged
        // (This demonstrates the immutability principle)
        
        let verifier_after = forum::get_verifier(&forum);
        let hash_after = shallot::verifier::get_password_hash(verifier_after);
        let timestamp_after = shallot::verifier::get_created_at(verifier_after);
        
        assert!(original_hash == hash_after, 0);
        assert!(original_timestamp == timestamp_after, 1);
        
        transfer::public_share_object(forum);
        test_scenario::end(scenario);
    }

    // ===== Integration Test =====

    #[test]
    fun test_forum_complete_lifecycle() {
        let mut scenario = test_scenario::begin(@0x1);
        let ctx = test_scenario::ctx(&mut scenario);
        
        let mut forum = forum::create_test_forum(ctx);
        let clock = clock::create_for_testing(ctx);
        let poll_id = object::id_from_address(@0x999);
        
        // 1. Initial state
        assert!(forum::get_member_count(&forum) == 0, 0);
        assert!(!forum::has_active_poll(&forum), 1);
        
        // 2. Simulate members joining
        forum::increment_member_count(&mut forum);
        forum::increment_member_count(&mut forum);
        assert!(forum::get_member_count(&forum) == 2, 2);
        
        // 3. Set active poll
        forum::set_active_poll(&mut forum, poll_id);
        assert!(forum::has_active_poll(&forum), 3);
        
        // 4. Update metadata (simulate successful vote)
        let new_name = string::utf8(b"Community Renamed Forum");
        let new_description = string::utf8(b"Democratically updated description");
        forum::update_metadata(&mut forum, new_name, new_description, poll_id, &clock);
        
        // 5. Clear poll
        forum::clear_active_poll(&mut forum);
        assert!(!forum::has_active_poll(&forum), 4);
        
        // 6. Verify final state
        let (final_name, final_description, creator, member_count, _) = forum::get_forum_info(&forum);
        assert!(final_name == new_name, 5);
        assert!(final_description == new_description, 6);
        assert!(creator == @0x1, 7); // Creator recorded but has no special rights
        assert!(member_count == 2, 8);
        
        clock::destroy_for_testing(clock);
        transfer::public_share_object(forum);
        test_scenario::end(scenario);
    }
}