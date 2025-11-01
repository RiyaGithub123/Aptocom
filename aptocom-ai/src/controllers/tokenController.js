/**
 * Token Controller
 * 
 * Handles ACT token operations including:
 * - Balance queries (ACT and APT)
 * - Token minting (admin only)
 * - Token transfers
 * - Token metadata retrieval
 * 
 * Integrates with:
 * - Aptos Service (blockchain token operations)
 * - MongoDB (User model for activity tracking)
 */

const User = require('../models/User');
const aptosService = require('../services/aptosService');

/**
 * Get Token Balances
 * GET /api/tokens/balance/:address
 * 
 * Retrieves ACT and APT token balances for a wallet address
 * 
 * Path Parameters:
 * - address: Aptos wallet address
 */
async function getBalance(req, res) {
  try {
    const { address } = req.params;

    // Validate address
    if (!aptosService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Aptos wallet address format',
      });
    }

    console.log(`Fetching token balances for ${address}...`);

    // Get ACT and APT balances from blockchain
    const [actBalance, aptBalance] = await Promise.all([
      aptosService.getACTBalance(address),
      aptosService.getAPTBalance(address),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        walletAddress: address,
        balances: {
          ACT: actBalance,
          APT: aptBalance,
        },
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching token balances:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch token balances',
      details: error.message,
    });
  }
}

/**
 * Mint ACT Tokens
 * POST /api/tokens/mint
 * 
 * Mints ACT tokens to a specified address (admin only)
 * 
 * Request Body:
 * - toAddress: string (recipient Aptos address)
 * - amount: number (amount to mint)
 * - adminWallet: string (admin wallet for authorization)
 */
async function mintTokens(req, res) {
  try {
    const { toAddress, amount, adminWallet } = req.body;

    // Validation
    if (!toAddress) {
      return res.status(400).json({
        success: false,
        error: 'Recipient address is required',
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number',
      });
    }

    if (!adminWallet) {
      return res.status(400).json({
        success: false,
        error: 'Admin wallet address is required for authorization',
      });
    }

    // Validate addresses
    if (!aptosService.isValidAddress(toAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid recipient address format',
      });
    }

    if (!aptosService.isValidAddress(adminWallet)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid admin wallet address format',
      });
    }

    // Note: In production, verify adminWallet is actually an admin
    // For now, using service account from environment
    console.log(`Minting ${amount} ACT tokens to ${toAddress}...`);

    const result = await aptosService.mintACT(toAddress, amount);

    if (!result.success) {
      throw new Error(result.error || 'Failed to mint tokens');
    }

    console.log(`Tokens minted successfully. Transaction: ${result.transactionHash}`);

    // Update user activity
    await User.findOneAndUpdate(
      { walletAddress: toAddress },
      {
        $push: {
          activityLog: {
            action: 'tokens_received',
            timestamp: new Date(),
            details: {
              amount,
              tokenType: 'ACT',
              transactionHash: result.transactionHash,
            },
          },
        },
      },
      { upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Tokens minted successfully',
      data: {
        toAddress,
        amount,
        transactionHash: result.transactionHash,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error minting tokens:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to mint tokens',
      details: error.message,
    });
  }
}

/**
 * Transfer ACT Tokens
 * POST /api/tokens/transfer
 * 
 * Transfers ACT tokens from one address to another
 * 
 * Request Body:
 * - fromAddress: string (sender Aptos address)
 * - toAddress: string (recipient Aptos address)
 * - amount: number (amount to transfer)
 */
async function transferTokens(req, res) {
  try {
    const { fromAddress, toAddress, amount } = req.body;

    // Validation
    if (!fromAddress) {
      return res.status(400).json({
        success: false,
        error: 'Sender address is required',
      });
    }

    if (!toAddress) {
      return res.status(400).json({
        success: false,
        error: 'Recipient address is required',
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number',
      });
    }

    // Validate addresses
    if (!aptosService.isValidAddress(fromAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid sender address format',
      });
    }

    if (!aptosService.isValidAddress(toAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid recipient address format',
      });
    }

    // Check sender's balance
    const balance = await aptosService.getACTBalance(fromAddress);
    if (balance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient ACT balance',
        data: {
          currentBalance: balance,
          requestedAmount: amount,
        },
      });
    }

    console.log(`Transferring ${amount} ACT from ${fromAddress} to ${toAddress}...`);

    const result = await aptosService.transferACT(fromAddress, toAddress, amount);

    if (!result.success) {
      throw new Error(result.error || 'Failed to transfer tokens');
    }

    console.log(`Transfer successful. Transaction: ${result.transactionHash}`);

    // Update activity for both users
    const timestamp = new Date();
    await Promise.all([
      User.findOneAndUpdate(
        { walletAddress: fromAddress },
        {
          $push: {
            activityLog: {
              action: 'tokens_sent',
              timestamp,
              details: {
                toAddress,
                amount,
                tokenType: 'ACT',
                transactionHash: result.transactionHash,
              },
            },
          },
        },
        { upsert: true }
      ),
      User.findOneAndUpdate(
        { walletAddress: toAddress },
        {
          $push: {
            activityLog: {
              action: 'tokens_received',
              timestamp,
              details: {
                fromAddress,
                amount,
                tokenType: 'ACT',
                transactionHash: result.transactionHash,
              },
            },
          },
        },
        { upsert: true }
      ),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Transfer successful',
      data: {
        fromAddress,
        toAddress,
        amount,
        transactionHash: result.transactionHash,
        timestamp,
      },
    });
  } catch (error) {
    console.error('Error transferring tokens:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to transfer tokens',
      details: error.message,
    });
  }
}

/**
 * Get Token Info
 * GET /api/tokens/info
 * 
 * Retrieves ACT token metadata and information
 */
async function getTokenInfo(req, res) {
  try {
    // Token metadata (from smart contract)
    const tokenInfo = {
      name: 'AptoCom Token',
      symbol: 'ACT',
      decimals: 8,
      description: 'Governance token for AptoCom DAO',
      network: 'Aptos Testnet',
      standard: 'Aptos Fungible Asset (FA)',
      contractAddress: process.env.TOKEN_CONTRACT_ADDRESS,
      features: [
        'Voting power in DAO governance',
        'Dividend entitlement from treasury',
        'Tradable on Aptos DEXs',
        'Transferable between wallets',
      ],
      links: {
        explorer: `https://explorer.aptoslabs.com/account/${process.env.TOKEN_CONTRACT_ADDRESS}?network=testnet`,
        docs: '/docs/act-token',
      },
    };

    return res.status(200).json({
      success: true,
      data: tokenInfo,
    });
  } catch (error) {
    console.error('Error fetching token info:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch token information',
      details: error.message,
    });
  }
}

/**
 * Get Token Statistics
 * GET /api/tokens/stats
 * 
 * Retrieves aggregate token statistics
 */
async function getTokenStats(req, res) {
  try {
    // Get all users with ACT balances
    const users = await User.find({}).select('walletAddress').lean();

    // Fetch balances for all users
    const balancePromises = users.map(user =>
      aptosService.getACTBalance(user.walletAddress).catch(() => 0)
    );
    const balances = await Promise.all(balancePromises);

    // Calculate statistics
    const totalHolders = balances.filter(b => b > 0).length;
    const totalSupply = balances.reduce((sum, balance) => sum + balance, 0);
    const averageHolding = totalHolders > 0 ? totalSupply / totalHolders : 0;

    // Calculate distribution
    const largestHolder = Math.max(...balances);
    const smallestNonZeroHolder = Math.min(...balances.filter(b => b > 0));

    return res.status(200).json({
      success: true,
      data: {
        totalSupply,
        totalHolders,
        averageHolding: parseFloat(averageHolding.toFixed(2)),
        largestHolder,
        smallestHolder: smallestNonZeroHolder,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching token stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch token statistics',
      details: error.message,
    });
  }
}

module.exports = {
  getBalance,
  mintTokens,
  transferTokens,
  getTokenInfo,
  getTokenStats,
};
