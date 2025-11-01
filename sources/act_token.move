module aptocom::act_token {
    use std::string;
    use std::signer;
    use std::option;
    use aptos_framework::fungible_asset::{Self, MintRef, TransferRef, BurnRef, Metadata, FungibleAsset};
    use aptos_framework::object::{Self, Object};
    use aptos_framework::primary_fungible_store;

    /// Error codes
    const E_NOT_ADMIN: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_NOT_INITIALIZED: u64 = 3;
    const E_INSUFFICIENT_BALANCE: u64 = 4;

    /// ACT Token Metadata
    const TOKEN_NAME: vector<u8> = b"AptoCom Token";
    const TOKEN_SYMBOL: vector<u8> = b"ACT";
    const TOKEN_DECIMALS: u8 = 8;
    const TOKEN_ICON_URI: vector<u8> = b"https://aptocom.io/act-icon.png";
    const TOKEN_PROJECT_URI: vector<u8> = b"https://aptocom.io";

    /// Resource to store token references
    struct TokenRefs has key {
        mint_ref: MintRef,
        transfer_ref: TransferRef,
        burn_ref: BurnRef,
    }

    /// Resource to track admin and total supply
    struct TokenController has key {
        admin: address,
        deployer: address, // Original deployer address (where resources are stored)
        total_supply: u64,
        metadata: Object<Metadata>,
    }

    /// Initialize the ACT token (can only be called once)
    /// Creates the fungible asset with metadata and stores references
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        // Ensure not already initialized
        assert!(!exists<TokenController>(admin_addr), E_ALREADY_INITIALIZED);

        // Create the fungible asset
        let constructor_ref = &object::create_named_object(admin, TOKEN_NAME);
        
        primary_fungible_store::create_primary_store_enabled_fungible_asset(
            constructor_ref,
            option::none(),
            string::utf8(TOKEN_NAME),
            string::utf8(TOKEN_SYMBOL),
            TOKEN_DECIMALS,
            string::utf8(TOKEN_ICON_URI),
            string::utf8(TOKEN_PROJECT_URI),
        );

        // Generate refs for minting, transferring, and burning
        let mint_ref = fungible_asset::generate_mint_ref(constructor_ref);
        let transfer_ref = fungible_asset::generate_transfer_ref(constructor_ref);
        let burn_ref = fungible_asset::generate_burn_ref(constructor_ref);
        let metadata = object::object_from_constructor_ref<Metadata>(constructor_ref);

        // Store references
        move_to(admin, TokenRefs {
            mint_ref,
            transfer_ref,
            burn_ref,
        });

        // Store controller
        move_to(admin, TokenController {
            admin: admin_addr,
            deployer: admin_addr, // Store the deployer address
            total_supply: 0,
            metadata,
        });
    }

    /// Mint ACT tokens to a recipient (only admin)
    public entry fun mint(
        admin: &signer,
        to: address,
        amount: u64
    ) acquires TokenRefs, TokenController {
        let admin_addr = signer::address_of(admin);
        let deployer = get_deployer();
        
        // Verify admin
        assert!(exists<TokenController>(deployer), E_NOT_INITIALIZED);
        let controller = borrow_global_mut<TokenController>(deployer);
        assert!(controller.admin == admin_addr, E_NOT_ADMIN);

        // Get refs
        let refs = borrow_global<TokenRefs>(deployer);
        
        // Mint tokens to recipient's primary store
        let fa = fungible_asset::mint(&refs.mint_ref, amount);
        primary_fungible_store::deposit(to, fa);

        // Update total supply
        controller.total_supply = controller.total_supply + amount;
    }

    /// Purchase ACT tokens with APT
    /// Exchange rate: 1 APT = 100 ACT (10000000000 base units = 100 * 10^8)
    /// User pays APT, receives ACT tokens
    public entry fun purchase(
        buyer: &signer,
        apt_amount: u64  // Amount in APT octas (1 APT = 10^8 octas)
    ) acquires TokenRefs, TokenController {
        use aptos_framework::coin;
        use aptos_framework::aptos_coin::AptosCoin;

        let deployer = get_deployer();
        let buyer_addr = signer::address_of(buyer);
        
        // Verify contract is initialized
        assert!(exists<TokenController>(deployer), E_NOT_INITIALIZED);
        
        // Calculate ACT tokens to mint (1 APT = 100 ACT)
        // apt_amount is in octas (10^8), ACT also has 8 decimals
        // So: act_amount = apt_amount * 100
        let act_amount = apt_amount * 100;
        
        // Transfer APT from buyer to deployer (treasury)
        coin::transfer<AptosCoin>(buyer, deployer, apt_amount);
        
        // Mint ACT tokens to buyer
        let controller = borrow_global_mut<TokenController>(deployer);
        let refs = borrow_global<TokenRefs>(deployer);
        
        let fa = fungible_asset::mint(&refs.mint_ref, act_amount);
        primary_fungible_store::deposit(buyer_addr, fa);
        
        // Update total supply
        controller.total_supply = controller.total_supply + act_amount;
    }

    /// Transfer ACT tokens from sender to recipient
    public entry fun transfer(
        from: &signer,
        to: address,
        amount: u64
    ) acquires TokenController {
        let deployer = get_deployer();
        let controller = borrow_global<TokenController>(deployer);
        
        // Transfer from primary store
        primary_fungible_store::transfer(from, controller.metadata, to, amount);
    }

    /// Burn ACT tokens (only admin can burn from any account)
    public entry fun burn(
        admin: &signer,
        from: address,
        amount: u64
    ) acquires TokenRefs, TokenController {
        let admin_addr = signer::address_of(admin);
        let deployer = get_deployer();
        
        // Verify admin
        assert!(exists<TokenController>(deployer), E_NOT_INITIALIZED);
        let controller = borrow_global_mut<TokenController>(deployer);
        assert!(controller.admin == admin_addr, E_NOT_ADMIN);

        // Get refs
        let refs = borrow_global<TokenRefs>(deployer);
        
        // Burn from the target account's primary store
        let from_store = primary_fungible_store::primary_store(from, controller.metadata);
        fungible_asset::burn_from(&refs.burn_ref, from_store, amount);

        // Update total supply
        controller.total_supply = controller.total_supply - amount;
    }

    /// Burn tokens from sender's own account
    public entry fun burn_from_self(
        from: &signer,
        amount: u64
    ) acquires TokenRefs, TokenController {
        let deployer = get_deployer();
        
        let controller = borrow_global_mut<TokenController>(deployer);
        let refs = borrow_global<TokenRefs>(deployer);
        
        // Withdraw and burn from sender's account
        let fa = primary_fungible_store::withdraw(from, controller.metadata, amount);
        fungible_asset::burn(&refs.burn_ref, fa);

        // Update total supply
        controller.total_supply = controller.total_supply - amount;
    }

    // ============= View Functions =============

    /// Get balance of an account
    #[view]
    public fun balance_of(account: address): u64 acquires TokenController {
        let deployer = get_deployer();
        let controller = borrow_global<TokenController>(deployer);
        primary_fungible_store::balance(account, controller.metadata)
    }

    /// Get total supply
    #[view]
    public fun total_supply(): u64 acquires TokenController {
        let deployer = get_deployer();
        let controller = borrow_global<TokenController>(deployer);
        controller.total_supply
    }

    /// Get token metadata object
    #[view]
    public fun get_metadata(): Object<Metadata> acquires TokenController {
        let deployer = get_deployer();
        let controller = borrow_global<TokenController>(deployer);
        controller.metadata
    }

    /// Get admin address
    #[view]
    public fun get_admin(): address acquires TokenController {
        let deployer = get_deployer();
        let controller = borrow_global<TokenController>(deployer);
        controller.admin
    }

    /// Get deployer address (where resources are stored)
    #[view]
    public fun get_deployer(): address {
        // The deployer is the account that initialized the token
        @aptocom
    }

    /// Get token name
    #[view]
    public fun name(): string::String {
        string::utf8(TOKEN_NAME)
    }

    /// Get token symbol
    #[view]
    public fun symbol(): string::String {
        string::utf8(TOKEN_SYMBOL)
    }

    /// Get token decimals
    #[view]
    public fun decimals(): u8 {
        TOKEN_DECIMALS
    }

    // ============= Admin Functions =============

    /// Transfer admin rights (only current admin)
    public entry fun transfer_admin(
        admin: &signer,
        new_admin: address
    ) acquires TokenController {
        let admin_addr = signer::address_of(admin);
        let deployer = get_deployer();
        
        assert!(exists<TokenController>(deployer), E_NOT_INITIALIZED);
        let controller = borrow_global_mut<TokenController>(deployer);
        assert!(controller.admin == admin_addr, E_NOT_ADMIN);

        controller.admin = new_admin;
    }

    // ============= Test-Only Functions =============

    #[test_only]
    public fun initialize_for_test(admin: &signer) {
        initialize(admin);
    }

    #[test_only]
    public fun mint_for_test(admin: &signer, to: address, amount: u64) acquires TokenRefs, TokenController {
        mint(admin, to, amount);
    }
}
