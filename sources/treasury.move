module aptocom::treasury {
    use std::signer;
    use std::vector;
    use std::string::String;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;
    use aptos_framework::account;
    use aptos_framework::event::{Self, EventHandle};
    use aptocom::act_token;
    use aptocom::governance;

    // Error codes
    const E_NOT_INITIALIZED: u64 = 1;
    const E_NOT_ADMIN: u64 = 2;
    const E_ALREADY_INITIALIZED: u64 = 3;
    const E_INSUFFICIENT_BALANCE: u64 = 4;
    const E_INVALID_AMOUNT: u64 = 5;
    const E_NO_DIVIDENDS_TO_CLAIM: u64 = 6;
    const E_ALREADY_CLAIMED: u64 = 7;
    const E_NO_ACT_HOLDINGS: u64 = 8;
    const E_DIVIDEND_ROUND_NOT_FOUND: u64 = 9;

    // Transaction types
    const TX_TYPE_DEPOSIT: u64 = 1;
    const TX_TYPE_WITHDRAWAL: u64 = 2;
    const TX_TYPE_DIVIDEND_DISTRIBUTION: u64 = 3;
    const TX_TYPE_DIVIDEND_CLAIM: u64 = 4;

    /// Transaction record for history tracking
    struct Transaction has store, drop, copy {
        tx_type: u64,
        amount: u64,
        from: address,
        to: address,
        timestamp: u64,
        description: String,
    }

    /// Dividend round information
    struct DividendRound has store, drop, copy {
        round_id: u64,
        total_amount: u64,
        total_supply_snapshot: u64,
        distribution_time: u64,
        claimed_addresses: vector<address>,
    }

    /// Claim record for a user
    struct ClaimRecord has store, drop, copy {
        round_id: u64,
        claimer: address,
        amount: u64,
        timestamp: u64,
    }

    /// Main treasury state
    struct TreasuryState has key {
        admin: address,
        total_deposits: u64,
        total_withdrawals: u64,
        total_dividends_distributed: u64,
        transaction_history: vector<Transaction>,
        dividend_rounds: vector<DividendRound>,
        claim_records: vector<ClaimRecord>,
        next_round_id: u64,
    }

    // Events
    struct DepositEvent has drop, store {
        depositor: address,
        amount: u64,
        timestamp: u64,
    }

    struct WithdrawalEvent has drop, store {
        recipient: address,
        amount: u64,
        timestamp: u64,
        proposal_id: u64,
    }

    struct DividendDistributedEvent has drop, store {
        round_id: u64,
        total_amount: u64,
        total_supply: u64,
        timestamp: u64,
    }

    struct DividendClaimedEvent has drop, store {
        round_id: u64,
        claimer: address,
        amount: u64,
        timestamp: u64,
    }

    struct TreasuryEvents has key {
        deposit_events: EventHandle<DepositEvent>,
        withdrawal_events: EventHandle<WithdrawalEvent>,
        dividend_distributed_events: EventHandle<DividendDistributedEvent>,
        dividend_claimed_events: EventHandle<DividendClaimedEvent>,
    }

    /// Initialize the treasury module
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        // Use deployer address for resource storage (same pattern as act_token)
        let deployer_addr = act_token::get_deployer();
        assert!(admin_addr == deployer_addr, E_NOT_ADMIN);
        
        assert!(!exists<TreasuryState>(deployer_addr), E_ALREADY_INITIALIZED);

        // Register coin store for treasury to receive APT (only if AptosCoin is already initialized)
        // In production, this will be initialized; in testing, it may not be
        if (coin::is_coin_initialized<AptosCoin>() && !coin::is_account_registered<AptosCoin>(deployer_addr)) {
            coin::register<AptosCoin>(admin);
        };

        move_to(admin, TreasuryState {
            admin: admin_addr,
            total_deposits: 0,
            total_withdrawals: 0,
            total_dividends_distributed: 0,
            transaction_history: vector::empty(),
            dividend_rounds: vector::empty(),
            claim_records: vector::empty(),
            next_round_id: 0,
        });

        move_to(admin, TreasuryEvents {
            deposit_events: account::new_event_handle<DepositEvent>(admin),
            withdrawal_events: account::new_event_handle<WithdrawalEvent>(admin),
            dividend_distributed_events: account::new_event_handle<DividendDistributedEvent>(admin),
            dividend_claimed_events: account::new_event_handle<DividendClaimedEvent>(admin),
        });
    }

    /// Deposit APT into treasury
    public entry fun deposit(depositor: &signer, amount: u64) acquires TreasuryState, TreasuryEvents {
        let deployer_addr = act_token::get_deployer();
        assert!(exists<TreasuryState>(deployer_addr), E_NOT_INITIALIZED);
        assert!(amount > 0, E_INVALID_AMOUNT);

        let depositor_addr = signer::address_of(depositor);
        
        // Transfer APT from depositor to treasury (deployer address)
        coin::transfer<AptosCoin>(depositor, deployer_addr, amount);

        // Update state
        let state = borrow_global_mut<TreasuryState>(deployer_addr);
        state.total_deposits = state.total_deposits + amount;

        // Record transaction
        let tx = Transaction {
            tx_type: TX_TYPE_DEPOSIT,
            amount,
            from: depositor_addr,
            to: deployer_addr,
            timestamp: timestamp::now_seconds(),
            description: std::string::utf8(b"Treasury deposit"),
        };
        vector::push_back(&mut state.transaction_history, tx);

        // Emit event
        let events = borrow_global_mut<TreasuryEvents>(deployer_addr);
        event::emit_event(&mut events.deposit_events, DepositEvent {
            depositor: depositor_addr,
            amount,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Withdraw funds from treasury (governance-controlled)
    /// Can only be called after a proposal is approved and executed
    public entry fun withdraw(
        admin: &signer,
        recipient: address,
        amount: u64,
        proposal_id: u64
    ) acquires TreasuryState, TreasuryEvents {
        let deployer_addr = act_token::get_deployer();
        assert!(exists<TreasuryState>(deployer_addr), E_NOT_INITIALIZED);

        let state = borrow_global_mut<TreasuryState>(deployer_addr);
        assert!(signer::address_of(admin) == state.admin, E_NOT_ADMIN);
        assert!(amount > 0, E_INVALID_AMOUNT);

        // Check treasury balance
        let treasury_balance = coin::balance<AptosCoin>(deployer_addr);
        assert!(treasury_balance >= amount, E_INSUFFICIENT_BALANCE);

        // Verify proposal is approved (governance integration)
        let proposal = governance::get_proposal(proposal_id);
        assert!(governance::get_proposal_status(&proposal) == 4, E_NOT_ADMIN); // Status 4 = EXECUTED
        assert!(governance::get_proposal_amount(&proposal) == amount, E_INVALID_AMOUNT);
        assert!(governance::get_proposal_recipient(&proposal) == recipient, E_NOT_ADMIN);

        // Transfer APT from treasury to recipient
        coin::transfer<AptosCoin>(admin, recipient, amount);

        // Update state
        state.total_withdrawals = state.total_withdrawals + amount;

        // Record transaction
        let tx = Transaction {
            tx_type: TX_TYPE_WITHDRAWAL,
            amount,
            from: deployer_addr,
            to: recipient,
            timestamp: timestamp::now_seconds(),
            description: std::string::utf8(b"Governance-approved withdrawal"),
        };
        vector::push_back(&mut state.transaction_history, tx);

        // Emit event
        let events = borrow_global_mut<TreasuryEvents>(deployer_addr);
        event::emit_event(&mut events.withdrawal_events, WithdrawalEvent {
            recipient,
            amount,
            timestamp: timestamp::now_seconds(),
            proposal_id,
        });
    }

    /// Distribute dividends to ACT token holders
    /// Creates a dividend round that holders can claim from
    public entry fun distribute_dividends(
        admin: &signer,
        total_amount: u64
    ) acquires TreasuryState, TreasuryEvents {
        let deployer_addr = act_token::get_deployer();
        assert!(exists<TreasuryState>(deployer_addr), E_NOT_INITIALIZED);

        let state = borrow_global_mut<TreasuryState>(deployer_addr);
        assert!(signer::address_of(admin) == state.admin, E_NOT_ADMIN);
        assert!(total_amount > 0, E_INVALID_AMOUNT);

        // Check treasury balance
        let treasury_balance = coin::balance<AptosCoin>(deployer_addr);
        assert!(treasury_balance >= total_amount, E_INSUFFICIENT_BALANCE);

        // Take snapshot of total ACT supply
        let total_supply = act_token::total_supply();
        assert!(total_supply > 0, E_NO_ACT_HOLDINGS);

        // Create dividend round
        let round_id = state.next_round_id;
        let dividend_round = DividendRound {
            round_id,
            total_amount,
            total_supply_snapshot: total_supply,
            distribution_time: timestamp::now_seconds(),
            claimed_addresses: vector::empty(),
        };
        vector::push_back(&mut state.dividend_rounds, dividend_round);
        state.next_round_id = round_id + 1;
        state.total_dividends_distributed = state.total_dividends_distributed + total_amount;

        // Record transaction
        let tx = Transaction {
            tx_type: TX_TYPE_DIVIDEND_DISTRIBUTION,
            amount: total_amount,
            from: deployer_addr,
            to: deployer_addr, // Dividends stay in treasury until claimed
            timestamp: timestamp::now_seconds(),
            description: std::string::utf8(b"Dividend distribution created"),
        };
        vector::push_back(&mut state.transaction_history, tx);

        // Emit event
        let events = borrow_global_mut<TreasuryEvents>(deployer_addr);
        event::emit_event(&mut events.dividend_distributed_events, DividendDistributedEvent {
            round_id,
            total_amount,
            total_supply,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Claim dividends for a specific round (requires admin to process)
    public entry fun claim_dividend(
        admin: &signer,
        claimer_addr: address,
        round_id: u64
    ) acquires TreasuryState, TreasuryEvents {
        let deployer_addr = act_token::get_deployer();
        assert!(exists<TreasuryState>(deployer_addr), E_NOT_INITIALIZED);

        let state = borrow_global_mut<TreasuryState>(deployer_addr);
        assert!(signer::address_of(admin) == state.admin, E_NOT_ADMIN);

        // Find dividend round
        let rounds_len = vector::length(&state.dividend_rounds);
        let round_found = false;
        let round_index = 0;
        let i = 0;
        while (i < rounds_len) {
            let round = vector::borrow(&state.dividend_rounds, i);
            if (round.round_id == round_id) {
                round_found = true;
                round_index = i;
                break
            };
            i = i + 1;
        };
        assert!(round_found, E_DIVIDEND_ROUND_NOT_FOUND);

        let round = vector::borrow_mut(&mut state.dividend_rounds, round_index);
        
        // Check if already claimed
        assert!(!has_claimed(round, claimer_addr), E_ALREADY_CLAIMED);

        // Get claimer's ACT balance
        let act_balance = act_token::balance_of(claimer_addr);
        assert!(act_balance > 0, E_NO_ACT_HOLDINGS);

        // Calculate dividend amount using u128 to avoid overflow
        let dividend_amount = ((round.total_amount as u128) * (act_balance as u128) / (round.total_supply_snapshot as u128) as u64);
        assert!(dividend_amount > 0, E_NO_DIVIDENDS_TO_CLAIM);

        // Check treasury balance
        let treasury_balance = coin::balance<AptosCoin>(deployer_addr);
        assert!(treasury_balance >= dividend_amount, E_INSUFFICIENT_BALANCE);

        // Mark as claimed
        vector::push_back(&mut round.claimed_addresses, claimer_addr);

        // Transfer dividend from treasury to claimer
        coin::transfer<AptosCoin>(admin, claimer_addr, dividend_amount);

        // Record claim
        let claim = ClaimRecord {
            round_id,
            claimer: claimer_addr,
            amount: dividend_amount,
            timestamp: timestamp::now_seconds(),
        };
        vector::push_back(&mut state.claim_records, claim);

        // Record transaction
        let tx = Transaction {
            tx_type: TX_TYPE_DIVIDEND_CLAIM,
            amount: dividend_amount,
            from: deployer_addr,
            to: claimer_addr,
            timestamp: timestamp::now_seconds(),
            description: std::string::utf8(b"Dividend claimed"),
        };
        vector::push_back(&mut state.transaction_history, tx);

        // Emit event
        let events = borrow_global_mut<TreasuryEvents>(deployer_addr);
        event::emit_event(&mut events.dividend_claimed_events, DividendClaimedEvent {
            round_id,
            claimer: claimer_addr,
            amount: dividend_amount,
            timestamp: timestamp::now_seconds(),
        });
    }

    // Helper functions

    /// Check if an address has already claimed from a dividend round
    fun has_claimed(round: &DividendRound, addr: address): bool {
        let len = vector::length(&round.claimed_addresses);
        let i = 0;
        while (i < len) {
            if (*vector::borrow(&round.claimed_addresses, i) == addr) {
                return true
            };
            i = i + 1;
        };
        false
    }

    // View functions

    #[view]
    /// Get treasury balance (APT)
    public fun get_treasury_balance(): u64 {
        let deployer_addr = act_token::get_deployer();
        coin::balance<AptosCoin>(deployer_addr)
    }

    #[view]
    /// Get total deposits
    public fun get_total_deposits(): u64 acquires TreasuryState {
        let deployer_addr = act_token::get_deployer();
        assert!(exists<TreasuryState>(deployer_addr), E_NOT_INITIALIZED);
        borrow_global<TreasuryState>(deployer_addr).total_deposits
    }

    #[view]
    /// Get total withdrawals
    public fun get_total_withdrawals(): u64 acquires TreasuryState {
        let deployer_addr = act_token::get_deployer();
        assert!(exists<TreasuryState>(deployer_addr), E_NOT_INITIALIZED);
        borrow_global<TreasuryState>(deployer_addr).total_withdrawals
    }

    #[view]
    /// Get total dividends distributed
    public fun get_total_dividends_distributed(): u64 acquires TreasuryState {
        let deployer_addr = act_token::get_deployer();
        assert!(exists<TreasuryState>(deployer_addr), E_NOT_INITIALIZED);
        borrow_global<TreasuryState>(deployer_addr).total_dividends_distributed
    }

    #[view]
    /// Get transaction count
    public fun get_transaction_count(): u64 acquires TreasuryState {
        let deployer_addr = act_token::get_deployer();
        assert!(exists<TreasuryState>(deployer_addr), E_NOT_INITIALIZED);
        vector::length(&borrow_global<TreasuryState>(deployer_addr).transaction_history)
    }

    #[view]
    /// Get dividend round count
    public fun get_dividend_round_count(): u64 acquires TreasuryState {
        let deployer_addr = act_token::get_deployer();
        assert!(exists<TreasuryState>(deployer_addr), E_NOT_INITIALIZED);
        vector::length(&borrow_global<TreasuryState>(deployer_addr).dividend_rounds)
    }

    #[view]
    /// Check if address has claimed from a specific round
    public fun has_claimed_dividend(round_id: u64, addr: address): bool acquires TreasuryState {
        let deployer_addr = act_token::get_deployer();
        assert!(exists<TreasuryState>(deployer_addr), E_NOT_INITIALIZED);
        
        let state = borrow_global<TreasuryState>(deployer_addr);
        let rounds_len = vector::length(&state.dividend_rounds);
        let i = 0;
        while (i < rounds_len) {
            let round = vector::borrow(&state.dividend_rounds, i);
            if (round.round_id == round_id) {
                return has_claimed(round, addr)
            };
            i = i + 1;
        };
        false
    }

    #[view]
    /// Calculate claimable dividend for an address in a specific round
    public fun get_claimable_dividend(round_id: u64, addr: address): u64 acquires TreasuryState {
        let deployer_addr = act_token::get_deployer();
        assert!(exists<TreasuryState>(deployer_addr), E_NOT_INITIALIZED);
        
        let state = borrow_global<TreasuryState>(deployer_addr);
        
        // Find dividend round
        let rounds_len = vector::length(&state.dividend_rounds);
        let i = 0;
        while (i < rounds_len) {
            let round = vector::borrow(&state.dividend_rounds, i);
            if (round.round_id == round_id) {
                // Check if already claimed
                if (has_claimed(round, addr)) {
                    return 0
                };
                
                // Calculate dividend
                let act_balance = act_token::balance_of(addr);
                if (act_balance == 0) {
                    return 0
                };
                
                return ((round.total_amount as u128) * (act_balance as u128) / (round.total_supply_snapshot as u128) as u64)
            };
            i = i + 1;
        };
        0
    }

    #[view]
    /// Get admin address
    public fun get_admin(): address acquires TreasuryState {
        let deployer_addr = act_token::get_deployer();
        assert!(exists<TreasuryState>(deployer_addr), E_NOT_INITIALIZED);
        borrow_global<TreasuryState>(deployer_addr).admin
    }

    // Accessor functions for Transaction struct
    public fun get_tx_type(tx: &Transaction): u64 {
        tx.tx_type
    }

    public fun get_tx_amount(tx: &Transaction): u64 {
        tx.amount
    }

    public fun get_tx_from(tx: &Transaction): address {
        tx.from
    }

    public fun get_tx_to(tx: &Transaction): address {
        tx.to
    }

    public fun get_tx_timestamp(tx: &Transaction): u64 {
        tx.timestamp
    }

    // Accessor functions for DividendRound struct
    public fun get_round_id(round: &DividendRound): u64 {
        round.round_id
    }

    public fun get_round_total_amount(round: &DividendRound): u64 {
        round.total_amount
    }

    public fun get_round_total_supply(round: &DividendRound): u64 {
        round.total_supply_snapshot
    }

    public fun get_round_distribution_time(round: &DividendRound): u64 {
        round.distribution_time
    }

    /// Get a specific dividend round by ID
    public fun get_dividend_round(round_id: u64): DividendRound acquires TreasuryState {
        let deployer_addr = act_token::get_deployer();
        assert!(exists<TreasuryState>(deployer_addr), E_NOT_INITIALIZED);
        
        let state = borrow_global<TreasuryState>(deployer_addr);
        let rounds_len = vector::length(&state.dividend_rounds);
        let i = 0;
        while (i < rounds_len) {
            let round = vector::borrow(&state.dividend_rounds, i);
            if (round.round_id == round_id) {
                return *round
            };
            i = i + 1;
        };
        abort E_DIVIDEND_ROUND_NOT_FOUND
    }
}
