/**
 * Proposal Schema
 * MongoDB schema for DAO proposals with comprehensive metadata
 */

const mongoose = require('mongoose');

// Team Member Sub-Schema
const teamMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team member name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name must be less than 100 characters'],
  },
  role: {
    type: String,
    required: [true, 'Team member role is required'],
    trim: true,
    maxlength: [100, 'Role must be less than 100 characters'],
  },
  experience: {
    type: String,
    required: [true, 'Team member experience is required'],
    trim: true,
    maxlength: [500, 'Experience must be less than 500 characters'],
  },
  walletAddress: {
    type: String,
    trim: true,
    match: [/^0x[a-fA-F0-9]{64}$/, 'Invalid Aptos wallet address format'],
  },
}, { _id: false });

// Milestone Sub-Schema
const milestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Milestone title is required'],
    trim: true,
    maxlength: [200, 'Title must be less than 200 characters'],
  },
  description: {
    type: String,
    required: [true, 'Milestone description is required'],
    trim: true,
    maxlength: [1000, 'Description must be less than 1000 characters'],
  },
  deadline: {
    type: Date,
    required: [true, 'Milestone deadline is required'],
  },
  deliverable: {
    type: String,
    required: [true, 'Milestone deliverable is required'],
    trim: true,
    maxlength: [500, 'Deliverable must be less than 500 characters'],
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'delayed', 'failed'],
    default: 'pending',
  },
  completedAt: {
    type: Date,
  },
}, { _id: true });

// Budget Breakdown Item Sub-Schema
const budgetItemSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'Budget category is required'],
    trim: true,
    maxlength: [100, 'Category must be less than 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Budget item description is required'],
    trim: true,
    maxlength: [300, 'Description must be less than 300 characters'],
  },
  amount: {
    type: Number,
    required: [true, 'Budget amount is required'],
    min: [0, 'Amount must be non-negative'],
  },
  percentage: {
    type: Number,
    min: [0, 'Percentage must be between 0 and 100'],
    max: [100, 'Percentage must be between 0 and 100'],
  },
}, { _id: false });

// Main Proposal Schema
const proposalSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Proposal title is required'],
    trim: true,
    minlength: [10, 'Title must be at least 10 characters'],
    maxlength: [200, 'Title must be less than 200 characters'],
    index: true,
  },
  
  description: {
    type: String,
    required: [true, 'Proposal description is required'],
    trim: true,
    minlength: [50, 'Description must be at least 50 characters'],
    maxlength: [5000, 'Description must be less than 5000 characters'],
  },
  
  sector: {
    type: String,
    required: [true, 'Proposal sector is required'],
    enum: [
      'marketing',
      'development',
      'operations',
      'research',
      'partnerships',
      'community',
      'infrastructure',
      'legal',
      'finance',
      'other',
    ],
    index: true,
  },
  
  // Submitter Information
  submitter: {
    walletAddress: {
      type: String,
      required: [true, 'Submitter wallet address is required'],
      trim: true,
      match: [/^0x[a-fA-F0-9]{64}$/, 'Invalid Aptos wallet address format'],
      index: true,
    },
    username: {
      type: String,
      trim: true,
      maxlength: [50, 'Username must be less than 50 characters'],
    },
  },
  
  // Investment Details
  amountRequested: {
    type: Number,
    required: [true, 'Amount requested is required'],
    min: [0, 'Amount must be non-negative'],
    index: true,
  },
  
  currency: {
    type: String,
    enum: ['APT', 'ACT', 'USD'],
    default: 'APT',
  },
  
  budgetBreakdown: {
    type: [budgetItemSchema],
    validate: {
      validator: function(breakdown) {
        if (!breakdown || breakdown.length === 0) return true;
        const total = breakdown.reduce((sum, item) => sum + item.amount, 0);
        return Math.abs(total - this.amountRequested) < 0.01; // Allow small floating point differences
      },
      message: 'Budget breakdown total must equal amount requested',
    },
  },
  
  // Team Information
  team: {
    type: [teamMemberSchema],
    validate: {
      validator: function(team) {
        return team && team.length > 0;
      },
      message: 'At least one team member is required',
    },
  },
  
  // Project Details
  projectGoals: {
    type: String,
    required: [true, 'Project goals are required'],
    trim: true,
    minlength: [50, 'Goals must be at least 50 characters'],
    maxlength: [2000, 'Goals must be less than 2000 characters'],
  },
  
  milestones: {
    type: [milestoneSchema],
    validate: {
      validator: function(milestones) {
        return milestones && milestones.length > 0;
      },
      message: 'At least one milestone is required',
    },
  },
  
  timeline: {
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function(endDate) {
          return endDate > this.timeline.startDate;
        },
        message: 'End date must be after start date',
      },
    },
    durationDays: {
      type: Number,
      min: [1, 'Duration must be at least 1 day'],
    },
  },
  
  // Risk and ROI
  riskAssessment: {
    type: String,
    required: [true, 'Risk assessment is required'],
    trim: true,
    minlength: [50, 'Risk assessment must be at least 50 characters'],
    maxlength: [2000, 'Risk assessment must be less than 2000 characters'],
  },
  
  expectedROI: {
    type: Number,
    min: [-100, 'ROI must be greater than -100%'],
    max: [10000, 'ROI must be less than 10000%'],
  },
  
  expectedROIDescription: {
    type: String,
    trim: true,
    maxlength: [1000, 'ROI description must be less than 1000 characters'],
  },
  
  // IPFS Storage
  ipfsHash: {
    type: String,
    trim: true,
    index: true,
  },
  
  attachments: [{
    name: String,
    ipfsHash: String,
    fileType: String,
    uploadedAt: Date,
  }],
  
  // Blockchain Integration
  onChainProposalId: {
    type: Number,
    index: true,
  },
  
  transactionHash: {
    type: String,
    trim: true,
  },
  
  // Status Tracking
  status: {
    type: String,
    enum: [
      'draft',           // Being created
      'submitted',       // Submitted for AI evaluation
      'evaluating',      // Under AI evaluation
      'evaluated',       // AI evaluation complete
      'pending-chain',   // Ready to submit to blockchain
      'on-chain',        // Submitted to blockchain
      'active',          // Voting in progress
      'approved',        // Voting passed
      'rejected',        // Voting failed
      'executed',        // Funds distributed
      'cancelled',       // Cancelled by creator/admin
      'expired',         // Voting period expired
    ],
    default: 'draft',
    required: true,
    index: true,
  },
  
  statusHistory: [{
    status: String,
    timestamp: Date,
    reason: String,
  }],
  
  // Timestamps
  submittedAt: {
    type: Date,
    index: true,
  },
  
  evaluatedAt: {
    type: Date,
  },
  
  onChainAt: {
    type: Date,
  },
  
  votingStartedAt: {
    type: Date,
  },
  
  votingEndsAt: {
    type: Date,
  },
  
  executedAt: {
    type: Date,
  },
  
  // Metadata
  views: {
    type: Number,
    default: 0,
    min: 0,
  },
  
  commentsCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  
  isArchived: {
    type: Boolean,
    default: false,
    index: true,
  },
  
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'proposals',
});

// Indexes for performance
proposalSchema.index({ 'submitter.walletAddress': 1, createdAt: -1 });
proposalSchema.index({ status: 1, submittedAt: -1 });
proposalSchema.index({ sector: 1, status: 1 });
proposalSchema.index({ amountRequested: 1 });
proposalSchema.index({ createdAt: -1 });
proposalSchema.index({ 'timeline.endDate': 1 });

// Text index for search functionality
proposalSchema.index({
  title: 'text',
  description: 'text',
  projectGoals: 'text',
  tags: 'text',
});

// Virtual for AI evaluation reference
proposalSchema.virtual('evaluation', {
  ref: 'AIEvaluation',
  localField: '_id',
  foreignField: 'proposalId',
  justOne: true,
});

// Virtual for duration calculation
proposalSchema.virtual('durationDays').get(function() {
  if (this.timeline && this.timeline.startDate && this.timeline.endDate) {
    const diffTime = Math.abs(this.timeline.endDate - this.timeline.startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Pre-save middleware to calculate duration
proposalSchema.pre('save', function(next) {
  if (this.timeline && this.timeline.startDate && this.timeline.endDate) {
    const diffTime = Math.abs(this.timeline.endDate - this.timeline.startDate);
    this.timeline.durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  next();
});

// Method to add status to history
proposalSchema.methods.addStatusChange = function(newStatus, reason = '') {
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    reason,
  });
  this.status = newStatus;
};

// Method to check if proposal is editable
proposalSchema.methods.isEditable = function() {
  return ['draft', 'submitted'].includes(this.status);
};

// Method to check if proposal can be submitted to chain
proposalSchema.methods.canSubmitToChain = function() {
  return this.status === 'evaluated' && !this.onChainProposalId;
};

// Static method to find active proposals
proposalSchema.statics.findActive = function() {
  return this.find({ status: 'active', isArchived: false }).sort({ votingStartedAt: -1 });
};

// Static method to find proposals by sector
proposalSchema.statics.findBySector = function(sector) {
  return this.find({ sector, isArchived: false }).sort({ createdAt: -1 });
};

// Static method to get proposals needing evaluation
proposalSchema.statics.findNeedingEvaluation = function() {
  return this.find({ status: 'submitted' }).sort({ submittedAt: 1 });
};

const Proposal = mongoose.model('Proposal', proposalSchema);

module.exports = Proposal;
