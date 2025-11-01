/**
 * Proposal Controller
 * 
 * Handles all proposal-related business logic including:
 * - Proposal creation with IPFS document upload
 * - AI evaluation triggering
 * - Blockchain submission
 * - Status updates and filtering
 * - Proposal retrieval and listing
 * 
 * Integrates with:
 * - MongoDB (Proposal, AIEvaluation models)
 * - IPFS Service (document storage)
 * - AI Service (proposal evaluation)
 * - Aptos Service (blockchain submission)
 */

const Proposal = require('../models/Proposal');
const AIEvaluation = require('../models/AIEvaluation');
const User = require('../models/User');
const ipfsService = require('../services/ipfsService');
const aiService = require('../services/aiService');
const aptosService = require('../services/aptosService');

/**
 * Create New Proposal
 * POST /api/proposals/create
 * 
 * Creates a new proposal with document upload to IPFS
 * Automatically triggers AI evaluation after creation
 * 
 * Request Body:
 * - title: string (required, 3-200 chars)
 * - description: string (required)
 * - sector: string (required)
 * - amountRequested: number (required, min 0)
 * - budgetBreakdown: array of {category, amount, description}
 * - team: array of {name, role, experience, linkedIn}
 * - projectGoals: string
 * - milestones: array of {title, description, deadline, deliverable, fundingPercentage}
 * - riskAssessment: string
 * - expectedROI: number
 * - submitterWallet: string (required, Aptos address)
 * - documents: array of file objects (optional)
 */
async function createProposal(req, res) {
  try {
    const {
      title,
      description,
      sector,
      amountRequested,
      budgetBreakdown,
      team,
      projectGoals,
      milestones,
      riskAssessment,
      expectedROI,
      submitterWallet,
    } = req.body;

    // Validation
    if (!title || title.length < 3 || title.length > 200) {
      return res.status(400).json({
        success: false,
        error: 'Title is required and must be 3-200 characters',
      });
    }

    if (!description || description.length < 50) {
      return res.status(400).json({
        success: false,
        error: 'Description is required and must be at least 50 characters',
      });
    }

    if (!sector) {
      return res.status(400).json({
        success: false,
        error: 'Sector is required',
      });
    }

    if (!amountRequested || amountRequested < 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount requested must be a positive number',
      });
    }

    if (!submitterWallet) {
      return res.status(400).json({
        success: false,
        error: 'Submitter wallet address is required',
      });
    }

    // Validate Aptos address format
    if (!aptosService.isValidAddress(submitterWallet)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Aptos wallet address format',
      });
    }

    // Handle document uploads to IPFS
    let ipfsDocumentHash = null;
    let uploadedDocuments = [];

    if (req.files && req.files.length > 0) {
      try {
        console.log(`Uploading ${req.files.length} documents to IPFS...`);

        // Upload files to IPFS
        const uploadResults = await ipfsService.uploadMultipleFiles(
          req.files.map(file => ({
            buffer: file.buffer,
            filename: file.originalname,
            mimeType: file.mimetype,
            metadata: {
              proposalTitle: title,
              uploadedBy: submitterWallet,
              uploadedAt: new Date().toISOString(),
            },
          }))
        );

        uploadedDocuments = uploadResults.files.map((file, index) => ({
          name: file.filename,
          ipfsHash: file.cid,
          url: file.url,
          size: req.files[index].size,
          mimeType: file.mimeType,
          uploadedAt: new Date(),
        }));

        // Store proposal package on IPFS (proposal data + documents)
        const proposalPackage = {
          title,
          description,
          sector,
          amountRequested,
          budgetBreakdown,
          team,
          projectGoals,
          milestones,
          riskAssessment,
          expectedROI,
          submitterWallet,
        };

        const packageResult = await ipfsService.storeProposalPackage(
          proposalPackage,
          uploadResults.files.map(f => ({
            cid: f.cid,
            filename: f.filename,
            size: f.size,
            mimeType: f.mimeType,
          }))
        );

        ipfsDocumentHash = packageResult.manifestCid;

        console.log(`Proposal package stored on IPFS: ${ipfsDocumentHash}`);
      } catch (ipfsError) {
        console.error('IPFS upload error:', ipfsError);
        return res.status(500).json({
          success: false,
          error: 'Failed to upload documents to IPFS',
          details: ipfsError.message,
        });
      }
    }

    // Create proposal in database
    const proposal = new Proposal({
      title,
      description,
      sector,
      amountRequested,
      budgetBreakdown: budgetBreakdown || [],
      team: team || [],
      projectGoals: projectGoals || '',
      milestones: milestones || [],
      riskAssessment: riskAssessment || '',
      expectedROI: expectedROI || 0,
      submitterWallet,
      ipfsDocumentHash,
      documents: uploadedDocuments,
      status: 'draft',
      submissionDate: new Date(),
    });

    await proposal.save();

    console.log(`Proposal created: ${proposal._id}`);

    // Update user's submitted proposals
    try {
      await User.findOneAndUpdate(
        { walletAddress: submitterWallet },
        {
          $push: {
            submittedProposals: proposal._id,
            activityLog: {
              action: 'proposal_submitted',
              timestamp: new Date(),
              details: {
                proposalId: proposal._id,
                proposalTitle: title,
              },
            },
          },
        },
        { upsert: true }
      );
    } catch (userError) {
      console.error('Error updating user record:', userError);
      // Non-critical error, continue
    }

    // Trigger AI evaluation asynchronously
    setImmediate(async () => {
      try {
        console.log(`Triggering AI evaluation for proposal ${proposal._id}...`);
        const evaluation = await aiService.evaluateProposal(proposal._id.toString());
        console.log(`AI evaluation completed for proposal ${proposal._id}`);

        // Update proposal with AI score
        await Proposal.findByIdAndUpdate(proposal._id, {
          aiEvaluationScore: evaluation.overallScore,
          aiRecommendation: evaluation.recommendation,
          status: 'ai_evaluated',
        });
      } catch (evalError) {
        console.error(`AI evaluation failed for proposal ${proposal._id}:`, evalError);
        // Update proposal status to indicate evaluation failure
        await Proposal.findByIdAndUpdate(proposal._id, {
          status: 'ai_evaluation_failed',
        });
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Proposal created successfully. AI evaluation in progress.',
      data: {
        proposalId: proposal._id,
        title: proposal.title,
        status: proposal.status,
        ipfsHash: ipfsDocumentHash,
        documents: uploadedDocuments,
        submissionDate: proposal.submissionDate,
      },
    });
  } catch (error) {
    console.error('Error creating proposal:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create proposal',
      details: error.message,
    });
  }
}

/**
 * Get Proposal by ID
 * GET /api/proposals/:id
 * 
 * Retrieves detailed information about a specific proposal
 * Includes AI evaluation if available
 */
async function getProposalById(req, res) {
  try {
    const { id } = req.params;

    const proposal = await Proposal.findById(id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found',
      });
    }

    // Get AI evaluation if exists
    let aiEvaluation = null;
    try {
      aiEvaluation = await aiService.getEvaluationByProposalId(id);
    } catch (evalError) {
      console.error('Error fetching AI evaluation:', evalError);
      // Non-critical, continue without evaluation
    }

    // Get blockchain data if proposal is on-chain
    let blockchainData = null;
    if (proposal.onChainProposalId !== null) {
      try {
        blockchainData = await aptosService.getProposalDetails(proposal.onChainProposalId);
      } catch (chainError) {
        console.error('Error fetching blockchain data:', chainError);
        // Non-critical, continue without blockchain data
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        proposal: proposal.toObject(),
        aiEvaluation: aiEvaluation ? aiEvaluation.toObject() : null,
        blockchainData,
      },
    });
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch proposal',
      details: error.message,
    });
  }
}

/**
 * List All Proposals
 * GET /api/proposals
 * 
 * Retrieves list of proposals with filtering, sorting, and pagination
 * 
 * Query Parameters:
 * - status: Filter by status (draft, ai_evaluated, pending_vote, etc.)
 * - sector: Filter by sector
 * - submitter: Filter by submitter wallet address
 * - minScore: Minimum AI evaluation score
 * - maxScore: Maximum AI evaluation score
 * - sortBy: Field to sort by (submissionDate, aiEvaluationScore, amountRequested)
 * - sortOrder: asc or desc
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 20, max: 100)
 */
async function listProposals(req, res) {
  try {
    const {
      status,
      sector,
      submitter,
      minScore,
      maxScore,
      sortBy = 'submissionDate',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = req.query;

    // Build filter query
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (sector) {
      filter.sector = sector;
    }

    if (submitter) {
      filter.submitterWallet = submitter;
    }

    if (minScore !== undefined || maxScore !== undefined) {
      filter.aiEvaluationScore = {};
      if (minScore !== undefined) {
        filter.aiEvaluationScore.$gte = parseFloat(minScore);
      }
      if (maxScore !== undefined) {
        filter.aiEvaluationScore.$lte = parseFloat(maxScore);
      }
    }

    // Build sort query
    const sortQuery = {};
    const validSortFields = ['submissionDate', 'aiEvaluationScore', 'amountRequested', 'title'];
    if (validSortFields.includes(sortBy)) {
      sortQuery[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortQuery.submissionDate = -1; // Default sort
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [proposals, totalCount] = await Promise.all([
      Proposal.find(filter)
        .sort(sortQuery)
        .skip(skip)
        .limit(limitNum)
        .select('-__v')
        .lean(),
      Proposal.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    return res.status(200).json({
      success: true,
      data: {
        proposals,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          limit: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
        filters: {
          status,
          sector,
          submitter,
          minScore,
          maxScore,
        },
      },
    });
  } catch (error) {
    console.error('Error listing proposals:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to list proposals',
      details: error.message,
    });
  }
}

/**
 * Trigger AI Evaluation
 * POST /api/proposals/:id/evaluate
 * 
 * Manually triggers or re-triggers AI evaluation for a proposal
 * Useful for re-evaluation after proposal updates
 */
async function evaluateProposal(req, res) {
  try {
    const { id } = req.params;
    const { force = false } = req.body;

    const proposal = await Proposal.findById(id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found',
      });
    }

    // Check if already evaluated and force flag not set
    const existingEvaluation = await AIEvaluation.findOne({ proposalId: id });
    if (existingEvaluation && !force) {
      return res.status(400).json({
        success: false,
        error: 'Proposal already evaluated. Set force=true to re-evaluate.',
        data: existingEvaluation,
      });
    }

    // Trigger evaluation
    console.log(`Triggering AI evaluation for proposal ${id}...`);
    const evaluation = force
      ? await aiService.reevaluateProposal(id)
      : await aiService.evaluateProposal(id);

    // Update proposal
    await Proposal.findByIdAndUpdate(id, {
      aiEvaluationScore: evaluation.overallScore,
      aiRecommendation: evaluation.recommendation,
      status: 'ai_evaluated',
    });

    return res.status(200).json({
      success: true,
      message: 'AI evaluation completed successfully',
      data: evaluation,
    });
  } catch (error) {
    console.error('Error evaluating proposal:', error);

    // Update proposal status to failed
    await Proposal.findByIdAndUpdate(req.params.id, {
      status: 'ai_evaluation_failed',
    });

    return res.status(500).json({
      success: false,
      error: 'AI evaluation failed',
      details: error.message,
    });
  }
}

/**
 * Get AI Evaluation Results
 * GET /api/proposals/:id/evaluation
 * 
 * Retrieves AI evaluation results for a specific proposal
 */
async function getEvaluationResults(req, res) {
  try {
    const { id } = req.params;

    const evaluation = await aiService.getEvaluationByProposalId(id);

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        error: 'AI evaluation not found for this proposal',
      });
    }

    return res.status(200).json({
      success: true,
      data: evaluation,
    });
  } catch (error) {
    console.error('Error fetching evaluation:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch AI evaluation',
      details: error.message,
    });
  }
}

/**
 * Submit Proposal to Blockchain
 * POST /api/proposals/:id/submit-chain
 * 
 * Submits an AI-approved proposal to the Aptos blockchain
 * Creates on-chain proposal for voting
 * 
 * Request Body:
 * - walletAddress: string (required, submitter's wallet)
 * - votingDuration: number (optional, days, default: 7)
 */
async function submitToBlockchain(req, res) {
  try {
    const { id } = req.params;
    const { walletAddress, votingDuration = 7 } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required',
      });
    }

    const proposal = await Proposal.findById(id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found',
      });
    }

    // Check if already submitted to blockchain
    if (proposal.onChainProposalId !== null) {
      return res.status(400).json({
        success: false,
        error: 'Proposal already submitted to blockchain',
        data: {
          onChainProposalId: proposal.onChainProposalId,
        },
      });
    }

    // Check if AI evaluation exists and is favorable
    const evaluation = await AIEvaluation.findOne({ proposalId: id });
    if (!evaluation) {
      return res.status(400).json({
        success: false,
        error: 'Proposal must be AI evaluated before blockchain submission',
      });
    }

    if (evaluation.overallScore < 40) {
      return res.status(400).json({
        success: false,
        error: 'Proposal AI score too low for blockchain submission (minimum 40)',
        data: {
          currentScore: evaluation.overallScore,
          minimumRequired: 40,
        },
      });
    }

    // Submit to blockchain
    console.log(`Submitting proposal ${id} to blockchain...`);

    const votingDurationSeconds = votingDuration * 24 * 60 * 60;

    const result = await aptosService.submitProposal(
      proposal.title,
      proposal.description,
      proposal.amountRequested,
      proposal.submitterWallet,
      votingDurationSeconds
    );

    if (!result.success) {
      throw new Error(result.error || 'Blockchain submission failed');
    }

    // Update proposal with on-chain ID
    proposal.onChainProposalId = result.proposalId;
    proposal.status = 'pending_vote';
    proposal.blockchainSubmissionDate = new Date();
    await proposal.save();

    console.log(
      `Proposal ${id} submitted to blockchain with on-chain ID: ${result.proposalId}`
    );

    // Update user activity
    await User.findOneAndUpdate(
      { walletAddress: proposal.submitterWallet },
      {
        $push: {
          activityLog: {
            action: 'proposal_submitted_blockchain',
            timestamp: new Date(),
            details: {
              proposalId: proposal._id,
              onChainProposalId: result.proposalId,
              transactionHash: result.transactionHash,
            },
          },
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Proposal submitted to blockchain successfully',
      data: {
        proposalId: proposal._id,
        onChainProposalId: result.proposalId,
        transactionHash: result.transactionHash,
        status: proposal.status,
      },
    });
  } catch (error) {
    console.error('Error submitting to blockchain:', error);

    // Update proposal status to failed
    await Proposal.findByIdAndUpdate(req.params.id, {
      status: 'blockchain_submission_failed',
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to submit proposal to blockchain',
      details: error.message,
    });
  }
}

/**
 * Update Proposal Status
 * PUT /api/proposals/:id/update
 * 
 * Updates proposal status and optional fields
 * Admin or submitter only
 * 
 * Request Body:
 * - status: string (optional)
 * - milestones: array (optional, for milestone updates)
 */
async function updateProposal(req, res) {
  try {
    const { id } = req.params;
    const { status, milestones, walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required',
      });
    }

    const proposal = await Proposal.findById(id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found',
      });
    }

    // Authorization check (only submitter or admin can update)
    // For MVP, we'll allow the submitter to update
    if (proposal.submitterWallet !== walletAddress) {
      return res.status(403).json({
        success: false,
        error: 'Only the proposal submitter can update this proposal',
      });
    }

    // Update fields
    const updates = {};

    if (status) {
      const validStatuses = [
        'draft',
        'ai_evaluated',
        'pending_vote',
        'voting',
        'approved',
        'rejected',
        'executed',
        'cancelled',
        'in_progress',
        'completed',
        'failed',
        'ai_evaluation_failed',
        'blockchain_submission_failed',
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        });
      }

      updates.status = status;
    }

    if (milestones) {
      updates.milestones = milestones;
    }

    // Apply updates
    const updatedProposal = await Proposal.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    console.log(`Proposal ${id} updated by ${walletAddress}`);

    return res.status(200).json({
      success: true,
      message: 'Proposal updated successfully',
      data: updatedProposal,
    });
  } catch (error) {
    console.error('Error updating proposal:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update proposal',
      details: error.message,
    });
  }
}

/**
 * Get Proposal Statistics
 * GET /api/proposals/stats
 * 
 * Retrieves aggregate statistics about proposals
 */
async function getProposalStats(req, res) {
  try {
    const [
      totalProposals,
      statusCounts,
      sectorCounts,
      avgScore,
      totalFundingRequested,
    ] = await Promise.all([
      Proposal.countDocuments(),
      Proposal.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Proposal.aggregate([
        { $group: { _id: '$sector', count: { $sum: 1 } } },
      ]),
      Proposal.aggregate([
        {
          $group: {
            _id: null,
            avgScore: { $avg: '$aiEvaluationScore' },
          },
        },
      ]),
      Proposal.aggregate([
        {
          $group: {
            _id: null,
            totalRequested: { $sum: '$amountRequested' },
          },
        },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalProposals,
        byStatus: statusCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        bySector: sectorCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        averageAIScore: avgScore[0]?.avgScore || 0,
        totalFundingRequested: totalFundingRequested[0]?.totalRequested || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching proposal stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch proposal statistics',
      details: error.message,
    });
  }
}

module.exports = {
  createProposal,
  getProposalById,
  listProposals,
  evaluateProposal,
  getEvaluationResults,
  submitToBlockchain,
  updateProposal,
  getProposalStats,
};
