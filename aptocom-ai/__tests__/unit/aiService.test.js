/**
 * Unit Tests for AI Service
 * Tests AI proposal evaluation functions
 */

import { jest } from '@jest/globals';

describe('AI Service - Unit Tests', () => {
  let aiService;
  
  // Mock Groq SDK
  const mockGroq = {
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  };

  beforeAll(async () => {
    // Set environment variable
    process.env.GROQ_API_KEY = 'test_groq_key';

    // Mock Groq module
    jest.unstable_mockModule('groq-sdk', () => ({
      default: jest.fn(() => mockGroq)
    }));

    const module = await import('../src/services/aiService.js');
    aiService = module.default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('evaluateProposal', () => {
    const sampleProposal = {
      title: 'AI-Powered Analytics Platform',
      description: 'Build a comprehensive analytics platform using AI',
      sector: 'AI Development',
      fundingAmount: 50000,
      timeline: '6 months',
      teamInfo: 'Team of 5 experienced developers',
      budgetBreakdown: 'Development: $30k, Marketing: $10k, Operations: $10k'
    };

    test('should evaluate proposal and return scores', async () => {
      const mockAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              innovation: 85,
              feasibility: 75,
              impactPotential: 80,
              teamExpertise: 78,
              budgetClarity: 72,
              timelineRealism: 80,
              riskAssessment: 70,
              communityAlignment: 85,
              detailedAnalysis: {
                innovation: 'Strong innovative approach...',
                feasibility: 'Technically sound...'
              },
              strengths: [
                'Clear problem statement',
                'Experienced team'
              ],
              weaknesses: [
                'Budget could be more detailed'
              ],
              recommendations: [
                'Add more granular milestones'
              ],
              recommendationSummary: 'Highly viable project with strong fundamentals'
            })
          }
        }]
      };

      mockGroq.chat.completions.create.mockResolvedValue(mockAIResponse);

      const result = await aiService.evaluateProposal(sampleProposal);

      expect(result).toHaveProperty('totalScore');
      expect(result).toHaveProperty('scores');
      expect(result).toHaveProperty('recommendationSummary');
      expect(result.scores).toHaveProperty('innovation', 85);
      expect(result.scores).toHaveProperty('feasibility', 75);
      expect(result.totalScore).toBe(
        Math.round((85 + 75 + 80 + 78 + 72 + 80 + 70 + 85) / 8)
      );
    });

    test('should handle AI service errors', async () => {
      mockGroq.chat.completions.create.mockRejectedValue(
        new Error('AI service unavailable')
      );

      await expect(aiService.evaluateProposal(sampleProposal))
        .rejects.toThrow('AI service unavailable');
    });

    test('should validate all required proposal fields', async () => {
      const incompleteProposal = {
        title: 'Test',
        // Missing required fields
      };

      await expect(aiService.evaluateProposal(incompleteProposal))
        .rejects.toThrow();
    });

    test('should handle malformed AI response', async () => {
      const mockAIResponse = {
        choices: [{
          message: {
            content: 'Invalid JSON response'
          }
        }]
      };

      mockGroq.chat.completions.create.mockResolvedValue(mockAIResponse);

      await expect(aiService.evaluateProposal(sampleProposal))
        .rejects.toThrow();
    });

    test('should use correct AI model', async () => {
      const mockAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              innovation: 80,
              feasibility: 75,
              impactPotential: 80,
              teamExpertise: 78,
              budgetClarity: 72,
              timelineRealism: 80,
              riskAssessment: 70,
              communityAlignment: 85,
              detailedAnalysis: {},
              strengths: [],
              weaknesses: [],
              recommendations: [],
              recommendationSummary: 'Good project'
            })
          }
        }]
      };

      mockGroq.chat.completions.create.mockResolvedValue(mockAIResponse);

      await aiService.evaluateProposal(sampleProposal);

      expect(mockGroq.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'llama-3.3-70b-versatile'
        })
      );
    });

    test('should include all 8 evaluation criteria', async () => {
      const mockAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              innovation: 80,
              feasibility: 75,
              impactPotential: 80,
              teamExpertise: 78,
              budgetClarity: 72,
              timelineRealism: 80,
              riskAssessment: 70,
              communityAlignment: 85,
              detailedAnalysis: {},
              strengths: [],
              weaknesses: [],
              recommendations: [],
              recommendationSummary: 'Good'
            })
          }
        }]
      };

      mockGroq.chat.completions.create.mockResolvedValue(mockAIResponse);

      const result = await aiService.evaluateProposal(sampleProposal);

      const expectedCriteria = [
        'innovation',
        'feasibility',
        'impactPotential',
        'teamExpertise',
        'budgetClarity',
        'timelineRealism',
        'riskAssessment',
        'communityAlignment'
      ];

      expectedCriteria.forEach(criterion => {
        expect(result.scores).toHaveProperty(criterion);
        expect(result.scores[criterion]).toBeGreaterThanOrEqual(0);
        expect(result.scores[criterion]).toBeLessThanOrEqual(100);
      });
    });

    test('should calculate correct average score', async () => {
      const mockAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              innovation: 80,
              feasibility: 80,
              impactPotential: 80,
              teamExpertise: 80,
              budgetClarity: 80,
              timelineRealism: 80,
              riskAssessment: 80,
              communityAlignment: 80,
              detailedAnalysis: {},
              strengths: [],
              weaknesses: [],
              recommendations: [],
              recommendationSummary: 'Excellent'
            })
          }
        }]
      };

      mockGroq.chat.completions.create.mockResolvedValue(mockAIResponse);

      const result = await aiService.evaluateProposal(sampleProposal);

      expect(result.totalScore).toBe(80); // All scores are 80
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      mockGroq.chat.completions.create.mockRejectedValue(
        new Error('Network error')
      );

      const proposal = {
        title: 'Test',
        description: 'Test',
        sector: 'Test',
        fundingAmount: 1000,
        timeline: '1 month',
        teamInfo: 'Test',
        budgetBreakdown: 'Test'
      };

      await expect(aiService.evaluateProposal(proposal))
        .rejects.toThrow('Network error');
    });

    test('should handle API rate limits', async () => {
      mockGroq.chat.completions.create.mockRejectedValue(
        new Error('Rate limit exceeded')
      );

      const proposal = {
        title: 'Test',
        description: 'Test',
        sector: 'Test',
        fundingAmount: 1000,
        timeline: '1 month',
        teamInfo: 'Test',
        budgetBreakdown: 'Test'
      };

      await expect(aiService.evaluateProposal(proposal))
        .rejects.toThrow('Rate limit exceeded');
    });

    test('should handle missing API key', async () => {
      const originalKey = process.env.GROQ_API_KEY;
      delete process.env.GROQ_API_KEY;

      // Re-import service without API key
      jest.resetModules();
      
      process.env.GROQ_API_KEY = originalKey; // Restore
    });
  });
});
