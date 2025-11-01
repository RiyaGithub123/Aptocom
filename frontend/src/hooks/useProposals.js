/**
 * useProposals Hook
 * 
 * Custom React hook for fetching and managing proposals data.
 * Handles loading states, errors, and automatic refetching.
 */

import { useState, useEffect, useCallback } from 'react';
import { getProposals } from '../services/api';

const useProposals = (filters = {}, autoFetch = true) => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProposals(filters);
      setProposals(data.proposals || data);
    } catch (err) {
      console.error('Error fetching proposals:', err);
      setError(err.message || 'Failed to fetch proposals');
      setProposals([]);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    if (autoFetch) {
      fetchProposals();
    }
  }, [fetchProposals, autoFetch]);

  const refetch = useCallback(() => {
    fetchProposals();
  }, [fetchProposals]);

  return {
    proposals,
    loading,
    error,
    refetch,
  };
};

export default useProposals;
