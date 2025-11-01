#[test_only]
module aptocom::governance_tests {
    use std::string;
    use std::signer;
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use aptocom::act_token;
    use aptocom::governance;

    /// Test initialization
    #[test(framework = @aptos_framework, admin = @aptocom)]
    public fun test_initialize(framework: &signer, admin: &signer) {
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(signer::address_of(admin));
        
        // Initialize ACT token first
        act_token::initialize(admin);
        
        // Initialize governance
        governance::initialize(admin);
        
        // Verify configuration
        assert!(governance::get_voting_period() == 604800, 1); // 7 days
        assert!(governance::get_quorum_percentage() == 51, 2);
        assert!(governance::get_proposal_count() == 0, 3);
    }

    /// Test proposal creation
    #[test(framework = @aptos_framework, admin = @aptocom, creator = @0x123)]
    public fun test_create_proposal(framework: &signer, admin: &signer, creator: &signer) {
        let creator_addr = signer::address_of(creator);
        let recipient = @0x999;
        
        // Setup
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(signer::address_of(admin));
        account::create_account_for_test(creator_addr);
        account::create_account_for_test(recipient);
        
        // Initialize
        act_token::initialize(admin);
        governance::initialize(admin);
        
        // Create proposal
        governance::create_proposal(
            creator,
            string::utf8(b"Fund Marketing Campaign"),
            string::utf8(b"Allocate 100 ACT for Q4 marketing"),
            10000000000, // 100 ACT
            recipient,
        );
        
        // Verify
        assert!(governance::get_proposal_count() == 1, 1);
        let proposal = governance::get_proposal(0);
        assert!(governance::get_proposal_id(&proposal) == 0, 2);
        assert!(governance::get_proposal_amount(&proposal) == 10000000000, 3);
        assert!(governance::get_proposal_recipient(&proposal) == recipient, 4);
        assert!(governance::get_proposal_creator(&proposal) == creator_addr, 5);
    }

    /// Test voting on proposal
    #[test(framework = @aptos_framework, admin = @aptocom, voter1 = @0x111, voter2 = @0x222)]
    public fun test_vote(framework: &signer, admin: &signer, voter1: &signer, voter2: &signer) {
        let voter1_addr = signer::address_of(voter1);
        let voter2_addr = signer::address_of(voter2);
        let recipient = @0x999;
        
        // Setup
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(signer::address_of(admin));
        account::create_account_for_test(voter1_addr);
        account::create_account_for_test(voter2_addr);
        account::create_account_for_test(recipient);
        
        // Initialize
        act_token::initialize(admin);
        governance::initialize(admin);
        
        // Mint tokens to voters
        act_token::mint(admin, voter1_addr, 50000000000); // 500 ACT
        act_token::mint(admin, voter2_addr, 30000000000); // 300 ACT
        
        // Create proposal
        governance::create_proposal(
            voter1,
            string::utf8(b"Test Proposal"),
            string::utf8(b"Description"),
            10000000000,
            recipient,
        );
        
        // Vote
        governance::vote(voter1, 0, true); // Vote for
        governance::vote(voter2, 0, false); // Vote against
        
        // Verify votes recorded
        assert!(governance::check_has_voted(0, voter1_addr), 1);
        assert!(governance::check_has_voted(0, voter2_addr), 2);
        
        let proposal = governance::get_proposal(0);
        assert!(governance::get_proposal_votes_for(&proposal) == 50000000000, 3);
        assert!(governance::get_proposal_votes_against(&proposal) == 30000000000, 4);
    }

    /// Test duplicate vote should fail
    #[test(framework = @aptos_framework, admin = @aptocom, voter = @0x123)]
    #[expected_failure(abort_code = 4)] // E_ALREADY_VOTED
    public fun test_duplicate_vote_fails(framework: &signer, admin: &signer, voter: &signer) {
        let voter_addr = signer::address_of(voter);
        
        // Setup
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(signer::address_of(admin));
        account::create_account_for_test(voter_addr);
        
        // Initialize
        act_token::initialize(admin);
        governance::initialize(admin);
        act_token::mint(admin, voter_addr, 10000000000);
        
        // Create proposal
        governance::create_proposal(
            voter,
            string::utf8(b"Test"),
            string::utf8(b"Test"),
            10000000000,
            @0x999,
        );
        
        // Vote twice
        governance::vote(voter, 0, true);
        governance::vote(voter, 0, false); // Should fail
    }

    /// Test counting votes with quorum reached
    #[test(framework = @aptos_framework, admin = @aptocom, voter1 = @0x111, voter2 = @0x222)]
    public fun test_count_votes_approved(framework: &signer, admin: &signer, voter1: &signer, voter2: &signer) {
        let voter1_addr = signer::address_of(voter1);
        let voter2_addr = signer::address_of(voter2);
        
        // Setup
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(signer::address_of(admin));
        account::create_account_for_test(voter1_addr);
        account::create_account_for_test(voter2_addr);
        
        // Initialize
        act_token::initialize(admin);
        governance::initialize(admin);
        
        // Mint tokens (total supply = 1000 ACT)
        act_token::mint(admin, voter1_addr, 60000000000); // 600 ACT (60%)
        act_token::mint(admin, voter2_addr, 40000000000); // 400 ACT (40%)
        
        // Create and vote on proposal
        governance::create_proposal(
            voter1,
            string::utf8(b"Approved Proposal"),
            string::utf8(b"This should pass"),
            10000000000,
            @0x999,
        );
        
        governance::vote(voter1, 0, true);  // 600 for
        governance::vote(voter2, 0, false); // 400 against
        
        // Fast forward time past voting period (7 days + 1 second)
        timestamp::fast_forward_seconds(604801);
        
        // Count votes
        governance::count_votes(admin, 0);
        
        // Verify approved
        let proposal = governance::get_proposal(0);
        assert!(governance::get_proposal_status(&proposal) == 2, 1); // STATUS_APPROVED
    }

    /// Test counting votes with quorum not reached
    #[test(framework = @aptos_framework, admin = @aptocom, voter = @0x111)]
    public fun test_count_votes_rejected_no_quorum(framework: &signer, admin: &signer, voter: &signer) {
        let voter_addr = signer::address_of(voter);
        
        // Setup
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(signer::address_of(admin));
        account::create_account_for_test(voter_addr);
        
        // Initialize
        act_token::initialize(admin);
        governance::initialize(admin);
        
        // Mint tokens (total supply = 1000 ACT)
        act_token::mint(admin, voter_addr, 40000000000); // Only 400 ACT (40% < 51% quorum)
        act_token::mint(admin, @0x888, 60000000000); // Other holder doesn't vote
        
        // Create and vote on proposal
        governance::create_proposal(
            voter,
            string::utf8(b"Rejected Proposal"),
            string::utf8(b"Not enough participation"),
            10000000000,
            @0x999,
        );
        
        governance::vote(voter, 0, true); // Only 40% voted
        
        // Fast forward time
        timestamp::fast_forward_seconds(604801);
        
        // Count votes
        governance::count_votes(admin, 0);
        
        // Verify rejected due to low quorum
        let proposal = governance::get_proposal(0);
        assert!(governance::get_proposal_status(&proposal) == 3, 1); // STATUS_REJECTED
    }

    /// Test proposal execution
    #[test(framework = @aptos_framework, admin = @aptocom, voter = @0x111)]
    public fun test_execute_proposal(framework: &signer, admin: &signer, voter: &signer) {
        let voter_addr = signer::address_of(voter);
        
        // Setup
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(signer::address_of(admin));
        account::create_account_for_test(voter_addr);
        
        // Initialize
        act_token::initialize(admin);
        governance::initialize(admin);
        
        // Mint tokens
        act_token::mint(admin, voter_addr, 60000000000); // 60% for quorum
        
        // Create, vote, and approve proposal
        governance::create_proposal(
            voter,
            string::utf8(b"Executable Proposal"),
            string::utf8(b"Ready to execute"),
            10000000000,
            @0x999,
        );
        
        governance::vote(voter, 0, true);
        timestamp::fast_forward_seconds(604801);
        governance::count_votes(admin, 0);
        
        // Execute
        governance::execute_proposal(admin, 0);
        
        // Verify executed
        let proposal = governance::get_proposal(0);
        assert!(governance::is_proposal_executed(&proposal) == true, 1);
        assert!(governance::get_proposal_status(&proposal) == 4, 2); // STATUS_EXECUTED
    }

    /// Test executing non-approved proposal should fail
    #[test(framework = @aptos_framework, admin = @aptocom, voter = @0x111)]
    #[expected_failure(abort_code = 7)] // E_PROPOSAL_NOT_APPROVED
    public fun test_execute_rejected_proposal_fails(framework: &signer, admin: &signer, voter: &signer) {
        let voter_addr = signer::address_of(voter);
        
        // Setup
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(signer::address_of(admin));
        account::create_account_for_test(voter_addr);
        
        // Initialize
        act_token::initialize(admin);
        governance::initialize(admin);
        
        // Create proposal with insufficient votes
        act_token::mint(admin, voter_addr, 40000000000); // Only 40%
        act_token::mint(admin, @0x888, 60000000000);
        
        governance::create_proposal(
            voter,
            string::utf8(b"Test"),
            string::utf8(b"Test"),
            10000000000,
            @0x999,
        );
        
        governance::vote(voter, 0, true);
        timestamp::fast_forward_seconds(604801);
        governance::count_votes(admin, 0);
        
        // Try to execute rejected proposal
        governance::execute_proposal(admin, 0); // Should fail
    }

    /// Test proposal cancellation
    #[test(framework = @aptos_framework, admin = @aptocom, creator = @0x123)]
    public fun test_cancel_proposal(framework: &signer, admin: &signer, creator: &signer) {
        let creator_addr = signer::address_of(creator);
        
        // Setup
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(signer::address_of(admin));
        account::create_account_for_test(creator_addr);
        
        // Initialize
        act_token::initialize(admin);
        governance::initialize(admin);
        
        // Create proposal
        governance::create_proposal(
            creator,
            string::utf8(b"To Cancel"),
            string::utf8(b"This will be cancelled"),
            10000000000,
            @0x999,
        );
        
        // Cancel by creator
        governance::cancel_proposal(creator, 0);
        
        // Verify cancelled
        let proposal = governance::get_proposal(0);
        assert!(governance::get_proposal_status(&proposal) == 5, 1); // STATUS_CANCELLED
    }

    /// Test voting after deadline should fail
    #[test(framework = @aptos_framework, admin = @aptocom, voter = @0x111)]
    #[expected_failure(abort_code = 5)] // E_VOTING_ENDED
    public fun test_vote_after_deadline_fails(framework: &signer, admin: &signer, voter: &signer) {
        let voter_addr = signer::address_of(voter);
        
        // Setup
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(signer::address_of(admin));
        account::create_account_for_test(voter_addr);
        
        // Initialize
        act_token::initialize(admin);
        governance::initialize(admin);
        act_token::mint(admin, voter_addr, 10000000000);
        
        // Create proposal
        governance::create_proposal(
            voter,
            string::utf8(b"Test"),
            string::utf8(b"Test"),
            10000000000,
            @0x999,
        );
        
        // Fast forward past voting period
        timestamp::fast_forward_seconds(604801);
        
        // Try to vote after deadline
        governance::vote(voter, 0, true); // Should fail
    }

    /// Test complete governance workflow
    #[test(framework = @aptos_framework, admin = @aptocom, creator = @0x111, voter1 = @0x222, voter2 = @0x333)]
    public fun test_complete_workflow(
        framework: &signer,
        admin: &signer,
        creator: &signer,
        voter1: &signer,
        voter2: &signer
    ) {
        let creator_addr = signer::address_of(creator);
        let voter1_addr = signer::address_of(voter1);
        let voter2_addr = signer::address_of(voter2);
        let recipient = @0x999;
        
        // Setup accounts
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(signer::address_of(admin));
        account::create_account_for_test(creator_addr);
        account::create_account_for_test(voter1_addr);
        account::create_account_for_test(voter2_addr);
        account::create_account_for_test(recipient);
        
        // Initialize systems
        act_token::initialize(admin);
        governance::initialize(admin);
        
        // Distribute tokens
        act_token::mint(admin, creator_addr, 30000000000); // 300 ACT
        act_token::mint(admin, voter1_addr, 40000000000);  // 400 ACT
        act_token::mint(admin, voter2_addr, 30000000000);  // 300 ACT
        // Total: 1000 ACT
        
        // 1. Create proposal
        governance::create_proposal(
            creator,
            string::utf8(b"Complete Workflow Test"),
            string::utf8(b"Testing full governance cycle"),
            50000000000, // 500 ACT
            recipient,
        );
        assert!(governance::get_proposal_count() == 1, 1);
        
        // 2. Cast votes
        governance::vote(creator, 0, true);  // 300 for
        governance::vote(voter1, 0, true);   // 400 for
        governance::vote(voter2, 0, false);  // 300 against
        
        // 3. Fast forward to end of voting
        timestamp::fast_forward_seconds(604801);
        
        // 4. Count votes
        governance::count_votes(admin, 0);
        let proposal = governance::get_proposal(0);
        assert!(governance::get_proposal_status(&proposal) == 2, 2); // Approved (700 for vs 300 against, 100% participation)
        
        // 5. Execute proposal
        governance::execute_proposal(admin, 0);
        let executed_proposal = governance::get_proposal(0);
        assert!(governance::is_proposal_executed(&executed_proposal) == true, 3);
        assert!(governance::get_proposal_status(&executed_proposal) == 4, 4); // Executed
    }
}
