import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { toast } from 'react-toastify';
import { FaCheckCircle, FaTimesCircle, FaClock, FaChartBar, FaRobot } from 'react-icons/fa';
import Card from '../components/Card';
import Button from '../components/Button';
import useProposalDetails from '../hooks/useProposalDetails';
import governanceService from '../services/governanceService';
import { getExplorerUrl } from '../services/aptosClient';
import './ProposalDetails.css';

const ProposalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { account, connected } = useWallet();
  const { proposal, loading, error, refetch } = useProposalDetails(id);
  const [voting, setVoting] = useState(false);
  const [executing, setExecuting] = useState(false);

  const handleVote = async (support) => {
    if (!connected || !account) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setVoting(true);
      const wallet = window.aptos || { account, signAndSubmitTransaction: window.aptos?.signAndSubmitTransaction };
      const result = await governanceService.vote(wallet, parseInt(id), support);
      
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
      setVoting(false);
    }
  };

  const handleExecute = async () => {
    if (!connected || !account) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setExecuting(true);
      const wallet = window.aptos || { account, signAndSubmitTransaction: window.aptos?.signAndSubmitTransaction };
      const result = await governanceService.executeProposal(wallet, parseInt(id));
      
      const explorerUrl = getExplorerUrl(result.hash);
      toast.success(
        <div>
          <div>Proposal executed successfully!</div>
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-green)', textDecoration: 'underline' }}>
            View Transaction
          </a>
        </div>,
        { autoClose: 10000 }
      );
      
      setTimeout(() => refetch(), 2000);
    } catch (err) {
      console.error('Execute error:', err);
      toast.error(err.message || 'Failed to execute proposal');
    } finally {
      setExecuting(false);
    }
  };

  const getStatusBadge = () => {
    if (!proposal) return null;
    const statusConfig = {
      pending: { color: 'var(--primary-yellow)', icon: FaClock, text: 'Pending' },
      active: { color: 'var(--primary-green)', icon: FaCheckCircle, text: 'Active' },
      approved: { color: 'var(--primary-green)', icon: FaCheckCircle, text: 'Approved' },
      rejected: { color: 'var(--status-danger)', icon: FaTimesCircle, text: 'Rejected' },
      executed: { color: 'var(--primary-purple)', icon: FaCheckCircle, text: 'Executed' }
    };
    
    const config = statusConfig[proposal.status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className="status-badge" style={{ color: config.color }}>
        <Icon style={{ marginRight: '0.5rem' }} />
        {config.text}
      </span>
    );
  };

  const getTotalVotes = () => {
    if (!proposal) return 0;
    return (proposal.votesFor || 0) + (proposal.votesAgainst || 0);
  };

  const getVotePercentage = (votes) => {
    const total = getTotalVotes();
    if (total === 0) return 0;
    return ((votes / total) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="proposal-details page">
        <div className="page-header">
          <h1>Loading proposal...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="proposal-details page">
        <div className="page-header">
          <h1>Error</h1>
        </div>
        <Card variant="danger">
          <p>{error}</p>
          <Button variant="ghost" onClick={() => navigate('/proposals')}>
            Back to Proposals
          </Button>
        </Card>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="proposal-details page">
        <div className="page-header">
          <h1>Proposal Not Found</h1>
        </div>
        <Card variant="warning">
          <p>The proposal you're looking for doesn't exist.</p>
          <Button variant="ghost" onClick={() => navigate('/proposals')}>
            Back to Proposals
          </Button>
        </Card>
      </div>
    );
  }

  const canVote = connected && proposal.status === 'active';
  const canExecute = connected && proposal.status === 'approved';

  return (
    <div className="proposal-details page">
      <div className="page-header">
        <div className="header-top">
          <Button variant="ghost" size="small" onClick={() => navigate('/proposals')}>
            ← Back to Proposals
          </Button>
          {getStatusBadge()}
        </div>
        <h1>{proposal.title}</h1>
        <p className="subtitle">
          Submitted by <span className="submitter">{proposal.submitter}</span>
        </p>
      </div>

      <div className="details-container">
        <div className="main-content">
          <Card variant="default">
            <h2>📋 Description</h2>
            <p className="description">{proposal.description}</p>
          </Card>

          {proposal.aiEvaluation && (
            <Card variant="outlined">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaRobot style={{ color: 'var(--primary-purple)' }} />
                AI Evaluation
              </h2>
              <div className="ai-section">
                <div className="ai-score">
                  <span className="label">AI Score</span>
                  <span className="score" style={{ 
                    color: proposal.aiEvaluation.score >= 70 ? 'var(--primary-green)' : 
                           proposal.aiEvaluation.score >= 40 ? 'var(--primary-yellow)' : 
                           'var(--status-danger)' 
                  }}>
                    {proposal.aiEvaluation.score}/100
                  </span>
                </div>
                <p className="ai-analysis">{proposal.aiEvaluation.analysis}</p>
                {proposal.aiEvaluation.risks && proposal.aiEvaluation.risks.length > 0 && (
                  <div className="ai-risks">
                    <strong>⚠️ Identified Risks:</strong>
                    <ul>
                      {proposal.aiEvaluation.risks.map((risk, i) => (
                        <li key={i}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          )}

          <Card variant="default">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaChartBar style={{ color: 'var(--primary-green)' }} />
              Voting Results
            </h2>
            <div className="voting-stats">
              <div className="vote-bar-container">
                <div className="vote-bar-labels">
                  <span className="for-label">For: {proposal.votesFor || 0} votes ({getVotePercentage(proposal.votesFor || 0)}%)</span>
                  <span className="against-label">Against: {proposal.votesAgainst || 0} votes ({getVotePercentage(proposal.votesAgainst || 0)}%)</span>
                </div>
                <div className="vote-bars">
                  <div className="vote-bar for-bar" style={{ width: `${getVotePercentage(proposal.votesFor || 0)}%` }}></div>
                  <div className="vote-bar against-bar" style={{ width: `${getVotePercentage(proposal.votesAgainst || 0)}%` }}></div>
                </div>
              </div>
              
              <div className="vote-actions">
                {!connected && (
                  <p className="vote-message">Connect your wallet to vote</p>
                )}
                {connected && proposal.status !== 'active' && (
                  <p className="vote-message">Voting is closed for this proposal</p>
                )}
                {canVote && (
                  <div className="vote-buttons">
                    <Button 
                      variant="success" 
                      onClick={() => handleVote(true)} 
                      disabled={voting}
                    >
                      {voting ? 'Casting Vote...' : '✓ Vote For'}
                    </Button>
                    <Button 
                      variant="danger" 
                      onClick={() => handleVote(false)} 
                      disabled={voting}
                    >
                      {voting ? 'Casting Vote...' : '✗ Vote Against'}
                    </Button>
                  </div>
                )}
                {canExecute && (
                  <Button 
                    variant="primary" 
                    size="large"
                    onClick={handleExecute} 
                    disabled={executing}
                  >
                    {executing ? 'Executing...' : '⚡ Execute Proposal'}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="sidebar-content">
          <Card variant="outlined">
            <h3>💰 Proposal Details</h3>
            <div className="detail-item">
              <span className="label">Requested Amount</span>
              <span className="value">{proposal.requestedAmount || 0} APT</span>
            </div>
            <div className="detail-item">
              <span className="label">Proposal ID</span>
              <span className="value">#{id}</span>
            </div>
            <div className="detail-item">
              <span className="label">Status</span>
              <span className="value">{proposal.status}</span>
            </div>
            {proposal.sector && (
              <div className="detail-item">
                <span className="label">Sector</span>
                <span className="value">{proposal.sector}</span>
              </div>
            )}
            {proposal.createdAt && (
              <div className="detail-item">
                <span className="label">Created</span>
                <span className="value">{new Date(proposal.createdAt).toLocaleDateString()}</span>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProposalDetails;
