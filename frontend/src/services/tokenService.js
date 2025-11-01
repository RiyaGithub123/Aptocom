/**
 * ACT Token Service
 * 
 * Handles all interactions with the ACT Token smart contract.
 * Provides functions for balance queries, minting, and transfers.
 */

import { aptosClient, CONTRACT_ADDRESSES, waitForTransaction } from './aptosClient';

/**
 * Get ACT token balance for an address
 * @param {string} address - Account address
 * @returns {Promise<number>} ACT token balance
 */
export const getACTBalance = async (address) => {
  try {
    if (!CONTRACT_ADDRESSES.ACT_TOKEN) {
      console.warn('ACT Token address not configured');
      return 0;
    }

    try {
      // Query using the view function - balance_of
      const result = await aptosClient.view({
        payload: {
          function: `${CONTRACT_ADDRESSES.ACT_TOKEN}::act_token::balance_of`,
          typeArguments: [],
          functionArguments: [address],
        },
      });
      
      // Result is in base units (8 decimals)
      const balanceValue = BigInt(result[0] || '0');
      return Number(balanceValue) / 100000000; // Convert to readable format
      
    } catch (viewError) {
      // If view function fails, try resource query as fallback
      console.warn('View function failed, trying resource query:', viewError.message);
      
      const resources = await aptosClient.getAccountResources({ accountAddress: address });
      
      // Find the ACT token store resource
      const actResource = resources.find(
        (r) => r.type.includes('fungible_asset') && r.type.includes('ACTToken')
      );
      
      if (!actResource) {
        return 0;
      }
      
      const balance = actResource.data?.balance || actResource.data?.coin?.value || 0;
      return parseInt(balance) / 100000000;
    }
  } catch (error) {
    console.error('Error fetching ACT balance:', error);
    return 0;
  }
};

/**
 * Mint ACT tokens (purchase with APT)
 * @param {Object} wallet - Connected wallet object
 * @param {number} aptAmount - Amount of APT to spend
 * @returns {Promise<Object>} Transaction result
 */
export const mintACT = async (wallet, aptAmount) => {
  try {
    if (!wallet || !wallet.account) {
      throw new Error('Wallet not connected');
    }

    if (!CONTRACT_ADDRESSES.ACT_TOKEN) {
      throw new Error('ACT Token contract address not configured');
    }

    // Convert APT to octas (1 APT = 100,000,000 octas)
    const aptOctas = Math.floor(aptAmount * 100000000);

    // Build transaction payload for purchase function
    const payload = {
      type: 'entry_function_payload',
      function: `${CONTRACT_ADDRESSES.ACT_TOKEN}::act_token::purchase`,
      type_arguments: [],
      arguments: [aptOctas.toString()], // Amount in octas as string
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
    console.error('Error purchasing ACT tokens:', error);
    throw error;
  }
};

/**
 * Transfer ACT tokens to another address
 * @param {Object} wallet - Connected wallet object
 * @param {string} recipient - Recipient address
 * @param {number} amount - Amount of ACT tokens to transfer
 * @returns {Promise<Object>} Transaction result
 */
export const transferACT = async (wallet, recipient, amount) => {
  try {
    if (!wallet || !wallet.account) {
      throw new Error('Wallet not connected');
    }

    if (!CONTRACT_ADDRESSES.ACT_TOKEN) {
      throw new Error('ACT Token contract address not configured');
    }

    if (!recipient || recipient.length === 0) {
      throw new Error('Invalid recipient address');
    }

    if (amount <= 0) {
      throw new Error('Invalid transfer amount');
    }

    // Build transaction payload
    const payload = {
      type: 'entry_function_payload',
      function: `${CONTRACT_ADDRESSES.ACT_TOKEN}::act_token::transfer`,
      type_arguments: [],
      arguments: [recipient, amount],
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
    console.error('Error transferring ACT tokens:', error);
    throw error;
  }
};

/**
 * Get ACT token metadata (name, symbol, decimals)
 * @returns {Promise<Object>} Token metadata
 */
export const getACTMetadata = async () => {
  try {
    if (!CONTRACT_ADDRESSES.ACT_TOKEN) {
      return {
        name: 'ACT Token',
        symbol: 'ACT',
        decimals: 8,
      };
    }

    // Query token metadata from contract
    // This would need to be implemented based on your token contract structure
    return {
      name: 'AptoCom Token',
      symbol: 'ACT',
      decimals: 8,
      description: 'Governance and dividend token for AptoCom DAO',
    };
  } catch (error) {
    console.error('Error fetching ACT metadata:', error);
    return {
      name: 'ACT Token',
      symbol: 'ACT',
      decimals: 8,
    };
  }
};

/**
 * Get ACT token total supply
 * @returns {Promise<number>} Total supply
 */
export const getACTTotalSupply = async () => {
  try {
    if (!CONTRACT_ADDRESSES.ACT_TOKEN) {
      return 0;
    }

    // Query total supply from contract
    // This would need to be implemented based on your token contract structure
    const resources = await aptosClient.getAccountResources({ 
      accountAddress: CONTRACT_ADDRESSES.ACT_TOKEN 
    });
    
    const supplyResource = resources.find((r) => r.type.includes('supply'));
    
    if (!supplyResource) {
      return 0;
    }
    
    return parseInt(supplyResource.data?.current?.vec?.[0]?.integer?.vec?.[0]?.value || 0);
  } catch (error) {
    console.error('Error fetching ACT total supply:', error);
    return 0;
  }
};

export default {
  getACTBalance,
  mintACT,
  transferACT,
  getACTMetadata,
  getACTTotalSupply,
};
