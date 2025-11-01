/**
 * User Schema
 * MongoDB schema for DAO stakeholders/users
 */

const mongoose = require('mongoose');

// User Activity Sub-Schema
const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'proposal_created',
      'proposal_voted',
      'dividend_claimed',
      'token_minted',
      'token_transferred',
      'profile_updated',
    ],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
  transactionHash: {
    type: String,
    trim: true,
  },
}, { _id: true });

// Notification Preferences Sub-Schema
const notificationPreferencesSchema = new mongoose.Schema({
  email: {
    enabled: { type: Boolean, default: false },
    address: { type: String, trim: true, lowercase: true },
    proposalUpdates: { type: Boolean, default: true },
    votingReminders: { type: Boolean, default: true },
    dividendAlerts: { type: Boolean, default: true },
    weeklyDigest: { type: Boolean, default: false },
  },
  inApp: {
    enabled: { type: Boolean, default: true },
    proposalUpdates: { type: Boolean, default: true },
    votingReminders: { type: Boolean, default: true },
    dividendAlerts: { type: Boolean, default: true },
  },
}, { _id: false });

// User Schema
const userSchema = new mongoose.Schema({
  // Wallet Information (Primary Identifier)
  walletAddress: {
    type: String,
    required: [true, 'Wallet address is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^0x[a-fA-F0-9]{64}$/, 'Invalid Aptos wallet address format'],
    index: true,
  },
  
  // Profile Information
  profile: {
    username: {
      type: String,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must be less than 30 characters'],
      match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'],
      sparse: true, // Allows null but enforces uniqueness when set
      index: true,
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: [50, 'Display name must be less than 50 characters'],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio must be less than 500 characters'],
    },
    avatar: {
      type: String, // URL or IPFS hash
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, 'Location must be less than 100 characters'],
    },
    website: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Invalid website URL'],
    },
    twitter: {
      type: String,
      trim: true,
      match: [/^@?[\w]{1,15}$/, 'Invalid Twitter handle'],
    },
    github: {
      type: String,
      trim: true,
    },
  },
  
  // Token Holdings (Cached from blockchain)
  tokenHoldings: {
    actBalance: {
      type: Number,
      default: 0,
      min: [0, 'Balance cannot be negative'],
    },
    aptBalance: {
      type: Number,
      default: 0,
      min: [0, 'Balance cannot be negative'],
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  
  // DAO Participation Statistics
  statistics: {
    proposalsCreated: {
      type: Number,
      default: 0,
      min: 0,
    },
    proposalsApproved: {
      type: Number,
      default: 0,
      min: 0,
    },
    proposalsRejected: {
      type: Number,
      default: 0,
      min: 0,
    },
    votescast: {
      type: Number,
      default: 0,
      min: 0,
    },
    votingPowerUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDividendsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    dividendsClaimed: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActiveAt: {
      type: Date,
    },
  },
  
  // Voting History (Reference)
  votingHistory: [{
    proposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
    },
    vote: {
      type: String,
      enum: ['for', 'against', 'abstain'],
    },
    votingPower: {
      type: Number,
      min: 0,
    },
    votedAt: {
      type: Date,
      default: Date.now,
    },
    transactionHash: {
      type: String,
    },
  }],
  
  // Dividend Claims History
  dividendClaims: [{
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    claimedAt: {
      type: Date,
      default: Date.now,
    },
    transactionHash: {
      type: String,
    },
    distributionId: {
      type: mongoose.Schema.Types.ObjectId,
    },
  }],
  
  // Activity Log
  recentActivity: {
    type: [activitySchema],
    validate: {
      validator: function(activities) {
        return activities.length <= 100; // Keep last 100 activities
      },
      message: 'Activity log cannot exceed 100 entries',
    },
  },
  
  // Reputation & Badges
  reputation: {
    score: {
      type: Number,
      default: 0,
      min: 0,
    },
    level: {
      type: String,
      enum: ['newcomer', 'contributor', 'active', 'veteran', 'leader'],
      default: 'newcomer',
    },
    badges: [{
      name: String,
      description: String,
      earnedAt: Date,
      iconUrl: String,
    }],
  },
  
  // Notification Preferences
  notifications: notificationPreferencesSchema,
  
  // Role & Permissions
  role: {
    type: String,
    enum: ['member', 'moderator', 'admin'],
    default: 'member',
    index: true,
  },
  
  permissions: [{
    type: String,
    enum: [
      'create_proposal',
      'vote',
      'claim_dividend',
      'moderate_proposals',
      'manage_users',
      'admin_actions',
    ],
  }],
  
  // Account Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'banned'],
    default: 'active',
    index: true,
  },
  
  suspensionReason: {
    type: String,
    trim: true,
  },
  
  suspendedUntil: {
    type: Date,
  },
  
  // Privacy Settings
  privacy: {
    showBalance: {
      type: Boolean,
      default: true,
    },
    showVotingHistory: {
      type: Boolean,
      default: true,
    },
    showActivity: {
      type: Boolean,
      default: true,
    },
  },
  
  // Verification
  isVerified: {
    type: Boolean,
    default: false,
  },
  
  verifiedAt: {
    type: Date,
  },
  
  // Timestamps
  firstSeenAt: {
    type: Date,
    default: Date.now,
  },
  
  lastLoginAt: {
    type: Date,
  },
  
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'users',
});

// Indexes for performance
userSchema.index({ walletAddress: 1 }, { unique: true });
userSchema.index({ 'profile.username': 1 }, { unique: true, sparse: true });
userSchema.index({ 'tokenHoldings.actBalance': -1 });
userSchema.index({ 'statistics.votescast': -1 });
userSchema.index({ 'statistics.proposalsCreated': -1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'reputation.score': -1 });

// Text index for search
userSchema.index({
  'profile.username': 'text',
  'profile.displayName': 'text',
  'profile.bio': 'text',
});

// Virtual for voting power (based on ACT balance)
userSchema.virtual('votingPower').get(function() {
  return this.tokenHoldings.actBalance;
});

// Virtual for pending dividends (would need to be calculated with treasury data)
userSchema.virtual('pendingDividends').get(function() {
  // This would be calculated based on treasury state
  // Placeholder for now
  return 0;
});

// Method to add activity
userSchema.methods.addActivity = function(type, details = {}, transactionHash = null) {
  this.recentActivity.unshift({
    type,
    timestamp: new Date(),
    details,
    transactionHash,
  });
  
  // Keep only last 100 activities
  if (this.recentActivity.length > 100) {
    this.recentActivity = this.recentActivity.slice(0, 100);
  }
  
  this.statistics.lastActiveAt = new Date();
};

// Method to record vote
userSchema.methods.recordVote = function(proposalId, vote, votingPower, transactionHash) {
  this.votingHistory.unshift({
    proposalId,
    vote,
    votingPower,
    votedAt: new Date(),
    transactionHash,
  });
  
  this.statistics.votesCast += 1;
  this.statistics.votingPowerUsed += votingPower;
  this.statistics.lastActiveAt = new Date();
  
  this.addActivity('proposal_voted', { proposalId, vote }, transactionHash);
};

// Method to record dividend claim
userSchema.methods.recordDividendClaim = function(amount, transactionHash, distributionId) {
  this.dividendClaims.unshift({
    amount,
    claimedAt: new Date(),
    transactionHash,
    distributionId,
  });
  
  this.statistics.dividendsClaimed += amount;
  this.statistics.lastActiveAt = new Date();
  
  this.addActivity('dividend_claimed', { amount }, transactionHash);
};

// Method to update token balances
userSchema.methods.updateBalances = async function(actBalance, aptBalance) {
  this.tokenHoldings.actBalance = actBalance;
  this.tokenHoldings.aptBalance = aptBalance;
  this.tokenHoldings.lastUpdated = new Date();
};

// Method to calculate reputation level
userSchema.methods.updateReputationLevel = function() {
  const score = this.reputation.score;
  
  if (score >= 1000) {
    this.reputation.level = 'leader';
  } else if (score >= 500) {
    this.reputation.level = 'veteran';
  } else if (score >= 200) {
    this.reputation.level = 'active';
  } else if (score >= 50) {
    this.reputation.level = 'contributor';
  } else {
    this.reputation.level = 'newcomer';
  }
};

// Method to check if user can vote
userSchema.methods.canVote = function() {
  return (
    this.status === 'active' &&
    this.tokenHoldings.actBalance > 0 &&
    (this.permissions.includes('vote') || this.role === 'member')
  );
};

// Method to check if user can create proposals
userSchema.methods.canCreateProposal = function() {
  return (
    this.status === 'active' &&
    (this.permissions.includes('create_proposal') || this.role !== 'member')
  );
};

// Static method to find top holders
userSchema.statics.findTopHolders = function(limit = 10) {
  return this.find({ status: 'active' })
    .sort({ 'tokenHoldings.actBalance': -1 })
    .limit(limit);
};

// Static method to find most active voters
userSchema.statics.findMostActiveVoters = function(limit = 10) {
  return this.find({ status: 'active' })
    .sort({ 'statistics.votesCast': -1 })
    .limit(limit);
};

// Static method to get user statistics
userSchema.statics.getUserStats = async function() {
  const result = await this.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        totalACTHolders: {
          $sum: { $cond: [{ $gt: ['$tokenHoldings.actBalance', 0] }, 1, 0] },
        },
        totalACTBalance: { $sum: '$tokenHoldings.actBalance' },
        avgACTBalance: { $avg: '$tokenHoldings.actBalance' },
        totalVotes: { $sum: '$statistics.votesCast' },
        totalProposals: { $sum: '$statistics.proposalsCreated' },
        totalDividends: { $sum: '$statistics.dividendsClaimed' },
      },
    },
  ]);
  return result[0] || null;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
