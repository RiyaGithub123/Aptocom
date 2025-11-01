import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from 'petra-plugin-wallet-adapter';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';

// Pages
import Dashboard from './pages/Dashboard';
import TokenPurchase from './pages/TokenPurchase';
import Proposals from './pages/Proposals';
import ProposalDetails from './pages/ProposalDetails';
import CreateProposal from './pages/CreateProposal';
import Voting from './pages/Voting';
import Treasury from './pages/Treasury';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

// Styles
import './App.css';

// Configure supported wallets
const wallets = [new PetraWallet()];

function App() {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [error, setError] = React.useState(null);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Error boundary for wallet adapter
  React.useEffect(() => {
    const handleError = (error) => {
      console.error('App Error:', error);
      setError(error.message);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'white', backgroundColor: '#0A0E27' }}>
        <h1>Error Loading Application</h1>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }

  return (
    <AptosWalletAdapterProvider 
      plugins={wallets} 
      autoConnect={false}
      onError={(error) => {
        console.error('Wallet Adapter Error:', error);
      }}
    >
      <Router>
        <div className="app">
          <Navbar toggleSidebar={toggleSidebar} />
          
          <div className="app-container">
            <Sidebar isOpen={sidebarOpen} />
            
            <main className={`app-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
              <div className="app-content">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/token-purchase" element={<TokenPurchase />} />
                  <Route path="/proposals" element={<Proposals />} />
                  <Route path="/proposals/:id" element={<ProposalDetails />} />
                  <Route path="/create-proposal" element={<CreateProposal />} />
                  <Route path="/voting/:id" element={<Voting />} />
                  <Route path="/treasury" element={<Treasury />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </div>
              
              <Footer />
            </main>
          </div>

          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
          />
        </div>
      </Router>
    </AptosWalletAdapterProvider>
  );
}

export default App;
