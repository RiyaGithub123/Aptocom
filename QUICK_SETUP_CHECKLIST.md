# 📋 Quick Setup Checklist - New Machine

Use this checklist when setting up AptoCom on a new laptop.

## ✅ Prerequisites (30-45 minutes)

### Software Installation
- [ ] **Git** installed and configured
  - `git --version` should work
  - Configure: `git config --global user.name "Your Name"`
  - Configure: `git config --global user.email "your@email.com"`

- [ ] **Node.js** v20+ installed
  - `node --version` should show v20+
  - `npm --version` should show v10+

- [ ] **VS Code** installed
  - Extensions: Move Analyzer, ESLint, Prettier

- [ ] **Aptos CLI** installed
  - `aptos --version` should work
  - Added to system PATH

- [ ] **Petra Wallet** browser extension
  - Installed in Chrome/Brave/Edge
  - Wallet created/imported
  - Switched to **Testnet** network

## 📦 Repository Setup (5 minutes)

- [ ] Repository cloned/extracted
  ```bash
  git clone https://github.com/RiyaGithub123/Aptocom.git
  cd Aptocom
  ```

- [ ] Verified folder structure (aptocom-ai/, frontend/, sources/)

## 🔧 Backend Setup (10 minutes)

- [ ] Navigate to backend: `cd aptocom-ai`
- [ ] Install dependencies: `npm install` (282 packages)
- [ ] Copy environment template: `cp .env.example .env`
- [ ] Edit `.env` with credentials (see below)
- [ ] Test environment: `node src/utils/testEnvironment.js`
- [ ] Start server: `npm start`
- [ ] Verify: Open http://localhost:3001/health

## 🎨 Frontend Setup (10 minutes)

- [ ] Navigate to frontend: `cd frontend`
- [ ] Install dependencies: `npm install`
- [ ] Copy environment template: `cp .env.example .env`
- [ ] Edit `.env`:
  ```env
  VITE_BACKEND_URL=http://localhost:3001/api
  VITE_APTOS_NETWORK=testnet
  VITE_CONTRACT_ADDRESS=0x346a0fa67d42e63c5d713914fe46cb4ed38f011d21004122e3784b28437a1f3d
  ```
- [ ] Start dev server: `npm run dev`
- [ ] Verify: Open http://localhost:5173

## 🔑 API Keys Required

### MongoDB Atlas
- [ ] Account created at https://www.mongodb.com/atlas/database
- [ ] Free cluster (M0) created
- [ ] Database user created: `aptocom_admin`
- [ ] IP whitelist: `0.0.0.0/0` (for development)
- [ ] Connection string copied to `.env`

### Groq AI
- [ ] Account created at https://console.groq.com/
- [ ] API key generated (starts with `gsk_`)
- [ ] Key copied to `.env` as `GROQ_API_KEY`

### nft.storage (IPFS)
- [ ] Account created at https://nft.storage/
- [ ] API key generated
- [ ] Key copied to `.env` as `NFT_STORAGE_API_KEY`

### Aptos Private Key
- [ ] Run `aptos init` (select testnet)
- [ ] Get key from `.aptos/config.yaml`
- [ ] Copy to `.env` as `APTOS_PRIVATE_KEY`
- [ ] Get testnet APT: https://faucet.testnet.aptoslabs.com/

## ✅ Verification Tests

### Backend Tests
- [ ] Environment test passes: `node src/utils/testEnvironment.js`
- [ ] Server starts: `npm start`
- [ ] Health check works: http://localhost:3001/health
- [ ] MongoDB connected (check terminal output)

### Frontend Tests
- [ ] Dev server starts: `npm run dev`
- [ ] Homepage loads: http://localhost:5173
- [ ] Petra wallet connects
- [ ] Can navigate between pages
- [ ] No console errors

### Wallet Tests
- [ ] Petra wallet installed
- [ ] Switched to **Testnet** network
- [ ] Has testnet APT (from faucet)
- [ ] Wallet connects to dApp
- [ ] Address visible in navbar

### Smart Contract Tests
- [ ] View deployed contracts on explorer:
  https://explorer.aptoslabs.com/account/0x346a0fa67d42e63c5d713914fe46cb4ed38f011d21004122e3784b28437a1f3d?network=testnet
- [ ] Contracts deployed: ✅ act_token, ✅ governance, ✅ treasury

## 🐛 Common Issues & Fixes

### "Cannot find module" error
```bash
rm -rf node_modules package-lock.json
npm install
```

### Port already in use
```bash
# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3001 | xargs kill -9
```

### MongoDB connection failed
- Check URI in `.env`
- Verify password (URL encode special chars)
- Check IP whitelist in MongoDB Atlas
- Ensure internet connection

### Wallet won't connect
- Ensure Petra is on **Testnet** (not Mainnet)
- Clear browser cache
- Disable conflicting extensions
- Try incognito mode

### Frontend shows "Network Error"
- Verify backend is running on port 3001
- Check `VITE_BACKEND_URL` in frontend `.env`
- Check CORS settings in backend
- Check browser console for details

## 🚀 Ready to Develop!

Once all items are checked:
- [ ] Both servers running (backend on 3001, frontend on 5173)
- [ ] Wallet connected
- [ ] Can navigate all pages
- [ ] Ready to start Phase 5 (Integration Testing)

## 📖 Next Steps

1. Read [SETUP_NEW_MACHINE.md](./SETUP_NEW_MACHINE.md) for detailed instructions
2. Review [TODO.md](./TODO.md) for Phase 5 tasks
3. Check [README.md](./README.md) for project overview
4. Start with integration testing

---

**Setup Time**: ~1 hour total  
**Last Updated**: November 1, 2025  
**Status**: Ready for Phase 5

Need help? Check [SETUP_NEW_MACHINE.md](./SETUP_NEW_MACHINE.md) for troubleshooting.
