/**
 * Analytics Controller
 * 
 * Provides dashboard analytics and metrics:
 * - Overview statistics
 * - Proposal metrics
 * - Token metrics
 * - User engagement metrics
 */

const Proposal = require('../models/Proposal');
const User = require('../models/User');
const aptosService = require('../services/aptosService');

/**
 * Get Dashboard Overview
 * GET /api/analytics/overview
 */
async function getOverview(req, res) {
  try {
    console.log('Fetching dashboard overview...');

    // Parallel aggregations
    const [
      proposalStats,
      userStats,
      treasuryBalance,
    ] = await Promise.all([
      // Proposal statistics
      Proposal.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending_evaluation'] }, 1, 0] } },
            voting: { $sum: { $cond: [{ $eq: ['$status', 'voting'] }, 1, 0] } },
            approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
            rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
            totalFunding: { $sum: '$fundingAmount' },
          },
        },
      ]),
      // User statistics
      User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeVoters: { $sum: { $cond: [{ $gt: [{ $size: '$votingHistory' }, 0] }, 1, 0] } },
            totalVotes: { $sum: { $size: '$votingHistory' } },
          },
        },
      ]),
      // Treasury balance
      aptosService.getTreasuryBalance().catch(() => 0),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        proposals: proposalStats[0] || {
          total: 0,
          pending: 0,
          voting: 0,
          approved: 0,
          rejected: 0,
          totalFunding: 0,
        },
        users: userStats[0] || {
          totalUsers: 0,
          activeVoters: 0,
          totalVotes: 0,
        },
        treasury: {
          balance: treasuryBalance,
          currency: 'APT',
        },
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching overview:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch overview',
      details: error.message,
    });
  }
}

/**
 * Get Proposal Metrics
 * GET /api/analytics/proposals
 */
async function getProposalMetrics(req, res) {
  try {
    console.log('Fetching proposal metrics...');

    const metrics = await Proposal.aggregate([
      {
        $facet: {
          // By sector
          bySector: [
            { $group: { _id: '$sector', count: { $sum: 1 }, totalFunding: { $sum: '$fundingAmount' } } },
            { $sort: { count: -1 } },
          ],
          // By status
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          // AI score distribution
          aiScoreDistribution: [
            {
              $match: { 'aiEvaluation.totalScore': { $exists: true } },
            },
            {
              $bucket: {
                groupBy: '$aiEvaluation.totalScore',
                boundaries: [0, 20, 40, 60, 80, 100],
                default: 'Unknown',
                output: { count: { $sum: 1 } },
              },
            },
          ],
          // Funding analysis
          fundingAnalysis: [
            {
              $group: {
                _id: null,
                totalRequested: { $sum: '$fundingAmount' },
                avgFunding: { $avg: '$fundingAmount' },
                maxFunding: { $max: '$fundingAmount' },
                minFunding: { $min: '$fundingAmount' },
              },
            },
          ],
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: metrics[0],
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error fetching proposal metrics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch proposal metrics',
      details: error.message,
    });
  }
}

/**
 * Get Token Metrics
 * GET /api/analytics/tokens
 */
async function getTokenMetrics(req, res) {
  try {
    console.log('Fetching token metrics...');

    // Fetch all users
    const users = await User.find({}, 'walletAddress');

    // Fetch ACT balances in parallel
    const balancePromises = users.map(async (user) => {
      try {
        const balance = await aptosService.getACTBalance(user.walletAddress);
        return { address: user.walletAddress, balance };
      } catch (error) {
        console.error(`Error fetching balance for ${user.walletAddress}:`, error.message);
        return { address: user.walletAddress, balance: 0 };
      }
    });

    const balances = await Promise.all(balancePromises);

    // Calculate metrics
    const holders = balances.filter((b) => b.balance > 0);
    const totalSupply = balances.reduce((sum, b) => sum + b.balance, 0);
    const avgBalance = holders.length > 0 ? totalSupply / holders.length : 0;

    // Distribution
    const sortedBalances = holders.sort((a, b) => b.balance - a.balance);
    const top10Holders = sortedBalances.slice(0, 10);
    const top10Supply = top10Holders.reduce((sum, h) => sum + h.balance, 0);

    return res.status(200).json({
      success: true,
      data: {
        totalSupply,
        totalHolders: holders.length,
        averageBalance: avgBalance,
        distribution: {
          top10Holders: top10Holders.length,
          top10Supply,
          top10Percentage: totalSupply > 0 ? (top10Supply / totalSupply) * 100 : 0,
        },
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching token metrics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch token metrics',
      details: error.message,
    });
  }
}

/**
 * Get User Engagement Metrics
 * GET /api/analytics/users
 */
async function getUserMetrics(req, res) {
  try {
    console.log('Fetching user metrics...');

    const metrics = await User.aggregate([
      {
        $facet: {
          // Overview
          overview: [
            {
              $group: {
                _id: null,
                totalUsers: { $sum: 1 },
                totalVotes: { $sum: { $size: '$votingHistory' } },
                totalProposals: { $sum: { $size: '$proposalHistory' } },
              },
            },
          ],
          // Engagement levels
          engagement: [
            {
              $project: {
                votingActivity: { $size: '$votingHistory' },
                proposalActivity: { $size: '$proposalHistory' },
              },
            },
            {
              $bucket: {
                groupBy: '$votingActivity',
                boundaries: [0, 1, 5, 10, 20],
                default: '20+',
                output: { count: { $sum: 1 } },
              },
            },
          ],
          // Top contributors
          topVoters: [
            {
              $project: {
                walletAddress: 1,
                voteCount: { $size: '$votingHistory' },
              },
            },
            { $sort: { voteCount: -1 } },
            { $limit: 10 },
          ],
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: metrics[0],
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error fetching user metrics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user metrics',
      details: error.message,
    });
  }
}

module.exports = {
  getOverview,
  getProposalMetrics,
  getTokenMetrics,
  getUserMetrics,
};
