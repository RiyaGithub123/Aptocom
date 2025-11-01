/**
 * useUserBalance Hook
 * 
 * Custom React hook for fetching user's ACT token balance.
 * Auto-refreshes when wallet address changes or on demand.
 */

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { getACTBalance } from '../services/tokenService';
import { getAPTBalance } from '../services/aptosClient';

const useUserBalance = (autoFetch = true, refreshInterval = 15000) => {
  const { account, connected } = useWallet();
  const [balances, setBalances] = useState({
    act: 0,
    apt: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBalances = useCallback(async () => {
    if (!connected || !account?.address) {
      setBalances({ act: 0, apt: 0 });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch both ACT and APT balances in parallel
      const [actBalance, aptBalance] = await Promise.all([
        getACTBalance(account.address),
        getAPTBalance(account.address),
      ]);

      setBalances({
        act: actBalance,
        apt: aptBalance,
      });
    } catch (err) {
      console.error('Error fetching user balances:', err);
      setError(err.message || 'Failed to fetch balances');
      setBalances({ act: 0, apt: 0 });
    } finally {
      setLoading(false);
    }
  }, [connected, account?.address]);

  useEffect(() => {
    if (autoFetch) {
      fetchBalances();

      // Auto-refresh at interval
      if (refreshInterval > 0 && connected) {
        const intervalId = setInterval(fetchBalances, refreshInterval);
        return () => clearInterval(intervalId);
      }
    }
  }, [fetchBalances, autoFetch, refreshInterval, connected]);

  const refetch = useCallback(() => {
    fetchBalances();
  }, [fetchBalances]);

  return {
    balances,
    actBalance: balances.act,
    aptBalance: balances.apt,
    loading,
    error,
    refetch,
    address: account?.address,
  };
};

export default useUserBalance;
