import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { FaBars, FaWallet, FaSignOutAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Button from './Button';
import WalletConnect from './WalletConnect';
import { formatAddress } from '../services/aptosClient';
import './Navbar.css';

const Navbar = ({ toggleSidebar }) => {
  const { connected, account, disconnect } = useWallet();
  const [isWalletModalOpen, setIsWalletModalOpen] = React.useState(false);

  const handleConnect = () => {
    setIsWalletModalOpen(true);
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast.success('Wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast.error('Failed to disconnect wallet');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <button className="navbar-menu-btn" onClick={toggleSidebar}>
            <FaBars />
          </button>
          
          <Link to="/" className="navbar-logo">
            <span className="logo-aptocom">Apto</span>
            <span className="logo-com">Com</span>
          </Link>
        </div>

        <div className="navbar-right">
          {connected && account ? (
            <div className="wallet-connected">
              <div className="wallet-info">
                <FaWallet className="wallet-icon" />
                <span className="wallet-address">{formatAddress(account.address)}</span>
              </div>
              <button 
                className="disconnect-btn" 
                onClick={handleDisconnect}
                title="Disconnect Wallet"
              >
                <FaSignOutAlt />
              </button>
            </div>
          ) : (
            <Button variant="secondary" size="medium" onClick={handleConnect}>
              <FaWallet /> Connect Wallet
            </Button>
          )}
        </div>
      </div>

      <WalletConnect 
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </nav>
  );
};

export default Navbar;
