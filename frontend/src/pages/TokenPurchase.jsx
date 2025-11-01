import React, { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { toast } from 'react-toastify';
import Button from '../components/Button';
import Card from '../components/Card';
import tokenService from '../services/tokenService';
import useUserBalance from '../hooks/useUserBalance';
import { getExplorerUrl } from '../services/aptosClient';
import './TokenPurchase.css';

const DEFAULT_RATE = parseFloat(import.meta.env.VITE_ACT_EXCHANGE_RATE || '100'); // ACT per 1 APT
const GAS_RESERVE = 0.05; // Reserve APT for transaction gas fees

const TokenPurchase = () => {
  const { account, connected } = useWallet();
  const { actBalance, aptBalance, refetch } = useUserBalance();
  const [aptAmount, setAptAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    if (!connected || !account) {
      toast.error('Please connect your wallet first');
      return;
    }

    const amountNum = parseFloat(aptAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Enter a valid APT amount');
      return;
    }

    // Check balance with gas reserve
    const availableBalance = aptBalance - GAS_RESERVE;
    if (amountNum > availableBalance) {
      toast.error(`Insufficient APT balance. Keep ${GAS_RESERVE} APT for gas fees. Available: ${availableBalance.toFixed(4)} APT`);
      return;
    }

    if (availableBalance < GAS_RESERVE) {
      toast.error(`You need at least ${GAS_RESERVE} APT for gas fees. Please get more APT from the faucet.`);
      return;
    }

    try {
      setLoading(true);
      const wallet = window.aptos || { account, signAndSubmitTransaction: window.aptos?.signAndSubmitTransaction };
      const result = await tokenService.mintACT(wallet, amountNum);
      
      const explorerUrl = getExplorerUrl(result.hash);
      toast.success(
        <div>
          <div>Purchase successful!</div>
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-green)', textDecoration: 'underline' }}>
            View Transaction
          </a>
        </div>,
        { autoClose: 10000 }
      );
      
      setAptAmount('');
      // Refetch balances after 2 seconds
      setTimeout(() => refetch(), 2000);
    } catch (err) {
      console.error('Purchase error:', err);
      toast.error(err.message || 'Purchase failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const estimatedACT = () => {
    const a = parseFloat(aptAmount);
    if (isNaN(a) || a <= 0) return '0';
    return (a * DEFAULT_RATE).toFixed(2);
  };

  const availableForPurchase = aptBalance ? Math.max(0, aptBalance - GAS_RESERVE) : 0;

  return (
    <div className="token-purchase page">
      <div className="page-header">
        <h1>Buy ACT Tokens</h1>
        <p className="subtitle">
          Purchase ACT tokens to participate in DAO governance and earn dividends from treasury profits.
        </p>
      </div>

      <div className="purchase-container">
        <Card variant="default">
          <div className="purchase-form">
            <div className="balance-info">
              <div className="balance-item">
                <span className="label">Your APT Balance</span>
                <span className="value">{aptBalance?.toFixed(4) || '0.0000'}</span>
              </div>
              <div className="balance-item">
                <span className="label">Available for Purchase</span>
                <span className="value" style={{ color: 'var(--primary-green)' }}>
                  {availableForPurchase.toFixed(4)} APT
                </span>
                <span className="hint" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ({GAS_RESERVE} APT reserved for gas)
                </span>
              </div>
              <div className="balance-item">
                <span className="label">Your ACT Balance</span>
                <span className="value">{actBalance?.toFixed(2) || '0.00'}</span>
              </div>
            </div>

            <div className="exchange-rate">
              <div className="rate-label">Exchange Rate</div>
              <div className="rate-value">1 APT = {DEFAULT_RATE} ACT</div>
            </div>

            <label>Amount of APT to Spend</label>
            <input
              type="number"
              min="0"
              step="0.0001"
              max={availableForPurchase}
              value={aptAmount}
              onChange={(e) => setAptAmount(e.target.value)}
              placeholder="0.0000"
              disabled={loading || !connected}
            />

            <div className="estimate">
              <strong>You will receive</strong>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-green)', textShadow: '0 0 20px rgba(0, 255, 148, 0.5)' }}>
                {estimatedACT()} ACT
              </div>
            </div>

            <div className="actions">
              <Button 
                variant="secondary" 
                size="large" 
                fullWidth
                onClick={handleBuy} 
                disabled={loading || !connected || !aptAmount || parseFloat(aptAmount) <= 0}
              >
                {loading ? 'Processing Transaction...' : connected ? 'Buy ACT Tokens' : 'Connect Wallet First'}
              </Button>
            </div>

            {!connected && (
              <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Please connect your wallet to purchase ACT tokens
              </p>
            )}
          </div>
        </Card>

        <div className="transaction-history">
          <h2>How It Works</h2>
          <Card variant="outlined">
            <ol style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <li>Enter the amount of APT you want to spend</li>
              <li>Review the exchange rate and estimated ACT tokens</li>
              <li>Click "Buy ACT Tokens" and approve the transaction in your wallet</li>
              <li>Wait for transaction confirmation (usually 5-10 seconds)</li>
              <li>Your ACT balance will update automatically</li>
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TokenPurchase;
