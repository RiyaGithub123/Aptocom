import React, { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { toast } from 'react-toastify';
import { FaUniversity, FaCoins, FaChartLine, FaHistory } from 'react-icons/fa';
import Card from '../components/Card';
import Button from '../components/Button';
import useTreasuryBalance from '../hooks/useTreasuryBalance';
import useUserBalance from '../hooks/useUserBalance';
import treasuryService from '../services/treasuryService';
import { getExplorerUrl } from '../services/aptosClient';
import './Treasury.css';

const Treasury = () => {
  const { account, connected } = useWallet();
  const { balance: treasuryBalance, loading: treasuryLoading } = useTreasuryBalance();
  const { actBalance, refetch } = useUserBalance();
  const [claiming, setClaiming] = useState(false);
  const [allocating, setAllocating] = useState(false);
  const [allocationAmount, setAllocationAmount] = useState('');

  // Mock data for dividends (would come from backend in production)
  const [dividendData] = useState({
    totalDistributed: 1250.5,
    yourShare: 45.75,
    lastDistribution: '2025-10-15',
    nextDistribution: '2025-11-15',
    claimableAmount: 12.35
  });

  const handleClaimDividends = async () => {
    if (!connected || !account) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (dividendData.claimableAmount <= 0) {
      toast.error('No dividends available to claim');
      return;
    }

    try {
      setClaiming(true);
      const wallet = window.aptos || { account, signAndSubmitTransaction: window.aptos?.signAndSubmitTransaction };
      const result = await treasuryService.claimDividends(wallet);
      
      const explorerUrl = getExplorerUrl(result.hash);
      toast.success(
        <div>
          <div>Dividends claimed successfully!</div>
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-green)', textDecoration: 'underline' }}>
            View Transaction
          </a>
        </div>,
        { autoClose: 10000 }
      );
      
      setTimeout(() => refetch(), 2000);
    } catch (err) {
      console.error('Claim error:', err);
      toast.error(err.message || 'Failed to claim dividends');
    } finally {
      setClaiming(false);
    }
  };

  const handleAllocateFunds = async () => {
    if (!connected || !account) {
      toast.error('Please connect your wallet first');
      return;
    }

    const amount = parseFloat(allocationAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    try {
      setAllocating(true);
      const wallet = window.aptos || { account, signAndSubmitTransaction: window.aptos?.signAndSubmitTransaction };
      const result = await treasuryService.allocateFunds(wallet, amount, 'General Investment');
      
      const explorerUrl = getExplorerUrl(result.hash);
      toast.success(
        <div>
          <div>Funds allocated successfully!</div>
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-green)', textDecoration: 'underline' }}>
            View Transaction
          </a>
        </div>,
        { autoClose: 10000 }
      );
      
      setAllocationAmount('');
    } catch (err) {
      console.error('Allocation error:', err);
      toast.error(err.message || 'Failed to allocate funds');
    } finally {
      setAllocating(false);
    }
  };

  const votingPower = actBalance && treasuryBalance 
    ? ((actBalance / (treasuryBalance + actBalance)) * 100).toFixed(2)
    : '0.00';

  return (
    <div className="treasury page">
      <div className="page-header">
        <h1>💰 Treasury Management</h1>
        <p className="subtitle">
          Monitor treasury balance, claim dividends, and manage fund allocations for approved proposals.
        </p>
      </div>

      <div className="treasury-stats">
        <Card variant="default" hover>
          <div className="stat-card">
            <div className="stat-icon" style={{ color: 'var(--primary-green)' }}>
              <FaUniversity />
            </div>
            <h3>Treasury Balance</h3>
            <p className="stat-value">
              {treasuryLoading ? '...' : (treasuryBalance?.toFixed(4) || '0.0000')}
            </p>
            <p className="stat-label">APT</p>
          </div>
        </Card>

        <Card variant="default" hover>
          <div className="stat-card">
            <div className="stat-icon" style={{ color: 'var(--primary-purple)' }}>
              <FaCoins />
            </div>
            <h3>Your ACT Balance</h3>
            <p className="stat-value">
              {actBalance?.toFixed(2) || '0.00'}
            </p>
            <p className="stat-label">ACT Tokens</p>
          </div>
        </Card>

        <Card variant="default" hover>
          <div className="stat-card">
            <div className="stat-icon" style={{ color: 'var(--primary-yellow)' }}>
              <FaChartLine />
            </div>
            <h3>Your Voting Power</h3>
            <p className="stat-value">
              {votingPower}%
            </p>
            <p className="stat-label">of Total Supply</p>
          </div>
        </Card>

        <Card variant="default" hover>
          <div className="stat-card">
            <div className="stat-icon" style={{ color: 'var(--primary-cyan)' }}>
              <FaHistory />
            </div>
            <h3>Claimable Dividends</h3>
            <p className="stat-value">
              {dividendData.claimableAmount.toFixed(2)}
            </p>
            <p className="stat-label">APT</p>
          </div>
        </Card>
      </div>

      <div className="treasury-actions">
        <Card variant="success">
          <h2>💎 Dividend Distribution</h2>
          <div className="dividend-info">
            <div className="dividend-item">
              <span className="label">Total Distributed</span>
              <span className="value">{dividendData.totalDistributed} APT</span>
            </div>
            <div className="dividend-item">
              <span className="label">Your Total Share</span>
              <span className="value">{dividendData.yourShare} APT</span>
            </div>
            <div className="dividend-item">
              <span className="label">Last Distribution</span>
              <span className="value">{new Date(dividendData.lastDistribution).toLocaleDateString()}</span>
            </div>
            <div className="dividend-item">
              <span className="label">Next Distribution</span>
              <span className="value">{new Date(dividendData.nextDistribution).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="claimable-section">
            <div className="claimable-amount">
              <span>Available to Claim:</span>
              <strong style={{ fontSize: '2rem', color: 'var(--primary-green)' }}>
                {dividendData.claimableAmount.toFixed(4)} APT
              </strong>
            </div>
            <Button 
              variant="success" 
              size="large"
              onClick={handleClaimDividends}
              disabled={claiming || !connected || dividendData.claimableAmount <= 0}
            >
              {claiming ? 'Claiming...' : '🎁 Claim Dividends'}
            </Button>
          </div>

          {!connected && (
            <p className="connect-message">
              Connect your wallet to claim dividends
            </p>
          )}
        </Card>

        <Card variant="outlined">
          <h2>🏦 Allocate Funds</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Allocate treasury funds to approved proposals for execution.
          </p>

          <div className="allocation-form">
            <label htmlFor="allocation-amount">Amount (APT)</label>
            <input
              type="number"
              id="allocation-amount"
              value={allocationAmount}
              onChange={(e) => setAllocationAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              disabled={!connected || allocating}
            />

            <Button 
              variant="primary"
              onClick={handleAllocateFunds}
              disabled={allocating || !connected || !allocationAmount}
              fullWidth
            >
              {allocating ? 'Allocating...' : '💸 Allocate Funds'}
            </Button>
          </div>

          {!connected && (
            <p className="connect-message">
              Connect your wallet to allocate funds
            </p>
          )}
        </Card>
      </div>

      <Card variant="default">
        <h2>📊 How Treasury Works</h2>
        <div className="info-section">
          <div className="info-item">
            <h3>💰 Fund Collection</h3>
            <p>Treasury receives funds from token sales, investment returns, and external contributions.</p>
          </div>
          <div className="info-item">
            <h3>📈 Investment Allocation</h3>
            <p>DAO members vote on proposals. Approved proposals receive allocated funds from the treasury.</p>
          </div>
          <div className="info-item">
            <h3>💎 Dividend Distribution</h3>
            <p>Profits from successful investments are distributed to ACT token holders proportionally.</p>
          </div>
          <div className="info-item">
            <h3>🔒 Governance Control</h3>
            <p>All fund movements require DAO approval through the governance voting mechanism.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Treasury;
