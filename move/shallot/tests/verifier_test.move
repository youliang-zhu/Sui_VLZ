module shallot::verifier_test {
    use shallot::verifier;
    use std::string;

    #[test]
    public fun test_verifier_functionality() {
        let verifier = verifier::create_simple_password_verifier(string::utf8(b"abc123"), 42);
        // 正确密码
        assert!(verifier::verify_user(&verifier, string::utf8(b"abc123")), 0);
        // 错误密码
        assert!(!verifier::verify_user(&verifier, string::utf8(b"wrong")), 1);
        // 空密码
        assert!(!verifier::verify_user(&verifier, string::utf8(b"")), 2);
    }
}