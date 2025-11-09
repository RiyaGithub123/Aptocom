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
  const { actBalance, aptBalance, loading: balanceLoading, refetch } = useUserBalance();
  const [aptAmount, setAptAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    if (!connected || !account) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Wait for balance to load
    if (balanceLoading) {
      toast.info('Please wait while we fetch your balance...');
      return;
    }

    // Check if aptBalance is actually loaded
    if (aptBalance === null || aptBalance === undefined) {
      toast.error('Unable to fetch your balance. Please refresh and try again.');
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

  const availableForPurchase = (aptBalance !== null && aptBalance !== undefined) 
    ? Math.max(0, aptBalance - GAS_RESERVE) 
    : 0;

  return (
    <div className="token-purchase page">
      <div className="page-header">
        <h1>Buy ACT Tokens</h1>
        <p className="subtitle">
          Purchase ACT tokens to participate in DAO governance and earn dividends from treasury profits.
        </p>
      </div>

      {balanceLoading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          <p>Loading your wallet balance...</p>
        </div>
      )}

      {!balanceLoading && connected && aptBalance === 0 && (
        <Card variant="outlined" style={{ marginBottom: '1.5rem', padding: '1.5rem', background: 'rgba(255, 193, 7, 0.1)', borderColor: 'var(--warning-yellow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '2rem' }}>⚠️</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ color: 'var(--warning-yellow)', margin: '0 0 0.5rem 0' }}>
                Your wallet has no APT balance
              </h3>
              <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)' }}>
                You need APT (Aptos tokens) to purchase ACT tokens. Get free testnet APT from the faucet:
              </p>
              <a 
                href="https://faucet.testnet.aptoslabs.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  display: 'inline-block',
                  padding: '0.5rem 1rem',
                  background: 'var(--warning-yellow)',
                  color: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  fontWeight: 600,
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                🚰 Get Free Testnet APT
              </a>
              <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Your wallet address: <code style={{ background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>{account?.address}</code>
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="purchase-container">
        <Card variant="default">
          <div className="purchase-form">
            <div className="balance-info">
              <div className="balance-item">
                <span className="label">Your APT Balance</span>
                <span className="value" style={{ color: aptBalance === 0 ? 'var(--warning-yellow)' : 'inherit' }}>
                  {balanceLoading ? '...' : (aptBalance?.toFixed(4) || '0.0000')}
                  {!balanceLoading && aptBalance === 0 && ' ⚠️'}
                </span>
              </div>
              <div className="balance-item">
                <span className="label">Available for Purchase</span>
                <span className="value" style={{ color: availableForPurchase > 0 ? 'var(--primary-green)' : 'var(--text-muted)' }}>
                  {balanceLoading ? '...' : `${availableForPurchase.toFixed(4)} APT`}
                </span>
                <span className="hint" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ({GAS_RESERVE} APT reserved for gas)
                </span>
              </div>
              <div className="balance-item">
                <span className="label">Your ACT Balance</span>
                <span className="value">
                  {balanceLoading ? '...' : (actBalance?.toFixed(2) || '0.00')}
                </span>
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
                disabled={loading || !connected || balanceLoading || !aptAmount || parseFloat(aptAmount) <= 0 || aptBalance === 0}
              >
                {loading ? 'Processing Transaction...' : 
                 balanceLoading ? 'Loading Balance...' :
                 !connected ? 'Connect Wallet First' :
                 aptBalance === 0 ? '⚠️ Get APT from Faucet First' :
                 'Buy ACT Tokens'}
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
