# 👋 START HERE - AptoCom Project

**Welcome to AptoCom!** This is an AI-powered DAO built on Aptos blockchain.

---

## 🚀 Quick Navigation

### 📖 Setting Up on a New Laptop?
➡️ **Read [SETUP_NEW_MACHINE.md](./SETUP_NEW_MACHINE.md)** first!

This comprehensive guide includes:
- Prerequisites to install (Git, Node.js, Aptos CLI, etc.)
- Step-by-step setup instructions
- API key configuration
- Troubleshooting common issues
- **~1 hour setup time**

### ✅ Need a Quick Checklist?
➡️ **Use [QUICK_SETUP_CHECKLIST.md](./QUICK_SETUP_CHECKLIST.md)**

Checklist format for tracking your setup progress.

---

## 📊 Project Status

**Overall Progress**: 85% Complete  
**Current Phase**: Phase 5 - Integration & Testing

### ✅ What's Done:
- ✅ Smart Contracts (deployed on Aptos Testnet)
- ✅ Backend API (24 endpoints)
- ✅ Frontend (10 pages, fully functional)
- ✅ Wallet Integration
- ✅ All core features implemented

### ⏳ What's Next:
- ⏳ Integration testing (Frontend ↔ Backend ↔ Blockchain)
- ⏳ End-to-end user flow testing
- ⏳ Performance & security testing
- 📋 Production deployment

➡️ **See [PROJECT_STATUS.md](./PROJECT_STATUS.md) for detailed breakdown**

---

## 📁 Key Files to Know

### Documentation
| File | Purpose |
|------|---------|
| [README.md](./README.md) | Project overview, features, tech stack |
| [TODO.md](./TODO.md) | Complete task checklist (1,725 lines) |
| [PROJECT_STATUS.md](./PROJECT_STATUS.md) | What's done, what's left |
| [SETUP_NEW_MACHINE.md](./SETUP_NEW_MACHINE.md) | New laptop setup guide |
| [CREDENTIALS.md](./CREDENTIALS.md) | How to get API keys |

### Code
| Directory | Contents |
|-----------|----------|
| `aptocom-ai/` | Backend (Node.js + Express) |
| `frontend/` | Frontend (React + Vite) |
| `sources/` | Smart contracts (Move language) |
| `tests/` | Smart contract tests |
| `build/` | Compiled contract bytecode |

### Configuration
| File | Purpose |
|------|---------|
| `aptocom-ai/.env.example` | Backend environment template |
| `frontend/.env.example` | Frontend environment template |
| `Move.toml` | Smart contract package config |

---

## ⚡ Quick Start (If Already Set Up)

### 1. Start Backend
```bash
cd aptocom-ai
npm start
# Should start on http://localhost:3001
```

### 2. Start Frontend (New Terminal)
```bash
cd frontend
npm run dev
# Should start on http://localhost:5173
```

### 3. Open in Browser
- Navigate to: http://localhost:5173
- Connect Petra wallet (make sure it's on **Testnet**)
- Start testing!

---

## 🔧 First Time Setup?

### Prerequisites You Need:
- [ ] **Git** - Version control
- [ ] **Node.js** v20+ - JavaScript runtime
- [ ] **Aptos CLI** - Blockchain tool
- [ ] **VS Code** - Code editor (recommended)
- [ ] **Petra Wallet** - Browser extension

### API Keys You Need:
- [ ] **MongoDB Atlas** - Database (free tier)
- [ ] **Groq API** - AI evaluation (free tier)
- [ ] **nft.storage** - IPFS storage (free)
- [ ] **Aptos Private Key** - For backend operations

➡️ **Get detailed instructions in [SETUP_NEW_MACHINE.md](./SETUP_NEW_MACHINE.md)**

---

## 🎯 Current Priority: Phase 5 Testing

If everything is set up, start testing:

1. **User Onboarding Flow**
   - Connect wallet
   - Buy ACT tokens
   - View dashboard

2. **Proposal Flow**
   - Create a proposal
   - Upload a document
   - Submit on-chain

3. **Voting Flow**
   - Browse proposals
   - Cast a vote
   - See results

4. **Document Issues**
   - Create GitHub Issues for bugs
   - Note UX problems
   - Record performance issues

➡️ **See TODO.md lines 1150-1300 for complete Phase 5 checklist**

---

## 🆘 Need Help?

### Common Issues:

**"Cannot find module" error?**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Port already in use?**
```bash
# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

**MongoDB connection failed?**
- Check `.env` file in `aptocom-ai/`
- Verify MongoDB URI is correct
- Check IP whitelist in MongoDB Atlas

**Wallet won't connect?**
- Ensure Petra is on **Testnet** (not Mainnet!)
- Clear browser cache
- Request testnet APT from faucet

➡️ **More troubleshooting in [SETUP_NEW_MACHINE.md](./SETUP_NEW_MACHINE.md)**

---

## 📚 Learn More

### Project Architecture
```
User (Browser) 
    ↓ (React App)
Frontend (Vite + React)
    ↓ (REST API)
Backend (Node.js + Express)
    ↓ (SDK)
Aptos Blockchain (Testnet)
    ↓ (Smart Contracts)
ACT Token + Governance + Treasury
```

### Tech Stack
- **Blockchain**: Aptos (Move language)
- **Backend**: Node.js, Express, MongoDB
- **Frontend**: React, Vite, Wallet Adapter
- **AI**: Groq API (llama-3.3-70b-versatile)
- **Storage**: IPFS (nft.storage)

### Features
- 🪙 ACT Token (Fungible Asset)
- 🤖 AI Proposal Evaluation
- 🗳️ Weighted Voting System
- 💰 Treasury Management
- 📊 Real-time Analytics
- 🔗 Wallet Integration

---

## 📞 Important Links

### Development
- **Frontend Dev**: http://localhost:5173
- **Backend Dev**: http://localhost:3001
- **Backend Health**: http://localhost:3001/health

### Aptos Resources
- **Contract Explorer**: [View Deployed Contracts](https://explorer.aptoslabs.com/account/0x346a0fa67d42e63c5d713914fe46cb4ed38f011d21004122e3784b28437a1f3d?network=testnet)
- **Aptos Faucet**: https://faucet.testnet.aptoslabs.com/
- **Aptos Docs**: https://aptos.dev/

### API Keys
- **MongoDB Atlas**: https://www.mongodb.com/atlas/database
- **Groq Console**: https://console.groq.com/
- **nft.storage**: https://nft.storage/

---

## ✨ Project Highlights

- 📈 **85% Complete** - Almost ready for production
- 🧪 **32/32 Tests Passing** - All smart contracts tested
- 🚀 **Deployed on Testnet** - Live and working
- 📝 **14,500+ Lines of Code** - Full-stack implementation
- 📚 **10+ Documentation Files** - Comprehensive guides
- 🎨 **10 Frontend Pages** - Complete UI
- 🔌 **24 API Endpoints** - Full backend
- 🤖 **AI-Powered** - Groq integration

---

## 🎯 Next Steps

1. **New to the project?**
   - Read [README.md](./README.md) for overview
   - Follow [SETUP_NEW_MACHINE.md](./SETUP_NEW_MACHINE.md) to set up
   - Use [QUICK_SETUP_CHECKLIST.md](./QUICK_SETUP_CHECKLIST.md) to track progress

2. **Already set up?**
   - Check [PROJECT_STATUS.md](./PROJECT_STATUS.md) for current status
   - Review [TODO.md](./TODO.md) Phase 5 tasks (lines 1150-1300)
   - Start testing user flows

3. **Ready to deploy?**
   - Complete Phase 5 testing first
   - See [TODO.md](./TODO.md) Phase 6-7 (lines 1300-1500)
   - Follow deployment guides

---

## 📊 File Summary

| Lines | File | Purpose |
|-------|------|---------|
| 1,725 | TODO.md | Complete task checklist |
| 200+ | SETUP_NEW_MACHINE.md | New machine setup |
| 150+ | PROJECT_STATUS.md | Progress report |
| 100+ | QUICK_SETUP_CHECKLIST.md | Setup checklist |
| 80+ | README.md | Project overview |
| 70+ | START_HERE.md | This file |

---

**Last Updated**: November 1, 2025  
**Status**: Ready for Phase 5 (Integration Testing)  
**Next Milestone**: Complete Phase 5, then deploy to production

---

<div align="center">

### 🚀 Ready to Build the Future of DAOs?

[Read Setup Guide](./SETUP_NEW_MACHINE.md) • [Check Status](./PROJECT_STATUS.md) • [View Tasks](./TODO.md)

**Made with ❤️ on Aptos Blockchain**

</div>
