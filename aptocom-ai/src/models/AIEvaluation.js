/**
 * AI Evaluation Schema
 * MongoDB schema for AI-generated proposal evaluations
 */

const mongoose = require('mongoose');

// Individual Score Sub-Schema
const scoreSchema = new mongoose.Schema({
  value: {
    type: Number,
    required: [true, 'Score value is required'],
    min: [0, 'Score must be between 0 and 100'],
    max: [100, 'Score must be between 0 and 100'],
  },
  weight: {
    type: Number,
    required: [true, 'Score weight is required'],
    min: [0, 'Weight must be non-negative'],
    max: [1, 'Weight must be between 0 and 1'],
  },
  reasoning: {
    type: String,
    trim: true,
    maxlength: [1000, 'Reasoning must be less than 1000 characters'],
  },
}, { _id: false });

// AI Evaluation Schema
const aiEvaluationSchema = new mongoose.Schema({
  // Reference to Proposal
  proposalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proposal',
    required: [true, 'Proposal ID is required'],
    index: true,
    unique: true,
  },
  
  // Individual Evaluation Scores (0-100)
  scores: {
    // Strategic Alignment: How well does the proposal align with DAO goals?
    strategicAlignment: {
      type: scoreSchema,
      required: true,
    },
    
    // Feasibility: Can the team realistically achieve the proposed goals?
    feasibility: {
      type: scoreSchema,
      required: true,
    },
    
    // Team Capability: Does the team have necessary skills and experience?
    teamCapability: {
      type: scoreSchema,
      required: true,
    },
    
    // Financial Reasonableness: Is the budget appropriate and well-justified?
    financialReasonableness: {
      type: scoreSchema,
      required: true,
    },
    
    // ROI Potential: What's the expected return on investment?
    roiPotential: {
      type: scoreSchema,
      required: true,
    },
    
    // Risk Assessment: What are the risks and how well are they addressed?
    riskLevel: {
      type: scoreSchema,
      required: true,
    },
    
    // Milestone Clarity: Are milestones clear, measurable, and achievable?
    milestoneClarity: {
      type: scoreSchema,
      required: true,
    },
    
    // Transparency: Is the proposal transparent with detailed information?
    transparency: {
      type: scoreSchema,
      required: true,
    },
  },
  
  // Overall weighted score (0-100)
  overallScore: {
    type: Number,
    required: [true, 'Overall score is required'],
    min: [0, 'Overall score must be between 0 and 100'],
    max: [100, 'Overall score must be between 0 and 100'],
    index: true,
  },
  
  // AI Recommendation
  recommendation: {
    type: String,
    required: [true, 'Recommendation is required'],
    enum: [
      'strongly-approve',   // Score >= 80
      'approve',            // Score >= 60
      'review',             // Score >= 40
      'reject',             // Score >= 20
      'strongly-reject',    // Score < 20
    ],
    index: true,
  },
  
  // Confidence Level
  confidence: {
    type: Number,
    min: [0, 'Confidence must be between 0 and 100'],
    max: [100, 'Confidence must be between 0 and 100'],
    default: 85,
  },
  
  // Detailed AI Reasoning
  summary: {
    type: String,
    required: [true, 'Evaluation summary is required'],
    trim: true,
    minlength: [50, 'Summary must be at least 50 characters'],
    maxlength: [2000, 'Summary must be less than 2000 characters'],
  },
  
  strengths: [{
    type: String,
    trim: true,
    maxlength: [500, 'Strength must be less than 500 characters'],
  }],
  
  weaknesses: [{
    type: String,
    trim: true,
    maxlength: [500, 'Weakness must be less than 500 characters'],
  }],
  
  risks: [{
    type: String,
    trim: true,
    maxlength: [500, 'Risk must be less than 500 characters'],
  }],
  
  opportunities: [{
    type: String,
    trim: true,
    maxlength: [500, 'Opportunity must be less than 500 characters'],
  }],
  
  // Suggestions for Improvement
  suggestions: [{
    type: String,
    trim: true,
    maxlength: [500, 'Suggestion must be less than 500 characters'],
  }],
  
  // Questions/Clarifications Needed
  clarificationsNeeded: [{
    type: String,
    trim: true,
    maxlength: [500, 'Clarification must be less than 500 characters'],
  }],
  
  // AI Model Information
  aiModel: {
    provider: {
      type: String,
      enum: ['groq', 'openai', 'anthropic', 'other'],
      default: 'groq',
    },
    model: {
      type: String,
      required: true,
      default: 'llama-3.3-70b-versatile',
    },
    version: {
      type: String,
    },
  },
  
  // Evaluation Metadata
  evaluationVersion: {
    type: String,
    default: '1.0',
  },
  
  processingTime: {
    type: Number, // in milliseconds
    min: [0, 'Processing time must be non-negative'],
  },
  
  tokensUsed: {
    type: Number,
    min: [0, 'Tokens used must be non-negative'],
  },
  
  rawResponse: {
    type: String,
    // Store raw AI response for debugging/auditing
  },
  
  // Evaluation Status
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'failed', 'retrying'],
    default: 'pending',
    required: true,
  },
  
  error: {
    message: String,
    code: String,
    timestamp: Date,
  },
  
  // Timestamps
  startedAt: {
    type: Date,
  },
  
  completedAt: {
    type: Date,
    index: true,
  },
  
  // Human Override (if admin manually adjusts)
  humanOverride: {
    overridden: {
      type: Boolean,
      default: false,
    },
    overriddenBy: {
      type: String, // wallet address
    },
    overriddenAt: {
      type: Date,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Override reason must be less than 500 characters'],
    },
    originalRecommendation: {
      type: String,
      enum: ['strongly-approve', 'approve', 'review', 'reject', 'strongly-reject'],
    },
  },
  
}, {
  timestamps: true,
  collection: 'ai_evaluations',
});

// Indexes for performance
aiEvaluationSchema.index({ proposalId: 1 }, { unique: true });
aiEvaluationSchema.index({ overallScore: -1 });
aiEvaluationSchema.index({ recommendation: 1 });
aiEvaluationSchema.index({ completedAt: -1 });
aiEvaluationSchema.index({ status: 1 });

// Pre-save middleware to calculate overall score
aiEvaluationSchema.pre('save', function(next) {
  if (this.scores && !this.isModified('overallScore')) {
    const scoreKeys = Object.keys(this.scores);
    let totalScore = 0;
    let totalWeight = 0;
    
    scoreKeys.forEach(key => {
      if (this.scores[key] && this.scores[key].value !== undefined) {
        totalScore += this.scores[key].value * this.scores[key].weight;
        totalWeight += this.scores[key].weight;
      }
    });
    
    if (totalWeight > 0) {
      this.overallScore = Math.round((totalScore / totalWeight) * 100) / 100;
    }
  }
  next();
});

// Pre-save middleware to set recommendation based on score
aiEvaluationSchema.pre('save', function(next) {
  if (this.overallScore !== undefined && !this.isModified('recommendation')) {
    if (this.overallScore >= 80) {
      this.recommendation = 'strongly-approve';
    } else if (this.overallScore >= 60) {
      this.recommendation = 'approve';
    } else if (this.overallScore >= 40) {
      this.recommendation = 'review';
    } else if (this.overallScore >= 20) {
      this.recommendation = 'reject';
    } else {
      this.recommendation = 'strongly-reject';
    }
  }
  next();
});

// Method to get score breakdown
aiEvaluationSchema.methods.getScoreBreakdown = function() {
  const breakdown = {};
  Object.keys(this.scores).forEach(key => {
    breakdown[key] = {
      value: this.scores[key].value,
      weight: this.scores[key].weight,
      weightedScore: this.scores[key].value * this.scores[key].weight,
    };
  });
  return breakdown;
};

// Method to check if evaluation passed threshold
aiEvaluationSchema.methods.passesThreshold = function(threshold = 60) {
  return this.overallScore >= threshold;
};

// Static method to find evaluations by recommendation
aiEvaluationSchema.statics.findByRecommendation = function(recommendation) {
  return this.find({ recommendation, status: 'completed' }).sort({ completedAt: -1 });
};

// Static method to get average scores
aiEvaluationSchema.statics.getAverageScores = async function() {
  const result = await this.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: null,
        avgOverallScore: { $avg: '$overallScore' },
        avgStrategicAlignment: { $avg: '$scores.strategicAlignment.value' },
        avgFeasibility: { $avg: '$scores.feasibility.value' },
        avgTeamCapability: { $avg: '$scores.teamCapability.value' },
        avgFinancialReasonableness: { $avg: '$scores.financialReasonableness.value' },
        avgROIPotential: { $avg: '$scores.roiPotential.value' },
        avgRiskLevel: { $avg: '$scores.riskLevel.value' },
        avgMilestoneClarity: { $avg: '$scores.milestoneClarity.value' },
        avgTransparency: { $avg: '$scores.transparency.value' },
        totalEvaluations: { $sum: 1 },
      },
    },
  ]);
  return result[0] || null;
};

// Static method to get score distribution
aiEvaluationSchema.statics.getScoreDistribution = async function() {
  return this.aggregate([
    { $match: { status: 'completed' } },
    {
      $bucket: {
        groupBy: '$overallScore',
        boundaries: [0, 20, 40, 60, 80, 100],
        default: 'Other',
        output: {
          count: { $sum: 1 },
          proposals: { $push: '$proposalId' },
        },
      },
    },
  ]);
};

const AIEvaluation = mongoose.model('AIEvaluation', aiEvaluationSchema);

module.exports = AIEvaluation;
