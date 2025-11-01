/**
 * Governance Service
 * 
 * Handles all interactions with the DAO Governance smart contract.
 * Provides functions for proposal creation, voting, and execution.
 */

import { aptosClient, CONTRACT_ADDRESSES, waitForTransaction } from './aptosClient';

/**
 * Create a proposal on-chain
 * @param {Object} wallet - Connected wallet object
 * @param {string} proposalId - Off-chain proposal ID from backend
 * @param {number} fundingAmount - Amount of APT requested
 * @param {number} duration - Voting duration in seconds
 * @returns {Promise<Object>} Transaction result
 */
export const createProposal = async (wallet, proposalId, fundingAmount, duration) => {
  try {
    if (!wallet || !wallet.account) {
      throw new Error('Wallet not connected');
    }

    if (!CONTRACT_ADDRESSES.DAO_MODULE) {
      throw new Error('DAO contract address not configured');
    }

    // Convert APT to octas
    const fundingOctas = Math.floor(fundingAmount * 100000000);

    // Build transaction payload
    const payload = {
      type: 'entry_function_payload',
      function: `${CONTRACT_ADDRESSES.DAO_MODULE}::governance::create_proposal`,
      type_arguments: [],
      arguments: [proposalId, fundingOctas, duration],
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
    console.error('Error creating proposal:', error);
    throw error;
  }
};

/**
 * Cast a vote on a proposal
 * @param {Object} wallet - Connected wallet object
 * @param {string} proposalId - Proposal ID
 * @param {boolean} voteFor - true for yes, false for no
 * @returns {Promise<Object>} Transaction result
 */
export const castVote = async (wallet, proposalId, voteFor) => {
  try {
    if (!wallet || !wallet.account) {
      throw new Error('Wallet not connected');
    }

    if (!CONTRACT_ADDRESSES.DAO_MODULE) {
      throw new Error('DAO contract address not configured');
    }

    // Build transaction payload
    const payload = {
      type: 'entry_function_payload',
      function: `${CONTRACT_ADDRESSES.DAO_MODULE}::governance::cast_vote`,
      type_arguments: [],
      arguments: [proposalId, voteFor],
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
    console.error('Error casting vote:', error);
    throw error;
  }
};

/**
 * Get proposal status from blockchain
 * @param {string} proposalId - Proposal ID
 * @returns {Promise<Object>} Proposal status
 */
export const getProposalStatus = async (proposalId) => {
  try {
    if (!CONTRACT_ADDRESSES.DAO_MODULE) {
      throw new Error('DAO contract address not configured');
    }

    // Query proposal from contract
    const resources = await aptosClient.getAccountResources({ 
      accountAddress: CONTRACT_ADDRESSES.DAO_MODULE 
    });
    
    // Find proposals table
    const proposalResource = resources.find((r) => 
      r.type.includes('governance') && r.type.includes('Proposal')
    );
    
    if (!proposalResource) {
      return null;
    }

    // Extract proposal data
    // This structure depends on your smart contract implementation
    const proposals = proposalResource.data?.proposals || {};
    const proposal = proposals[proposalId];
    
    if (!proposal) {
      return null;
    }

    return {
      id: proposalId,
      votesFor: parseInt(proposal.votes_for || 0),
      votesAgainst: parseInt(proposal.votes_against || 0),
      status: proposal.status, // 'pending', 'active', 'approved', 'rejected', 'executed'
      endTime: parseInt(proposal.end_time || 0),
      executed: proposal.executed || false,
    };
  } catch (error) {
    console.error('Error fetching proposal status:', error);
    return null;
  }
};

/**
 * Execute an approved proposal
 * @param {Object} wallet - Connected wallet object
 * @param {string} proposalId - Proposal ID
 * @returns {Promise<Object>} Transaction result
 */
export const executeProposal = async (wallet, proposalId) => {
  try {
    if (!wallet || !wallet.account) {
      throw new Error('Wallet not connected');
    }

    if (!CONTRACT_ADDRESSES.DAO_MODULE) {
      throw new Error('DAO contract address not configured');
    }

    // Build transaction payload
    const payload = {
      type: 'entry_function_payload',
      function: `${CONTRACT_ADDRESSES.DAO_MODULE}::governance::execute_proposal`,
      type_arguments: [],
      arguments: [proposalId],
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
    console.error('Error executing proposal:', error);
    throw error;
  }
};

/**
 * Get voter's voting power for a proposal
 * @param {string} voterAddress - Voter's address
 * @param {string} proposalId - Proposal ID
 * @returns {Promise<number>} Voting power (ACT token balance at proposal creation)
 */
export const getVotingPower = async (voterAddress, proposalId) => {
  try {
    if (!CONTRACT_ADDRESSES.DAO_MODULE) {
      return 0;
    }

    // Query voting power from contract
    // This would typically be the user's ACT balance at the time of proposal creation
    const resources = await aptosClient.getAccountResources({ 
      accountAddress: CONTRACT_ADDRESSES.DAO_MODULE 
    });
    
    const votingResource = resources.find((r) => 
      r.type.includes('governance') && r.type.includes('VotingPower')
    );
    
    if (!votingResource) {
      return 0;
    }

    const votingPower = votingResource.data?.voting_power?.[voterAddress]?.[proposalId] || 0;
    return parseInt(votingPower);
  } catch (error) {
    console.error('Error fetching voting power:', error);
    return 0;
  }
};

/**
 * Check if user has voted on a proposal
 * @param {string} voterAddress - Voter's address
 * @param {string} proposalId - Proposal ID
 * @returns {Promise<Object|null>} Vote info or null if not voted
 */
export const getUserVote = async (voterAddress, proposalId) => {
  try {
    if (!CONTRACT_ADDRESSES.DAO_MODULE) {
      return null;
    }

    // Query user's vote from contract
    const resources = await aptosClient.getAccountResources({ 
      accountAddress: CONTRACT_ADDRESSES.DAO_MODULE 
    });
    
    const votesResource = resources.find((r) => 
      r.type.includes('governance') && r.type.includes('Votes')
    );
    
    if (!votesResource) {
      return null;
    }

    const votes = votesResource.data?.votes?.[proposalId]?.[voterAddress];
    
    if (!votes) {
      return null;
    }

    return {
      voted: true,
      voteFor: votes.vote_for,
      votingPower: parseInt(votes.voting_power || 0),
      timestamp: parseInt(votes.timestamp || 0),
    };
  } catch (error) {
    console.error('Error fetching user vote:', error);
    return null;
  }
};

export default {
  createProposal,
  castVote,
  getProposalStatus,
  executeProposal,
  getVotingPower,
  getUserVote,
};
