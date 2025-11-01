/**
 * Analytics Schema
 * MongoDB schema for tracking DAO metrics and statistics
 */

const mongoose = require('mongoose');

// Analytics Snapshot Schema
const analyticsSchema = new mongoose.Schema({
  // Snapshot Type
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'custom'],
    required: true,
    index: true,
  },
  
  // Time Period
  period: {
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
  },
  
  // Proposal Metrics
  proposals: {
    total: {
      type: Number,
      default: 0,
      min: 0,
    },
    created: {
      type: Number,
      default: 0,
      min: 0,
    },
    submitted: {
      type: Number,
      default: 0,
      min: 0,
    },
    active: {
      type: Number,
      default: 0,
      min: 0,
    },
    approved: {
      type: Number,
      default: 0,
      min: 0,
    },
    rejected: {
      type: Number,
      default: 0,
      min: 0,
    },
    executed: {
      type: Number,
      default: 0,
      min: 0,
    },
    cancelled: {
      type: Number,
      default: 0,
      min: 0,
    },
    expired: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmountRequested: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmountApproved: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmountExecuted: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageApprovalRate: {
      type: Number,
      min: 0,
      max: 100,
    },
    bySector: {
      marketing: { type: Number, default: 0 },
      development: { type: Number, default: 0 },
      operations: { type: Number, default: 0 },
      research: { type: Number, default: 0 },
      partnerships: { type: Number, default: 0 },
      community: { type: Number, default: 0 },
      infrastructure: { type: Number, default: 0 },
      legal: { type: Number, default: 0 },
      finance: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
  },
  
  // Voting Metrics
  voting: {
    totalVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalVotingPower: {
      type: Number,
      default: 0,
      min: 0,
    },
    uniqueVoters: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageParticipationRate: {
      type: Number,
      min: 0,
      max: 100,
    },
    votesFor: {
      type: Number,
      default: 0,
      min: 0,
    },
    votesAgainst: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageTurnout: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
  
  // Token Metrics
  tokens: {
    totalSupply: {
      type: Number,
      default: 0,
      min: 0,
    },
    circulatingSupply: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalHolders: {
      type: Number,
      default: 0,
      min: 0,
    },
    activeHolders: {
      type: Number,
      default: 0,
      min: 0,
    },
    newHolders: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalTransfers: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalMinted: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalBurned: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    medianBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    top10HoldersPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
  
  // Treasury Metrics
  treasury: {
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDeposits: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalWithdrawals: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDividendsDistributed: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDividendsClaimed: {
      type: Number,
      default: 0,
      min: 0,
    },
    unclaimedDividends: {
      type: Number,
      default: 0,
      min: 0,
    },
    transactionCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageTransactionSize: {
      type: Number,
      default: 0,
      min: 0,
    },
    growthRate: {
      type: Number, // Percentage
    },
  },
  
  // AI Evaluation Metrics
  aiEvaluations: {
    totalEvaluations: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    averageProcessingTime: {
      type: Number, // milliseconds
      min: 0,
    },
    stronglyApproved: {
      type: Number,
      default: 0,
      min: 0,
    },
    approved: {
      type: Number,
      default: 0,
      min: 0,
    },
    review: {
      type: Number,
      default: 0,
      min: 0,
    },
    rejected: {
      type: Number,
      default: 0,
      min: 0,
    },
    stronglyRejected: {
      type: Number,
      default: 0,
      min: 0,
    },
    aiAccuracy: {
      type: Number, // Percentage of AI recommendations matching final vote
      min: 0,
      max: 100,
    },
  },
  
  // User Engagement Metrics
  users: {
    totalUsers: {
      type: Number,
      default: 0,
      min: 0,
    },
    activeUsers: {
      type: Number,
      default: 0,
      min: 0,
    },
    newUsers: {
      type: Number,
      default: 0,
      min: 0,
    },
    returningUsers: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageSessionDuration: {
      type: Number, // seconds
      min: 0,
    },
    dailyActiveUsers: {
      type: Number,
      default: 0,
      min: 0,
    },
    weeklyActiveUsers: {
      type: Number,
      default: 0,
      min: 0,
    },
    monthlyActiveUsers: {
      type: Number,
      default: 0,
      min: 0,
    },
    retentionRate: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
  
  // Platform Activity
  activity: {
    totalPageViews: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalProposalViews: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalComments: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageEngagementRate: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
  
  // Growth Trends
  trends: {
    proposalGrowth: {
      type: Number, // Percentage change
    },
    userGrowth: {
      type: Number, // Percentage change
    },
    tokenHolderGrowth: {
      type: Number, // Percentage change
    },
    treasuryGrowth: {
      type: Number, // Percentage change
    },
    votingParticipationGrowth: {
      type: Number, // Percentage change
    },
  },
  
  // Top Performers
  topPerformers: {
    topProposalCreators: [{
      walletAddress: String,
      count: Number,
    }],
    topVoters: [{
      walletAddress: String,
      votingPower: Number,
    }],
    topTokenHolders: [{
      walletAddress: String,
      balance: Number,
    }],
  },
  
  // Metadata
  calculatedAt: {
    type: Date,
    default: Date.now,
  },
  
  calculationDuration: {
    type: Number, // milliseconds
    min: 0,
  },
  
  dataSource: {
    type: String,
    enum: ['blockchain', 'database', 'hybrid'],
    default: 'hybrid',
  },
  
  version: {
    type: String,
    default: '1.0',
  },
  
}, {
  timestamps: true,
  collection: 'analytics',
});

// Indexes for performance
analyticsSchema.index({ type: 1, 'period.startDate': -1 });
analyticsSchema.index({ 'period.startDate': 1, 'period.endDate': 1 });
analyticsSchema.index({ calculatedAt: -1 });

// Static method to get latest snapshot
analyticsSchema.statics.getLatest = function(type = 'daily') {
  return this.findOne({ type }).sort({ 'period.startDate': -1 });
};

// Static method to get snapshot for date range
analyticsSchema.statics.getForPeriod = function(startDate, endDate, type = 'daily') {
  return this.find({
    type,
    'period.startDate': { $gte: startDate },
    'period.endDate': { $lte: endDate },
  }).sort({ 'period.startDate': 1 });
};

// Static method to calculate growth rate
analyticsSchema.statics.calculateGrowthRate = function(current, previous) {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

// Method to compare with previous period
analyticsSchema.methods.compareWithPrevious = async function() {
  const periodDuration = this.period.endDate - this.period.startDate;
  const previousStart = new Date(this.period.startDate.getTime() - periodDuration);
  const previousEnd = new Date(this.period.endDate.getTime() - periodDuration);
  
  const previous = await this.constructor.findOne({
    type: this.type,
    'period.startDate': previousStart,
    'period.endDate': previousEnd,
  });
  
  if (!previous) return null;
  
  return {
    proposals: {
      growth: this.constructor.calculateGrowthRate(
        this.proposals.total,
        previous.proposals.total
      ),
    },
    users: {
      growth: this.constructor.calculateGrowthRate(
        this.users.totalUsers,
        previous.users.totalUsers
      ),
    },
    treasury: {
      growth: this.constructor.calculateGrowthRate(
        this.treasury.balance,
        previous.treasury.balance
      ),
    },
    tokens: {
      growth: this.constructor.calculateGrowthRate(
        this.tokens.totalHolders,
        previous.tokens.totalHolders
      ),
    },
  };
};

const Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = Analytics;
