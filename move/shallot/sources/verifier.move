/// Verifier module for Shallot decentralized forum voting system
/// Implements pluggable identity verification system with simple password verification
module shallot::verifier {
    use std::string::{Self, String};

    // ===== Error Constants =====
    
    /// Error: Invalid password provided
    const E_INVALID_PASSWORD: u64 = 1;
    
    /// Error: Empty password not allowed
    const E_EMPTY_PASSWORD: u64 = 2;

    // ===== Verifier Configuration Structure =====

    /// Simple password verifier configuration
    /// This is the core verification mechanism for Forum access
    public struct SimplePasswordVerifier has store, copy, drop {
        password_hash: vector<u8>,  // SHA-256 hash of the password
        created_at: u64,            // Timestamp when verifier was created
    }

    // ===== Verifier Creation Functions =====

    /// Create a new SimplePasswordVerifier with given password
    /// This function hashes the password and stores only the hash for security
    public fun create_simple_password_verifier(
        password: String,
        timestamp: u64,
    ): SimplePasswordVerifier {
        // Ensure password is not empty
        assert!(!string::is_empty(&password), E_EMPTY_PASSWORD);
        
        // Convert string to bytes and hash it
        let password_bytes = string::as_bytes(&password);
        let password_hash = std::hash::sha2_256(*password_bytes);
        
        SimplePasswordVerifier {
            password_hash,
            created_at: timestamp,
        }
    }

    // ===== Verification Functions =====

    /// Verify user input against the stored password hash
    /// Returns true if password matches, false otherwise
    public fun verify_user(
        verifier: &SimplePasswordVerifier,
        input_password: String,
    ): bool {
        // Handle empty input
        if (string::is_empty(&input_password)) {
            return false
        };
        
        // Hash the input password and compare with stored hash
        let input_bytes = string::as_bytes(&input_password);
        let input_hash = std::hash::sha2_256(*input_bytes);
        
        input_hash == verifier.password_hash
    }

    /// Strict verification that aborts on failure
    /// Use this when you want to ensure verification or halt execution
    public fun verify_user_strict(
        verifier: &SimplePasswordVerifier,
        input_password: String,
    ) {
        assert!(verify_user(verifier, input_password), E_INVALID_PASSWORD);
    }

    // ===== Getter Functions =====

    /// Get the creation timestamp of the verifier
    public fun get_created_at(verifier: &SimplePasswordVerifier): u64 {
        verifier.created_at
    }

    /// Get the password hash (for debugging purposes only)
    /// Note: This should not be used in production for security reasons
    public fun get_password_hash(verifier: &SimplePasswordVerifier): vector<u8> {
        verifier.password_hash
    }

    // ===== Testing and Utility Functions =====

    /// Check if two verifiers have the same password (for testing)
    public fun verifiers_match(
        verifier1: &SimplePasswordVerifier,
        verifier2: &SimplePasswordVerifier,
    ): bool {
        verifier1.password_hash == verifier2.password_hash
    }

    #[test_only]
    /// Create a test verifier with a known password (for unit tests)
    public fun create_test_verifier(): SimplePasswordVerifier {
        create_simple_password_verifier(
            string::utf8(b"test_password_123"),
            1000, // test timestamp
        )
    }

    #[test_only]
    /// Test basic verification functionality
    public fun test_verification() {
        let verifier = create_test_verifier();
        
        // Test correct password
        assert!(verify_user(&verifier, string::utf8(b"test_password_123")), 0);
        
        // Test incorrect password
        assert!(!verify_user(&verifier, string::utf8(b"wrong_password")), 1);
        
        // Test empty password
        assert!(!verify_user(&verifier, string::utf8(b"")), 2);
    }
}