import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { toast } from 'react-toastify';
import Card from '../components/Card';
import Button from '../components/Button';
import governanceService from '../services/governanceService';
import api from '../services/api';
import { getExplorerUrl } from '../services/aptosClient';
import './CreateProposal.css';

const CreateProposal = () => {
  const navigate = useNavigate();
  const { account, connected } = useWallet();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiEvaluating, setAiEvaluating] = useState(false);
  const [aiEvaluation, setAiEvaluation] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requestedAmount: '',
    sector: 'Technology',
    details: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAIEvaluation = async () => {
    if (!formData.title || !formData.description) {
      toast.error('Please fill in title and description first');
      return;
    }

    try {
      setAiEvaluating(true);
      const response = await api.evaluateProposal({
        title: formData.title,
        description: formData.description,
        requestedAmount: parseFloat(formData.requestedAmount) || 0,
        sector: formData.sector
      });

      setAiEvaluation(response.data);
      toast.success(`AI Evaluation Complete: ${response.data.score}/100`);
      setStep(2);
    } catch (err) {
      console.error('AI evaluation error:', err);
      toast.error('AI evaluation failed. You can still submit the proposal.');
    } finally {
      setAiEvaluating(false);
    }
  };

  const handleSubmit = async () => {
    if (!connected || !account) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!formData.title || !formData.description || !formData.requestedAmount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      // Create proposal on blockchain
      const wallet = window.aptos || { account, signAndSubmitTransaction: window.aptos?.signAndSubmitTransaction };
      const result = await governanceService.createProposal(
        wallet,
        formData.title,
        formData.description,
        parseFloat(formData.requestedAmount)
      );

      // Submit to backend with AI evaluation
      await api.createProposal({
        ...formData,
        requestedAmount: parseFloat(formData.requestedAmount),
        submitter: account.address,
        aiEvaluation: aiEvaluation || undefined,
        transactionHash: result.hash
      });

      const explorerUrl = getExplorerUrl(result.hash);
      toast.success(
        <div>
          <div>Proposal created successfully!</div>
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-green)', textDecoration: 'underline' }}>
            View Transaction
          </a>
        </div>,
        { autoClose: 10000 }
      );

      setTimeout(() => navigate('/proposals'), 2000);
    } catch (err) {
      console.error('Proposal creation error:', err);
      toast.error(err.message || 'Failed to create proposal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-proposal page">
      <div className="page-header">
        <h1>Create New Proposal</h1>
        <p className="subtitle">
          Submit your investment proposal for DAO consideration. AI will evaluate feasibility and risks.
        </p>
      </div>

      <div className="proposal-steps">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">Proposal Details</span>
        </div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">AI Evaluation</span>
        </div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>
          <span className="step-number">3</span>
          <span className="step-label">Review & Submit</span>
        </div>
      </div>

      {step === 1 && (
        <Card variant="default">
          <div className="form-section">
            <h2>📝 Proposal Information</h2>
            
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Investment in Renewable Energy Startup"
                maxLength={100}
                required
              />
              <span className="char-count">{formData.title.length}/100</span>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the investment opportunity, business model, market analysis, and expected returns..."
                rows={8}
                maxLength={4000}
                required
              />
              <span className="char-count">{formData.description.length}/4000</span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="requestedAmount">Requested Amount (APT) *</label>
                <input
                  type="number"
                  id="requestedAmount"
                  name="requestedAmount"
                  value={formData.requestedAmount}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="sector">Sector *</label>
                <select
                  id="sector"
                  name="sector"
                  value={formData.sector}
                  onChange={handleChange}
                  required
                >
                  <option value="Technology">Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Finance">Finance</option>
                  <option value="Energy">Energy</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Education">Education</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="details">Additional Details (Optional)</label>
              <textarea
                id="details"
                name="details"
                value={formData.details}
                onChange={handleChange}
                placeholder="Team background, timeline, milestones, exit strategy..."
                rows={4}
                maxLength={5000}
              />
              <span className="char-count">{formData.details.length}/5000</span>
            </div>

            <div className="form-actions">
              <Button variant="ghost" onClick={() => navigate('/proposals')}>
                Cancel
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleAIEvaluation}
                disabled={aiEvaluating || !formData.title || !formData.description || !formData.requestedAmount}
              >
                {aiEvaluating ? 'Evaluating with AI...' : '🤖 Get AI Evaluation'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {step === 2 && aiEvaluation && (
        <div className="evaluation-step">
          <Card variant={aiEvaluation.score >= 70 ? 'success' : aiEvaluation.score >= 40 ? 'warning' : 'danger'}>
            <div className="ai-evaluation-result">
              <h2>🤖 AI Evaluation Results</h2>
              
              <div className="ai-score-display">
                <div className="score-circle" style={{
                  background: `conic-gradient(${
                    aiEvaluation.score >= 70 ? 'var(--primary-green)' :
                    aiEvaluation.score >= 40 ? 'var(--primary-yellow)' :
                    'var(--status-danger)'
                  } ${aiEvaluation.score * 3.6}deg, rgba(255,255,255,0.1) 0deg)`
                }}>
                  <div className="score-inner">
                    <span className="score-value">{aiEvaluation.score}</span>
                    <span className="score-max">/100</span>
                  </div>
                </div>
                <div className="score-label">
                  {aiEvaluation.score >= 70 ? '✅ Highly Recommended' :
                   aiEvaluation.score >= 40 ? '⚠️ Moderate Risk' :
                   '❌ High Risk'}
                </div>
              </div>

              <div className="ai-analysis-section">
                <h3>📊 Analysis</h3>
                <p>{aiEvaluation.analysis}</p>
              </div>

              {aiEvaluation.risks && aiEvaluation.risks.length > 0 && (
                <div className="ai-risks-section">
                  <h3>⚠️ Identified Risks</h3>
                  <ul>
                    {aiEvaluation.risks.map((risk, i) => (
                      <li key={i}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiEvaluation.recommendations && aiEvaluation.recommendations.length > 0 && (
                <div className="ai-recommendations-section">
                  <h3>💡 Recommendations</h3>
                  <ul>
                    {aiEvaluation.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>

          <div className="form-actions" style={{ marginTop: '2rem' }}>
            <Button variant="ghost" onClick={() => setStep(1)}>
              ← Back to Edit
            </Button>
            <Button variant="primary" onClick={() => setStep(3)}>
              Continue to Submit →
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="review-step">
          <Card variant="outlined">
            <h2>📋 Review Your Proposal</h2>
            
            <div className="review-section">
              <div className="review-item">
                <span className="review-label">Title</span>
                <span className="review-value">{formData.title}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Description</span>
                <span className="review-value">{formData.description}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Requested Amount</span>
                <span className="review-value">{formData.requestedAmount} APT</span>
              </div>
              <div className="review-item">
                <span className="review-label">Sector</span>
                <span className="review-value">{formData.sector}</span>
              </div>
              {aiEvaluation && (
                <div className="review-item">
                  <span className="review-label">AI Score</span>
                  <span className="review-value" style={{
                    color: aiEvaluation.score >= 70 ? 'var(--primary-green)' :
                           aiEvaluation.score >= 40 ? 'var(--primary-yellow)' :
                           'var(--status-danger)'
                  }}>
                    {aiEvaluation.score}/100
                  </span>
                </div>
              )}
            </div>

            {!connected && (
              <Card variant="warning" style={{ marginTop: '1rem' }}>
                <p>⚠️ Please connect your wallet to submit the proposal</p>
              </Card>
            )}
          </Card>

          <div className="form-actions" style={{ marginTop: '2rem' }}>
            <Button variant="ghost" onClick={() => setStep(aiEvaluation ? 2 : 1)}>
              ← Back
            </Button>
            <Button 
              variant="success" 
              size="large"
              onClick={handleSubmit}
              disabled={loading || !connected}
            >
              {loading ? 'Submitting to Blockchain...' : '🚀 Submit Proposal'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateProposal;
