/**
 * useProposalDetails Hook
 * 
 * Custom React hook for fetching a single proposal's details.
 * Includes loading states, error handling, and refetch functionality.
 */

import { useState, useEffect, useCallback } from 'react';
import { getProposalById } from '../services/api';

const useProposalDetails = (proposalId, autoFetch = true) => {
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProposal = useCallback(async () => {
    if (!proposalId) {
      setProposal(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getProposalById(proposalId);
      setProposal(data.proposal || data);
    } catch (err) {
      console.error('Error fetching proposal details:', err);
      setError(err.message || 'Failed to fetch proposal details');
      setProposal(null);
    } finally {
      setLoading(false);
    }
  }, [proposalId]);

  useEffect(() => {
    if (autoFetch && proposalId) {
      fetchProposal();
    }
  }, [fetchProposal, autoFetch, proposalId]);

  const refetch = useCallback(() => {
    fetchProposal();
  }, [fetchProposal]);

  return {
    proposal,
    loading,
    error,
    refetch,
  };
};

export default useProposalDetails;
