/**
 * useTreasuryBalance Hook
 * 
 * Custom React hook for fetching treasury balance.
 * Auto-refreshes periodically and on demand.
 */

import { useState, useEffect, useCallback } from 'react';
import { getTreasuryBalance } from '../services/treasuryService';

const useTreasuryBalance = (autoFetch = true, refreshInterval = 30000) => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBalance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const treasuryBalance = await getTreasuryBalance();
      setBalance(treasuryBalance);
    } catch (err) {
      console.error('Error fetching treasury balance:', err);
      setError(err.message || 'Failed to fetch treasury balance');
      setBalance(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchBalance();

      // Auto-refresh at interval
      if (refreshInterval > 0) {
        const intervalId = setInterval(fetchBalance, refreshInterval);
        return () => clearInterval(intervalId);
      }
    }
  }, [fetchBalance, autoFetch, refreshInterval]);

  const refetch = useCallback(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    loading,
    error,
    refetch,
  };
};

export default useTreasuryBalance;
