/**
 * User Controller
 * 
 * Handles user profile operations:
 * - User registration/creation
 * - Profile retrieval
 * - Profile updates
 * - Activity logs
 */

const User = require('../models/User');
const aptosService = require('../services/aptosService');

/**
 * Register/Create User
 * POST /api/users/register
 */
async function registerUser(req, res) {
  try {
    const { walletAddress, name, bio, socials } = req.body;

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

    // Check if user exists
    let user = await User.findOne({ walletAddress });

    if (user) {
      return res.status(200).json({
        success: true,
        message: 'User already exists',
        data: {
          walletAddress: user.walletAddress,
          name: user.name,
          registeredAt: user.createdAt,
        },
      });
    }

    // Create new user
    user = new User({
      walletAddress,
      name: name || '',
      bio: bio || '',
      socials: socials || {},
      votingHistory: [],
      proposalHistory: [],
      activityLog: [
        {
          action: 'user_registered',
          timestamp: new Date(),
        },
      ],
    });

    await user.save();

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        walletAddress: user.walletAddress,
        name: user.name,
        registeredAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to register user',
      details: error.message,
    });
  }
}

/**
 * Get User Profile
 * GET /api/users/:address
 */
async function getUserProfile(req, res) {
  try {
    const { address } = req.params;

    if (!aptosService.isValidAptosAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Aptos wallet address format',
      });
    }

    const user = await User.findOne({ walletAddress: address });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Get ACT balance
    let actBalance = {
      balance: '0',
      balanceFormatted: '0.00000000',
      decimals: 8,
      symbol: 'ACT',
    };
    try {
      actBalance = await aptosService.getACTBalance(address);
    } catch (error) {
      console.error('Error fetching ACT balance:', error.message);
    }

    return res.status(200).json({
      success: true,
      data: {
        walletAddress: user.walletAddress,
        name: user.name,
        bio: user.bio,
        socials: user.socials,
        actBalance: actBalance.balanceFormatted || '0.00000000',
        actBalanceRaw: actBalance.balance || '0',
        stats: {
          votingCount: user.votingHistory.length,
          proposalCount: user.proposalHistory.length,
          registeredAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile',
      details: error.message,
    });
  }
}

/**
 * Update User Profile
 * PUT /api/users/:address
 */
async function updateUserProfile(req, res) {
  try {
    const { address } = req.params;
    const { name, bio, socials } = req.body;

    if (!aptosService.isValidAptosAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Aptos wallet address format',
      });
    }

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (bio !== undefined) updateFields.bio = bio;
    if (socials !== undefined) updateFields.socials = socials;

    const user = await User.findOneAndUpdate(
      { walletAddress: address },
      {
        ...updateFields,
        $push: {
          activityLog: {
            action: 'profile_updated',
            timestamp: new Date(),
          },
        },
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        walletAddress: user.walletAddress,
        name: user.name,
        bio: user.bio,
        socials: user.socials,
      },
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update user profile',
      details: error.message,
    });
  }
}

/**
 * Get User Activity Log
 * GET /api/users/:address/activity
 */
async function getUserActivity(req, res) {
  try {
    const { address } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!aptosService.isValidAptosAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Aptos wallet address format',
      });
    }

    const user = await User.findOne({ walletAddress: address });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Paginate activity log
    const activityLog = user.activityLog || [];
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedActivity = activityLog
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(startIndex, endIndex);

    return res.status(200).json({
      success: true,
      data: {
        activities: paginatedActivity,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(activityLog.length / parseInt(limit)),
          totalCount: activityLog.length,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user activity',
      details: error.message,
    });
  }
}

module.exports = {
  registerUser,
  getUserProfile,
  updateUserProfile,
  getUserActivity,
};
