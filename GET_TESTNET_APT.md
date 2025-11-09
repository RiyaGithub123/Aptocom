# 🚰 How to Get Testnet APT

## Quick Guide: Fund Your Wallet with Testnet APT

### Why You Need APT:
- APT is the native token of the Aptos blockchain
- You need APT to pay for transaction gas fees
- You need APT to purchase ACT tokens in the AptoCom DAO
- Testnet APT is **FREE** - it's just for testing!

---

## 📝 Step-by-Step Instructions

### Method 1: Using Aptos Faucet Website (Recommended)

**1. Copy Your Wallet Address:**
- Open your Petra wallet extension
- Click the copy icon next to your address
- Or copy it from the AptoCom app (shown in the warning banner)

**Example address format:**
```
0x2ce4817959cd6d6035ef1c1d5effe3ae40b687e78b1494520155a181af6286a0
```

**2. Go to Aptos Testnet Faucet:**
```
https://faucet.testnet.aptoslabs.com/
```

**3. Paste Your Address:**
- Paste your wallet address into the input field
- Click "Fund Account" button

**4. Wait for Confirmation:**
- ⏱️ Takes ~5-10 seconds
- You'll receive **1 APT** (100,000,000 octas)

**5. Refresh Your Wallet:**
- Open Petra wallet
- You should see **1.00 APT** balance
- Refresh the AptoCom app to see updated balance

---

### Method 2: Using Petra Wallet Built-in Faucet

**1. Open Petra Wallet:**
- Click the Petra extension icon in your browser

**2. Click "Faucet" Button:**
- Look for the "Faucet" or "Get Testnet APT" button
- Usually located in the wallet interface

**3. Confirm:**
- Click to request testnet APT
- Wait ~5-10 seconds

**4. Check Balance:**
- Your balance should update to 1 APT
- Refresh AptoCom app

---

### Method 3: Using Aptos CLI (Advanced)

If you have Aptos CLI installed:

```bash
aptos account fund-with-faucet --account YOUR_ADDRESS_HERE
```

Example:
```bash
aptos account fund-with-faucet --account 0x2ce4817959cd6d6035ef1c1d5effe3ae40b687e78b1494520155a181af6286a0
```

---

## ✅ Verify Your Balance

### In Petra Wallet:
- Open wallet extension
- Check "Aptos Coin" balance
- Should show **1.00 APT** or more

### In AptoCom App:
- Go to Token Purchase page (`http://localhost:3000/token-purchase`)
- Check "Your APT Balance" field
- Should show **1.0000 APT**
- Warning banner should disappear

### On Aptos Explorer:
```
https://explorer.aptoslabs.com/account/YOUR_ADDRESS_HERE?network=testnet
```

---

## 🎯 Next Steps After Getting APT

### 1. Purchase ACT Tokens:
- Go to Token Purchase page
- Enter amount of APT to spend (e.g., 0.5 APT)
- You'll receive 50 ACT tokens (1 APT = 100 ACT)
- Keep 0.05 APT for gas fees

### 2. Create a Proposal:
- Go to Create Proposal page
- Fill out the form
- Requires 1 ACT fee to submit

### 3. Vote on Proposals:
- Go to Voting page
- Browse active proposals
- Cast your vote (requires small gas fee in APT)

---

## 🔧 Troubleshooting

### Issue: "Transaction failed" or "Insufficient balance"
**Solution:**
- Wait 30 seconds and try faucet again
- Make sure you're on **Testnet** network in Petra wallet
- Check if address was copied correctly (no extra spaces)

### Issue: Balance not updating in AptoCom
**Solution:**
- Wait 10-15 seconds for blockchain to confirm
- Refresh the browser page (F5)
- Disconnect and reconnect wallet
- Check balance auto-refreshes every 15 seconds

### Issue: Faucet says "Too many requests"
**Solution:**
- Aptos faucet has rate limits
- Wait 1 hour and try again
- Use different wallet address temporarily
- Ask in Aptos Discord for manual funding

### Issue: Still showing "No APT CoinStore found"
**Solution:**
- Make sure transaction confirmed on faucet
- Check wallet is on Testnet (not Mainnet or Devnet)
- Verify address on explorer has transactions
- Account needs at least 1 transaction to initialize

---

## 📊 APT vs ACT Tokens

| Token | Purpose | How to Get |
|-------|---------|------------|
| **APT** | Native Aptos token for gas fees | Free from testnet faucet |
| **ACT** | AptoCom DAO governance token | Purchase with APT (1 APT = 100 ACT) |

**Example:**
- You have: **1.0 APT** (from faucet)
- You spend: **0.5 APT** (to buy ACT)
- You receive: **50 ACT tokens**
- You keep: **0.5 APT** (for gas fees)

---

## 🌐 Important Links

| Resource | URL |
|----------|-----|
| **Aptos Testnet Faucet** | https://faucet.testnet.aptoslabs.com/ |
| **Aptos Explorer** | https://explorer.aptoslabs.com/?network=testnet |
| **Petra Wallet** | https://petra.app/ |
| **Aptos Docs** | https://aptos.dev/guides/getting-started |
| **Aptos Discord** | https://discord.gg/aptoslabs |

---

## 💡 Pro Tips

### 1. Keep Some APT for Gas:
- Always keep **0.1-0.2 APT** for gas fees
- Each transaction costs ~0.001-0.01 APT
- Don't spend all your APT!

### 2. Multiple Faucet Requests:
- Can request from faucet multiple times
- Limited to once per hour per address
- Create multiple test wallets if needed

### 3. Monitor Your Balance:
- AptoCom auto-refreshes balance every 15 seconds
- Manual refresh available (disconnect/reconnect wallet)
- Check explorer for confirmed transactions

### 4. Testnet vs Mainnet:
- **Testnet APT = FREE** (for testing only)
- **Mainnet APT = REAL MONEY** (has actual value)
- Always use Testnet for development!

---

## 🎉 Success Indicators

You'll know it worked when:
- ✅ Petra wallet shows 1+ APT balance
- ✅ AptoCom shows 1.0000 APT (not 0.0000)
- ✅ Warning banner disappears
- ✅ "Buy ACT Tokens" button is enabled
- ✅ Available for Purchase shows positive amount
- ✅ Can enter APT amount in purchase form

---

## 🆘 Still Having Issues?

1. **Check Network:**
   - Open Petra wallet
   - Top bar should say "Testnet" with red dot
   - If it says "Mainnet" or "Devnet", switch to Testnet

2. **Check Address:**
   - Make sure using correct wallet address
   - Petra can have multiple accounts
   - Verify connected account matches funded address

3. **Clear Cache:**
   - Sometimes browser cache causes issues
   - Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
   - Or clear browser cache completely

4. **Restart Servers:**
   ```bash
   # Stop both servers (Ctrl+C)
   # Restart backend
   cd aptocom-ai
   npm start
   
   # Restart frontend (new terminal)
   cd frontend
   npm run dev
   ```

---

**Last Updated:** November 9, 2025  
**AptoCom Version:** 1.0.0  
**Network:** Aptos Testnet

🚀 **Once you have APT, you're ready to participate in AptoCom DAO!**
