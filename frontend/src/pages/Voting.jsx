import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { toast } from 'react-toastify';
import { FaCheckCircle, FaTimesCircle, FaClock, FaChartBar, FaVoteYea } from 'react-icons/fa';
import Card from '../components/Card';
import Button from '../components/Button';
import useProposals from '../hooks/useProposals';
import useUserBalance from '../hooks/useUserBalance';
import governanceService from '../services/governanceService';
import { getExplorerUrl } from '../services/aptosClient';
import './Voting.css';

const Voting = () => {
  const { account, connected } = useWallet();
  const { proposals, loading, refetch } = useProposals();
  const { actBalance } = useUserBalance();
  const [voting, setVoting] = useState(null);
  const [filter, setFilter] = useState('active');
  const [sortBy, setSortBy] = useState('newest');

  // Filter and sort proposals
  const getFilteredProposals = () => {
    if (!proposals || proposals.length === 0) return [];
    
    let filtered = proposals;
    
    // Apply status filter
    if (filter === 'active') {
      filtered = filtered.filter(p => 
        (p.status || '').toLowerCase() === 'active' || 
        (p.status || '').toLowerCase() === 'pending'
      );
    } else if (filter === 'passed') {
      filtered = filtered.filter(p => 
        (p.status || '').toLowerCase() === 'approved' || 
        (p.status || '').toLowerCase() === 'executed'
      );
    } else if (filter === 'rejected') {
      filtered = filtered.filter(p => (p.status || '').toLowerCase() === 'rejected');
    }
    
    // Apply sorting
    if (sortBy === 'newest') {
      filtered = [...filtered].sort((a, b) => 
        new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt)
      );
    } else if (sortBy === 'oldest') {
      filtered = [...filtered].sort((a, b) => 
        new Date(a.submittedAt || a.createdAt) - new Date(b.submittedAt || b.createdAt)
      );
    } else if (sortBy === 'amount') {
      filtered = [...filtered].sort((a, b) => 
        (b.investmentDetails?.requestedAmount || 0) - (a.investmentDetails?.requestedAmount || 0)
      );
    } else if (sortBy === 'score') {
      filtered = [...filtered].sort((a, b) => 
        (b.aiEvaluation?.overallScore || 0) - (a.aiEvaluation?.overallScore || 0)
      );
    }
    
    return filtered;
  };

  const handleVote = async (proposalId, support) => {
    if (!connected || !account) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!actBalance || actBalance <= 0) {
      toast.error('You need ACT tokens to vote');
      return;
    }

    try {
      setVoting(proposalId);
      const wallet = window.aptos || { account, signAndSubmitTransaction: window.aptos?.signAndSubmitTransaction };
      const result = await governanceService.vote(wallet, proposalId, support);
      
      const explorerUrl = getExplorerUrl(result.hash);
      toast.success(
        <div>
          <div>Vote cast successfully!</div>
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-green)', textDecoration: 'underline' }}>
            View Transaction
          </a>
        </div>,
        { autoClose: 10000 }
      );
      
      setTimeout(() => refetch(), 2000);
    } catch (err) {
      console.error('Vote error:', err);
      toast.error(err.message || 'Failed to cast vote');
    } finally {
      setVoting(null);
    }
  };

  const getStatusIcon = (status) => {
    const statusLower = (status || 'pending').toLowerCase();
    switch (statusLower) {
      case 'approved':
      case 'executed':
        return <FaCheckCircle style={{ color: 'var(--primary-green)' }} />;
      case 'rejected':
        return <FaTimesCircle style={{ color: 'var(--status-danger)' }} />;
      case 'active':
      case 'pending':
        return <FaClock style={{ color: 'var(--primary-yellow)' }} />;
      default:
        return <FaClock style={{ color: 'var(--text-muted)' }} />;
    }
  };

  const getStatusVariant = (status) => {
    const statusLower = (status || 'pending').toLowerCase();
    switch (statusLower) {
      case 'approved':
      case 'executed':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'active':
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const calculateVotePercentage = (proposal) => {
    const votesFor = proposal.votingResults?.votesFor || proposal.votesFor || 0;
    const votesAgainst = proposal.votingResults?.votesAgainst || proposal.votesAgainst || 0;
    const total = votesFor + votesAgainst;
    
    if (total === 0) return { forPercent: 0, againstPercent: 0 };
    
    return {
      forPercent: (votesFor / total * 100).toFixed(1),
      againstPercent: (votesAgainst / total * 100).toFixed(1)
    };
  };

  const filteredProposals = getFilteredProposals();

  return (
    <div className="voting page">
      <div className="page-header">
        <h1><FaVoteYea /> Active Voting</h1>
        <p className="subtitle">
          Cast your votes on proposals using your ACT token voting power. Your voice shapes the future of the DAO.
        </p>
      </div>

      {/* Voting Power Card */}
      <Card variant="outlined" className="voting-power-card">
        <div className="voting-power-content">
          <div className="voting-power-icon">
            <FaChartBar />
          </div>
          <div className="voting-power-info">
            <h3>Your Voting Power</h3>
            <div className="voting-power-stats">
              <div className="stat">
                <span className="stat-label">ACT Balance</span>
                <span className="stat-value">{actBalance ? actBalance.toFixed(2) : '0.00'} ACT</span>
              </div>
              <div className="stat">
                <span className="stat-label">Status</span>
                <span className={`stat-value ${connected ? 'connected' : 'disconnected'}`}>
                  {connected ? '✓ Connected' : '✗ Not Connected'}
                </span>
              </div>
            </div>
          </div>
        </div>
        {!connected && (
          <div className="voting-power-warning">
            ⚠️ Connect your wallet to participate in voting
          </div>
        )}
      </Card>

      {/* Filters and Sort */}
      <div className="voting-controls">
        <div className="filter-group">
          <label>Filter by Status:</label>
          <div className="filter-buttons">
            <Button 
              variant={filter === 'all' ? 'primary' : 'ghost'} 
              size="small"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button 
              variant={filter === 'active' ? 'primary' : 'ghost'} 
              size="small"
              onClick={() => setFilter('active')}
            >
              Active
            </Button>
            <Button 
              variant={filter === 'passed' ? 'primary' : 'ghost'} 
              size="small"
              onClick={() => setFilter('passed')}
            >
              Passed
            </Button>
            <Button 
              variant={filter === 'rejected' ? 'primary' : 'ghost'} 
              size="small"
              onClick={() => setFilter('rejected')}
            >
              Rejected
            </Button>
          </div>
        </div>

        <div className="sort-group">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount">Highest Amount</option>
            <option value="score">Highest AI Score</option>
          </select>
        </div>

        <Button variant="ghost" onClick={refetch} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Proposals List */}
      {loading ? (
        <div className="loading-skeleton">
          <p>Loading proposals...</p>
        </div>
      ) : filteredProposals.length === 0 ? (
        <Card variant="default">
          <div className="empty-state">
            <FaVoteYea style={{ fontSize: '4rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h2>No proposals found</h2>
            <p>Try adjusting your filters or check back later for new proposals.</p>
          </div>
        </Card>
      ) : (
        <div className="proposals-voting-list">
          {filteredProposals.map((proposal) => {
            const { forPercent, againstPercent } = calculateVotePercentage(proposal);
            const aiScore = proposal.aiEvaluation?.overallScore || 0;
            const isVoting = voting === proposal._id;

            return (
              <Card key={proposal._id} variant={getStatusVariant(proposal.status)} hover>
                <div className="proposal-voting-card">
                  {/* Header */}
                  <div className="proposal-voting-header">
                    <div className="proposal-voting-title">
                      <h3>
                        <Link to={`/proposals/${proposal._id}`}>
                          {proposal.title || 'Untitled Proposal'}
                        </Link>
                      </h3>
                      <div className="proposal-meta">
                        <span className="proposal-id">#{proposal.onChainProposalId || proposal._id?.slice(-6)}</span>
                        <span className="proposal-sector">{proposal.sector || 'General'}</span>
                        {getStatusIcon(proposal.status)}
                        <span className="proposal-status">{proposal.status || 'Pending'}</span>
                      </div>
                    </div>
                    <div className="proposal-voting-amount">
                      <span className="amount-label">Requested</span>
                      <span className="amount-value">
                        {proposal.investmentDetails?.requestedAmount || 0} APT
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="proposal-voting-description">
                    {proposal.description?.substring(0, 150) || 'No description provided'}
                    {proposal.description?.length > 150 && '...'}
                  </p>

                  {/* AI Score */}
                  {aiScore > 0 && (
                    <div className="proposal-ai-score">
                      <span className="ai-label">AI Evaluation:</span>
                      <div className="ai-score-bar">
                        <div 
                          className="ai-score-fill" 
                          style={{ 
                            width: `${aiScore}%`,
                            background: aiScore >= 80 ? 'var(--primary-green)' : 
                                       aiScore >= 60 ? 'var(--primary-yellow)' : 
                                       aiScore >= 40 ? 'var(--primary-orange)' : 
                                       'var(--status-danger)'
                          }}
                        />
                      </div>
                      <span className="ai-score-value">{aiScore}/100</span>
                    </div>
                  )}

                  {/* Voting Results */}
                  <div className="voting-results">
                    <div className="voting-bar">
                      <div 
                        className="voting-bar-for" 
                        style={{ width: `${forPercent}%` }}
                        title={`${forPercent}% For`}
                      />
                      <div 
                        className="voting-bar-against" 
                        style={{ width: `${againstPercent}%` }}
                        title={`${againstPercent}% Against`}
                      />
                    </div>
                    <div className="voting-stats">
                      <div className="voting-stat for">
                        <FaCheckCircle />
                        <span>{forPercent}% For ({proposal.votingResults?.votesFor || proposal.votesFor || 0})</span>
                      </div>
                      <div className="voting-stat against">
                        <FaTimesCircle />
                        <span>{againstPercent}% Against ({proposal.votingResults?.votesAgainst || proposal.votesAgainst || 0})</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="proposal-voting-actions">
                    <Link to={`/proposals/${proposal._id}`}>
                      <Button variant="ghost" size="small">
                        View Details
                      </Button>
                    </Link>
                    
                    {proposal.status === 'Active' && (
                      <>
                        <Button 
                          variant="secondary" 
                          size="small"
                          onClick={() => handleVote(proposal._id, true)}
                          disabled={!connected || isVoting || !actBalance || actBalance <= 0}
                        >
                          {isVoting ? 'Voting...' : '✓ Vote For'}
                        </Button>
                        <Button 
                          variant="danger" 
                          size="small"
                          onClick={() => handleVote(proposal._id, false)}
                          disabled={!connected || isVoting || !actBalance || actBalance <= 0}
                        >
                          {isVoting ? 'Voting...' : '✗ Vote Against'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Voting;
