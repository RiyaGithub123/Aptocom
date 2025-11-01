/**
 * Treasury Controller
 * 
 * Handles treasury operations including:
 * - Treasury balance queries
 * - Transaction history
 * - Dividend distribution
 * - Dividend claims
 * 
 * Integrates with:
 * - Aptos Service (blockchain treasury operations)
 * - MongoDB (User model for tracking)
 */

const User = require('../models/User');
const aptosService = require('../services/aptosService');

/**
 * Get Treasury Balance
 * GET /api/treasury/balance
 */
async function getTreasuryBalance(req, res) {
  try {
    console.log('Fetching treasury balance...');
    const balance = await aptosService.getTreasuryBalance();

    return res.status(200).json({
      success: true,
      data: {
        balance,
        currency: 'APT',
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching treasury balance:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch treasury balance',
      details: error.message,
    });
  }
}

/**
 * Get Treasury Transactions
 * GET /api/treasury/transactions
 */
async function getTreasuryTransactions(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query;

    // Note: In production, query from blockchain event logs or database
    // For MVP, return sample structure
    return res.status(200).json({
      success: true,
      data: {
        transactions: [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalCount: 0,
          limit: parseInt(limit),
        },
      },
      message: 'Transaction history feature coming soon',
    });
  } catch (error) {
    console.error('Error fetching treasury transactions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch treasury transactions',
      details: error.message,
    });
  }
}

/**
 * Distribute Dividends
 * POST /api/treasury/distribute
 */
async function distributeDividends(req, res) {
  try {
    const { amount, adminWallet } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number',
      });
    }

    if (!adminWallet) {
      return res.status(400).json({
        success: false,
        error: 'Admin wallet required for authorization',
      });
    }

    // Note: Actual implementation would trigger blockchain distribution
    console.log(`Distributing ${amount} APT as dividends...`);

    return res.status(200).json({
      success: true,
      message: 'Dividend distribution initiated',
      data: {
        amount,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error distributing dividends:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to distribute dividends',
      details: error.message,
    });
  }
}

/**
 * Get Claimable Dividends
 * GET /api/treasury/dividends/:address
 */
async function getClaimableDividends(req, res) {
  try {
    const { address } = req.params;

    if (!aptosService.isValidAptosAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Aptos wallet address format',
      });
    }

    console.log(`Fetching claimable dividends for ${address}...`);
    const claimable = await aptosService.getClaimableDividends(address);

    return res.status(200).json({
      success: true,
      data: {
        walletAddress: address,
        claimableAmount: claimable,
        currency: 'APT',
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching claimable dividends:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch claimable dividends',
      details: error.message,
    });
  }
}

/**
 * Claim Dividends
 * POST /api/treasury/claim
 */
async function claimDividends(req, res) {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required',
      });
    }

    if (!aptosService.isValidAptosAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Aptos wallet address format',
      });
    }

    console.log(`Claiming dividends for ${walletAddress}...`);
    const result = await aptosService.claimDividends(walletAddress);

    if (!result.success) {
      throw new Error(result.error || 'Failed to claim dividends');
    }

    // Update user activity
    await User.findOneAndUpdate(
      { walletAddress },
      {
        $push: {
          activityLog: {
            action: 'dividends_claimed',
            timestamp: new Date(),
            details: {
              amount: result.amount,
              transactionHash: result.transactionHash,
            },
          },
        },
      },
      { upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Dividends claimed successfully',
      data: {
        walletAddress,
        amount: result.amount,
        transactionHash: result.transactionHash,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error claiming dividends:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to claim dividends',
      details: error.message,
    });
  }
}

module.exports = {
  getTreasuryBalance,
  getTreasuryTransactions,
  distributeDividends,
  getClaimableDividends,
  claimDividends,
};
