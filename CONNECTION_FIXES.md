# 🔧 AptoCom Connection Fixes & Token Details

**Date**: November 1, 2025  
**Status**: Comprehensive Analysis Complete

---

## 🔍 Issues Identified

### 1. **Backend Environment Variable Mismatch** ✅ FIXED
- **Problem**: `aptosService.js` was using `process.env.CONTRACT_ADDRESS`
- **Reality**: `.env` file has `TOKEN_CONTRACT_ADDRESS`
- **Fix Applied**: Updated aptosService to check both variables
- **Impact**: Backend can now properly connect to smart contracts

### 2. **Frontend Showing Mock/Arbitrary Data**
- **Treasury Page**: Uses hardcoded `dividendData` mock object
- **Analytics Page**: Backend returns real database data, but empty collections show zeros
- **Root Cause**: No proposal or user data in MongoDB yet

### 3. **Token Purchase "Insufficient Balance" Issue**
- **Symptom**: User has APT but can't purchase ACT tokens
- **Possible Causes**:
  1. Gas fees not accounted for (needs APT for gas)
  2. Contract not initialized on the wallet's account
  3. Frontend APT balance check too strict
  4. Missing fungible asset store on user account

---

## 📊 Token Details (ACT Token)

### Smart Contract Specifications
```
Module: aptocom::act_token
Contract Address: 0x346a0fa67d42e63c5d713914fe46cb4ed38f011d21004122e3784b28437a1f3d
Network: Aptos Testnet (Chain ID: 2022)
```

### Token Properties
| Property | Value |
|----------|-------|
| **Name** | AptoCom Token |
| **Symbol** | ACT |
| **Decimals** | 8 |
| **Standard** | Aptos Fungible Asset (FA) |
| **Icon URI** | https://aptocom.io/act-icon.png |
| **Project URI** | https://aptocom.io |

### Token Functions Available

#### **View Functions** (Read-Only)
- `balance_of(account: address)` → Returns user's ACT balance
- `total_supply()` → Returns total ACT minted
- `get_metadata()` → Returns token metadata object
- `get_admin()` → Returns admin address
- `get_deployer()` → Returns @aptocom address
- `name()` → Returns "AptoCom Token"
- `symbol()` → Returns "ACT"
- `decimals()` → Returns 8

#### **Entry Functions** (Transactions)
- `initialize(admin: &signer)` → Initialize token (already done)
- `mint(admin: &signer, to: address, amount: u64)` → Mint new tokens (admin only)
- `transfer(from: &signer, to: address, amount: u64)` → Transfer tokens
- `burn(admin: &signer, from: address, amount: u64)` → Burn tokens (admin only)
- `burn_from_self(from: &signer, amount: u64)` → User burns own tokens

### Exchange Rate
```
1 APT = 100 ACT (configured in frontend .env)
```

---

## 🔗 Connection Architecture

### Current Setup
```
Frontend (React)
    ↓ [Direct Blockchain Call via Aptos SDK]
Aptos Testnet
    ↓ [Query/Transaction]
Smart Contracts (@aptocom)
    ├── act_token.move
    ├── governance.move
    └── treasury.move

Frontend (React)
    ↓ [REST API Call]
Backend (Express)
    ↓ [Aptos SDK]
Aptos Testnet
    ↓ [MongoDB for metadata]
Database (MongoDB Atlas)
```

### What's Connected ✅
1. **Backend → MongoDB**: ✅ Connected (`aptocom.xhdymta.mongodb.net`)
2. **Backend → Aptos RPC**: ✅ Connected (`fullnode.testnet.aptoslabs.com`)
3. **Backend → AI (Groq)**: ✅ Connected (API key valid)
4. **Backend → IPFS (nft.storage)**: ✅ Connected (API key valid)
5. **Frontend → Backend API**: ✅ Connected (`localhost:5000`)
6. **Frontend → Aptos RPC**: ✅ Connected (same testnet node)

### What's NOT Fully Working ⚠️
1. **Token Purchase Flow**: Frontend → Wallet → Blockchain mint function
2. **Treasury Balance**: Backend queries but treasury may be empty (no funds yet)
3. **Analytics Data**: Backend queries empty collections (no historical data)

---

## 🐛 Root Cause Analysis

### Issue #1: Arbitrary Data in Treasury Page
**Diagnosis**: Treasury.jsx uses hardcoded mock data:
```javascript
const [dividendData] = useState({
    totalDistributed: 1250.5,  // MOCK DATA
    yourShare: 45.75,            // MOCK DATA
    lastDistribution: '2025-10-15',  // MOCK DATA
    nextDistribution: '2025-11-15',  // MOCK DATA
    claimableAmount: 12.35      // MOCK DATA
});
```
**Fix Needed**: Connect to backend API endpoint `/api/treasury/dividends/:address`

### Issue #2: Analytics Showing Arbitrary Values
**Diagnosis**: Backend returns correct structure but empty data:
- Zero proposals in MongoDB → Shows 0 proposals
- Zero users in MongoDB → Shows 0 users
- Treasury has 0 APT → Shows 0.0000 APT
**Not a Bug**: This is expected on fresh deployment with no activity yet

### Issue #3: Token Purchase Shows "Insufficient Tokens"
**Diagnosis**: Multiple possible causes:
1. **Gas Fees**: User needs to keep ~0.05 APT for gas fees, but check compares full balance
2. **Fungible Asset Store**: ACT token requires a fungible asset store on user's account
3. **Contract Not Initialized**: The mint function might be failing on-chain

**Current Code Check**:
```javascript
if (amountNum > aptBalance) {
    toast.error('Insufficient APT balance');
    return;
}
```
**Problem**: Doesn't account for gas fees! If user has 0.5 APT and tries to spend 0.5, transaction will fail.

---

## 🛠️ Fixes Required

### Fix #1: Treasury Page - Connect to Backend API ✅ TO DO
**File**: `frontend/src/pages/Treasury.jsx`
**Action**: Replace mock data with API calls

```javascript
// Add API call
import { getDividendInfo } from '../services/api';

// In component
const [dividendData, setDividendData] = useState(null);

useEffect(() => {
    if (connected && account) {
        getDividendInfo(account.address).then(setDividendData);
    }
}, [connected, account]);
```

### Fix #2: Token Purchase - Account for Gas Fees ✅ TO DO
**File**: `frontend/src/pages/TokenPurchase.jsx`
**Action**: Reserve gas fees in balance check

```javascript
const GAS_RESERVE = 0.05; // Reserve 0.05 APT for gas fees

const handleBuy = async () => {
    // ...
    if (amountNum > (aptBalance - GAS_RESERVE)) {
        toast.error(`Insufficient APT balance. Please keep ${GAS_RESERVE} APT for gas fees.`);
        return;
    }
    // ...
}
```

### Fix #3: Token Purchase - Ensure FA Store Exists ✅ TO DO
**Issue**: Users need a fungible asset store for ACT tokens
**Solution**: Check if store exists, if not, create it first

**Need to add in smart contract or frontend**:
```javascript
// Check if primary store exists for ACT token
const hasFAStore = await checkFungibleAssetStore(account.address);
if (!hasFAStore) {
    await createPrimaryStore(account, actTokenMetadata);
}
```

### Fix #4: Backend Treasury Controller - Fix isValidAddress ✅ DONE
Already applied in previous fixes

---

## 📋 Implementation Status

### ✅ Completed
1. Backend `userController.js` - Fixed `isValidAptosAddress()` function calls
2. Backend `aptosService.js` - Fixed CONTRACT_ADDRESS env variable reading
3. Frontend `tokenService.js` - Fixed ACT balance query using view function
4. Backend `userController.js` - Fixed ACT balance object structure handling

### ⏳ Pending
1. Treasury page dividend data API integration
2. Token purchase gas fee reservation
3. Token purchase FA store initialization check
4. Populate MongoDB with test data for analytics

---

## 🧪 Testing Checklist

### Backend Health Check
```bash
curl http://localhost:5000/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Check Contract on Explorer
Visit: https://explorer.aptoslabs.com/account/0x346a0fa67d42e63c5d713914fe46cb4ed38f011d21004122e3784b28437a1f3d?network=testnet

Verify:
- [ ] Modules exist (act_token, governance, treasury)
- [ ] Resources show TokenController
- [ ] Resources show TokenRefs

### Test Token Balance Query
```bash
# Via backend
curl http://localhost:5000/api/users/YOUR_WALLET_ADDRESS

# Should return user profile with actBalance field
```

### Test Token Purchase Flow
1. Connect wallet with sufficient APT (>0.1 APT recommended)
2. Try purchasing 0.01 APT worth of ACT
3. Check console for errors
4. Verify transaction on explorer if submitted

---

## 📊 Current State Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Smart Contracts | ✅ Deployed | All 3 modules on testnet |
| Backend API | ✅ Running | 24 endpoints operational |
| Frontend UI | ✅ Running | 10 pages accessible |
| MongoDB | ✅ Connected | Empty collections (fresh) |
| Wallet Integration | ⚠️ Partial | Connected but purchase fails |
| ACT Balance Query | ✅ Working | View function operational |
| Token Purchase | ❌ Failing | Insufficient balance error |
| Treasury Data | ⚠️ Mock | Hardcoded values, not API |
| Analytics Data | ✅ Working | Returns zeros (no data yet) |

---

## 🎯 Recommended Next Steps

### Immediate (High Priority)
1. **Fix Token Purchase Gas Issue** - Add 0.05 APT reserve
2. **Test Purchase Flow** - Verify with small amount
3. **Connect Treasury to API** - Replace mock data

### Short Term (Medium Priority)
4. **Create Test Data** - Add sample proposals to MongoDB
5. **Test Dividend Flow** - Verify claims work end-to-end
6. **Verify All Endpoints** - Full API testing

### Long Term (Low Priority)
7. **Add Transaction History** - Store blockchain events in DB
8. **Optimize Queries** - Add caching layer
9. **Production Deployment** - Deploy to mainnet

---

## 🔑 Key Environment Variables

### Backend (.env)
```properties
TOKEN_CONTRACT_ADDRESS=0x346a0fa67d42e63c5d713914fe46cb4ed38f011d21004122e3784b28437a1f3d
SERVICE_WALLET_PRIVATE_KEY=<your-service-wallet-private-key>
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/
GROQ_API_KEY=<your-groq-api-key>
NFT_STORAGE_API_KEY=<your-nft-storage-api-key>
```

### Frontend (.env)
```properties
VITE_ACT_TOKEN_ADDRESS=0x346a0fa67d42e63c5d713914fe46cb4ed38f011d21004122e3784b28437a1f3d
VITE_BACKEND_URL=http://localhost:5000
VITE_APTOS_NETWORK=testnet
VITE_ACT_EXCHANGE_RATE=100
```

---

**Last Updated**: November 1, 2025  
**Next Review**: After implementing gas fee fix
