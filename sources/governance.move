module aptocom::governance {
    use std::string::{Self, String};
    use std::signer;
    use std::vector;
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_framework::account;
    use aptocom::act_token;

    /// Error codes
    const E_NOT_INITIALIZED: u64 = 1;
    const E_NOT_ADMIN: u64 = 2;
    const E_PROPOSAL_NOT_FOUND: u64 = 3;
    const E_ALREADY_VOTED: u64 = 4;
    const E_VOTING_ENDED: u64 = 5;
    const E_VOTING_NOT_ENDED: u64 = 6;
    const E_PROPOSAL_NOT_APPROVED: u64 = 7;
    const E_ALREADY_EXECUTED: u64 = 8;
    const E_INSUFFICIENT_QUORUM: u64 = 9;
    const E_INVALID_PROPOSAL: u64 = 10;

    /// Proposal status constants
    const STATUS_PENDING: u8 = 0;
    const STATUS_ACTIVE: u8 = 1;
    const STATUS_APPROVED: u8 = 2;
    const STATUS_REJECTED: u8 = 3;
    const STATUS_EXECUTED: u8 = 4;
    const STATUS_CANCELLED: u8 = 5;

    /// Default voting period (7 days in seconds)
    const DEFAULT_VOTING_PERIOD: u64 = 604800;
    
    /// Default quorum requirement (51% of total supply)
    const DEFAULT_QUORUM_PERCENTAGE: u64 = 51;

    /// Proposal structure
    struct Proposal has store, drop, copy {
        id: u64,
        title: String,
        description: String,
        amount: u64,
        recipient: address,
        votes_for: u64,
        votes_against: u64,
        status: u8,
        creator: address,
        created_at: u64,
        voting_end_time: u64,
        executed: bool,
    }

    /// Vote record for each voter on each proposal
    struct VoteRecord has store, drop, copy {
        proposal_id: u64,
        voter: address,
        vote_for: bool,
        voting_power: u64,
        timestamp: u64,
    }

    /// Governance configuration and state
    struct GovernanceState has key {
        admin: address,
        proposals: vector<Proposal>,
        vote_records: vector<VoteRecord>,
        next_proposal_id: u64,
        voting_period: u64,
        quorum_percentage: u64,
    }

    /// Events
    #[event]
    struct ProposalCreatedEvent has drop, store {
        proposal_id: u64,
        creator: address,
        title: String,
        amount: u64,
        recipient: address,
        voting_end_time: u64,
    }

    #[event]
    struct VoteCastEvent has drop, store {
        proposal_id: u64,
        voter: address,
        vote_for: bool,
        voting_power: u64,
    }

    #[event]
    struct ProposalExecutedEvent has drop, store {
        proposal_id: u64,
        executor: address,
        amount: u64,
        recipient: address,
    }

    #[event]
    struct ProposalStatusChangedEvent has drop, store {
        proposal_id: u64,
        old_status: u8,
        new_status: u8,
    }

    /// Initialize governance system
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        assert!(!exists<GovernanceState>(admin_addr), E_NOT_INITIALIZED);

        move_to(admin, GovernanceState {
            admin: admin_addr,
            proposals: vector::empty<Proposal>(),
            vote_records: vector::empty<VoteRecord>(),
            next_proposal_id: 0,
            voting_period: DEFAULT_VOTING_PERIOD,
            quorum_percentage: DEFAULT_QUORUM_PERCENTAGE,
        });
    }

    /// Create a new proposal
    public entry fun create_proposal(
        creator: &signer,
        title: String,
        description: String,
        amount: u64,
        recipient: address,
    ) acquires GovernanceState {
        let creator_addr = signer::address_of(creator);
        let deployer = act_token::get_deployer();
        
        assert!(exists<GovernanceState>(deployer), E_NOT_INITIALIZED);
        
        let state = borrow_global_mut<GovernanceState>(deployer);
        let proposal_id = state.next_proposal_id;
        let current_time = timestamp::now_seconds();
        let voting_end_time = current_time + state.voting_period;

        let proposal = Proposal {
            id: proposal_id,
            title,
            description,
            amount,
            recipient,
            votes_for: 0,
            votes_against: 0,
            status: STATUS_ACTIVE,
            creator: creator_addr,
            created_at: current_time,
            voting_end_time,
            executed: false,
        };

        vector::push_back(&mut state.proposals, proposal);
        state.next_proposal_id = proposal_id + 1;

        // Emit event
        event::emit(ProposalCreatedEvent {
            proposal_id,
            creator: creator_addr,
            title,
            amount,
            recipient,
            voting_end_time,
        });
    }

    /// Cast a vote on a proposal
    public entry fun vote(
        voter: &signer,
        proposal_id: u64,
        vote_for: bool,
    ) acquires GovernanceState {
        let voter_addr = signer::address_of(voter);
        let deployer = act_token::get_deployer();
        
        assert!(exists<GovernanceState>(deployer), E_NOT_INITIALIZED);
        
        let state = borrow_global_mut<GovernanceState>(deployer);
        
        // Check proposal exists
        assert!(proposal_id < vector::length(&state.proposals), E_PROPOSAL_NOT_FOUND);
        
        // Check if already voted (before borrowing proposal)
        assert!(!has_voted(state, proposal_id, voter_addr), E_ALREADY_VOTED);
        
        let proposal = vector::borrow_mut(&mut state.proposals, proposal_id);
        
        // Check voting period
        let current_time = timestamp::now_seconds();
        assert!(current_time <= proposal.voting_end_time, E_VOTING_ENDED);
        assert!(proposal.status == STATUS_ACTIVE, E_VOTING_ENDED);
        
        // Get voting power (ACT token balance)
        let voting_power = act_token::balance_of(voter_addr);
        assert!(voting_power > 0, E_INVALID_PROPOSAL);
        
        // Record vote
        if (vote_for) {
            proposal.votes_for = proposal.votes_for + voting_power;
        } else {
            proposal.votes_against = proposal.votes_against + voting_power;
        };
        
        // Store vote record
        let vote_record = VoteRecord {
            proposal_id,
            voter: voter_addr,
            vote_for,
            voting_power,
            timestamp: current_time,
        };
        vector::push_back(&mut state.vote_records, vote_record);

        // Emit event
        event::emit(VoteCastEvent {
            proposal_id,
            voter: voter_addr,
            vote_for,
            voting_power,
        });
    }

    /// Count votes and determine if proposal passes
    public entry fun count_votes(
        _anyone: &signer,
        proposal_id: u64,
    ) acquires GovernanceState {
        let deployer = act_token::get_deployer();
        assert!(exists<GovernanceState>(deployer), E_NOT_INITIALIZED);
        
        let state = borrow_global_mut<GovernanceState>(deployer);
        assert!(proposal_id < vector::length(&state.proposals), E_PROPOSAL_NOT_FOUND);
        
        let proposal = vector::borrow_mut(&mut state.proposals, proposal_id);
        
        // Check voting has ended
        let current_time = timestamp::now_seconds();
        assert!(current_time > proposal.voting_end_time, E_VOTING_NOT_ENDED);
        assert!(proposal.status == STATUS_ACTIVE, E_ALREADY_EXECUTED);
        
        // Get total supply for quorum calculation
        let total_supply = act_token::total_supply();
        let total_votes = proposal.votes_for + proposal.votes_against;
        let quorum_required = (total_supply * state.quorum_percentage) / 100;
        
        let old_status = proposal.status;
        
        // Check quorum and approval
        if (total_votes >= quorum_required && proposal.votes_for > proposal.votes_against) {
            proposal.status = STATUS_APPROVED;
        } else {
            proposal.status = STATUS_REJECTED;
        };

        // Emit status change event
        event::emit(ProposalStatusChangedEvent {
            proposal_id,
            old_status,
            new_status: proposal.status,
        });
    }

    /// Execute an approved proposal
    public entry fun execute_proposal(
        executor: &signer,
        proposal_id: u64,
    ) acquires GovernanceState {
        let executor_addr = signer::address_of(executor);
        let deployer = act_token::get_deployer();
        
        assert!(exists<GovernanceState>(deployer), E_NOT_INITIALIZED);
        
        let state = borrow_global_mut<GovernanceState>(deployer);
        assert!(proposal_id < vector::length(&state.proposals), E_PROPOSAL_NOT_FOUND);
        
        let proposal = vector::borrow_mut(&mut state.proposals, proposal_id);
        
        // Verify proposal is approved and not executed
        assert!(proposal.status == STATUS_APPROVED, E_PROPOSAL_NOT_APPROVED);
        assert!(!proposal.executed, E_ALREADY_EXECUTED);
        
        // Mark as executed
        proposal.executed = true;
        proposal.status = STATUS_EXECUTED;

        // Emit event
        event::emit(ProposalExecutedEvent {
            proposal_id,
            executor: executor_addr,
            amount: proposal.amount,
            recipient: proposal.recipient,
        });

        // Note: Actual fund transfer should be done through treasury module
        // This function just marks the proposal as executed
    }

    /// Cancel a proposal (only by creator or admin before voting ends)
    public entry fun cancel_proposal(
        canceller: &signer,
        proposal_id: u64,
    ) acquires GovernanceState {
        let canceller_addr = signer::address_of(canceller);
        let deployer = act_token::get_deployer();
        
        assert!(exists<GovernanceState>(deployer), E_NOT_INITIALIZED);
        
        let state = borrow_global_mut<GovernanceState>(deployer);
        assert!(proposal_id < vector::length(&state.proposals), E_PROPOSAL_NOT_FOUND);
        
        let proposal = vector::borrow_mut(&mut state.proposals, proposal_id);
        
        // Only creator or admin can cancel
        assert!(
            canceller_addr == proposal.creator || canceller_addr == state.admin,
            E_NOT_ADMIN
        );
        
        // Can only cancel active proposals
        assert!(proposal.status == STATUS_ACTIVE, E_ALREADY_EXECUTED);
        
        let old_status = proposal.status;
        proposal.status = STATUS_CANCELLED;

        // Emit event
        event::emit(ProposalStatusChangedEvent {
            proposal_id,
            old_status,
            new_status: STATUS_CANCELLED,
        });
    }

    /// Helper function to check if user has already voted
    fun has_voted(state: &GovernanceState, proposal_id: u64, voter: address): bool {
        let i = 0;
        let len = vector::length(&state.vote_records);
        while (i < len) {
            let record = vector::borrow(&state.vote_records, i);
            if (record.proposal_id == proposal_id && record.voter == voter) {
                return true
            };
            i = i + 1;
        };
        false
    }

    // ============= View Functions =============

    #[view]
    /// Get proposal by ID
    public fun get_proposal(proposal_id: u64): Proposal acquires GovernanceState {
        let deployer = act_token::get_deployer();
        let state = borrow_global<GovernanceState>(deployer);
        assert!(proposal_id < vector::length(&state.proposals), E_PROPOSAL_NOT_FOUND);
        *vector::borrow(&state.proposals, proposal_id)
    }

    /// Get proposal ID
    public fun get_proposal_id(proposal: &Proposal): u64 {
        proposal.id
    }

    /// Get proposal amount
    public fun get_proposal_amount(proposal: &Proposal): u64 {
        proposal.amount
    }

    /// Get proposal recipient
    public fun get_proposal_recipient(proposal: &Proposal): address {
        proposal.recipient
    }

    /// Get proposal creator
    public fun get_proposal_creator(proposal: &Proposal): address {
        proposal.creator
    }

    /// Get proposal votes for
    public fun get_proposal_votes_for(proposal: &Proposal): u64 {
        proposal.votes_for
    }

    /// Get proposal votes against
    public fun get_proposal_votes_against(proposal: &Proposal): u64 {
        proposal.votes_against
    }

    /// Get proposal status
    public fun get_proposal_status(proposal: &Proposal): u8 {
        proposal.status
    }

    /// Get proposal executed flag
    public fun is_proposal_executed(proposal: &Proposal): bool {
        proposal.executed
    }

    #[view]
    /// Get total number of proposals
    public fun get_proposal_count(): u64 acquires GovernanceState {
        let deployer = act_token::get_deployer();
        let state = borrow_global<GovernanceState>(deployer);
        vector::length(&state.proposals)
    }

    #[view]
    /// Get voting period configuration
    public fun get_voting_period(): u64 acquires GovernanceState {
        let deployer = act_token::get_deployer();
        let state = borrow_global<GovernanceState>(deployer);
        state.voting_period
    }

    #[view]
    /// Get quorum percentage
    public fun get_quorum_percentage(): u64 acquires GovernanceState {
        let deployer = act_token::get_deployer();
        let state = borrow_global<GovernanceState>(deployer);
        state.quorum_percentage
    }

    #[view]
    /// Check if user has voted on proposal
    public fun check_has_voted(proposal_id: u64, voter: address): bool acquires GovernanceState {
        let deployer = act_token::get_deployer();
        let state = borrow_global<GovernanceState>(deployer);
        has_voted(state, proposal_id, voter)
    }

    #[view]
    /// Get deployer address
    public fun get_deployer(): address {
        act_token::get_deployer()
    }

    // ============= Admin Functions =============

    /// Update voting period (admin only)
    public entry fun set_voting_period(
        admin: &signer,
        new_period: u64,
    ) acquires GovernanceState {
        let admin_addr = signer::address_of(admin);
        let deployer = act_token::get_deployer();
        
        let state = borrow_global_mut<GovernanceState>(deployer);
        assert!(admin_addr == state.admin, E_NOT_ADMIN);
        
        state.voting_period = new_period;
    }

    /// Update quorum percentage (admin only)
    public entry fun set_quorum_percentage(
        admin: &signer,
        new_percentage: u64,
    ) acquires GovernanceState {
        let admin_addr = signer::address_of(admin);
        let deployer = act_token::get_deployer();
        
        let state = borrow_global_mut<GovernanceState>(deployer);
        assert!(admin_addr == state.admin, E_NOT_ADMIN);
        
        state.quorum_percentage = new_percentage;
    }

    // ============= Test-Only Functions =============

    #[test_only]
    public fun initialize_for_test(admin: &signer) {
        initialize(admin);
    }
}
