/**
 * Aptos Integration Layer
 * Service for interacting with Aptos blockchain and smart contracts
 * 
 * Based on AptoCom prompt file requirements:
 * - All transactions use Aptos Testnet APT tokens
 * - ACT token is a fungible asset on Aptos
 * - Contract address: process.env.CONTRACT_ADDRESS
 * - Network: Aptos Testnet (Chain ID: 2022)
 */

const { 
  Aptos,
  AptosConfig,
  Network,
  Account,
  Ed25519PrivateKey,
  AccountAddress,
} = require('@aptos-labs/ts-sdk');

// Configuration
const config = {
  network: Network.TESTNET, // Aptos Testnet (Chain ID: 2022)
  nodeUrl: 'https://fullnode.testnet.aptoslabs.com/v1',
  contractAddress: process.env.TOKEN_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS || '0x346a0fa67d42e63c5d713914fe46cb4ed38f011d21004122e3784b28437a1f3d',
  serviceWalletPrivateKey: process.env.SERVICE_WALLET_PRIVATE_KEY,
  
  // Retry configuration
  maxRetries: 3,
  retryDelay: 2000, // 2 seconds
  
  // Transaction configuration
  maxGasAmount: 10000,
  gasUnitPrice: 100,
  transactionTimeoutSecs: 30,
};

// Initialize Aptos client
const aptosConfig = new AptosConfig({ network: config.network });
const aptos = new Aptos(aptosConfig);

// Service wallet account (for admin operations)
let serviceAccount = null;

/**
 * Initialize service wallet account
 * @returns {Account} - Service account instance
 */
function initializeServiceAccount() {
  if (serviceAccount) return serviceAccount;
  
  if (!config.serviceWalletPrivateKey) {
    console.warn('⚠️  Service wallet private key not configured');
    return null;
  }
  
  try {
    // Remove '0x' prefix if present and parse as hex
    const privateKeyHex = config.serviceWalletPrivateKey.replace(/^0x/, '');
    const privateKey = new Ed25519PrivateKey(privateKeyHex);
    serviceAccount = Account.fromPrivateKey({ privateKey });
    
    console.log(`✅ Service account initialized: ${serviceAccount.accountAddress.toString()}`);
    return serviceAccount;
    
  } catch (error) {
    console.error('❌ Failed to initialize service account:', error.message);
    return null;
  }
}

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry wrapper for blockchain operations
 * @param {Function} operation - Async function to retry
 * @param {string} operationName - Name for logging
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise} - Result of operation
 */
async function withRetry(operation, operationName, maxRetries = config.maxRetries) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.error(`❌ ${operationName} failed (attempt ${attempt}/${maxRetries}):`, error.message);
      
      if (attempt < maxRetries) {
        const delay = config.retryDelay * attempt;
        console.log(`   Retrying in ${delay / 1000} seconds...`);
        await sleep(delay);
      }
    }
  }
  
  throw new Error(`${operationName} failed after ${maxRetries} attempts: ${lastError.message}`);
}

/**
 * Get Aptos client instance
 * @returns {Aptos} - Aptos client
 */
function getAptosClient() {
  return aptos;
}

/**
 * Check if wallet address is valid Aptos format
 * @param {string} address - Wallet address to validate
 * @returns {boolean} - True if valid
 */
function isValidAptosAddress(address) {
  try {
    // Aptos addresses are 32 bytes (64 hex chars) with optional 0x prefix
    const hexAddress = address.replace(/^0x/, '');
    return /^[0-9a-fA-F]{64}$/.test(hexAddress);
  } catch {
    return false;
  }
}

/**
 * Normalize Aptos address format (ensure 0x prefix)
 * @param {string} address - Address to normalize
 * @returns {string} - Normalized address
 */
function normalizeAddress(address) {
  const normalized = address.toLowerCase().replace(/^0x/, '');
  return `0x${normalized}`;
}

// ==================== TOKEN OPERATIONS ====================

/**
 * Get ACT token balance for an address
 * @param {string} walletAddress - Wallet address to query
 * @returns {Promise<number>} - ACT balance (in base units, 8 decimals)
 */
async function getACTBalance(walletAddress) {
  return withRetry(async () => {
    if (!isValidAptosAddress(walletAddress)) {
      throw new Error('Invalid Aptos wallet address format');
    }
    
    const address = normalizeAddress(walletAddress);
    
    try {
      // Query balance_of view function from ACT token module
      const balance = await aptos.view({
        payload: {
          function: `${config.contractAddress}::act_token::balance_of`,
          typeArguments: [],
          functionArguments: [address],
        },
      });
      
      // Balance is returned as string, convert to number
      const balanceValue = BigInt(balance[0] || '0');
      
      return {
        balance: balanceValue.toString(),
        balanceFormatted: (Number(balanceValue) / 100000000).toFixed(8), // 8 decimals
        decimals: 8,
        symbol: 'ACT',
      };
      
    } catch (error) {
      if (error.message.includes('not found')) {
        // Account doesn't have ACT yet
        return {
          balance: '0',
          balanceFormatted: '0.00000000',
          decimals: 8,
          symbol: 'ACT',
        };
      }
      throw error;
    }
  }, `Get ACT balance for ${walletAddress}`);
}

/**
 * Get APT (native token) balance for an address
 * @param {string} walletAddress - Wallet address to query
 * @returns {Promise<object>} - APT balance details
 */
async function getAPTBalance(walletAddress) {
  return withRetry(async () => {
    if (!isValidAptosAddress(walletAddress)) {
      throw new Error('Invalid Aptos wallet address format');
    }
    
    const address = normalizeAddress(walletAddress);
    
    try {
      // Get account resource for AptosCoin
      const resource = await aptos.getAccountResource({
        accountAddress: address,
        resourceType: '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>',
      });
      
      const balance = BigInt(resource.coin.value);
      
      return {
        balance: balance.toString(),
        balanceFormatted: (Number(balance) / 100000000).toFixed(8), // APT has 8 decimals
        decimals: 8,
        symbol: 'APT',
      };
      
    } catch (error) {
      if (error.status === 404) {
        // Account doesn't exist yet or has no APT
        return {
          balance: '0',
          balanceFormatted: '0.00000000',
          decimals: 8,
          symbol: 'APT',
        };
      }
      throw error;
    }
  }, `Get APT balance for ${walletAddress}`);
}

/**
 * Mint ACT tokens (admin only, requires service account)
 * @param {string} recipientAddress - Address to receive tokens
 * @param {number} amount - Amount to mint (in base units, 8 decimals)
 * @returns {Promise<object>} - Transaction result
 */
async function mintACTTokens(recipientAddress, amount) {
  return withRetry(async () => {
    const account = initializeServiceAccount();
    if (!account) {
      throw new Error('Service account not initialized. Admin operations require SERVICE_WALLET_PRIVATE_KEY');
    }
    
    if (!isValidAptosAddress(recipientAddress)) {
      throw new Error('Invalid recipient address format');
    }
    
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    
    const recipient = normalizeAddress(recipientAddress);
    
    // Build transaction
    const transaction = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${config.contractAddress}::act_token::mint`,
        typeArguments: [],
        functionArguments: [recipient, amount.toString()],
      },
      options: {
        maxGasAmount: config.maxGasAmount,
        gasUnitPrice: config.gasUnitPrice,
      },
    });
    
    // Sign and submit
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: account,
      transaction,
    });
    
    // Wait for confirmation
    const executedTransaction = await aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
      options: {
        timeoutSecs: config.transactionTimeoutSecs,
      },
    });
    
    return {
      success: executedTransaction.success,
      transactionHash: committedTxn.hash,
      gasUsed: executedTransaction.gas_used,
      recipient,
      amount: amount.toString(),
      amountFormatted: (amount / 100000000).toFixed(8),
      explorer: `https://explorer.aptoslabs.com/txn/${committedTxn.hash}?network=testnet`,
    };
    
  }, `Mint ${amount} ACT tokens to ${recipientAddress}`);
}

/**
 * Transfer ACT tokens
 * @param {string} fromPrivateKey - Sender's private key (0x-prefixed hex)
 * @param {string} toAddress - Recipient address
 * @param {number} amount - Amount to transfer (base units)
 * @returns {Promise<object>} - Transaction result
 */
async function transferACTTokens(fromPrivateKey, toAddress, amount) {
  return withRetry(async () => {
    if (!isValidAptosAddress(toAddress)) {
      throw new Error('Invalid recipient address format');
    }
    
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    
    // Create account from private key
    const privateKeyHex = fromPrivateKey.replace(/^0x/, '');
    const privateKey = new Ed25519PrivateKey(privateKeyHex);
    const senderAccount = Account.fromPrivateKey({ privateKey });
    
    const recipient = normalizeAddress(toAddress);
    
    // Build transaction
    const transaction = await aptos.transaction.build.simple({
      sender: senderAccount.accountAddress,
      data: {
        function: `${config.contractAddress}::act_token::transfer`,
        typeArguments: [],
        functionArguments: [recipient, amount.toString()],
      },
      options: {
        maxGasAmount: config.maxGasAmount,
        gasUnitPrice: config.gasUnitPrice,
      },
    });
    
    // Sign and submit
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: senderAccount,
      transaction,
    });
    
    // Wait for confirmation
    const executedTransaction = await aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
      options: {
        timeoutSecs: config.transactionTimeoutSecs,
      },
    });
    
    return {
      success: executedTransaction.success,
      transactionHash: committedTxn.hash,
      gasUsed: executedTransaction.gas_used,
      from: senderAccount.accountAddress.toString(),
      to: recipient,
      amount: amount.toString(),
      amountFormatted: (amount / 100000000).toFixed(8),
      explorer: `https://explorer.aptoslabs.com/txn/${committedTxn.hash}?network=testnet`,
    };
    
  }, `Transfer ${amount} ACT tokens to ${toAddress}`);
}

// ==================== GOVERNANCE OPERATIONS ====================

/**
 * Submit proposal to blockchain
 * @param {string} creatorPrivateKey - Proposal creator's private key
 * @param {object} proposalData - Proposal details
 * @returns {Promise<object>} - Transaction result with proposal ID
 */
async function submitProposal(creatorPrivateKey, proposalData) {
  return withRetry(async () => {
    const {
      title,
      description,
      amountRequested,
      recipientAddress,
      ipfsHash = '',
    } = proposalData;
    
    if (!title || !description || !amountRequested || !recipientAddress) {
      throw new Error('Missing required proposal fields');
    }
    
    if (!isValidAptosAddress(recipientAddress)) {
      throw new Error('Invalid recipient address format');
    }
    
    // Create account from private key
    const privateKeyHex = creatorPrivateKey.replace(/^0x/, '');
    const privateKey = new Ed25519PrivateKey(privateKeyHex);
    const creatorAccount = Account.fromPrivateKey({ privateKey });
    
    const recipient = normalizeAddress(recipientAddress);
    
    // Build transaction
    const transaction = await aptos.transaction.build.simple({
      sender: creatorAccount.accountAddress,
      data: {
        function: `${config.contractAddress}::governance::create_proposal`,
        typeArguments: [],
        functionArguments: [
          title,
          description,
          amountRequested.toString(),
          recipient,
          ipfsHash,
        ],
      },
      options: {
        maxGasAmount: config.maxGasAmount,
        gasUnitPrice: config.gasUnitPrice,
      },
    });
    
    // Sign and submit
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: creatorAccount,
      transaction,
    });
    
    // Wait for confirmation
    const executedTransaction = await aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
      options: {
        timeoutSecs: config.transactionTimeoutSecs,
      },
    });
    
    // Extract proposal ID from transaction events
    let proposalId = null;
    if (executedTransaction.events) {
      const proposalEvent = executedTransaction.events.find(e => 
        e.type.includes('ProposalCreatedEvent')
      );
      if (proposalEvent) {
        proposalId = proposalEvent.data.proposal_id;
      }
    }
    
    return {
      success: executedTransaction.success,
      transactionHash: committedTxn.hash,
      gasUsed: executedTransaction.gas_used,
      proposalId,
      creator: creatorAccount.accountAddress.toString(),
      title,
      amountRequested: amountRequested.toString(),
      recipient,
      explorer: `https://explorer.aptoslabs.com/txn/${committedTxn.hash}?network=testnet`,
    };
    
  }, `Submit proposal: ${proposalData.title}`);
}

/**
 * Cast vote on a proposal
 * @param {string} voterPrivateKey - Voter's private key
 * @param {number} proposalId - Proposal ID to vote on
 * @param {boolean} voteFor - True for "For", false for "Against"
 * @returns {Promise<object>} - Transaction result
 */
async function castVote(voterPrivateKey, proposalId, voteFor) {
  return withRetry(async () => {
    if (proposalId < 0) {
      throw new Error('Invalid proposal ID');
    }
    
    // Create account from private key
    const privateKeyHex = voterPrivateKey.replace(/^0x/, '');
    const privateKey = new Ed25519PrivateKey(privateKeyHex);
    const voterAccount = Account.fromPrivateKey({ privateKey });
    
    // Build transaction
    const transaction = await aptos.transaction.build.simple({
      sender: voterAccount.accountAddress,
      data: {
        function: `${config.contractAddress}::governance::vote`,
        typeArguments: [],
        functionArguments: [
          proposalId.toString(),
          voteFor,
        ],
      },
      options: {
        maxGasAmount: config.maxGasAmount,
        gasUnitPrice: config.gasUnitPrice,
      },
    });
    
    // Sign and submit
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: voterAccount,
      transaction,
    });
    
    // Wait for confirmation
    const executedTransaction = await aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
      options: {
        timeoutSecs: config.transactionTimeoutSecs,
      },
    });
    
    return {
      success: executedTransaction.success,
      transactionHash: committedTxn.hash,
      gasUsed: executedTransaction.gas_used,
      voter: voterAccount.accountAddress.toString(),
      proposalId,
      vote: voteFor ? 'FOR' : 'AGAINST',
      explorer: `https://explorer.aptoslabs.com/txn/${committedTxn.hash}?network=testnet`,
    };
    
  }, `Cast vote on proposal ${proposalId}`);
}

/**
 * Get proposal details from blockchain
 * @param {number} proposalId - Proposal ID
 * @returns {Promise<object>} - Proposal details
 */
async function getProposal(proposalId) {
  return withRetry(async () => {
    if (proposalId < 0) {
      throw new Error('Invalid proposal ID');
    }
    
    try {
      // Query get_proposal view function
      const result = await aptos.view({
        payload: {
          function: `${config.contractAddress}::governance::get_proposal`,
          typeArguments: [],
          functionArguments: [proposalId.toString()],
        },
      });
      
      // Parse result (structure depends on Move implementation)
      const proposal = result[0];
      
      return {
        id: proposalId,
        title: proposal.title || '',
        description: proposal.description || '',
        creator: proposal.creator || '',
        recipient: proposal.recipient || '',
        amountRequested: proposal.amount_requested?.toString() || '0',
        votesFor: proposal.votes_for?.toString() || '0',
        votesAgainst: proposal.votes_against?.toString() || '0',
        status: proposal.status || 'unknown',
        votingEnds: proposal.voting_ends || null,
        ipfsHash: proposal.ipfs_hash || '',
        createdAt: proposal.created_at || null,
      };
      
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('does not exist')) {
        throw new Error(`Proposal ${proposalId} not found`);
      }
      throw error;
    }
  }, `Get proposal ${proposalId}`);
}

// ==================== TREASURY OPERATIONS ====================

/**
 * Get treasury balance
 * @returns {Promise<object>} - Treasury balance details
 */
async function getTreasuryBalance() {
  return withRetry(async () => {
    try {
      // Query treasury balance view function
      const result = await aptos.view({
        payload: {
          function: `${config.contractAddress}::treasury::get_balance`,
          typeArguments: [],
          functionArguments: [],
        },
      });
      
      const balance = BigInt(result[0] || '0');
      
      return {
        balance: balance.toString(),
        balanceFormatted: (Number(balance) / 100000000).toFixed(8), // APT has 8 decimals
        decimals: 8,
        symbol: 'APT',
      };
      
    } catch (error) {
      console.error('Error getting treasury balance:', error.message);
      return {
        balance: '0',
        balanceFormatted: '0.00000000',
        decimals: 8,
        symbol: 'APT',
      };
    }
  }, 'Get treasury balance');
}

/**
 * Get claimable dividends for an address
 * @param {string} walletAddress - Wallet address to check
 * @returns {Promise<object>} - Claimable dividend amount
 */
async function getClaimableDividends(walletAddress) {
  return withRetry(async () => {
    if (!isValidAptosAddress(walletAddress)) {
      throw new Error('Invalid wallet address format');
    }
    
    const address = normalizeAddress(walletAddress);
    
    try {
      // Query claimable_amount view function
      const result = await aptos.view({
        payload: {
          function: `${config.contractAddress}::treasury::claimable_amount`,
          typeArguments: [],
          functionArguments: [address],
        },
      });
      
      const amount = BigInt(result[0] || '0');
      
      return {
        amount: amount.toString(),
        amountFormatted: (Number(amount) / 100000000).toFixed(8),
        decimals: 8,
        symbol: 'APT',
        address,
      };
      
    } catch (error) {
      if (error.message.includes('not found')) {
        return {
          amount: '0',
          amountFormatted: '0.00000000',
          decimals: 8,
          symbol: 'APT',
          address,
        };
      }
      throw error;
    }
  }, `Get claimable dividends for ${walletAddress}`);
}

/**
 * Claim dividends
 * @param {string} claimerPrivateKey - Claimer's private key
 * @returns {Promise<object>} - Transaction result
 */
async function claimDividends(claimerPrivateKey) {
  return withRetry(async () => {
    // Create account from private key
    const privateKeyHex = claimerPrivateKey.replace(/^0x/, '');
    const privateKey = new Ed25519PrivateKey(privateKeyHex);
    const claimerAccount = Account.fromPrivateKey({ privateKey });
    
    // Build transaction
    const transaction = await aptos.transaction.build.simple({
      sender: claimerAccount.accountAddress,
      data: {
        function: `${config.contractAddress}::treasury::claim_dividend`,
        typeArguments: [],
        functionArguments: [],
      },
      options: {
        maxGasAmount: config.maxGasAmount,
        gasUnitPrice: config.gasUnitPrice,
      },
    });
    
    // Sign and submit
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: claimerAccount,
      transaction,
    });
    
    // Wait for confirmation
    const executedTransaction = await aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
      options: {
        timeoutSecs: config.transactionTimeoutSecs,
      },
    });
    
    // Extract claimed amount from events
    let claimedAmount = '0';
    if (executedTransaction.events) {
      const claimEvent = executedTransaction.events.find(e => 
        e.type.includes('DividendClaimedEvent')
      );
      if (claimEvent) {
        claimedAmount = claimEvent.data.amount || '0';
      }
    }
    
    return {
      success: executedTransaction.success,
      transactionHash: committedTxn.hash,
      gasUsed: executedTransaction.gas_used,
      claimer: claimerAccount.accountAddress.toString(),
      amountClaimed: claimedAmount,
      amountFormatted: (Number(claimedAmount) / 100000000).toFixed(8),
      explorer: `https://explorer.aptoslabs.com/txn/${committedTxn.hash}?network=testnet`,
    };
    
  }, 'Claim dividends');
}

// ==================== TRANSACTION STATUS ====================

/**
 * Get transaction status and details
 * @param {string} transactionHash - Transaction hash
 * @returns {Promise<object>} - Transaction details
 */
async function getTransactionStatus(transactionHash) {
  return withRetry(async () => {
    try {
      const transaction = await aptos.getTransactionByHash({
        transactionHash,
      });
      
      return {
        hash: transactionHash,
        success: transaction.success,
        vmStatus: transaction.vm_status,
        gasUsed: transaction.gas_used,
        sender: transaction.sender,
        sequenceNumber: transaction.sequence_number,
        timestamp: transaction.timestamp,
        version: transaction.version,
        events: transaction.events || [],
        explorer: `https://explorer.aptoslabs.com/txn/${transactionHash}?network=testnet`,
      };
      
    } catch (error) {
      if (error.status === 404) {
        return {
          hash: transactionHash,
          status: 'not_found',
          message: 'Transaction not found or still pending',
        };
      }
      throw error;
    }
  }, `Get transaction status ${transactionHash}`);
}

/**
 * Estimate transaction gas
 * @param {object} transactionPayload - Transaction payload
 * @param {string} senderAddress - Sender address
 * @returns {Promise<object>} - Gas estimation
 */
async function estimateGas(transactionPayload, senderAddress) {
  try {
    if (!isValidAptosAddress(senderAddress)) {
      throw new Error('Invalid sender address format');
    }
    
    const sender = normalizeAddress(senderAddress);
    
    // Simulate transaction to estimate gas
    const simulation = await aptos.transaction.simulate.simple({
      signerPublicKey: AccountAddress.from(sender),
      transaction: {
        sender,
        data: transactionPayload,
      },
    });
    
    const gasUsed = simulation[0]?.gas_used || 0;
    const gasCost = gasUsed * config.gasUnitPrice;
    
    return {
      gasUsed: gasUsed.toString(),
      gasUnitPrice: config.gasUnitPrice.toString(),
      gasCost: gasCost.toString(),
      gasCostFormatted: (gasCost / 100000000).toFixed(8),
      success: simulation[0]?.success || false,
      vmStatus: simulation[0]?.vm_status || 'unknown',
    };
    
  } catch (error) {
    console.error('Gas estimation failed:', error.message);
    
    // Return default estimate on error
    return {
      gasUsed: config.maxGasAmount.toString(),
      gasUnitPrice: config.gasUnitPrice.toString(),
      gasCost: (config.maxGasAmount * config.gasUnitPrice).toString(),
      gasCostFormatted: ((config.maxGasAmount * config.gasUnitPrice) / 100000000).toFixed(8),
      success: false,
      vmStatus: 'estimation_failed',
      error: error.message,
    };
  }
}

// ==================== HEALTH CHECK ====================

/**
 * Check Aptos blockchain connection and contract availability
 * @returns {Promise<object>} - Health check results
 */
async function healthCheck() {
  const startTime = Date.now();
  
  try {
    // Check ledger info (blockchain connection)
    const ledgerInfo = await aptos.getLedgerInfo();
    
    // Check contract exists
    let contractExists = false;
    try {
      await aptos.getAccountModules({
        accountAddress: config.contractAddress,
      });
      contractExists = true;
    } catch {
      contractExists = false;
    }
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      connected: true,
      network: config.network,
      chainId: ledgerInfo.chain_id,
      ledgerVersion: ledgerInfo.ledger_version,
      ledgerTimestamp: ledgerInfo.ledger_timestamp,
      contractAddress: config.contractAddress,
      contractExists,
      responseTime,
      rpcUrl: config.nodeUrl,
    };
    
  } catch (error) {
    return {
      status: 'unhealthy',
      connected: false,
      error: error.message,
      responseTime: Date.now() - startTime,
      network: config.network,
      rpcUrl: config.nodeUrl,
    };
  }
}

// Export all functions
module.exports = {
  // Client
  getAptosClient,
  
  // Utilities
  isValidAptosAddress,
  normalizeAddress,
  initializeServiceAccount,
  
  // Token operations
  getACTBalance,
  getAPTBalance,
  mintACTTokens,
  transferACTTokens,
  
  // Governance operations
  submitProposal,
  castVote,
  getProposal,
  
  // Treasury operations
  getTreasuryBalance,
  getClaimableDividends,
  claimDividends,
  
  // Transaction utilities
  getTransactionStatus,
  estimateGas,
  
  // Health check
  healthCheck,
  
  // Configuration (read-only)
  config: {
    network: config.network,
    nodeUrl: config.nodeUrl,
    contractAddress: config.contractAddress,
    chainId: 2022, // Aptos Testnet
  },
};
