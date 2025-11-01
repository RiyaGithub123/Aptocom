#[test_only]
module aptocom::act_token_tests {
    use std::signer;
    use aptos_framework::account;
    use aptocom::act_token;

    /// Test initialization of ACT token
    #[test(admin = @aptocom)]
    public fun test_initialize(admin: &signer) {
        // Initialize the token
        act_token::initialize(admin);

        // Verify metadata
        assert!(act_token::name() == std::string::utf8(b"AptoCom Token"), 1);
        assert!(act_token::symbol() == std::string::utf8(b"ACT"), 2);
        assert!(act_token::decimals() == 8, 3);
        assert!(act_token::total_supply() == 0, 4);
    }

    /// Test that double initialization fails
    #[test(admin = @aptocom)]
    #[expected_failure(abort_code = 2)] // E_ALREADY_INITIALIZED
    public fun test_double_initialization_fails(admin: &signer) {
        act_token::initialize(admin);
        act_token::initialize(admin); // Should fail
    }

    /// Test minting tokens
    #[test(admin = @aptocom, recipient = @0x123)]
    public fun test_mint(admin: &signer, recipient: &signer) {
        let recipient_addr = signer::address_of(recipient);
        
        // Create accounts
        account::create_account_for_test(signer::address_of(admin));
        account::create_account_for_test(recipient_addr);

        // Initialize token
        act_token::initialize(admin);

        // Mint 1000 ACT tokens
        act_token::mint(admin, recipient_addr, 100000000000); // 1000 tokens (8 decimals)

        // Verify balance and supply
        assert!(act_token::balance_of(recipient_addr) == 100000000000, 1);
        assert!(act_token::total_supply() == 100000000000, 2);
    }

    /// Test minting multiple times increases supply
    #[test(admin = @aptocom, user1 = @0x123, user2 = @0x456)]
    public fun test_mint_multiple(admin: &signer, user1: &signer, user2: &signer) {
        let user1_addr = signer::address_of(user1);
        let user2_addr = signer::address_of(user2);
        
        // Create accounts
        account::create_account_for_test(signer::address_of(admin));
        account::create_account_for_test(user1_addr);
        account::create_account_for_test(user2_addr);

        // Initialize token
        act_token::initialize(admin);

        // Mint to user1
        act_token::mint(admin, user1_addr, 50000000000); // 500 tokens

        // Mint to user2
        act_token::mint(admin, user2_addr, 30000000000); // 300 tokens

        // Verify balances
        assert!(act_token::balance_of(user1_addr) == 50000000000, 1);
        assert!(act_token::balance_of(user2_addr) == 30000000000, 2);
        assert!(act_token::total_supply() == 80000000000, 3);
    }

    /// Test that non-admin cannot mint
    #[test(admin = @aptocom, hacker = @0x666)]
    #[expected_failure] // Should fail with E_NOT_ADMIN
    public fun test_non_admin_cannot_mint(admin: &signer, hacker: &signer) {
        let hacker_addr = signer::address_of(hacker);
        
        // Create accounts
        account::create_account_for_test(signer::address_of(admin));
        account::create_account_for_test(hacker_addr);

        // Initialize token with admin
        act_token::initialize(admin);

        // Try to mint as hacker (should fail)
        act_token::mint(hacker, hacker_addr, 100000000000);
    }

    /// Test token transfer
    #[test(admin = @aptocom, sender = @0x123, receiver = @0x456)]
    public fun test_transfer(admin: &signer, sender: &signer, receiver: &signer) {
        let sender_addr = signer::address_of(sender);
        let receiver_addr = signer::address_of(receiver);
        
        // Create accounts
        account::create_account_for_test(signer::address_of(admin));
        account::create_account_for_test(sender_addr);
        account::create_account_for_test(receiver_addr);

        // Initialize and mint
        act_token::initialize(admin);
        act_token::mint(admin, sender_addr, 100000000000); // 1000 tokens

        // Transfer 300 tokens
        act_token::transfer(sender, receiver_addr, 30000000000);

        // Verify balances
        assert!(act_token::balance_of(sender_addr) == 70000000000, 1); // 700 left
        assert!(act_token::balance_of(receiver_addr) == 30000000000, 2); // 300 received
        assert!(act_token::total_supply() == 100000000000, 3); // Supply unchanged
    }

    /// Test burning tokens by admin
    #[test(admin = @aptocom, user = @0x123)]
    public fun test_burn_by_admin(admin: &signer, user: &signer) {
        let user_addr = signer::address_of(user);
        
        // Create accounts
        account::create_account_for_test(signer::address_of(admin));
        account::create_account_for_test(user_addr);

        // Initialize and mint
        act_token::initialize(admin);
        act_token::mint(admin, user_addr, 100000000000); // 1000 tokens

        // Burn 200 tokens
        act_token::burn(admin, user_addr, 20000000000);

        // Verify balance and supply decreased
        assert!(act_token::balance_of(user_addr) == 80000000000, 1); // 800 left
        assert!(act_token::total_supply() == 80000000000, 2); // Supply decreased
    }

    /// Test self-burn
    #[test(admin = @aptocom, user = @0x123)]
    public fun test_burn_from_self(admin: &signer, user: &signer) {
        let user_addr = signer::address_of(user);
        
        // Create accounts
        account::create_account_for_test(signer::address_of(admin));
        account::create_account_for_test(user_addr);

        // Initialize and mint
        act_token::initialize(admin);
        act_token::mint(admin, user_addr, 100000000000); // 1000 tokens

        // User burns their own tokens
        act_token::burn_from_self(user, 20000000000); // Burn 200 tokens

        // Verify balance and supply
        assert!(act_token::balance_of(user_addr) == 80000000000, 1);
        assert!(act_token::total_supply() == 80000000000, 2);
    }

    /// Test admin transfer
    #[test(admin = @aptocom, new_admin = @0x999)]
    public fun test_transfer_admin(admin: &signer, new_admin: &signer) {
        let new_admin_addr = signer::address_of(new_admin);
        
        // Create accounts
        account::create_account_for_test(signer::address_of(admin));
        account::create_account_for_test(new_admin_addr);

        // Initialize
        act_token::initialize(admin);

        // Transfer admin rights
        act_token::transfer_admin(admin, new_admin_addr);

        // Verify new admin can mint
        act_token::mint(new_admin, new_admin_addr, 100000000000);
        assert!(act_token::balance_of(new_admin_addr) == 100000000000, 1);
    }

    /// Test complete workflow: mint -> transfer -> burn
    #[test(admin = @aptocom, alice = @0x111, bob = @0x222)]
    public fun test_complete_workflow(admin: &signer, alice: &signer, bob: &signer) {
        let alice_addr = signer::address_of(alice);
        let bob_addr = signer::address_of(bob);
        
        // Create accounts
        account::create_account_for_test(signer::address_of(admin));
        account::create_account_for_test(alice_addr);
        account::create_account_for_test(bob_addr);

        // 1. Initialize
        act_token::initialize(admin);
        assert!(act_token::total_supply() == 0, 1);

        // 2. Mint to Alice
        act_token::mint(admin, alice_addr, 100000000000); // 1000 tokens
        assert!(act_token::balance_of(alice_addr) == 100000000000, 2);
        assert!(act_token::total_supply() == 100000000000, 3);

        // 3. Alice transfers to Bob
        act_token::transfer(alice, bob_addr, 40000000000); // 400 tokens
        assert!(act_token::balance_of(alice_addr) == 60000000000, 4); // 600 left
        assert!(act_token::balance_of(bob_addr) == 40000000000, 5); // 400 received

        // 4. Bob burns some tokens
        act_token::burn_from_self(bob, 10000000000); // Burn 100 tokens
        assert!(act_token::balance_of(bob_addr) == 30000000000, 6); // 300 left
        assert!(act_token::total_supply() == 90000000000, 7); // Supply = 900

        // 5. Admin burns from Alice
        act_token::burn(admin, alice_addr, 10000000000); // Burn 100 from Alice
        assert!(act_token::balance_of(alice_addr) == 50000000000, 8); // 500 left
        assert!(act_token::total_supply() == 80000000000, 9); // Total = 800
    }

    /// Test balance query for account with no tokens
    #[test(admin = @aptocom, empty_account = @0xAAA)]
    public fun test_zero_balance(admin: &signer, empty_account: &signer) {
        let empty_addr = signer::address_of(empty_account);
        
        // Create accounts
        account::create_account_for_test(signer::address_of(admin));
        account::create_account_for_test(empty_addr);

        // Initialize
        act_token::initialize(admin);

        // Check balance (should be 0)
        assert!(act_token::balance_of(empty_addr) == 0, 1);
    }
}
