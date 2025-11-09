/**
 * Aptos Blockchain Client Service
 * 
 * Provides configuration and helper functions for interacting with Aptos blockchain.
 * Handles network setup, client initialization, and common blockchain operations.
 */

import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

// Get network from environment variables
const APTOS_NETWORK = import.meta.env.VITE_APTOS_NETWORK || 'testnet';
const APTOS_NODE_URL = import.meta.env.VITE_APTOS_NODE_URL;

// Contract addresses from environment
export const CONTRACT_ADDRESSES = {
  ACT_TOKEN: import.meta.env.VITE_ACT_TOKEN_ADDRESS || '',
  DAO_MODULE: import.meta.env.VITE_DAO_MODULE_ADDRESS || '',
  TREASURY_MODULE: import.meta.env.VITE_TREASURY_MODULE_ADDRESS || '',
};

/**
 * Initialize Aptos client with network configuration
 */
const config = new AptosConfig({
  network: APTOS_NETWORK === 'mainnet' ? Network.MAINNET : Network.TESTNET,
  ...(APTOS_NODE_URL && { fullnode: APTOS_NODE_URL }),
});

export const aptosClient = new Aptos(config);

/**
 * Log network configuration details for debugging
 */
export const logNetworkConfig = () => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🌐 APTOS NETWORK CONFIGURATION');
  console.log('═══════════════════════════════════════════════════════');
  console.log('Network:', APTOS_NETWORK);
  console.log('RPC URL:', APTOS_NODE_URL);
  console.log('Network Enum:', APTOS_NETWORK === 'mainnet' ? 'MAINNET' : 'TESTNET');
  console.log('Chain ID (Testnet):', 2);
  console.log('Chain ID (Mainnet):', 1);
  console.log('───────────────────────────────────────────────────────');
  console.log('📦 CONTRACT ADDRESSES');
  console.log('───────────────────────────────────────────────────────');
  console.log('ACT Token:', CONTRACT_ADDRESSES.ACT_TOKEN);
  console.log('DAO Module:', CONTRACT_ADDRESSES.DAO_MODULE);
  console.log('Treasury:', CONTRACT_ADDRESSES.TREASURY_MODULE);
  console.log('───────────────────────────────────────────────────────');
  console.log('🔗 EXPLORER LINKS');
  console.log('───────────────────────────────────────────────────────');
  console.log('Contract Explorer:', `https://explorer.aptoslabs.com/account/${CONTRACT_ADDRESSES.ACT_TOKEN}?network=${APTOS_NETWORK}`);
  console.log('Testnet Faucet:', 'https://faucet.testnet.aptoslabs.com/');
  console.log('═══════════════════════════════════════════════════════');
  
  return {
    network: APTOS_NETWORK,
    rpcUrl: APTOS_NODE_URL,
    chainId: APTOS_NETWORK === 'mainnet' ? 1 : 2,
    contracts: CONTRACT_ADDRESSES,
  };
};

// Auto-log on import
console.log('[aptosClient] Initializing Aptos client...');
logNetworkConfig();

/**
 * Get account information
 * @param {string} address - Account address
 * @returns {Promise<Object>} Account info
 */
export const getAccountInfo = async (address) => {
  try {
    const account = await aptosClient.getAccountInfo({ accountAddress: address });
    return account;
  } catch (error) {
    console.error('Error fetching account info:', error);
    throw new Error('Failed to fetch account information');
  }
};

/**
 * Get account APT balance
 * 
 * UPDATED: Uses modern SDK method that handles BOTH legacy Coin standard
 * and new Fungible Asset (FA) standard. APT migrated to FA on June 30, 2025.
 * 
 * @param {string} address - Account address
 * @returns {Promise<number>} Balance in APT (converted from octas)
 */
export const getAPTBalance = async (address) => {
  try {
    console.log('[getAPTBalance] 🔍 Fetching APT balance for:', address);
    
    // Use the modern SDK method that automatically handles FA migration
    // This method checks BOTH CoinStore (legacy) and FungibleStore (FA) 
    const balanceInOctas = await aptosClient.getAccountAPTAmount({ 
      accountAddress: address 
    });
    
    console.log('[getAPTBalance] ✅ Raw balance (octas):', balanceInOctas);
    
    // Convert from octas to APT (1 APT = 100,000,000 octas)
    const aptBalance = parseInt(balanceInOctas) / 100000000;
    console.log('[getAPTBalance] 💰 APT balance:', aptBalance);
    
    return aptBalance;
  } catch (error) {
    console.error('[getAPTBalance] ❌ Error fetching APT balance:', error);
    console.error('[getAPTBalance] Error details:', error.message);
    
    // If the account doesn't exist or has no APT, return 0
    if (error.message?.includes('not found') || error.message?.includes('Resource not found')) {
      console.warn('[getAPTBalance] ⚠️ Account has no APT balance or does not exist');
      return 0;
    }
    
    throw error; // Re-throw unexpected errors
  }
};

/**
 * Wait for transaction to be confirmed
 * @param {string} txHash - Transaction hash
 * @param {number} maxWaitTime - Maximum wait time in milliseconds (default 30s)
 * @returns {Promise<Object>} Transaction result
 */
export const waitForTransaction = async (txHash, maxWaitTime = 30000) => {
  try {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const txn = await aptosClient.getTransactionByHash({ transactionHash: txHash });
        
        if (txn.success !== undefined) {
          if (!txn.success) {
            throw new Error(`Transaction failed: ${txn.vm_status || 'Unknown error'}`);
          }
          return txn;
        }
        
        // Wait 1 second before checking again
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        // Transaction not yet available, continue waiting
        if (!error.message.includes('not found')) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    throw new Error('Transaction confirmation timeout');
  } catch (error) {
    console.error('Error waiting for transaction:', error);
    throw error;
  }
};

/**
 * Get transaction by hash
 * @param {string} txHash - Transaction hash
 * @returns {Promise<Object>} Transaction details
 */
export const getTransaction = async (txHash) => {
  try {
    return await aptosClient.getTransactionByHash({ transactionHash: txHash });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    throw new Error('Failed to fetch transaction details');
  }
};

/**
 * Format address to short version (0x1234...5678)
 * @param {string} address - Full address
 * @param {number} startChars - Number of characters to show at start
 * @param {number} endChars - Number of characters to show at end
 * @returns {string} Formatted address
 */
export const formatAddress = (address, startChars = 6, endChars = 4) => {
  if (!address || address.length < startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * Format APT amount with proper decimals
 * @param {number} amount - Amount in APT
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted amount
 */
export const formatAPT = (amount, decimals = 4) => {
  return parseFloat(amount).toFixed(decimals);
};

/**
 * Convert APT to octas
 * @param {number} apt - Amount in APT
 * @returns {number} Amount in octas
 */
export const aptToOctas = (apt) => {
  return Math.floor(apt * 100000000);
};

/**
 * Convert octas to APT
 * @param {number} octas - Amount in octas
 * @returns {number} Amount in APT
 */
export const octasToAPT = (octas) => {
  return octas / 100000000;
};

/**
 * Get Aptos Explorer URL for transaction
 * @param {string} txHash - Transaction hash
 * @returns {string} Explorer URL
 */
export const getExplorerUrl = (txHash) => {
  const network = APTOS_NETWORK === 'mainnet' ? '' : `${APTOS_NETWORK}.`;
  return `https://explorer.aptoslabs.com/txn/${txHash}?network=${APTOS_NETWORK}`;
};

/**
 * Get Aptos Explorer URL for account
 * @param {string} address - Account address
 * @returns {string} Explorer URL
 */
export const getAccountExplorerUrl = (address) => {
  const network = APTOS_NETWORK === 'mainnet' ? '' : `${APTOS_NETWORK}.`;
  return `https://explorer.aptoslabs.com/account/${address}?network=${APTOS_NETWORK}`;
};

export default aptosClient;
