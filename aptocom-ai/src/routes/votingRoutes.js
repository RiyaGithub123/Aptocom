/**
 * Voting Routes
 * 
 * RESTful API endpoints for voting operations
 * 
 * Routes:
 * - POST   /api/voting/vote              - Cast vote on proposal
 * - GET    /api/voting/stats             - Get voting statistics
 * - GET    /api/voting/proposal/:id      - Get proposal voting details
 * - GET    /api/voting/user/:wallet      - Get user voting history
 */

const express = require('express');
const votingController = require('../controllers/votingController');

const router = express.Router();

/**
 * POST /api/voting/vote
 * Cast a vote on a proposal
 * 
 * Body:
 * - proposalId: string (MongoDB ObjectId)
 * - onChainProposalId: number
 * - walletAddress: string (voter's Aptos address)
 * - voteFor: boolean (true = for, false = against)
 * 
 * Response:
 * - proposalId, onChainProposalId, walletAddress, voteFor
 * - votingPower, transactionHash, timestamp
 */
router.post('/vote', votingController.castVote);

/**
 * GET /api/voting/stats
 * Get aggregate voting statistics
 * 
 * Response:
 * - totalVotes: number
 * - uniqueVoters: number
 * - totalProposalsWithVoting: number
 * - averageParticipation: number
 * - byStatus: object (status counts)
 */
router.get('/stats', votingController.getVotingStats);

/**
 * GET /api/voting/proposal/:id
 * Get voting details for a specific proposal
 * 
 * Params:
 * - id: On-chain proposal ID (number)
 * 
 * Query:
 * - includeVoters: boolean (include voter list, default: false)
 * 
 * Response:
 * - proposalId, onChainProposalId, title, status
 * - voting: { votesFor, votesAgainst, totalVotes, percentages }
 * - deadline, isActive, executed
 * - voters: array (if includeVoters=true)
 */
router.get('/proposal/:id', votingController.getProposalVotes);

/**
 * GET /api/voting/user/:wallet
 * Get voting history for a user
 * 
 * Params:
 * - wallet: Aptos wallet address
 * 
 * Query:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * 
 * Response:
 * - walletAddress: string
 * - votes: array (proposal details, vote, voting power, timestamp)
 * - pagination: object
 */
router.get('/user/:wallet', votingController.getUserVotingHistory);

module.exports = router;
