# 🚀 AptoCom Complete Setup & Dependency Guide

**Last Updated**: November 2, 2025  
**Project**: AptoCom - AI-Powered DAO on Aptos Blockchain  
**Status**: Production-Ready on Testnet

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [System Requirements](#system-requirements)
3. [Dependencies Breakdown](#dependencies-breakdown)
4. [Blockchain Communication](#blockchain-communication)
5. [Installation Steps](#installation-steps)
6. [Environment Configuration](#environment-configuration)
7. [Running the Project](#running-the-project)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

**AptoCom** is a fully autonomous, AI-powered DAO built on Aptos blockchain with:
- **Smart Contracts**: 3 Move modules (ACT token, governance, treasury)
- **Backend API**: Node.js + Express with AI integration
- **Frontend**: React + Vite with wallet adapters
- **Blockchain**: Aptos Testnet (Chain ID: 2022)

**Deployed Contract Address**: `0x346a0fa67d42e63c5d713914fe46cb4ed38f011d21004122e3784b28437a1f3d`

---

## 💻 System Requirements

### Required Software

| Tool | Version | Purpose | Download |
|------|---------|---------|----------|
| **Node.js** | v20+ | JavaScript runtime | https://nodejs.org/ |
| **npm** | v10+ | Package manager | Comes with Node.js |
| **Git** | Latest | Version control | https://git-scm.com/ |
| **Aptos CLI** | Latest | Smart contract deployment | https://aptos.dev/tools/aptos-cli/install-cli/ |
| **VS Code** | Latest (Optional) | Code editor | https://code.visualstudio.com/ |
| **Move Extension** | Latest (Optional) | Move syntax support | Install from VS Code marketplace |

### Browser Extensions

| Extension | Purpose | Download |
|-----------|---------|----------|
| **Petra Wallet** | Aptos wallet for transactions | https://petra.app/ |
| **Martian Wallet** | Alternative Aptos wallet | https://martianwallet.xyz/ |

### Operating System
- ✅ Windows 10/11
- ✅ macOS 12+
- ✅ Linux (Ubuntu 20.04+)

---

## 📦 Dependencies Breakdown

### 1. Smart Contracts (Move)

**Location**: `sources/` directory  
**Build Output**: `build/aptocom/` directory

#### Framework Dependencies
```toml
[dependencies.AptosFramework]
git = "https://github.com/aptos-labs/aptos-core.git"
rev = "aptos-release-v1.19"
subdir = "aptos-move/framework/aptos-framework"
```

**Includes**:
- `AptosFramework` - Core Aptos functionality
- `AptosStdlib` - Standard library
- `MoveStdlib` - Move language stdlib

**Key Modules Used**:
- `aptos_framework::fungible_asset` - For ACT token (FA standard)
- `aptos_framework::coin` - For APT handling
- `aptos_framework::account` - Account management
- `aptos_framework::event` - On-chain events
- `aptos_framework::timestamp` - Blockchain time

#### Compilation
```bash
aptos move compile --save-metadata
aptos move test
```

**Build Status**: ✅ Compiled (bytecode version 8, compiler V2_0)  
**Test Results**: 32/32 tests passing

---

### 2. Backend API (Node.js)

**Location**: `aptocom-ai/` directory  
**Package Manager**: npm  
**Entry Point**: `src/server.js`

#### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@aptos-labs/ts-sdk` | ^5.1.1 | **Blockchain communication** - Aptos TypeScript SDK for transactions |
| `express` | ^5.1.0 | Web server framework |
| `axios` | ^1.13.1 | HTTP client for external APIs |
| `cors` | ^2.8.5 | Cross-origin resource sharing |
| `dotenv` | ^17.2.3 | Environment variable management |
| `body-parser` | ^2.2.0 | Request body parsing |
| `groq-sdk` | ^0.34.0 | **AI integration** - Groq API for proposal evaluation |
| `nft.storage` | ^7.2.0 | **IPFS integration** - Decentralized file storage |
| `ipfs-http-client` | ^60.0.1 | IPFS HTTP client |
| `mongodb` | ^6.20.0 | MongoDB native driver |
| `mongoose` | ^8.19.2 | **Database ORM** - MongoDB object modeling |
| `multer` | ^2.0.2 | File upload handling |

#### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@jest/globals` | ^30.2.0 | Testing framework |
| `jest` | ^30.2.0 | Test runner |
| `supertest` | ^7.1.4 | HTTP testing |

#### Key Backend Services

1. **aptosService.js** (900 lines)
   - Blockchain transaction handling
   - Smart contract interaction
   - Wallet management
   - Gas estimation

2. **aiService.js** (1,040 lines)
   - Groq API integration
   - Proposal evaluation
   - Scoring algorithm

3. **ipfsService.js** (820 lines)
   - Document upload to IPFS
   - Content retrieval
   - Pin management

#### Installation
```bash
cd aptocom-ai
npm install
```

**Dependencies Count**: 282 packages installed

---

### 3. Frontend (React + Vite)

**Location**: `frontend/` directory  
**Build Tool**: Vite  
**Package Manager**: npm

#### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.2.0 | UI library |
| `react-dom` | ^18.2.0 | React DOM rendering |
| `react-router-dom` | ^6.20.0 | Client-side routing |
| `@aptos-labs/ts-sdk` | ^1.8.0 | **Blockchain SDK** - Aptos TypeScript SDK |
| `@aptos-labs/wallet-adapter-react` | ^3.0.0 | **Wallet integration** - React hooks |
| `@aptos-labs/wallet-adapter-ant-design` | ^2.0.0 | **Wallet UI** - Ant Design components |
| `petra-plugin-wallet-adapter` | ^0.4.0 | **Petra wallet** - Specific adapter |
| `axios` | ^1.6.2 | API client |
| `recharts` | ^2.10.3 | Data visualization |
| `framer-motion` | ^10.16.16 | Animations |
| `react-icons` | ^4.12.0 | Icon library |
| `react-toastify` | ^9.1.3 | Toast notifications |

#### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@vitejs/plugin-react` | ^4.2.1 | Vite React plugin |
| `vite` | ^5.0.8 | Build tool |
| `eslint` | ^8.55.0 | Code linting |
| `eslint-plugin-react` | ^7.33.2 | React linting |
| `eslint-plugin-react-hooks` | ^4.6.0 | React hooks linting |

#### Installation
```bash
cd frontend
npm install
```

**Dependencies Count**: 540 packages installed

---

## 🔗 Blockchain Communication

### Aptos Network Configuration

**Network**: Aptos Testnet  
**Chain ID**: 2022  
**RPC Endpoint**: `https://fullnode.testnet.aptoslabs.com/v1`  
**Explorer**: https://explorer.aptoslabs.com/?network=testnet

### Contract Deployment

**Main Address**: `0x346a0fa67d42e63c5d713914fe46cb4ed38f011d21004122e3784b28437a1f3d`

**Modules**:
1. `aptocom::act_token` - ACT Fungible Asset token
2. `aptocom::governance` - Proposal and voting logic
3. `aptocom::treasury` - Fund management

### Backend → Blockchain Communication

**File**: `aptocom-ai/src/services/aptosService.js`

**Key Functions**:
```javascript
// Initialize Aptos client
const aptosConfig = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(aptosConfig);

// Service account for backend operations
const serviceAccount = Account.fromPrivateKey({ privateKey });

// Transaction submission
const transaction = await aptos.transaction.build.simple({
  sender: senderAddress,
  data: {
    function: `${contractAddress}::act_token::purchase`,
    functionArguments: [amount],
  },
});
```

**Capabilities**:
- ✅ Submit transactions
- ✅ Query on-chain data
- ✅ Estimate gas fees
- ✅ Wait for transaction confirmation
- ✅ Handle errors and retries

### Frontend → Blockchain Communication

**File**: `frontend/src/services/aptosClient.js`

**Key Functions**:
```javascript
// Initialize client
const config = new AptosConfig({ network: Network.TESTNET });
export const aptosClient = new Aptos(config);

// Get wallet from connected adapter
const wallet = useWallet();
const account = wallet.account;

// Submit transaction via wallet
const response = await wallet.signAndSubmitTransaction({
  data: {
    function: `${contractAddress}::act_token::purchase`,
    functionArguments: [aptAmount],
  },
});
```

**Wallet Adapters**:
- ✅ Petra Wallet
- ✅ Martian Wallet
- ✅ Multi-wallet support

**Capabilities**:
- ✅ Connect/disconnect wallet
- ✅ Get account info
- ✅ Query balances (APT, ACT)
- ✅ Submit transactions
- ✅ Listen to wallet events

### Token Standard

**ACT Token** uses Aptos **Fungible Asset (FA)** standard:
- Address: Same as contract (`0x346a0fa...`)
- Decimals: 8
- Exchange Rate: 1 APT = 100 ACT
- Functions: `purchase`, `transfer`, `mint`, `burn`, `balance_of`

### Gas & Fees

**Typical Gas Costs**:
- Token purchase: ~100-200 gas units
- Proposal creation: ~500-800 gas units
- Voting: ~100-150 gas units
- Proposal execution: ~300-500 gas units

**Gas Price**: 100 octas per unit (configurable)  
**Max Gas**: 10,000 units per transaction

---

## 🔧 Installation Steps

### Step 1: Clone Repository
```bash
git clone https://github.com/RiyaGithub123/Aptocom.git
cd Aptocom
```

### Step 2: Install Aptos CLI
```bash
# macOS/Linux
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3

# Windows (PowerShell)
iwr "https://aptos.dev/scripts/install_cli.py" -useb | py -

# Verify installation
aptos --version
```

### Step 3: Setup Wallet

**Option A: Petra Wallet (Recommended)**
1. Install [Petra browser extension](https://petra.app/)
2. Create new wallet or import existing
3. Switch to **Testnet** network
4. Request testnet APT from [Aptos Faucet](https://faucet.testnet.aptoslabs.com/)

**Option B: Martian Wallet**
1. Install [Martian browser extension](https://martianwallet.xyz/)
2. Follow same steps as Petra

### Step 4: Install Backend Dependencies
```bash
cd aptocom-ai
npm install
```

**Expected**: ~282 packages installed (~150 MB)

### Step 5: Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

**Expected**: ~540 packages installed (~300 MB)

### Step 6: Setup Environment Variables

**Backend** (`aptocom-ai/.env`):
```bash
cp .env.example .env
```

Edit `.env` and fill in:
```env
PORT=5000
APTOS_NETWORK=testnet
TOKEN_CONTRACT_ADDRESS=0x346a0fa67d42e63c5d713914fe46cb4ed38f011d21004122e3784b28437a1f3d
SERVICE_WALLET_PRIVATE_KEY=<your-backend-wallet-private-key>
GROQ_API_KEY=<get-from-https://console.groq.com>
MONGODB_URI=<get-from-https://cloud.mongodb.com>
NFT_STORAGE_API_KEY=<get-from-https://nft.storage>
```

**Frontend** (`frontend/.env`):
```bash
cp .env.example .env
```

Edit `.env` and fill in:
```env
VITE_BACKEND_URL=http://localhost:5000
VITE_APTOS_NETWORK=testnet
VITE_ACT_TOKEN_ADDRESS=0x346a0fa67d42e63c5d713914fe46cb4ed38f011d21004122e3784b28437a1f3d
```

---

## 🌍 Environment Configuration

### Required API Keys

#### 1. Groq API (AI Service)
- **Purpose**: AI-powered proposal evaluation
- **Get it**: https://console.groq.com/
- **Free Tier**: Yes (60 requests/minute)
- **Environment Variable**: `GROQ_API_KEY`

#### 2. MongoDB Atlas (Database)
- **Purpose**: Off-chain data storage (proposals, analytics)
- **Get it**: https://www.mongodb.com/atlas/database
- **Free Tier**: M0 cluster (512 MB)
- **Environment Variable**: `MONGODB_URI`

#### 3. nft.storage (IPFS)
- **Purpose**: Decentralized document storage
- **Get it**: https://nft.storage/
- **Free Tier**: Unlimited storage
- **Environment Variable**: `NFT_STORAGE_API_KEY`

#### 4. Service Wallet Private Key
- **Purpose**: Backend wallet for automated operations
- **How to get**: Export from Petra/Martian wallet OR create new with Aptos CLI
- **⚠️ CRITICAL**: Never commit to Git, keep secure
- **Environment Variable**: `SERVICE_WALLET_PRIVATE_KEY`

**Create Service Wallet with Aptos CLI**:
```bash
aptos init --network testnet
# Follow prompts, private key will be in .aptos/config.yaml
```

---

## ▶️ Running the Project

### Option 1: Development Mode (Both Servers)

**Terminal 1 - Backend**:
```bash
cd aptocom-ai
npm start
# Server runs on http://localhost:5000
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
# Server runs on http://localhost:3000 or http://localhost:5173
```

### Option 2: Health Check First

**Test Environment**:
```bash
cd aptocom-ai
npm run test
# Checks: MongoDB, Groq API, nft.storage, Aptos blockchain
```

**Expected Output**:
```
✅ MongoDB connection successful
✅ Groq AI service operational
✅ IPFS service (nft.storage) operational
✅ Aptos blockchain connection successful
```

### Option 3: Backend Only

**Start Backend**:
```bash
cd aptocom-ai
npm start
```

**Test Endpoints**:
```bash
# Health check
curl http://localhost:5000/api/health

# Get proposals
curl http://localhost:5000/api/proposals
```

### Option 4: Frontend Only (with Backend Running)

**Start Frontend**:
```bash
cd frontend
npm run dev
```

**Access Application**:
- Open browser: http://localhost:3000 (or the port Vite assigns)
- Connect wallet (Petra/Martian)
- Ensure wallet is on **Testnet**

---

## 🧪 Testing

### Smart Contract Tests

**Run All Tests**:
```bash
cd Aptocom
aptos move test
```

**Expected Output**:
```
Running Move unit tests
[ PASS ] 0x346a0fa67d42e63c5d713914fe46cb4ed38f011d21004122e3784b28437a1f3d::act_token::test_initialize
[ PASS ] 0x346a0fa67d42e63c5d713914fe46cb4ed38f011d21004122e3784b28437a1f3d::act_token::test_mint
... (32 tests total)
Test result: OK. Total tests: 32; passed: 32; failed: 0
```

**Test Coverage**:
- ACT Token: 11 tests
- Governance: 11 tests
- Treasury: 10 tests

### Backend Tests

**Run Backend Tests**:
```bash
cd aptocom-ai
npm run test
```

**Test Files**:
- `__tests__/unit/aiService.test.js`
- `__tests__/unit/aptosService.test.js`
- `__tests__/unit/ipfsService.test.js`
- `__tests__/integration/proposalAPI.test.js`

### Frontend Testing

**Manual Testing**:
1. Connect wallet
2. Buy ACT tokens
3. Create proposal
4. Vote on proposal
5. Check analytics

**Browser Console**:
```javascript
// Check if Aptos SDK loaded
console.log(window.aptos);

// Check wallet connection
console.log(await window.aptos.account());
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "Failed to connect to blockchain"

**Cause**: Aptos RPC endpoint unreachable  
**Solution**:
```bash
# Check Aptos network status
curl https://fullnode.testnet.aptoslabs.com/v1

# Try alternative RPC
# Update .env: APTOS_RPC_URL=https://aptos.testnet.suzuka.movementlabs.xyz/v1
```

#### 2. "Transaction failed: INSUFFICIENT_BALANCE"

**Cause**: Not enough APT for gas fees  
**Solution**:
```bash
# Get testnet APT from faucet
# Visit: https://faucet.testnet.aptoslabs.com/
# Paste your wallet address
# Request 1 APT
```

#### 3. "Module not found: @aptos-labs/ts-sdk"

**Cause**: Dependencies not installed  
**Solution**:
```bash
cd aptocom-ai  # or frontend
rm -rf node_modules package-lock.json
npm install
```

#### 4. "Wallet connection failed"

**Cause**: Wallet not on correct network  
**Solution**:
1. Open Petra/Martian wallet
2. Click network dropdown
3. Select **Testnet**
4. Refresh page

#### 5. "MongoDB connection timeout"

**Cause**: Invalid MongoDB URI or network issue  
**Solution**:
```bash
# Check MongoDB Atlas:
# 1. Database Access - User has correct permissions
# 2. Network Access - IP whitelist includes your IP (or 0.0.0.0/0 for all)
# 3. URI format: mongodb+srv://username:password@cluster.mongodb.net/aptocom
```

#### 6. "Groq API rate limit exceeded"

**Cause**: Too many AI evaluation requests  
**Solution**:
```bash
# Free tier limit: 60 requests/minute
# Wait 1 minute or upgrade plan
# Temporary: Comment out AI evaluation in proposalController.js
```

#### 7. "CORS error when calling backend"

**Cause**: Frontend URL not in CORS whitelist  
**Solution**:
```env
# In aptocom-ai/.env
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,http://localhost:5174
```

#### 8. "Cannot read property 'account' of undefined"

**Cause**: Wallet not connected  
**Solution**:
```javascript
// In frontend, always check:
const { connected, account } = useWallet();
if (!connected || !account) {
  // Show "Connect Wallet" message
  return;
}
```

#### 9. "Build folder missing or corrupted"

**Cause**: Smart contracts not compiled  
**Solution**:
```bash
cd Aptocom
aptos move clean
aptos move compile --save-metadata
# Check: build/aptocom/ should have bytecode_modules/, sources/, etc.
```

#### 10. "Port 5000 already in use"

**Cause**: Another process using port 5000  
**Solution**:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change port in aptocom-ai/.env
PORT=5001
```

---

## 📊 Dependency Summary

### Total Dependencies

| Component | Packages | Size | Time to Install |
|-----------|----------|------|-----------------|
| Backend | 282 | ~150 MB | ~2 min |
| Frontend | 540 | ~300 MB | ~3 min |
| **Total** | **822** | **~450 MB** | **~5 min** |

### Critical Dependencies for Blockchain Communication

**Backend**:
1. `@aptos-labs/ts-sdk` - Aptos blockchain interaction
2. `groq-sdk` - AI proposal evaluation
3. `nft.storage` - IPFS document storage
4. `mongoose` - MongoDB database

**Frontend**:
1. `@aptos-labs/ts-sdk` - Aptos blockchain client
2. `@aptos-labs/wallet-adapter-react` - Wallet connection
3. `@aptos-labs/wallet-adapter-ant-design` - Wallet UI
4. `petra-plugin-wallet-adapter` - Petra wallet support
5. `axios` - Backend API communication

### External Services Required

1. **Aptos Testnet RPC** - Free, public endpoint
2. **MongoDB Atlas** - Free M0 cluster
3. **Groq API** - Free tier (60 req/min)
4. **nft.storage** - Free unlimited
5. **Aptos Faucet** - Free testnet APT

---

## 🎯 Quick Start Checklist

- [ ] Node.js v20+ installed
- [ ] Aptos CLI installed
- [ ] Petra/Martian wallet installed
- [ ] Wallet on Testnet network
- [ ] Testnet APT in wallet (>1 APT)
- [ ] Repository cloned
- [ ] Backend dependencies installed (`npm install` in aptocom-ai/)
- [ ] Frontend dependencies installed (`npm install` in frontend/)
- [ ] Groq API key obtained
- [ ] MongoDB Atlas database created
- [ ] nft.storage API key obtained
- [ ] Backend `.env` configured
- [ ] Frontend `.env` configured
- [ ] Backend server running (port 5000)
- [ ] Frontend server running (port 3000/5173)
- [ ] Wallet connected to dApp
- [ ] Ready to transact! 🚀

---

## 🔗 Useful Links

### Official Documentation
- **Aptos Docs**: https://aptos.dev/
- **Move Language**: https://move-language.github.io/move/
- **Aptos TS SDK**: https://aptos.dev/sdks/ts-sdk/

### Tools & Services
- **Aptos Explorer**: https://explorer.aptoslabs.com/?network=testnet
- **Aptos Faucet**: https://faucet.testnet.aptoslabs.com/
- **Petra Wallet**: https://petra.app/
- **Groq Console**: https://console.groq.com/
- **MongoDB Atlas**: https://cloud.mongodb.com/
- **nft.storage**: https://nft.storage/

### GitHub Repository
- **Project Repo**: https://github.com/RiyaGithub123/Aptocom

---

## 📝 Notes

- **Network**: All operations use **Aptos Testnet** (Chain ID: 2022)
- **Tokens**: Use testnet APT (no real value)
- **Contracts**: Already deployed at address above
- **No Deployment Needed**: Use existing contract address
- **Backend Wallet**: Needs testnet APT for automated operations
- **User Wallets**: Petra/Martian connect via dApp

---

**Last Build**: November 2, 2025  
**Smart Contracts**: ✅ Compiled  
**Backend**: ✅ Dependencies installed (282 packages)  
**Frontend**: ✅ Dependencies installed (540 packages)  
**Status**: 🟢 Production-ready on Testnet

