# 🚀 AptoCom Backend API

AI-powered backend service for the AptoCom autonomous DAO on Aptos blockchain.

## 📋 Overview

This Node.js/Express backend provides:
- **AI Agent**: Proposal evaluation using Groq API (Mixtral model)
- **REST API**: Endpoints for proposals, tokens, treasury, and analytics
- **Blockchain Integration**: Aptos SDK for smart contract interactions
- **Database**: MongoDB for storing proposals and AI evaluations
- **IPFS Integration**: Decentralized storage via nft.storage

## 🛠️ Tech Stack

- **Runtime**: Node.js v20.18.1
- **Framework**: Express.js
- **Blockchain**: Aptos TypeScript SDK
- **AI**: Groq API (Mixtral-8x7b-32768)
- **Database**: MongoDB Atlas
- **Storage**: IPFS (nft.storage)
- **Languages**: JavaScript (CommonJS)

## 📁 Project Structure

```
aptocom-ai/
├── src/
│   ├── config/          # Configuration loader
│   ├── controllers/     # Request handlers
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic
│   │   ├── aptosService.js      # Blockchain interactions
│   │   ├── aiService.js         # AI evaluation logic
│   │   ├── ipfsService.js       # IPFS upload/download
│   │   └── mongoService.js      # Database operations
│   ├── models/          # MongoDB schemas
│   ├── utils/           # Helper functions
│   └── server.js        # Main Express app
├── .env                 # Environment variables (DO NOT COMMIT!)
├── .env.example         # Template for .env
├── .gitignore
├── package.json
└── README.md
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
- `TOKEN_CONTRACT_ADDRESS` - Deployed ACT token contract
- `GOVERNANCE_CONTRACT_ADDRESS` - Deployed governance contract
- `TREASURY_CONTRACT_ADDRESS` - Deployed treasury contract
- `SERVICE_WALLET_PRIVATE_KEY` - Backend wallet private key
- `GROQ_API_KEY` - Groq AI API key
- `MONGODB_URI` - MongoDB connection string
- `NFT_STORAGE_API_KEY` - nft.storage API key

### 3. Run Development Server

```bash
npm run dev
```

Or:

```bash
node src/server.js
```

Server will start on `http://localhost:5000`

## 📡 API Endpoints

### Health Check
```
GET /health
```
Returns server status and configuration.

### Proposals
```
POST   /api/proposals/create          # Submit new proposal
GET    /api/proposals                 # List all proposals
GET    /api/proposals/:id             # Get proposal details
POST   /api/proposals/:id/evaluate    # Trigger AI evaluation
POST   /api/proposals/:id/submit-chain # Submit to blockchain
```

### Tokens
```
GET    /api/tokens/balance/:address   # Get ACT balance
POST   /api/tokens/mint               # Mint ACT (admin only)
GET    /api/tokens/info               # Get token metadata
```

### Treasury
```
GET    /api/treasury/balance          # Get treasury balance
GET    /api/treasury/transactions     # Transaction history
POST   /api/treasury/distribute       # Trigger dividend distribution
```

### Analytics
```
GET    /api/analytics/overview        # Dashboard statistics
GET    /api/analytics/proposals       # Proposal stats
```

## 🤖 AI Evaluation

The AI agent evaluates proposals using 8 parameters:

1. **Strategic Alignment** (0-100): Alignment with DAO goals
2. **Feasibility** (0-100): Execution viability
3. **Team Capability** (0-100): Team experience and track record
4. **Financial Reasonableness** (0-100): Budget appropriateness
5. **ROI Potential** (0-100): Expected return on investment
6. **Risk Assessment** (0-100): Risk level analysis
7. **Milestone Clarity** (0-100): Clear milestones and deliverables
8. **Transparency** (0-100): Disclosure and documentation quality

**Overall Score**: Weighted average of all parameters
**Recommendation**: Auto-approve (>80), Review (50-80), Reject (<50)

## 🔗 Smart Contract Integration

Connects to deployed Aptos contracts:
- **ACT Token**: `0x346a0fa6...7a1f3d::act_token`
- **Governance**: `0x346a0fa6...7a1f3d::governance`
- **Treasury**: `0x346a0fa6...7a1f3d::treasury`

## 💾 Database Schema

### Proposals Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  category: String,
  amountRequested: Number,
  recipient: String,
  team: Array,
  milestones: Array,
  ipfsHash: String,
  onChainProposalId: Number,
  aiEvaluation: {
    scores: Object,
    overallScore: Number,
    recommendation: String,
    reasoning: String,
    timestamp: Date
  },
  status: String, // 'pending', 'evaluated', 'on-chain', 'approved', 'rejected'
  createdAt: Date,
  updatedAt: Date
}
```

## 📦 Dependencies

### Core
- `express` - Web framework
- `axios` - HTTP client
- `dotenv` - Environment variables
- `cors` - CORS middleware
- `body-parser` - Request parsing

### Blockchain
- `@aptos-labs/ts-sdk` - Aptos TypeScript SDK

### AI
- `groq-sdk` - Groq AI API client

### Database
- `mongodb` - MongoDB driver

### Storage
- `ipfs-http-client` - IPFS client

## 🔒 Security

- ✅ Private keys stored in `.env` (never committed)
- ✅ CORS configured for specific origins
- ✅ Rate limiting on API endpoints
- ✅ Input validation and sanitization
- ✅ MongoDB injection prevention
- ✅ Environment variable validation

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

## 📝 Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest",
    "lint": "eslint src/"
  }
}
```

## 🚀 Deployment

### Heroku
```bash
heroku create aptocom-api
git push heroku main
heroku config:set $(cat .env | xargs)
```

### Railway
```bash
railway init
railway up
```

### Docker
```bash
docker build -t aptocom-api .
docker run -p 5000:5000 --env-file .env aptocom-api
```

## 📊 Monitoring

- **Logs**: Check console output or configure external logging service
- **Health**: `GET /health` endpoint for uptime monitoring
- **Errors**: Error handling middleware catches and logs all errors

## 🤝 Contributing

1. Create feature branch
2. Implement changes
3. Test thoroughly
4. Submit pull request

## 📄 License

ISC

## 🔗 Links

- **Frontend**: (To be deployed)
- **Smart Contracts**: [Aptos Explorer](https://explorer.aptoslabs.com/account/0x346a0fa67d42e63c5d713914fe46cb4ed38f011d21004122e3784b28437a1f3d?network=testnet)
- **Documentation**: `/ONCHAIN_TESTING_REPORT.md`

---

**Built with ❤️ for the AptoCom DAO**
