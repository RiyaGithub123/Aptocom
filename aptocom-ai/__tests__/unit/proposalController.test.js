/**
 * Unit Tests for Proposal Controller
 * Tests business logic for proposal operations
 */

import { jest } from '@jest/globals';

// Mock dependencies
const mockProposal = {
  findById: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  aggregate: jest.fn(),
  prototype: {
    save: jest.fn()
  }
};

const mockUser = {
  findOneAndUpdate: jest.fn()
};

const mockAIEvaluation = {
  findOne: jest.fn(),
  prototype: {
    save: jest.fn()
  }
};

const mockAptosService = {
  createProposal: jest.fn(),
  getProposalDetails: jest.fn(),
  isValidAddress: jest.fn()
};

const mockAIService = {
  evaluateProposal: jest.fn()
};

const mockIPFSService = {
  uploadProposalPackage: jest.fn()
};

// Mock modules
jest.unstable_mockModule('../src/models/Proposal.js', () => ({
  default: mockProposal
}));

jest.unstable_mockModule('../src/models/User.js', () => ({
  default: mockUser
}));

jest.unstable_mockModule('../src/models/AIEvaluation.js', () => ({
  default: mockAIEvaluation
}));

jest.unstable_mockModule('../src/services/aptosService.js', () => ({
  default: mockAptosService
}));

jest.unstable_mockModule('../src/services/aiService.js', () => ({
  default: mockAIService
}));

jest.unstable_mockModule('../src/services/ipfsService.js', () => ({
  default: mockIPFSService
}));

describe('Proposal Controller - Unit Tests', () => {
  let proposalController;
  let mockReq, mockRes;

  beforeAll(async () => {
    // Import controller after mocks are set up
    const module = await import('../src/controllers/proposalController.js');
    proposalController = module;
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock request and response
    mockReq = {
      body: {},
      params: {},
      query: {},
      files: []
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('getProposalById', () => {
    test('should return proposal with AI evaluation and blockchain data', async () => {
      const mockProposalData = {
        _id: '507f1f77bcf86cd799439011',
        title: 'Test Proposal',
        status: 'voting',
        onChainProposalId: 5,
        toObject: jest.fn().mockReturnThis()
      };

      const mockEvaluation = {
        totalScore: 78,
        scores: { innovation: 85 }
      };

      const mockBlockchainData = {
        votesFor: 1000,
        votesAgainst: 500
      };

      mockProposal.findById.mockResolvedValue(mockProposalData);
      mockAIEvaluation.findOne.mockResolvedValue(mockEvaluation);
      mockAptosService.getProposalDetails.mockResolvedValue(mockBlockchainData);

      mockReq.params.id = '507f1f77bcf86cd799439011';

      await proposalController.getProposalById(mockReq, mockRes);

      expect(mockProposal.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            aiEvaluation: mockEvaluation,
            blockchainData: mockBlockchainData
          })
        })
      );
    });

    test('should return 404 if proposal not found', async () => {
      mockProposal.findById.mockResolvedValue(null);
      mockReq.params.id = '507f1f77bcf86cd799439011';

      await proposalController.getProposalById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Proposal not found'
        })
      );
    });
  });

  describe('listProposals', () => {
    test('should return paginated proposals with filters', async () => {
      const mockProposals = [
        { _id: '1', title: 'Proposal 1', status: 'voting' },
        { _id: '2', title: 'Proposal 2', status: 'voting' }
      ];

      const mockCountDocuments = jest.fn().mockResolvedValue(10);
      
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockProposals),
        countDocuments: mockCountDocuments
      };

      mockProposal.find.mockReturnValue(mockQuery);

      mockReq.query = {
        status: 'voting',
        page: '1',
        limit: '10'
      };

      await proposalController.listProposals(mockReq, mockRes);

      expect(mockProposal.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'voting' })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            proposals: mockProposals,
            pagination: expect.objectContaining({
              currentPage: 1,
              totalPages: 1,
              totalCount: 10
            })
          })
        })
      );
    });
  });

  describe('getProposalStats', () => {
    test('should return aggregate proposal statistics', async () => {
      const mockStats = [
        {
          _id: null,
          total: 50,
          byStatus: {
            voting: 8,
            approved: 15
          },
          bySector: {
            'AI Development': 20,
            'Infrastructure': 15
          },
          totalFunding: 2500000,
          avgScore: 72.5
        }
      ];

      mockProposal.aggregate.mockResolvedValue(mockStats);

      await proposalController.getProposalStats(mockReq, mockRes);

      expect(mockProposal.aggregate).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            totalProposals: 50,
            totalFundingRequested: 2500000
          })
        })
      );
    });
  });

  describe('evaluateProposal', () => {
    test('should trigger AI evaluation for proposal', async () => {
      const mockProposalData = {
        _id: '507f1f77bcf86cd799439011',
        title: 'Test Proposal',
        description: 'Test description',
        sector: 'AI Development',
        save: jest.fn().mockResolvedValue(true)
      };

      const mockEvaluationResult = {
        totalScore: 78,
        scores: { innovation: 85 },
        recommendationSummary: 'Highly viable project'
      };

      mockProposal.findById.mockResolvedValue(mockProposalData);
      mockAIService.evaluateProposal.mockResolvedValue(mockEvaluationResult);

      mockReq.params.id = '507f1f77bcf86cd799439011';
      mockReq.body = { force: false };

      await proposalController.evaluateProposal(mockReq, mockRes);

      expect(mockAIService.evaluateProposal).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('evaluation')
        })
      );
    });

    test('should return error if AI evaluation fails', async () => {
      const mockProposalData = {
        _id: '507f1f77bcf86cd799439011',
        status: 'pending_evaluation',
        save: jest.fn()
      };

      mockProposal.findById.mockResolvedValue(mockProposalData);
      mockAIService.evaluateProposal.mockRejectedValue(new Error('AI service unavailable'));

      mockReq.params.id = '507f1f77bcf86cd799439011';

      await proposalController.evaluateProposal(mockReq, mockRes);

      expect(mockProposalData.save).toHaveBeenCalled();
      expect(mockProposalData.status).toBe('evaluation_failed');
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('submitToBlockchain', () => {
    test('should submit approved proposal to blockchain', async () => {
      const mockProposalData = {
        _id: '507f1f77bcf86cd799439011',
        title: 'Test Proposal',
        status: 'approved',
        fundingAmount: 50000,
        walletAddress: '0x123',
        aiEvaluation: { totalScore: 78 },
        save: jest.fn().mockResolvedValue(true)
      };

      const mockBlockchainResult = {
        proposalId: 5,
        transactionHash: '0xabc123'
      };

      mockProposal.findById.mockResolvedValue(mockProposalData);
      mockAptosService.createProposal.mockResolvedValue(mockBlockchainResult);

      mockReq.params.id = '507f1f77bcf86cd799439011';
      mockReq.body = { votingDurationDays: 7 };

      await proposalController.submitToBlockchain(mockReq, mockRes);

      expect(mockAptosService.createProposal).toHaveBeenCalled();
      expect(mockProposalData.status).toBe('voting');
      expect(mockProposalData.onChainProposalId).toBe(5);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should reject proposal with low AI score', async () => {
      const mockProposalData = {
        _id: '507f1f77bcf86cd799439011',
        aiEvaluation: { totalScore: 30 }
      };

      mockProposal.findById.mockResolvedValue(mockProposalData);
      mockReq.params.id = '507f1f77bcf86cd799439011';

      await proposalController.submitToBlockchain(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('AI score')
        })
      );
    });
  });

  describe('updateProposal', () => {
    test('should update proposal status', async () => {
      const mockProposalData = {
        _id: '507f1f77bcf86cd799439011',
        walletAddress: '0x123',
        status: 'voting',
        save: jest.fn().mockResolvedValue(true)
      };

      mockProposal.findById.mockResolvedValue(mockProposalData);

      mockReq.params.id = '507f1f77bcf86cd799439011';
      mockReq.body = {
        status: 'approved',
        walletAddress: '0x123'
      };

      await proposalController.updateProposal(mockReq, mockRes);

      expect(mockProposalData.status).toBe('approved');
      expect(mockProposalData.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should reject unauthorized update', async () => {
      const mockProposalData = {
        _id: '507f1f77bcf86cd799439011',
        walletAddress: '0x123'
      };

      mockProposal.findById.mockResolvedValue(mockProposalData);

      mockReq.params.id = '507f1f77bcf86cd799439011';
      mockReq.body = {
        status: 'approved',
        walletAddress: '0x456' // Different wallet
      };

      await proposalController.updateProposal(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('authorized')
        })
      );
    });
  });
});
