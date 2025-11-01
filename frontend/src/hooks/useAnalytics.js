/**
 * useAnalytics Hook
 * 
 * Custom React hook for fetching dashboard analytics data.
 * Includes proposal stats, treasury metrics, and user activity.
 */

import { useState, useEffect, useCallback } from 'react';
import { getDashboardAnalytics, getProposalStats } from '../services/api';

const useAnalytics = (autoFetch = true, refreshInterval = 60000) => {
  const [analytics, setAnalytics] = useState({
    totalProposals: 0,
    activeProposals: 0,
    approvedProposals: 0,
    rejectedProposals: 0,
    totalFunding: 0,
    averageScore: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch dashboard analytics first
      try {
        const data = await getDashboardAnalytics();
        setAnalytics(data);
      } catch {
        // Fallback to proposal stats if dashboard analytics not available
        const stats = await getProposalStats();
        setAnalytics({
          totalProposals: stats.total || 0,
          activeProposals: stats.active || 0,
          approvedProposals: stats.approved || 0,
          rejectedProposals: stats.rejected || 0,
          totalFunding: stats.totalFunding || 0,
          averageScore: stats.averageScore || 0,
        });
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to fetch analytics');
      setAnalytics({
        totalProposals: 0,
        activeProposals: 0,
        approvedProposals: 0,
        rejectedProposals: 0,
        totalFunding: 0,
        averageScore: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchAnalytics();

      // Auto-refresh at interval
      if (refreshInterval > 0) {
        const intervalId = setInterval(fetchAnalytics, refreshInterval);
        return () => clearInterval(intervalId);
      }
    }
  }, [fetchAnalytics, autoFetch, refreshInterval]);

  const refetch = useCallback(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    refetch,
  };
};

export default useAnalytics;
