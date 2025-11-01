/**
 * Voting Controller
 * 
 * Handles all voting-related operations including:
 * - Casting votes on proposals (on-chain)
 * - Retrieving voting status and results
 * - User voting history tracking
 * - Vote validation and authorization
 * 
 * Integrates with:
 * - Aptos Service (on-chain voting)
 * - MongoDB (Proposal, User models for tracking)
 */

const Proposal = require('../models/Proposal');
const User = require('../models/User');
const aptosService = require('../services/aptosService');

/**
 * Cast Vote
 * POST /api/voting/vote
 * 
 * Submits a vote on a proposal to the blockchain
 * Records vote in user activity log
 * 
 * Request Body:
 * - proposalId: string (MongoDB ObjectId)
 * - onChainProposalId: number (blockchain proposal ID)
 * - walletAddress: string (voter's Aptos address)
 * - voteFor: boolean (true = for, false = against)
 */
async function castVote(req, res) {
  try {
    const { proposalId, onChainProposalId, walletAddress, voteFor } = req.body;

    // Validation
    if (!proposalId) {
      return res.status(400).json({
        success: false,
        error: 'Proposal ID is required',
      });
    }

    if (onChainProposalId === undefined || onChainProposalId === null) {
      return res.status(400).json({
        success: false,
        error: 'On-chain proposal ID is required',
      });
    }

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required',
      });
    }

    if (voteFor === undefined || voteFor === null) {
      return res.status(400).json({
        success: false,
        error: 'Vote choice (voteFor) is required',
      });
    }

    // Validate Aptos address
    if (!aptosService.isValidAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Aptos wallet address format',
      });
    }

    // Check if proposal exists and is on-chain
    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found',
      });
    }

    if (proposal.onChainProposalId === null) {
      return res.status(400).json({
        success: false,
        error: 'Proposal has not been submitted to blockchain yet',
      });
    }

    if (proposal.onChainProposalId !== onChainProposalId) {
      return res.status(400).json({
        success: false,
        error: 'On-chain proposal ID mismatch',
      });
    }

    // Check if proposal is in voting status
    if (!['pending_vote', 'voting'].includes(proposal.status)) {
      return res.status(400).json({
        success: false,
        error: `Proposal is not open for voting (current status: ${proposal.status})`,
      });
    }

    // Get voter's ACT token balance (voting power)
    const actBalance = await aptosService.getACTBalance(walletAddress);
    if (actBalance === 0) {
      return res.status(400).json({
        success: false,
        error: 'You must hold ACT tokens to vote',
      });
    }

    console.log(
      `Casting vote on proposal ${onChainProposalId} by ${walletAddress} (${voteFor ? 'FOR' : 'AGAINST'})`
    );

    // Submit vote to blockchain
    const voteResult = await aptosService.submitVote(
      onChainProposalId,
      voteFor,
      walletAddress
    );

    if (!voteResult.success) {
      throw new Error(voteResult.error || 'Failed to submit vote to blockchain');
    }

    console.log(`Vote cast successfully. Transaction: ${voteResult.transactionHash}`);

    // Update proposal status if needed
    if (proposal.status === 'pending_vote') {
      proposal.status = 'voting';
      await proposal.save();
    }

    // Update user voting history
    await User.findOneAndUpdate(
      { walletAddress },
      {
        $push: {
          votingHistory: {
            proposalId: proposal._id,
            onChainProposalId,
            voteFor,
            votingPower: actBalance,
            timestamp: new Date(),
            transactionHash: voteResult.transactionHash,
          },
          activityLog: {
            action: 'vote_cast',
            timestamp: new Date(),
            details: {
              proposalId: proposal._id,
              proposalTitle: proposal.title,
              voteFor,
              votingPower: actBalance,
              transactionHash: voteResult.transactionHash,
            },
          },
        },
      },
      { upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Vote cast successfully',
      data: {
        proposalId: proposal._id,
        onChainProposalId,
        walletAddress,
        voteFor,
        votingPower: actBalance,
        transactionHash: voteResult.transactionHash,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error casting vote:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to cast vote',
      details: error.message,
    });
  }
}

/**
 * Get Proposal Votes
 * GET /api/voting/proposal/:id
 * 
 * Retrieves voting status and results for a specific proposal
 * 
 * Path Parameters:
 * - id: On-chain proposal ID (number)
 * 
 * Query Parameters:
 * - includeVoters: boolean (include list of voters, default: false)
 */
async function getProposalVotes(req, res) {
  try {
    const { id } = req.params;
    const { includeVoters = false } = req.query;

    const onChainProposalId = parseInt(id);
    if (isNaN(onChainProposalId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid proposal ID format',
      });
    }

    // Find proposal in database
    const proposal = await Proposal.findOne({ onChainProposalId });
    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found',
      });
    }

    // Get voting details from blockchain
    console.log(`Fetching voting details for proposal ${onChainProposalId}...`);
    const blockchainData = await aptosService.getProposalDetails(onChainProposalId);

    if (!blockchainData.success) {
      throw new Error(blockchainData.error || 'Failed to fetch blockchain data');
    }

    // Calculate voting statistics
    const totalVotes = blockchainData.votesFor + blockchainData.votesAgainst;
    const forPercentage = totalVotes > 0 ? (blockchainData.votesFor / totalVotes) * 100 : 0;
    const againstPercentage = totalVotes > 0 ? (blockchainData.votesAgainst / totalVotes) * 100 : 0;

    const responseData = {
      proposalId: proposal._id,
      onChainProposalId,
      title: proposal.title,
      status: blockchainData.status,
      voting: {
        votesFor: blockchainData.votesFor,
        votesAgainst: blockchainData.votesAgainst,
        totalVotes,
        forPercentage: parseFloat(forPercentage.toFixed(2)),
        againstPercentage: parseFloat(againstPercentage.toFixed(2)),
      },
      deadline: blockchainData.deadline,
      isActive: blockchainData.isActive,
      executed: blockchainData.executed,
    };

    // Include voter list if requested
    if (includeVoters === 'true' || includeVoters === true) {
      const voters = await User.find({
        'votingHistory.onChainProposalId': onChainProposalId,
      })
        .select('walletAddress votingHistory')
        .lean();

      const voterList = voters.map(user => {
        const vote = user.votingHistory.find(
          v => v.onChainProposalId === onChainProposalId
        );
        return {
          walletAddress: user.walletAddress,
          voteFor: vote.voteFor,
          votingPower: vote.votingPower,
          timestamp: vote.timestamp,
          transactionHash: vote.transactionHash,
        };
      });

      responseData.voters = voterList;
      responseData.voterCount = voterList.length;
    }

    return res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Error fetching proposal votes:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch proposal votes',
      details: error.message,
    });
  }
}

/**
 * Get User Voting History
 * GET /api/voting/user/:wallet
 * 
 * Retrieves voting history for a specific user
 * 
 * Path Parameters:
 * - wallet: Aptos wallet address
 * 
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 */
async function getUserVotingHistory(req, res) {
  try {
    const { wallet } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Validate wallet address
    if (!aptosService.isValidAddress(wallet)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Aptos wallet address format',
      });
    }

    // Find user
    const user = await User.findOne({ walletAddress: wallet });
    if (!user) {
      return res.status(200).json({
        success: true,
        data: {
          walletAddress: wallet,
          votes: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalCount: 0,
            limit: parseInt(limit),
          },
        },
      });
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Get voting history with pagination
    const totalVotes = user.votingHistory.length;
    const votes = user.votingHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(skip, skip + limitNum);

    // Enrich with proposal details
    const enrichedVotes = await Promise.all(
      votes.map(async vote => {
        const proposal = await Proposal.findById(vote.proposalId).select(
          'title sector status aiEvaluationScore'
        );
        return {
          proposalId: vote.proposalId,
          onChainProposalId: vote.onChainProposalId,
          proposalTitle: proposal ? proposal.title : 'Unknown',
          proposalSector: proposal ? proposal.sector : null,
          proposalStatus: proposal ? proposal.status : null,
          voteFor: vote.voteFor,
          votingPower: vote.votingPower,
          timestamp: vote.timestamp,
          transactionHash: vote.transactionHash,
        };
      })
    );

    const totalPages = Math.ceil(totalVotes / limitNum);

    return res.status(200).json({
      success: true,
      data: {
        walletAddress: wallet,
        votes: enrichedVotes,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount: totalVotes,
          limit: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching user voting history:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user voting history',
      details: error.message,
    });
  }
}

/**
 * Get Voting Statistics
 * GET /api/voting/stats
 * 
 * Retrieves aggregate voting statistics across all proposals
 */
async function getVotingStats(req, res) {
  try {
    // Count total votes cast
    const users = await User.find({}).select('votingHistory').lean();
    const totalVotes = users.reduce((sum, user) => sum + user.votingHistory.length, 0);

    // Count unique voters
    const uniqueVoters = users.filter(user => user.votingHistory.length > 0).length;

    // Get proposals with voting
    const proposalsWithVoting = await Proposal.find({
      onChainProposalId: { $ne: null },
    }).select('onChainProposalId status').lean();

    // Calculate average participation (votes per proposal)
    const avgParticipation = proposalsWithVoting.length > 0
      ? totalVotes / proposalsWithVoting.length
      : 0;

    // Count proposals by voting status
    const votingStatusCounts = proposalsWithVoting.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      data: {
        totalVotes,
        uniqueVoters,
        totalProposalsWithVoting: proposalsWithVoting.length,
        averageParticipation: parseFloat(avgParticipation.toFixed(2)),
        byStatus: votingStatusCounts,
      },
    });
  } catch (error) {
    console.error('Error fetching voting stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch voting statistics',
      details: error.message,
    });
  }
}

module.exports = {
  castVote,
  getProposalVotes,
  getUserVotingHistory,
  getVotingStats,
};
