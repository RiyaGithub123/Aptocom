/**
 * API Service
 * 
 * Provides wrapper functions for all backend API endpoints.
 * Handles data fetching, creation, and updates for proposals, treasury, and analytics.
 */

import apiClient from './apiClient';

/**
 * Proposals API
 */

// Get all proposals with optional filters
export const getProposals = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await apiClient.get(`/proposals${params ? `?${params}` : ''}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching proposals:', error);
    throw error;
  }
};

// Get proposal by ID
export const getProposalById = async (id) => {
  try {
    const response = await apiClient.get(`/proposals/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching proposal:', error);
    throw error;
  }
};

// Create new proposal (with AI evaluation)
export const createProposal = async (proposalData) => {
  try {
    const response = await apiClient.post('/proposals/create', proposalData);
    return response.data;
  } catch (error) {
    console.error('Error creating proposal:', error);
    throw error;
  }
};

// Force re-evaluation of a proposal
export const evaluateProposal = async (id) => {
  try {
    const response = await apiClient.post(`/proposals/${id}/evaluate`);
    return response.data;
  } catch (error) {
    console.error('Error evaluating proposal:', error);
    throw error;
  }
};

// Submit proposal to blockchain
export const submitProposalToBlockchain = async (id, blockchainData) => {
  try {
    const response = await apiClient.post(`/proposals/${id}/submit-blockchain`, blockchainData);
    return response.data;
  } catch (error) {
    console.error('Error submitting proposal to blockchain:', error);
    throw error;
  }
};

// Get proposal statistics
export const getProposalStats = async () => {
  try {
    const response = await apiClient.get('/proposals/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching proposal stats:', error);
    throw error;
  }
};

/**
 * ACT Token API
 */

// Get ACT balance for address (from backend cache/tracking)
export const getACTBalanceAPI = async (address) => {
  try {
    const response = await apiClient.get(`/act/balance/${address}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching ACT balance from API:', error);
    throw error;
  }
};

/**
 * Treasury API
 */

// Get treasury balance
export const getTreasuryBalanceAPI = async () => {
  try {
    const response = await apiClient.get('/treasury/balance');
    return response.data;
  } catch (error) {
    console.error('Error fetching treasury balance from API:', error);
    throw error;
  }
};

// Get dividends info for address
export const getDividends = async (address) => {
  try {
    const response = await apiClient.get(`/treasury/dividends/${address}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching dividends:', error);
    throw error;
  }
};

// Claim dividends (record in backend)
export const claimDividendsAPI = async (address, txHash) => {
  try {
    const response = await apiClient.post('/treasury/claim-dividends', { address, txHash });
    return response.data;
  } catch (error) {
    console.error('Error claiming dividends:', error);
    throw error;
  }
};

/**
 * Analytics API
 */

// Get dashboard analytics
export const getDashboardAnalytics = async () => {
  try {
    const response = await apiClient.get('/analytics/overview');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    throw error;
  }
};

// Get user analytics
export const getUserAnalytics = async (address) => {
  try {
    const response = await apiClient.get(`/analytics/user/${address}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    throw error;
  }
};

/**
 * User API
 */

// Register new user
export const registerUser = async (userData) => {
  try {
    const response = await apiClient.post('/users/register', userData);
    return response.data;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

// Get user profile
export const getUserProfile = async (address) => {
  try {
    const response = await apiClient.get(`/users/${address}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (address, userData) => {
  try {
    const response = await apiClient.put(`/users/${address}`, userData);
    return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Get user activity
export const getUserActivity = async (address) => {
  try {
    const response = await apiClient.get(`/users/${address}/activity`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user activity:', error);
    throw error;
  }
};

/**
 * Health Check API
 */

// Check backend health
export const checkHealth = async () => {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    console.error('Error checking health:', error);
    throw error;
  }
};

/**
 * File Upload API (for IPFS)
 */

// Upload file to IPFS via backend
export const uploadFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export default {
  // Proposals
  getProposals,
  getProposalById,
  createProposal,
  evaluateProposal,
  submitProposalToBlockchain,
  getProposalStats,
  
  // ACT Token
  getACTBalanceAPI,
  
  // Treasury
  getTreasuryBalanceAPI,
  getDividends,
  claimDividendsAPI,
  
  // Analytics
  getDashboardAnalytics,
  getUserAnalytics,
  
  // Users
  registerUser,
  getUserProfile,
  updateUserProfile,
  getUserActivity,
  
  // Health
  checkHealth,
  
  // Upload
  uploadFile,
};
