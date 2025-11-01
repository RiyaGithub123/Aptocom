/**
 * Treasury Service
 * 
 * Handles all interactions with the Treasury smart contract.
 * Provides functions for balance queries, dividend claims, and treasury operations.
 */

import { aptosClient, CONTRACT_ADDRESSES, waitForTransaction } from './aptosClient';

/**
 * Get treasury balance
 * @returns {Promise<number>} Treasury balance in APT
 */
export const getTreasuryBalance = async () => {
  try {
    if (!CONTRACT_ADDRESSES.TREASURY_MODULE) {
      console.warn('Treasury contract address not configured');
      return 0;
    }

    // Query treasury account balance
    const resources = await aptosClient.getAccountResources({ 
      accountAddress: CONTRACT_ADDRESSES.TREASURY_MODULE 
    });
    
    const coinResource = resources.find(
      (r) => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
    );
    
    if (!coinResource) {
      return 0;
    }
    
    const balance = coinResource.data.coin.value;
    // Convert from octas to APT
    return parseInt(balance) / 100000000;
  } catch (error) {
    console.error('Error fetching treasury balance:', error);
    return 0;
  }
};

/**
 * Get claimable dividends for an address
 * @param {string} address - Account address
 * @returns {Promise<number>} Claimable dividend amount in APT
 */
export const getClaimableAmount = async (address) => {
  try {
    if (!CONTRACT_ADDRESSES.TREASURY_MODULE) {
      return 0;
    }

    // Query claimable dividends from contract
    const resources = await aptosClient.getAccountResources({ 
      accountAddress: CONTRACT_ADDRESSES.TREASURY_MODULE 
    });
    
    const dividendResource = resources.find((r) => 
      r.type.includes('treasury') && r.type.includes('Dividends')
    );
    
    if (!dividendResource) {
      return 0;
    }

    const claimable = dividendResource.data?.claimable?.[address] || 0;
    // Convert from octas to APT
    return parseInt(claimable) / 100000000;
  } catch (error) {
    console.error('Error fetching claimable amount:', error);
    return 0;
  }
};

/**
 * Claim dividends
 * @param {Object} wallet - Connected wallet object
 * @returns {Promise<Object>} Transaction result
 */
export const claimDividends = async (wallet) => {
  try {
    if (!wallet || !wallet.account) {
      throw new Error('Wallet not connected');
    }

    if (!CONTRACT_ADDRESSES.TREASURY_MODULE) {
      throw new Error('Treasury contract address not configured');
    }

    // Build transaction payload
    const payload = {
      type: 'entry_function_payload',
      function: `${CONTRACT_ADDRESSES.TREASURY_MODULE}::treasury::claim_dividends`,
      type_arguments: [],
      arguments: [],
    };

    // Sign and submit transaction
    const response = await wallet.signAndSubmitTransaction(payload);
    
    // Wait for transaction confirmation
    const txResult = await waitForTransaction(response.hash);
    
    return {
      success: true,
      hash: response.hash,
      transaction: txResult,
    };
  } catch (error) {
    console.error('Error claiming dividends:', error);
    throw error;
  }
};

/**
 * Get total dividends distributed
 * @returns {Promise<number>} Total dividends in APT
 */
export const getTotalDividendsDistributed = async () => {
  try {
    if (!CONTRACT_ADDRESSES.TREASURY_MODULE) {
      return 0;
    }

    // Query total dividends from contract
    const resources = await aptosClient.getAccountResources({ 
      accountAddress: CONTRACT_ADDRESSES.TREASURY_MODULE 
    });
    
    const dividendResource = resources.find((r) => 
      r.type.includes('treasury') && r.type.includes('DividendStats')
    );
    
    if (!dividendResource) {
      return 0;
    }

    const total = dividendResource.data?.total_distributed || 0;
    // Convert from octas to APT
    return parseInt(total) / 100000000;
  } catch (error) {
    console.error('Error fetching total dividends:', error);
    return 0;
  }
};

/**
 * Get user's total claimed dividends
 * @param {string} address - Account address
 * @returns {Promise<number>} Total claimed in APT
 */
export const getUserTotalClaimed = async (address) => {
  try {
    if (!CONTRACT_ADDRESSES.TREASURY_MODULE) {
      return 0;
    }

    // Query user's claim history from contract
    const resources = await aptosClient.getAccountResources({ 
      accountAddress: CONTRACT_ADDRESSES.TREASURY_MODULE 
    });
    
    const claimResource = resources.find((r) => 
      r.type.includes('treasury') && r.type.includes('ClaimHistory')
    );
    
    if (!claimResource) {
      return 0;
    }

    const totalClaimed = claimResource.data?.user_claims?.[address] || 0;
    // Convert from octas to APT
    return parseInt(totalClaimed) / 100000000;
  } catch (error) {
    console.error('Error fetching user total claimed:', error);
    return 0;
  }
};

/**
 * Get last dividend distribution timestamp
 * @returns {Promise<number>} Unix timestamp
 */
export const getLastDistributionTime = async () => {
  try {
    if (!CONTRACT_ADDRESSES.TREASURY_MODULE) {
      return 0;
    }

    // Query last distribution time from contract
    const resources = await aptosClient.getAccountResources({ 
      accountAddress: CONTRACT_ADDRESSES.TREASURY_MODULE 
    });
    
    const dividendResource = resources.find((r) => 
      r.type.includes('treasury') && r.type.includes('DividendStats')
    );
    
    if (!dividendResource) {
      return 0;
    }

    return parseInt(dividendResource.data?.last_distribution || 0);
  } catch (error) {
    console.error('Error fetching last distribution time:', error);
    return 0;
  }
};

/**
 * Distribute dividends (admin only)
 * @param {Object} wallet - Connected wallet object (must be admin)
 * @param {number} amount - Amount to distribute in APT
 * @returns {Promise<Object>} Transaction result
 */
export const distributeDividends = async (wallet, amount) => {
  try {
    if (!wallet || !wallet.account) {
      throw new Error('Wallet not connected');
    }

    if (!CONTRACT_ADDRESSES.TREASURY_MODULE) {
      throw new Error('Treasury contract address not configured');
    }

    // Convert APT to octas
    const amountOctas = Math.floor(amount * 100000000);

    // Build transaction payload
    const payload = {
      type: 'entry_function_payload',
      function: `${CONTRACT_ADDRESSES.TREASURY_MODULE}::treasury::distribute_dividends`,
      type_arguments: [],
      arguments: [amountOctas],
    };

    // Sign and submit transaction
    const response = await wallet.signAndSubmitTransaction(payload);
    
    // Wait for transaction confirmation
    const txResult = await waitForTransaction(response.hash);
    
    return {
      success: true,
      hash: response.hash,
      transaction: txResult,
    };
  } catch (error) {
    console.error('Error distributing dividends:', error);
    throw error;
  }
};

export default {
  getTreasuryBalance,
  getClaimableAmount,
  claimDividends,
  getTotalDividendsDistributed,
  getUserTotalClaimed,
  getLastDistributionTime,
  distributeDividends,
};
