# 🚀 AptoCom - AI-Powered DAO on Aptos Blockchain

[![Aptos](https://img.shields.io/badge/Aptos-Testnet-00D4AA?logo=aptos)](https://explorer.aptoslabs.com/account/0x346a0fa67d42e63c5d713914fe46cb4ed38f011d21004122e3784b28437a1f3d?network=testnet)
[![Move Language](https://img.shields.io/badge/Move-Smart%20Contracts-4A90E2)](https://move-language.github.io/move/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **A fully autonomous, AI-powered Decentralized Autonomous Organization (DAO) revolutionizing treasury management and governance on Aptos blockchain.**

---

## 📖 Overview

**AptoCom** is a cutting-edge DAO platform that combines artificial intelligence with blockchain technology to create transparent, efficient, and autonomous governance. Built on Aptos using the Move programming language, AptoCom enables community-driven decision making for investment proposals with AI-assisted evaluation.

### 🎯 Key Features

- **🪙 ACT Token System** - Aptos Fungible Asset for governance and rewards
- **🤖 AI-Powered Evaluation** - Automated proposal scoring using Groq AI
- **🗳️ Weighted Voting** - Token-based governance with transparent on-chain voting
- **💰 Treasury Management** - Automated fund allocation and dividend distribution
- **📊 Real-time Analytics** - Comprehensive dashboard for DAO metrics
- **🔗 IPFS Integration** - Decentralized storage for proposal documents

---

## 📜 Deployed Smart Contracts

All contracts are deployed on **Aptos Testnet** at:

**Contract Address**: `0x346a0fa67d42e63c5d713914fe46cb4ed38f011d21004122e3784b28437a1f3d`

### Modules

| Module | Description | Key Functions |
|--------|-------------|---------------|
| **`act_token`** | ACT Fungible Asset token | `purchase`, `transfer`, `mint`, `burn`, `balance_of` |
| **`governance`** | Proposal creation & voting | `create_proposal`, `vote`, `execute_proposal` |
| **`treasury`** | Fund management & dividends | `deposit`, `withdraw`, `distribute_dividends`, `claim_dividend` |

🔗 **View on Explorer**: [AptoCom Contract](https://explorer.aptoslabs.com/account/0x346a0fa67d42e63c5d713914fe46cb4ed38f011d21004122e3784b28437a1f3d?network=testnet)

### Token Details

- **Token Name**: AptoCom Token
- **Symbol**: ACT
- **Decimals**: 8
- **Type**: Aptos Fungible Asset (FA)
- **Exchange Rate**: 1 APT = 100 ACT

---
## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       User Interface                         │
│              (React + Vite + Wallet Adapter)                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                      Backend API                             │
│           (Node.js + Express + MongoDB)                      │
│  ┌──────────────┬──────────────┬──────────────────────┐    │
│  │ Groq AI      │ IPFS Storage │ Aptos Integration    │    │
│  │ Evaluation   │ (nft.storage)│ (TypeScript SDK)     │    │
│  └──────────────┴──────────────┴──────────────────────┘    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  Aptos Blockchain (Testnet)                  │
│  ┌──────────────┬──────────────┬──────────────────────┐    │
│  │ ACT Token    │ Governance   │ Treasury             │    │
│  │ Module       │ Module       │ Module               │    │
│  └──────────────┴──────────────┴──────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---


## 🛠️ Tech Stack

### Blockchain
- **Aptos Blockchain** - Layer 1 blockchain with Move language
- **Move Language** - Safe and secure smart contract development
- **Aptos TypeScript SDK** - Client-side blockchain interactions

### Backend
- **Node.js v20+** - JavaScript runtime
- **Express v5** - Web application framework
- **MongoDB Atlas** - Cloud database for off-chain data
- **Groq API** - AI model for proposal evaluation (llama-3.3-70b-versatile)
- **nft.storage** - IPFS pinning service for document storage

### Frontend
- **React 18** - Modern UI library
- **Vite 5** - Fast build tool
- **Aptos Wallet Adapter** - Multi-wallet support (Petra, Martian)
- **Chart.js** - Data visualization
- **React Router** - Client-side routing
- **React Toastify** - User notifications

### Development Tools
- **Aptos CLI** - Contract deployment and testing
- **Git** - Version control
- **VS Code** - Recommended IDE with Move extension

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20 or higher
- **npm** or **yarn**
- **Aptos CLI** ([Installation Guide](https://aptos.dev/tools/aptos-cli/install-cli/))
- **Petra Wallet** or **Martian Wallet** browser extension
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/RiyaGithub123/Aptocom.git
   cd Aptocom
   ```

2. **Install backend dependencies**
   ```bash
   cd aptocom-ai
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure environment variables**
   
   Create `.env` file in `aptocom-ai/` directory:
   ```env
   PORT=5000
   NODE_ENV=development
   
   # Aptos Configuration
   APTOS_NETWORK=testnet
   TOKEN_CONTRACT_ADDRESS=0x346a0fa67d42e63c5d713914fe46cb4ed38f011d21004122e3784b28437a1f3d
   
   # Service Wallet (for backend operations)
   SERVICE_WALLET_PRIVATE_KEY=<your-private-key>
   
   # MongoDB (get from MongoDB Atlas)
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/aptocom
   
   # Groq AI (get from https://console.groq.com)
   GROQ_API_KEY=<your-groq-api-key>
   
   # IPFS Storage (get from https://nft.storage)
   NFT_STORAGE_API_KEY=<your-nft-storage-api-key>
   ```

   Create `.env` file in `frontend/` directory:
   ```env
   VITE_BACKEND_URL=http://localhost:5000
   VITE_APTOS_NETWORK=testnet
   VITE_ACT_TOKEN_ADDRESS=0x346a0fa67d42e63c5d713914fe46cb4ed38f011d21004122e3784b28437a1f3d
   VITE_ACT_EXCHANGE_RATE=100
   ```

5. **Get testnet APT tokens**
   - Visit [Aptos Faucet](https://faucet.testnet.aptoslabs.com/)
   - Connect your wallet and request testnet APT

### Running the Application

1. **Start the backend server**
   ```bash
   cd aptocom-ai
   npm start
   ```
   Backend will run on `http://localhost:5000`

2. **Start the frontend (in a new terminal)**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will run on `http://localhost:3000`

3. **Open your browser**
   - Navigate to `http://localhost:3000`
   - Connect your Petra or Martian wallet
   - Make sure wallet is on **Aptos Testnet**

---

## 📱 Features & Usage

### 1. Token Purchase
- Navigate to **"Buy ACT Tokens"** page
- Enter APT amount to spend
- Exchange rate: 1 APT = 100 ACT
- Approve transaction in wallet
- ACT tokens are minted to your wallet

### 2. Create Proposal
- Go to **"Create Proposal"** page
- Fill in proposal details (title, description, funding amount)
- Upload supporting documents (stored on IPFS)
- Submit proposal to blockchain
- AI automatically evaluates the proposal

### 3. Vote on Proposals
- Visit **"Voting"** page
- Browse active proposals
- View AI evaluation scores
- Cast your vote (For/Against)
- Voting power based on ACT token holdings

### 4. Treasury Management
- View total treasury balance
- Check claimable dividends
- Claim your share of profits
- Allocate funds to approved proposals

### 5. Analytics Dashboard
- Real-time DAO metrics
- Proposal statistics
- Token distribution
- User engagement data

---

## 🧪 Smart Contract Testing

Run the test suite:

```bash
cd Aptocom
aptos move test
```

All 32 tests cover:
- Token minting, burning, and transfers
- Proposal creation and voting
- Treasury deposits and withdrawals
- Dividend distribution and claiming

---

## 📁 Project Structure

```
Aptocom/
├── aptocom-ai/                   # Backend (Node.js + Express)
│   ├── src/
│   │   ├── controllers/         # API controllers (6 modules)
│   │   ├── services/            # Core services (AI, Aptos, IPFS)
│   │   ├── models/              # MongoDB schemas
│   │   ├── routes/              # API routes
│   │   ├── config/              # Configuration
│   │   ├── utils/               # Utilities
│   │   └── server.js            # Entry point
│   ├── __tests__/               # Test suites
│   └── package.json
├── frontend/                     # React dApp
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # 10 page components
│   │   ├── services/            # API & blockchain services
│   │   ├── hooks/               # Custom React hooks
│   │   ├── utils/               # Utilities
│   │   ├── styles/              # CSS files
│   │   └── main.jsx             # Entry point
│   └── package.json
├── sources/                      # Move smart contracts
│   ├── act_token.move           # ACT token module
│   ├── governance.move          # Governance logic
│   └── treasury.move            # Treasury management
├── tests/                        # Move contract tests
│   ├── act_token_tests.move
│   ├── governance_tests.move
│   └── treasury_tests.move
├── build/                        # Compiled Move code
├── scripts/                      # Utility scripts
├── .env.example                  # Environment template
├── Move.toml                     # Move package config
├── README.md                     # This file
├── TODO.md                       # Complete task checklist
├── SETUP_NEW_MACHINE.md         # 🆕 New laptop setup guide
├── CREDENTIALS.md                # Credential reference
├── DEPLOYMENT_RECORD.md          # Smart contract deployment
├── ONCHAIN_TESTING_REPORT.md     # Blockchain test results
└── PHASE_4_COMPLETION_REPORT.md  # Frontend completion report
```

---

## 📊 Development Status

**Current Progress**: Phase 4 Complete (Frontend 100% ✅)  
**Overall Status**: ~85% Complete

### Phase 1: Environment Setup ✅ COMPLETE
- [x] Development tools (VS Code, Aptos CLI, Node.js, Git)
- [x] Wallet setup (Petra)
- [x] API credentials (Groq, MongoDB, nft.storage)
- [x] Environment configuration
- [x] Security setup (.gitignore, .env)

### Phase 2: Smart Contract Development ✅ COMPLETE
- [x] ACT Token Module (11/11 tests passing)
- [x] Governance Module (11/11 tests passing)
- [x] Treasury Module (10/10 tests passing)
- [x] Deployed to Aptos Testnet
- [x] On-chain testing (7/7 tests passed)
- **Contract**: `0x346a0fa67d42e63c5d713914fe46cb4ed38f011d21004122e3784b28437a1f3d`

### Phase 3: Backend Development ✅ 95% COMPLETE
- [x] Backend structure with Express.js
- [x] Database schemas (Proposal, AIEvaluation, User, Analytics)
- [x] Aptos integration service (950+ lines)
- [x] AI evaluation service with Groq (1,040 lines)
- [x] IPFS integration service (820 lines)
- [x] All 24 API endpoints implemented
- [x] Unit tests (50+ test cases)
- [x] Integration tests
- [ ] Deployment to Render (Phase 7)

### Phase 4: Frontend Development ✅ 100% COMPLETE
- [x] Complete design system (6 button variants, 6 card variants)
- [x] Wallet integration (Petra + Martian)
- [x] All 10 pages implemented:
  - [x] Dashboard (stats, analytics)
  - [x] Token Purchase (ACT buying)
  - [x] Proposals (list with filters)
  - [x] Create Proposal (full form)
  - [x] Proposal Details (voting interface)
  - [x] Voting (complete voting page)
  - [x] Treasury (management)
  - [x] Analytics (charts, insights)
  - [x] Profile (user management)
  - [x] Settings (preferences)
- [x] All blockchain services (token, governance, treasury)
- [x] Backend API integration (23 functions)
- [x] 5 custom React hooks
- [x] Responsive design (mobile, tablet, desktop)
- [x] Toast notifications throughout
- **Total**: ~8,500+ lines of frontend code

### Phase 5: Integration & Testing ⏳ IN PROGRESS (NEXT PRIORITY)

**Status**: Not started - Ready to begin  
**Estimated Time**: 2-3 weeks  
**Priority**: HIGH - Required before deployment

#### What Needs to Be Completed:

##### 5.1 Frontend-Backend Integration Testing
- [ ] Test all 24 API endpoints from frontend
- [ ] Verify data flow: Frontend → Backend → MongoDB
- [ ] Test file uploads to IPFS (proposals with documents)
- [ ] Verify AI evaluation displays correctly in UI
- [ ] Test error handling for API failures
- [ ] Validate request/response formats
- [ ] Test loading states and user feedback

##### 5.2 Blockchain Integration Testing
- [ ] Test wallet connection flows (Petra + Martian)
- [ ] Test ACT token purchase with APT
- [ ] Test proposal creation with on-chain submission
- [ ] Test voting with transaction signing
- [ ] Test proposal execution after approval
- [ ] Test dividend claiming
- [ ] Verify transaction confirmations
- [ ] Test with different wallet states (no funds, insufficient funds, etc.)

##### 5.3 End-to-End User Flows
- [ ] **New User Onboarding**: Connect wallet → Buy ACT → View dashboard
- [ ] **Proposal Submission**: Create proposal → Upload doc → Pay fee → Submit
- [ ] **Voting Flow**: Browse proposals → Vote → Confirm transaction → View results
- [ ] **Proposal Execution**: Wait for approval → Auto-execute → View treasury change
- [ ] **Dividend Claiming**: Check eligibility → Claim rewards → Receive APT

##### 5.4 Cross-Browser Testing
- [ ] Chrome (desktop + mobile)
- [ ] Firefox
- [ ] Safari (desktop + mobile)
- [ ] Edge
- [ ] Test wallet extensions on each browser

##### 5.5 Performance Testing
- [ ] Frontend load time < 3 seconds
- [ ] API response time < 500ms
- [ ] Lighthouse score > 90
- [ ] Bundle size optimization
- [ ] Image optimization
- [ ] Code splitting

##### 5.6 Security Testing
- [ ] Input validation on all forms
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Rate limiting on APIs
- [ ] Environment variable security
- [ ] Smart contract audit (recommended)

##### 5.7 Usability Testing
- [ ] Test with 3-5 users
- [ ] Collect feedback on UI/UX
- [ ] Test mobile responsiveness
- [ ] Verify accessibility (WCAG 2.1)
- [ ] Test error messages clarity

**See [TODO.md](./TODO.md) lines 1150-1300 for detailed Phase 5 tasks**

### Phase 6-7: Deployment 📋 PLANNED (After Phase 5 Complete)

**Status**: Not started - Waiting for Phase 5 completion  
**Estimated Time**: 1-2 weeks  
**Priority**: MEDIUM

#### What Needs to Be Completed:

##### 6.1 Backend Deployment (Render/Railway)
- [ ] Create Render account
- [ ] Configure environment variables in Render
- [ ] Deploy backend to Render
- [ ] Test deployed backend endpoints
- [ ] Setup custom domain (optional)
- [ ] Configure logging and monitoring

##### 6.2 Frontend Deployment (Vercel/Netlify)
- [ ] Build production bundle (`npm run build`)
- [ ] Create Vercel account
- [ ] Configure environment variables in Vercel
- [ ] Deploy frontend to Vercel
- [ ] Test deployed frontend
- [ ] Configure custom domain (optional)
- [ ] Setup analytics

##### 6.3 Database Deployment
- [ ] MongoDB Atlas already configured ✅
- [ ] Verify production security settings
- [ ] Setup automated backups
- [ ] Configure IP whitelist for production

##### 6.4 Monitoring & Logging
- [ ] Setup error tracking (Sentry)
- [ ] Configure uptime monitoring
- [ ] Setup log aggregation
- [ ] Create status page

##### 6.5 Production Testing
- [ ] Test all features in production
- [ ] Verify wallet connections
- [ ] Test blockchain transactions
- [ ] Load testing
- [ ] Security scan

##### 6.6 Documentation & Launch
- [ ] Update README with production URLs
- [ ] Create user guide
- [ ] Create video tutorial (optional)
- [ ] Announce launch
- [ ] Gather initial user feedback

**See [TODO.md](./TODO.md) lines 1300-1500 for detailed deployment tasks**

For detailed checklist, see [TODO.md](./TODO.md)

---

## 📚 Documentation

### Setup & Configuration
- **[SETUP_NEW_MACHINE.md](./SETUP_NEW_MACHINE.md)** - 🆕 Complete guide for setting up on a new laptop
- **[CREDENTIALS.md](./CREDENTIALS.md)** - Credential setup and API key guide
- **[SETUP_COMPLETE.md](./SETUP_COMPLETE.md)** - Initial setup completion summary

### Project Progress
- **[TODO.md](./TODO.md)** - Complete project checklist (1,725+ lines, 400+ tasks)
- **[PHASE_4_COMPLETION_REPORT.md](./PHASE_4_COMPLETION_REPORT.md)** - Frontend completion details
- **[RAPID_DEVELOPMENT_SUMMARY.md](./RAPID_DEVELOPMENT_SUMMARY.md)** - Development velocity report

### Smart Contracts
- **[DEPLOYMENT_RECORD.md](./DEPLOYMENT_RECORD.md)** - Smart contract deployment details
- **[ONCHAIN_TESTING_REPORT.md](./ONCHAIN_TESTING_REPORT.md)** - Blockchain test results (32/32 tests passing)
- **[DEPLOYMENT_INSTRUCTIONS.md](./DEPLOYMENT_INSTRUCTIONS.md)** - How to deploy contracts

### Backend Documentation
- **[aptocom-ai/README.md](./aptocom-ai/README.md)** - Backend overview
- **[docs/PHASE_3.7_COMPLETE_API_REFERENCE.md](./docs/PHASE_3.7_COMPLETE_API_REFERENCE.md)** - API documentation (24 endpoints)
- **[docs/PHASE_3.8_BACKEND_TESTING.md](./docs/PHASE_3.8_BACKEND_TESTING.md)** - Testing guide

### Frontend Documentation
- **[frontend/README.md](./frontend/README.md)** - Frontend overview
- Component documentation in respective files

### Integration Guides
- **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - Full integration guide
- **[ENVIRONMENT_TEST_REPORT.md](./ENVIRONMENT_TEST_REPORT.md)** - Environment testing results
- **[GIT_WORKFLOW_GUIDE.md](./GIT_WORKFLOW_GUIDE.md)** - Git workflow best practices

### External Resources
- [Aptos Documentation](https://aptos.dev/)
- [Move Language Book](https://move-language.github.io/move/)
- [Aptos TypeScript SDK](https://aptos.dev/sdks/ts-sdk/)
- [Aptos Explorer (Testnet)](https://explorer.aptoslabs.com/testnet)
- [Petra Wallet Documentation](https://petra.app/docs)

---

## 🔐 Security

### Important Notes
- **Never commit `.env` files** - Contains sensitive credentials
- **Never share private keys** - Keep them offline and encrypted
- **Use testnet only** - This is a development/demo project
- **Audit smart contracts** - Before any mainnet deployment

### Credential Storage
- All credentials stored in `.env` (excluded from Git)
- Template available in `.env.example`
- Documentation in `CREDENTIALS.md`

---

## 🌈 Design System

### Colors
- **Primary**: Neon Green (#00FF41), Deep Black (#0A0A0A), Bright Yellow (#FFD700)
- **Accent**: White (#FFFFFF)
- **Secondary**: Muted grays, soft oranges, subtle gradients

### Typography
- **Fonts**: Montserrat (headings), Inter (body)
- **Style**: Bold, clean, futuristic

### UI Philosophy
- Energetic and clean dashboard
- Warm, inviting cards
- Animated charts and interactions
- Mobile-first responsive design

---

## 🤝 Contributing

This is currently a personal/educational project. Contributions, issues, and feature requests are welcome!

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

**Developer**: [Your Name]  
**Project Start**: November 1, 2025  
**Status**: Active Development

---

## 🙏 Acknowledgments

- [Aptos Labs](https://aptoslabs.com/) - Blockchain infrastructure
- [Groq](https://groq.com/) - AI inference
- [MongoDB](https://mongodb.com/) - Database
- [nft.storage](https://nft.storage/) - IPFS pinning

---

## 📞 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/aptocom/issues)
- **Documentation**: [Project Wiki](https://github.com/YOUR_USERNAME/aptocom/wiki)

---

<div align="center">

**Made with ❤️ on Aptos Blockchain**

[⭐ Star this repo](https://github.com/YOUR_USERNAME/aptocom) • [🐛 Report Bug](https://github.com/YOUR_USERNAME/aptocom/issues) • [💡 Request Feature](https://github.com/YOUR_USERNAME/aptocom/issues)

</div>
#***REMOVED*** ***REMOVED***A***REMOVED***p***REMOVED***t***REMOVED***o***REMOVED***c***REMOVED***o***REMOVED***m***REMOVED***
***REMOVED***
***REMOVED***
