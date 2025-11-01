#[test_only]
module aptocom::treasury_tests {
    use std::signer;
    use std::string;
    use aptos_framework::account;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::{Self, AptosCoin};
    use aptos_framework::timestamp;
    use aptocom::act_token;
    use aptocom::governance;
    use aptocom::treasury;

    /// Test initialization
    #[test(framework = @aptos_framework, admin = @aptocom)]
    public fun test_initialize(framework: &signer, admin: &signer) {
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(signer::address_of(admin));
        
        // Initialize ACT token first (treasury depends on it)
        act_token::initialize(admin);
        
        // Initialize treasury
        treasury::initialize(admin);
        
        // Verify treasury is initialized
        assert!(treasury::get_total_deposits() == 0, 1);
        assert!(treasury::get_total_withdrawals() == 0, 2);
        assert!(treasury::get_total_dividends_distributed() == 0, 3);
        assert!(treasury::get_transaction_count() == 0, 4);
        assert!(treasury::get_admin() == signer::address_of(admin), 5);
    }

    /// Test deposit functionality
    #[test(framework = @aptos_framework, admin = @aptocom, depositor = @0x123)]
    public fun test_deposit(framework: &signer, admin: &signer, depositor: &signer) {
        let depositor_addr = signer::address_of(depositor);
        let admin_addr = signer::address_of(admin);
        
        // Setup
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(admin_addr);
        account::create_account_for_test(depositor_addr);
        
        // Initialize AptosCoin for testing
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(framework);
        
        // Mint APT to depositor
        let coins = coin::mint(1000000000, &mint_cap); // 10 APT
        coin::register<AptosCoin>(depositor);
        coin::deposit(depositor_addr, coins);
        
        // Initialize modules
        act_token::initialize(admin);
        treasury::initialize(admin);
        
        // Get initial treasury balance
        let initial_balance = treasury::get_treasury_balance();
        
        // Deposit 5 APT to treasury
        treasury::deposit(depositor, 500000000);
        
        // Verify deposit
        assert!(treasury::get_total_deposits() == 500000000, 1);
        assert!(treasury::get_treasury_balance() == initial_balance + 500000000, 2);
        assert!(treasury::get_transaction_count() == 1, 3);
        
        // Cleanup
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    /// Test multiple deposits
    #[test(framework = @aptos_framework, admin = @aptocom, depositor1 = @0x111, depositor2 = @0x222)]
    public fun test_multiple_deposits(
        framework: &signer,
        admin: &signer,
        depositor1: &signer,
        depositor2: &signer
    ) {
        let depositor1_addr = signer::address_of(depositor1);
        let depositor2_addr = signer::address_of(depositor2);
        let admin_addr = signer::address_of(admin);
        
        // Setup
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(admin_addr);
        account::create_account_for_test(depositor1_addr);
        account::create_account_for_test(depositor2_addr);
        
        // Initialize AptosCoin
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(framework);
        
        // Mint APT to both depositors
        coin::register<AptosCoin>(depositor1);
        coin::register<AptosCoin>(depositor2);
        let coins1 = coin::mint(1000000000, &mint_cap);
        let coins2 = coin::mint(1000000000, &mint_cap);
        coin::deposit(depositor1_addr, coins1);
        coin::deposit(depositor2_addr, coins2);
        
        // Initialize modules
        act_token::initialize(admin);
        treasury::initialize(admin);
        
        // Multiple deposits
        treasury::deposit(depositor1, 300000000); // 3 APT
        treasury::deposit(depositor2, 500000000); // 5 APT
        treasury::deposit(depositor1, 200000000); // 2 APT
        
        // Verify
        assert!(treasury::get_total_deposits() == 1000000000, 1); // 10 APT total
        assert!(treasury::get_transaction_count() == 3, 2);
        
        // Cleanup
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    /// Test governance-controlled withdrawal
    #[test(framework = @aptos_framework, admin = @aptocom, voter = @0x111, recipient = @0x999)]
    public fun test_withdrawal(
        framework: &signer,
        admin: &signer,
        voter: &signer,
        recipient: &signer
    ) {
        let admin_addr = signer::address_of(admin);
        let voter_addr = signer::address_of(voter);
        let recipient_addr = signer::address_of(recipient);
        
        // Setup
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(admin_addr);
        account::create_account_for_test(voter_addr);
        account::create_account_for_test(recipient_addr);
        
        // Initialize AptosCoin
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(framework);
        
        // Fund accounts
        coin::register<AptosCoin>(admin);
        coin::register<AptosCoin>(voter);
        coin::register<AptosCoin>(recipient);
        let coins = coin::mint(2000000000, &mint_cap);
        coin::deposit(admin_addr, coins);
        
        // Initialize modules
        act_token::initialize(admin);
        governance::initialize(admin);
        treasury::initialize(admin);
        
        // Mint ACT tokens to voter (for voting power)
        act_token::mint(admin, voter_addr, 100000000000); // 1000 ACT
        
        // Deposit to treasury
        treasury::deposit(admin, 1000000000); // 10 APT
        
        // Create governance proposal for withdrawal
        governance::create_proposal(
            voter,
            string::utf8(b"Fund Project X"),
            string::utf8(b"Allocate 3 APT for development"),
            300000000, // 3 APT
            recipient_addr,
        );
        
        // Vote and approve
        governance::vote(voter, 0, true);
        
        // Fast forward time past voting period
        timestamp::fast_forward_seconds(604800 + 1); // 7 days + 1 second
        
        // Count votes and execute proposal
        governance::count_votes(admin, 0);
        governance::execute_proposal(admin, 0);
        
        // Now withdraw from treasury using the executed proposal
        treasury::withdraw(admin, recipient_addr, 300000000, 0);
        
        // Verify withdrawal
        assert!(treasury::get_total_withdrawals() == 300000000, 1);
        assert!(coin::balance<AptosCoin>(recipient_addr) == 300000000, 2);
        
        // Cleanup
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    /// Test dividend distribution
    #[test(framework = @aptos_framework, admin = @aptocom)]
    public fun test_distribute_dividends(framework: &signer, admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        // Setup
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(admin_addr);
        
        // Initialize AptosCoin
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(framework);
        
        // Fund admin
        coin::register<AptosCoin>(admin);
        let coins = coin::mint(2000000000, &mint_cap);
        coin::deposit(admin_addr, coins);
        
        // Initialize modules
        act_token::initialize(admin);
        treasury::initialize(admin);
        
        // Mint some ACT tokens (create total supply)
        act_token::mint(admin, admin_addr, 100000000000); // 1000 ACT
        
        // Deposit to treasury
        treasury::deposit(admin, 1000000000); // 10 APT
        
        // Distribute dividends
        treasury::distribute_dividends(admin, 500000000); // 5 APT as dividends
        
        // Verify
        assert!(treasury::get_total_dividends_distributed() == 500000000, 1);
        assert!(treasury::get_dividend_round_count() == 1, 2);
        
        // Cleanup
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    /// Test dividend claiming
    #[test(framework = @aptos_framework, admin = @aptocom, holder1 = @0x111, holder2 = @0x222)]
    public fun test_claim_dividend(
        framework: &signer,
        admin: &signer,
        holder1: &signer,
        holder2: &signer
    ) {
        let admin_addr = signer::address_of(admin);
        let holder1_addr = signer::address_of(holder1);
        let holder2_addr = signer::address_of(holder2);
        
        // Setup
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(admin_addr);
        account::create_account_for_test(holder1_addr);
        account::create_account_for_test(holder2_addr);
        
        // Initialize AptosCoin
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(framework);
        
        // Fund accounts
        coin::register<AptosCoin>(admin);
        coin::register<AptosCoin>(holder1);
        coin::register<AptosCoin>(holder2);
        let coins = coin::mint(2000000000, &mint_cap);
        coin::deposit(admin_addr, coins);
        
        // Initialize modules
        act_token::initialize(admin);
        treasury::initialize(admin);
        
        // Mint ACT tokens to holders
        // holder1: 600 ACT (60%), holder2: 400 ACT (40%)
        act_token::mint(admin, holder1_addr, 60000000000);
        act_token::mint(admin, holder2_addr, 40000000000);
        // Total supply: 1000 ACT
        
        // Deposit to treasury
        treasury::deposit(admin, 1000000000); // 10 APT
        
        // Distribute dividends
        treasury::distribute_dividends(admin, 100000000); // 1 APT as dividends
        
        // Check claimable amounts
        let claimable1 = treasury::get_claimable_dividend(0, holder1_addr);
        let claimable2 = treasury::get_claimable_dividend(0, holder2_addr);
        assert!(claimable1 == 60000000, 1); // 60% of 1 APT = 0.6 APT
        assert!(claimable2 == 40000000, 2); // 40% of 1 APT = 0.4 APT
        
        // Holder1 claims dividend (admin processes)
        let balance_before = coin::balance<AptosCoin>(holder1_addr);
        treasury::claim_dividend(admin, holder1_addr, 0);
        let balance_after = coin::balance<AptosCoin>(holder1_addr);
        
        // Verify claim
        assert!(balance_after == balance_before + 60000000, 3);
        assert!(treasury::has_claimed_dividend(0, holder1_addr), 4);
        assert!(!treasury::has_claimed_dividend(0, holder2_addr), 5);
        
        // Holder2 claims dividend (admin processes)
        treasury::claim_dividend(admin, holder2_addr, 0);
        assert!(treasury::has_claimed_dividend(0, holder2_addr), 6);
        
        // Cleanup
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    /// Test duplicate claim should fail
    #[test(framework = @aptos_framework, admin = @aptocom, holder = @0x111)]
    #[expected_failure(abort_code = 7)] // E_ALREADY_CLAIMED
    public fun test_duplicate_claim_fails(framework: &signer, admin: &signer, holder: &signer) {
        let admin_addr = signer::address_of(admin);
        let holder_addr = signer::address_of(holder);
        
        // Setup
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(admin_addr);
        account::create_account_for_test(holder_addr);
        
        // Initialize AptosCoin
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(framework);
        
        // Fund accounts
        coin::register<AptosCoin>(admin);
        coin::register<AptosCoin>(holder);
        let coins = coin::mint(2000000000, &mint_cap);
        coin::deposit(admin_addr, coins);
        
        // Initialize modules
        act_token::initialize(admin);
        treasury::initialize(admin);
        
        // Mint ACT tokens
        act_token::mint(admin, holder_addr, 100000000000);
        
        // Deposit and distribute
        treasury::deposit(admin, 1000000000);
        treasury::distribute_dividends(admin, 100000000);
        
        // First claim (should succeed - admin processes)
        treasury::claim_dividend(admin, holder_addr, 0);
        
        // Second claim (should fail)
        treasury::claim_dividend(admin, holder_addr, 0);
        
        // Cleanup
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    /// Test claim with no ACT holdings should fail
    #[test(framework = @aptos_framework, admin = @aptocom, holder = @0x111)]
    #[expected_failure(abort_code = 8)] // E_NO_ACT_HOLDINGS
    public fun test_claim_without_act_fails(framework: &signer, admin: &signer, holder: &signer) {
        let admin_addr = signer::address_of(admin);
        let holder_addr = signer::address_of(holder);
        
        // Setup
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(admin_addr);
        account::create_account_for_test(holder_addr);
        
        // Initialize AptosCoin
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(framework);
        
        // Fund accounts
        coin::register<AptosCoin>(admin);
        coin::register<AptosCoin>(holder);
        let coins = coin::mint(2000000000, &mint_cap);
        coin::deposit(admin_addr, coins);
        
        // Initialize modules
        act_token::initialize(admin);
        treasury::initialize(admin);
        
        // Mint ACT tokens to admin only (not to holder)
        act_token::mint(admin, admin_addr, 100000000000);
        
        // Deposit and distribute
        treasury::deposit(admin, 1000000000);
        treasury::distribute_dividends(admin, 100000000);
        
        // Try to claim without ACT holdings (should fail - admin processes)
        treasury::claim_dividend(admin, holder_addr, 0);
        
        // Cleanup
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    /// Test complete treasury workflow
    #[test(framework = @aptos_framework, admin = @aptocom, depositor = @0x111, holder1 = @0x222, holder2 = @0x333)]
    public fun test_complete_workflow(
        framework: &signer,
        admin: &signer,
        depositor: &signer,
        holder1: &signer,
        holder2: &signer
    ) {
        let admin_addr = signer::address_of(admin);
        let depositor_addr = signer::address_of(depositor);
        let holder1_addr = signer::address_of(holder1);
        let holder2_addr = signer::address_of(holder2);
        
        // Setup accounts
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(admin_addr);
        account::create_account_for_test(depositor_addr);
        account::create_account_for_test(holder1_addr);
        account::create_account_for_test(holder2_addr);
        
        // Initialize AptosCoin
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(framework);
        
        // Fund accounts
        coin::register<AptosCoin>(admin);
        coin::register<AptosCoin>(depositor);
        coin::register<AptosCoin>(holder1);
        coin::register<AptosCoin>(holder2);
        let coins = coin::mint(5000000000, &mint_cap); // 50 APT
        coin::deposit(depositor_addr, coins);
        
        // Initialize modules
        act_token::initialize(admin);
        governance::initialize(admin);
        treasury::initialize(admin);
        
        // Mint ACT tokens to holders
        act_token::mint(admin, holder1_addr, 70000000000); // 700 ACT (70%)
        act_token::mint(admin, holder2_addr, 30000000000); // 300 ACT (30%)
        
        // Step 1: Deposit to treasury
        treasury::deposit(depositor, 2000000000); // 20 APT
        assert!(treasury::get_total_deposits() == 2000000000, 1);
        
        // Step 2: Distribute first dividend round
        treasury::distribute_dividends(admin, 500000000); // 5 APT
        assert!(treasury::get_dividend_round_count() == 1, 2);
        
        // Step 3: Holders claim dividends (admin processes)
        treasury::claim_dividend(admin, holder1_addr, 0);
        treasury::claim_dividend(admin, holder2_addr, 0);
        assert!(treasury::has_claimed_dividend(0, holder1_addr), 3);
        assert!(treasury::has_claimed_dividend(0, holder2_addr), 4);
        
        // Step 4: Create and execute withdrawal proposal
        governance::create_proposal(
            holder1,
            string::utf8(b"Infrastructure"),
            string::utf8(b"Fund server costs"),
            300000000, // 3 APT
            holder2_addr,
        );
        governance::vote(holder1, 0, true);
        
        timestamp::fast_forward_seconds(604800 + 1);
        governance::count_votes(admin, 0);
        governance::execute_proposal(admin, 0);
        
        treasury::withdraw(admin, holder2_addr, 300000000, 0);
        assert!(treasury::get_total_withdrawals() == 300000000, 5);
        
        // Step 5: Second dividend round
        treasury::deposit(depositor, 1000000000); // 10 APT more
        treasury::distribute_dividends(admin, 400000000); // 4 APT
        assert!(treasury::get_dividend_round_count() == 2, 6);
        
        // Verify final state
        assert!(treasury::get_total_deposits() == 3000000000, 7); // 30 APT total
        assert!(treasury::get_total_dividends_distributed() == 900000000, 8); // 9 APT total
        assert!(treasury::get_transaction_count() > 5, 9);
        
        // Cleanup
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    /// Test transaction history tracking
    #[test(framework = @aptos_framework, admin = @aptocom, depositor = @0x123)]
    public fun test_transaction_history(framework: &signer, admin: &signer, depositor: &signer) {
        let admin_addr = signer::address_of(admin);
        let depositor_addr = signer::address_of(depositor);
        
        // Setup
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(admin_addr);
        account::create_account_for_test(depositor_addr);
        
        // Initialize AptosCoin
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(framework);
        
        // Fund accounts
        coin::register<AptosCoin>(admin);
        coin::register<AptosCoin>(depositor);
        let coins = coin::mint(2000000000, &mint_cap);
        coin::deposit(depositor_addr, coins);
        
        // Initialize modules
        act_token::initialize(admin);
        treasury::initialize(admin);
        
        // Create transactions
        treasury::deposit(depositor, 1000000000); // 1st transaction
        treasury::deposit(depositor, 500000000);  // 2nd transaction
        
        // Mint ACT for dividend
        act_token::mint(admin, admin_addr, 100000000000);
        treasury::distribute_dividends(admin, 100000000); // 3rd transaction
        
        // Verify transaction count
        assert!(treasury::get_transaction_count() == 3, 1);
        
        // Cleanup
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }
}
