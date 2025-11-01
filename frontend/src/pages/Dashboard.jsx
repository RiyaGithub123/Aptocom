import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { FaCoins, FaUniversity, FaFileAlt, FaChartLine } from 'react-icons/fa';
import Card from '../components/Card';
import Button from '../components/Button';
import './Dashboard.css';

// Hooks & Services
import useUserBalance from '../hooks/useUserBalance';
import useTreasuryBalance from '../hooks/useTreasuryBalance';
import useAnalytics from '../hooks/useAnalytics';
import useProposals from '../hooks/useProposals';

const Dashboard = () => {
  const navigate = useNavigate();
  const { connected } = useWallet();
  const { actBalance, aptBalance, loading: userLoading } = useUserBalance();
  const { balance: treasuryBalance, loading: treasuryLoading } = useTreasuryBalance();
  const { analytics, loading: analyticsLoading } = useAnalytics();
  const { proposals, loading: proposalsLoading } = useProposals({}, true);

  const [votingPower, setVotingPower] = useState('0');

  useEffect(() => {
    // Compute voting power as user's ACT divided by total supply
    try {
      const totalSupply = analytics?.totalACTSupply || analytics?.totalSupply || 1000000; // Default 1M
      if (actBalance && actBalance > 0) {
        const power = ((actBalance / totalSupply) * 100).toFixed(4);
        setVotingPower(power);
      } else {
        setVotingPower('0');
      }
    } catch {
      setVotingPower('0');
    }
  }, [analytics, actBalance]);

  const activeProposalsCount = () => {
    if (!proposals || !Array.isArray(proposals) || proposals.length === 0) return 0;
    return proposals.filter(p => 
      (p.status || '').toLowerCase() === 'active' || 
      (p.status || '').toLowerCase() === 'pending'
    ).length;
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="dashboard-subtitle">
          Welcome to AptoCom - AI-Powered Autonomous DAO
        </p>
      </div>

      <div className="dashboard-stats">
        <Card variant="default" hover>
          <div className="stat-card">
            <div className="stat-icon" style={{ color: 'var(--primary-purple)' }}>
              <FaCoins />
            </div>
            <h3>ACT Balance</h3>
            <p className="stat-value">
              {userLoading ? '...' : (actBalance?.toFixed(2) || '0.00')}
            </p>
            <p className="stat-label">ACT Tokens</p>
          </div>
        </Card>

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
            <div className="stat-icon" style={{ color: 'var(--primary-yellow)' }}>
              <FaFileAlt />
            </div>
            <h3>Active Proposals</h3>
            <p className="stat-value">
              {proposalsLoading ? '...' : activeProposalsCount()}
            </p>
            <p className="stat-label">Proposals</p>
          </div>
        </Card>

        <Card variant="default" hover>
          <div className="stat-card">
            <div className="stat-icon" style={{ color: 'var(--primary-orange)' }}>
              <FaChartLine />
            </div>
            <h3>Voting Power</h3>
            <p className="stat-value">
              {analyticsLoading || userLoading ? '...' : `${votingPower}%`}
            </p>
            <p className="stat-label">of Total Supply</p>
          </div>
        </Card>
      </div>

      {!connected && (
        <Card variant="warning" style={{ marginBottom: '2rem' }}>
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <h3>⚠️ Wallet Not Connected</h3>
            <p>Connect your wallet to view your balances and participate in governance.</p>
          </div>
        </Card>
      )}

      <div className="dashboard-actions">
        <Card variant="outlined" neonBorder hover>
          <div className="action-card">
            <h3>🚀 Get Started</h3>
            <p>Purchase ACT tokens to participate in DAO governance and earn dividends from treasury profits.</p>
            <Button 
              variant="secondary" 
              size="large" 
              fullWidth 
              onClick={() => navigate('/token-purchase')}
            >
              Buy ACT Tokens
            </Button>
          </div>
        </Card>

        <Card variant="success" hover>
          <div className="action-card">
            <h3>💡 Create Proposal</h3>
            <p>Submit your investment proposal for AI evaluation and community voting. Help grow the DAO.</p>
            <Button 
              variant="primary" 
              size="large" 
              fullWidth 
              onClick={() => navigate('/create-proposal')}
            >
              Create New Proposal
            </Button>
          </div>
        </Card>
      </div>

      <div className="dashboard-info">
        <Card>
          <h3>📊 About AptoCom DAO</h3>
          <p>
            AptoCom is an autonomous AI-powered DAO built on the Aptos blockchain. We leverage smart contracts
            and AI agents to manage treasury funds, evaluate investment proposals, and distribute dividends to ACT token holders.
          </p>
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(108, 72, 255, 0.1)', borderRadius: 'var(--radius-md)' }}>
            <strong>Key Features:</strong>
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', lineHeight: 1.8 }}>
              <li>AI-powered proposal evaluation with scoring</li>
              <li>Transparent on-chain governance and voting</li>
              <li>Automated dividend distribution to token holders</li>
              <li>Real-time treasury and analytics dashboard</li>
            </ul>
          </div>
        </Card>
      </div>

      {proposals && proposals.length > 0 && (
        <div className="dashboard-recent">
          <h2>Recent Proposals</h2>
          <div className="recent-proposals-list">
            {proposals.slice(0, 3).map((p, index) => (
              <Card key={p.id || index} variant="outlined" hover onClick={() => navigate(`/proposals/${p.id || index}`)}>
                <div style={{ cursor: 'pointer' }}>
                  <h4>{p.title || `Proposal #${p.id || index + 1}`}</h4>
                  <p className="muted-text" style={{ fontSize: '0.875rem', margin: '0.5rem 0' }}>
                    {p.summary || p.description?.slice(0, 100) || 'No description'}
                    {((p.description?.length || 0) > 100) && '...'}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                    <span style={{ fontSize: '0.813rem', color: 'var(--text-muted)' }}>
                      Status: <strong>{p.status || 'Pending'}</strong>
                    </span>
                    <span style={{ fontSize: '0.813rem', color: 'var(--primary-green)' }}>
                      View →
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
