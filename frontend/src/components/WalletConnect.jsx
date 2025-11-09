/**
 * Wallet Connect Component
 * 
 * Modal component for selecting and connecting Aptos wallets (Petra, Martian).
 * Handles wallet connection, disconnection, and error states.
 */

import React, { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { FaTimes, FaWallet } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Button from './Button';
import './WalletConnect.css';

const WalletConnect = ({ isOpen, onClose }) => {
  const { connect, wallets, connected } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);

  // Filter to only show wallets that are actually installed
  const installedWallets = wallets.filter(wallet => {
    // Check if wallet is actually available in the browser
    if (wallet.name === 'Petra') {
      return typeof window !== 'undefined' && window.aptos;
    }
    if (wallet.name === 'Martian') {
      return typeof window !== 'undefined' && window.martian;
    }
    // For other wallets, check if readyState is installed
    return wallet.readyState === 'Installed';
  });

  const handleConnect = async (walletName) => {
    try {
      setIsConnecting(true);
      
      // Double check wallet is actually installed before connecting
      const wallet = installedWallets.find(w => w.name === walletName);
      if (!wallet) {
        toast.error(`${walletName} wallet is not installed. Please install it first.`);
        setIsConnecting(false);
        return;
      }

      await connect(walletName);
      toast.success(`Connected to ${walletName}`);
      onClose();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      
      // Check if error is because wallet is not installed
      if (error.message && error.message.includes('not installed')) {
        toast.error(`${walletName} wallet is not installed. Please install the browser extension first.`);
      } else {
        toast.error(`Failed to connect to ${walletName}. Please try again.`);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="wallet-modal-overlay" onClick={onClose}>
      <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wallet-modal-header">
          <h2>
            <FaWallet className="wallet-icon" />
            Connect Wallet
          </h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="wallet-modal-body">
          <p className="wallet-modal-description">
            Connect your Aptos wallet to access AptoCom DAO
          </p>

          <div className="wallet-list">
            {installedWallets.map((wallet) => (
              <button
                key={wallet.name}
                className="wallet-item"
                onClick={() => handleConnect(wallet.name)}
                disabled={isConnecting}
              >
                {wallet.icon && (
                  <img 
                    src={wallet.icon} 
                    alt={wallet.name} 
                    className="wallet-logo"
                  />
                )}
                <div className="wallet-info">
                  <h3>{wallet.name}</h3>
                  <p className="wallet-status">✓ Installed</p>
                </div>
              </button>
            ))}
          </div>

          {installedWallets.length === 0 && (
            <div className="no-wallets">
              <p>No Aptos wallets detected.</p>
              <p>Please install Petra or Martian wallet extension.</p>
              <div className="wallet-links">
                <a 
                  href="https://petra.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="small">
                    Install Petra
                  </Button>
                </a>
                <a 
                  href="https://martianwallet.xyz/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="small">
                    Install Martian
                  </Button>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletConnect;
