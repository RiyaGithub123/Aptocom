/**
 * Proposal Routes
 * 
 * RESTful API endpoints for proposal management
 * 
 * Routes:
 * - POST   /api/proposals/create        - Create new proposal
 * - GET    /api/proposals/stats         - Get proposal statistics
 * - GET    /api/proposals/:id           - Get proposal by ID
 * - GET    /api/proposals               - List all proposals (with filters)
 * - POST   /api/proposals/:id/evaluate  - Trigger AI evaluation
 * - GET    /api/proposals/:id/evaluation - Get AI evaluation results
 * - POST   /api/proposals/:id/submit-chain - Submit to blockchain
 * - PUT    /api/proposals/:id/update    - Update proposal
 */

const express = require('express');
const multer = require('multer');
const proposalController = require('../controllers/proposalController');

const router = express.Router();

// Configure multer for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB max file size
    files: 10, // Max 10 files per upload
  },
  fileFilter: (req, file, cb) => {
    // Allow specific file types
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
      'text/markdown',
      'application/json',
      'text/csv',
      'application/zip',
      'application/x-rar-compressed',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `File type not allowed: ${file.mimetype}. Allowed types: PDF, DOC, XLS, PPT, images, text, JSON, CSV, ZIP`
        ),
        false
      );
    }
  },
});

/**
 * POST /api/proposals/create
 * Create a new proposal with optional document uploads
 * 
 * Multipart form data:
 * - title: string
 * - description: string
 * - sector: string
 * - amountRequested: number
 * - budgetBreakdown: JSON string
 * - team: JSON string
 * - projectGoals: string
 * - milestones: JSON string
 * - riskAssessment: string
 * - expectedROI: number
 * - submitterWallet: string
 * - documents: file(s) (optional)
 */
router.post('/create', upload.array('documents', 10), proposalController.createProposal);

/**
 * GET /api/proposals/stats
 * Get aggregate statistics about proposals
 * 
 * Response:
 * - totalProposals: number
 * - byStatus: object (status counts)
 * - bySector: object (sector counts)
 * - averageAIScore: number
 * - totalFundingRequested: number
 */
router.get('/stats', proposalController.getProposalStats);

/**
 * GET /api/proposals/:id
 * Get detailed information about a specific proposal
 * 
 * Params:
 * - id: MongoDB ObjectId
 * 
 * Response:
 * - proposal: object (full proposal data)
 * - aiEvaluation: object (AI evaluation if available)
 * - blockchainData: object (on-chain data if submitted)
 */
router.get('/:id', proposalController.getProposalById);

/**
 * GET /api/proposals
 * List all proposals with filtering, sorting, and pagination
 * 
 * Query Parameters:
 * - status: string (filter by status)
 * - sector: string (filter by sector)
 * - submitter: string (filter by wallet address)
 * - minScore: number (min AI score)
 * - maxScore: number (max AI score)
 * - sortBy: string (submissionDate, aiEvaluationScore, amountRequested)
 * - sortOrder: string (asc, desc)
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * 
 * Response:
 * - proposals: array
 * - pagination: object (page info)
 * - filters: object (applied filters)
 */
router.get('/', proposalController.listProposals);

/**
 * POST /api/proposals/:id/evaluate
 * Trigger or re-trigger AI evaluation for a proposal
 * 
 * Params:
 * - id: MongoDB ObjectId
 * 
 * Body:
 * - force: boolean (optional, force re-evaluation)
 * 
 * Response:
 * - evaluation: object (AI evaluation results)
 */
router.post('/:id/evaluate', proposalController.evaluateProposal);

/**
 * GET /api/proposals/:id/evaluation
 * Get AI evaluation results for a proposal
 * 
 * Params:
 * - id: MongoDB ObjectId
 * 
 * Response:
 * - evaluation: object (full AI evaluation)
 */
router.get('/:id/evaluation', proposalController.getEvaluationResults);

/**
 * POST /api/proposals/:id/submit-chain
 * Submit an AI-approved proposal to the Aptos blockchain
 * 
 * Params:
 * - id: MongoDB ObjectId
 * 
 * Body:
 * - walletAddress: string (submitter's wallet)
 * - votingDuration: number (optional, days, default: 7)
 * 
 * Response:
 * - proposalId: MongoDB ObjectId
 * - onChainProposalId: number
 * - transactionHash: string
 * - status: string
 */
router.post('/:id/submit-chain', proposalController.submitToBlockchain);

/**
 * PUT /api/proposals/:id/update
 * Update proposal status and fields
 * 
 * Params:
 * - id: MongoDB ObjectId
 * 
 * Body:
 * - walletAddress: string (required for authorization)
 * - status: string (optional)
 * - milestones: array (optional)
 * 
 * Response:
 * - proposal: object (updated proposal)
 */
router.put('/:id/update', proposalController.updateProposal);

// Error handling middleware for multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 100 MB per file.',
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum is 10 files per upload.',
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${error.message}`,
    });
  }

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }

  next();
});

module.exports = router;
