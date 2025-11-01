# 🔐 APTOCOM - CREDENTIALS REFERENCE

> **⚠️ SECURITY WARNING**: This file contains references to credentials stored in `.env`  
> **DO NOT** put actual secret values here. This is for documentation only.

---

## ✅ Credentials Status

Last Updated: **November 1, 2025**

| Service | Status | Location | Notes |
|---------|--------|----------|-------|
| **Groq API** | ✅ Configured | `.env` | Free tier, AI evaluation |
| **MongoDB Atlas** | ✅ Configured | `.env` | Free M0 cluster |
| **nft.storage** | ✅ Configured | `.env` | Free IPFS pinning |
| **Petra Wallet** | ✅ Configured | `.env` | Service wallet for backend |
| **Testnet APT** | ✅ Funded | Wallet | Get more from faucet if needed |
| **Contract Addresses** | ⏳ Pending | `.env` | Will fill after deployment |

---

## 📋 Services Overview

### 1. **Groq API** (AI Evaluation)
- **Purpose**: AI agent for proposal evaluation and scoring
- **URL**: https://groq.com/
- **Tier**: Free
- **Key Location**: `GROQ_API_KEY` in `.env`
- **Model**: Mixtral/Llama (high performance, free)

### 2. **MongoDB Atlas** (Database)
- **Purpose**: Store proposals, AI evaluations, analytics
- **URL**: https://cloud.mongodb.com/
- **Cluster**: aptocom.xhdymta.mongodb.net
- **Database Name**: aptocom
- **Tier**: M0 Free (512MB)
- **Credentials**: `MONGODB_URI` in `.env`

### 3. **nft.storage** (IPFS)
- **Purpose**: Decentralized storage for proposal documents
- **URL**: https://nft.storage/
- **Tier**: Free (unlimited storage)
- **Key Location**: `NFT_STORAGE_API_KEY` in `.env`

### 4. **Petra Wallet** (Service Wallet)
- **Purpose**: Backend wallet for automated transactions and smart contract deployment
- **Address**: `0x346a0fa67d42e63c5d713914fe46cb4ed38f011d21004122e3784b28437a1f3d`
- **Private Key Format**: `ed25519-priv-<64-hexadecimal-characters>`
  - **Key Type**: `ed25519` (Aptos signature scheme)
  - **Prefix**: `ed25519-priv-` (human-readable format)
  - **Hex Indicator**: `0x` (indicates hexadecimal)
  - **Private Material**: 64 hex characters = 32 bytes
- **Network**: Aptos Testnet
- **Credentials**: `SERVICE_WALLET_PRIVATE_KEY` in `.env`
- **⚠️ CRITICAL**: Never share or commit private key to public repositories!

### 5. **Aptos Testnet**
- **Network**: Aptos Testnet
- **Chain ID**: 2022
- **RPC URL**: https://fullnode.testnet.aptoslabs.com/v1
- **Explorer**: https://explorer.aptoslabs.com/testnet
- **Faucet**: https://faucet.testnet.aptoslabs.com/
- **Currency**: APT (testnet)

---

## 🔄 Getting More Testnet APT

If you need more testnet APT for gas fees:

1. Go to: https://faucet.testnet.aptoslabs.com/
2. Enter wallet address: `0x346a0fa67d42e63c5d713914fe46cb4ed38f011d21004122e3784b28437a1f3d`
3. Click "Mint" - you'll receive 1 APT per request
4. Wait 24 hours between requests (or use different wallets)

---

## 📝 Next Steps

### After Smart Contract Deployment:
Update `.env` with contract addresses:
```env
TOKEN_CONTRACT_ADDRESS=0x...
GOVERNANCE_CONTRACT_ADDRESS=0x...
TREASURY_CONTRACT_ADDRESS=0x...
```

### Optional Services (when needed):
- **Vercel**: Frontend deployment (sign up with GitHub - free)
- **Heroku/Railway**: Backend deployment (free tier available)
- **OpenAI**: If switching from Groq (has $5 free credits)

---

## 🛡️ Security Best Practices

✅ **DO**:
- Keep `.env` file out of version control (in `.gitignore`)
- Store backups in encrypted password manager
- Use separate wallets for dev/test/production
- Enable 2FA on all service accounts
- Rotate keys periodically

❌ **DON'T**:
- Commit `.env` to GitHub
- Share private keys in chat/email
- Use production keys in development
- Store keys in plain text files
- Screenshot keys and share publicly

---

## 📞 Support & Docs

- **Groq**: https://console.groq.com/docs
- **MongoDB**: https://docs.mongodb.com/
- **nft.storage**: https://nft.storage/docs/
- **Aptos**: https://aptos.dev/
- **Petra Wallet**: https://petra.app/docs

---

**Last Verified**: November 1, 2025  
**Status**: All credentials active and configured ✅
