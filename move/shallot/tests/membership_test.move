#[test_only]
module shallot::membership_tests_simple {
    use shallot::membership;
    use sui::test_scenario::{Self, Scenario};

    // ===== Test Membership NFT =====

    #[test]
    fun test_membership_basic() {
        let mut scenario = sui::test_scenario::begin(@0x1);
        
        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let forum_id = sui::object::id_from_address(@0x999);
            let member_addr = @0x1;
            
            let membership = membership::create_test_membership(forum_id, member_addr, ctx);
            
            // Test membership properties
            let (membership_forum_id, membership_member, joined_at) = membership::get_membership_info(&membership);
            assert!(membership_forum_id == forum_id, 0);
            assert!(membership_member == member_addr, 1);
            assert!(joined_at == 1000, 2);
            
            // Test forum verification
            assert!(membership::verify_membership_forum(&membership, forum_id), 3);
            
            sui::transfer::public_transfer(membership, member_addr);
        };
        
        test_scenario::end(scenario);
    }

    // ===== Test Member Registry =====

    #[test]
    fun test_registry_empty() {
        let mut scenario = sui::test_scenario::begin(@0x1);
        
        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let forum_id = sui::object::id_from_address(@0x999);
            
            let registry = membership::create_test_registry(forum_id, ctx);
            
            // Test empty registry
            assert!(!membership::is_member(&registry, @0x1), 0);
            assert!(membership::get_member_count(&registry) == 0, 1);
            assert!(membership::get_registry_forum_id(&registry) == forum_id, 2);
            
            sui::transfer::public_share_object(registry);
        };
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_registry_add_member() {
        let mut scenario = sui::test_scenario::begin(@0x1);
        
        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let forum_id = sui::object::id_from_address(@0x999);
            let mut registry = membership::create_test_registry(forum_id, ctx);
            let member_addr = @0x1;
            
            // Add member
            membership::add_member_to_registry(&mut registry, member_addr);
            
            // Test member added successfully
            assert!(membership::is_member(&registry, member_addr), 0);
            assert!(membership::get_member_count(&registry) == 1, 1);
            assert!(membership::get_member_at_index(&registry, 0) == member_addr, 2);
            
            // Test verification
            membership::verify_member_or_abort(&registry, member_addr);
            
            sui::transfer::public_share_object(registry);
        };
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_registry_multiple_members() {
        let mut scenario = sui::test_scenario::begin(@0x1);
        
        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let forum_id = sui::object::id_from_address(@0x999);
            let mut registry = membership::create_test_registry(forum_id, ctx);
            
            let member1 = @0x1;
            let member2 = @0x2;
            let member3 = @0x3;
            
            // Add multiple members
            membership::add_member_to_registry(&mut registry, member1);
            membership::add_member_to_registry(&mut registry, member2);
            membership::add_member_to_registry(&mut registry, member3);
            
            // Test all members
            assert!(membership::get_member_count(&registry) == 3, 0);
            assert!(membership::is_member(&registry, member1), 1);
            assert!(membership::is_member(&registry, member2), 2);
            assert!(membership::is_member(&registry, member3), 3);
            
            // Test member order
            assert!(membership::get_member_at_index(&registry, 0) == member1, 4);
            assert!(membership::get_member_at_index(&registry, 1) == member2, 5);
            assert!(membership::get_member_at_index(&registry, 2) == member3, 6);
            
            sui::transfer::public_share_object(registry);
        };
        
        test_scenario::end(scenario);
    }

    // ===== Test Integration =====

    #[test]
    fun test_membership_registry_integration() {
        let mut scenario = sui::test_scenario::begin(@0x1);
        
        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let forum_id = sui::object::id_from_address(@0x999);
            let mut registry = membership::create_test_registry(forum_id, ctx);
            let member_addr = @0x1;
            
            // Create membership and add to registry
            let membership = membership::create_test_membership(forum_id, member_addr, ctx);
            membership::add_member_to_registry(&mut registry, member_addr);
            
            // Test integration - membership valid for forum
            assert!(membership::verify_membership_for_forum(&membership, &registry), 0);
            
            sui::transfer::public_share_object(registry);
            sui::transfer::public_transfer(membership, member_addr);
        };
        
        test_scenario::end(scenario);
    }

    // ===== Test Error Conditions =====

    #[test]
    #[expected_failure(abort_code = shallot::membership::E_ALREADY_MEMBER)]
    fun test_duplicate_member_fails() {
        let mut scenario = sui::test_scenario::begin(@0x1);
        
        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let forum_id = sui::object::id_from_address(@0x999);
            let mut registry = membership::create_test_registry(forum_id, ctx);
            
            // Add member twice - should fail
            membership::add_member_to_registry(&mut registry, @0x1);
            membership::add_member_to_registry(&mut registry, @0x1);
            
            sui::transfer::public_share_object(registry);
        };
        
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = shallot::membership::E_NOT_MEMBER)]
    fun test_verify_non_member_fails() {
        let mut scenario = sui::test_scenario::begin(@0x1);
        
        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let forum_id = sui::object::id_from_address(@0x999);
            let registry = membership::create_test_registry(forum_id, ctx);
            
            // Verify non-member - should fail
            membership::verify_member_or_abort(&registry, @0x1);
            
            sui::transfer::public_share_object(registry);
        };
        
        test_scenario::end(scenario);
    }

    // ===== Test Creator No Privileges =====

    #[test]
    fun test_creator_equality() {
        let mut scenario = sui::test_scenario::begin(@0x1);
        
        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let forum_id = sui::object::id_from_address(@0x999);
            let registry = membership::create_test_registry(forum_id, ctx);
            
            // Creator (@0x1) has no special privileges
            assert!(!membership::is_member(&registry, @0x1), 0);
            assert!(membership::get_member_count(&registry) == 0, 1);
            
            sui::transfer::public_share_object(registry);
        };
        
        test_scenario::end(scenario);
    }
}