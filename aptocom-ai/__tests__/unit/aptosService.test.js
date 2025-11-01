/**
 * Unit Tests for Aptos Service
 * Tests blockchain interaction functions
 */

import { jest } from '@jest/globals';

describe('Aptos Service - Unit Tests', () => {
  let aptosService;
  
  // Mock Aptos SDK
  const mockAptosClient = {
    getAccountResource: jest.fn(),
    signAndSubmitTransaction: jest.fn(),
    waitForTransaction: jest.fn(),
    view: jest.fn()
  };

  beforeAll(async () => {
    // Mock the Aptos SDK module
    jest.unstable_mockModule('@aptos-labs/ts-sdk', () => ({
      Aptos: jest.fn(() => mockAptosClient),
      AptosConfig: jest.fn(),
      Network: { TESTNET: 'testnet' }
    }));

    const module = await import('../src/services/aptosService.js');
    aptosService = module.default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isValidAddress', () => {
    test('should validate correct Aptos address', () => {
      const validAddress = '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f';
      expect(aptosService.isValidAddress(validAddress)).toBe(true);
    });

    test('should reject invalid Aptos address', () => {
      const invalidAddresses = [
        'invalid',
        '0x123', // Too short
        '0xZZZZ', // Invalid hex
        '',
        null
      ];

      invalidAddresses.forEach(addr => {
        expect(aptosService.isValidAddress(addr)).toBe(false);
      });
    });

    test('should handle address with 0x prefix', () => {
      const address = '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f';
      expect(aptosService.isValidAddress(address)).toBe(true);
    });
  });

  describe('getACTBalance', () => {
    test('should return token balance for valid address', async () => {
      const mockBalance = 1000;
      mockAptosClient.view.mockResolvedValue([mockBalance]);

      const balance = await aptosService.getACTBalance('0x123');

      expect(mockAptosClient.view).toHaveBeenCalled();
      expect(balance).toBe(mockBalance);
    });

    test('should return 0 for account with no balance', async () => {
      mockAptosClient.view.mockResolvedValue([0]);

      const balance = await aptosService.getACTBalance('0x123');

      expect(balance).toBe(0);
    });

    test('should handle errors gracefully', async () => {
      mockAptosClient.view.mockRejectedValue(new Error('Account not found'));

      const balance = await aptosService.getACTBalance('0x123');

      expect(balance).toBe(0); // Should return 0 on error
    });
  });

  describe('getAPTBalance', () => {
    test('should return APT balance for valid address', async () => {
      const mockResource = {
        data: {
          coin: {
            value: '5500000000' // 5.5 APT in octas
          }
        }
      };

      mockAptosClient.getAccountResource.mockResolvedValue(mockResource);

      const balance = await aptosService.getAPTBalance('0x123');

      expect(balance).toBe(5.5);
    });

    test('should return 0 for account with no APT', async () => {
      mockAptosClient.getAccountResource.mockRejectedValue(
        new Error('Resource not found')
      );

      const balance = await aptosService.getAPTBalance('0x123');

      expect(balance).toBe(0);
    });
  });

  describe('mintACT', () => {
    test('should mint tokens successfully', async () => {
      const mockTxHash = '0xabc123def456';
      
      mockAptosClient.signAndSubmitTransaction.mockResolvedValue({
        hash: mockTxHash
      });
      
      mockAptosClient.waitForTransaction.mockResolvedValue({
        success: true
      });

      const result = await aptosService.mintACT('0x123', 1000);

      expect(result).toHaveProperty('transactionHash', mockTxHash);
      expect(result).toHaveProperty('success', true);
      expect(mockAptosClient.signAndSubmitTransaction).toHaveBeenCalled();
    });

    test('should handle minting errors', async () => {
      mockAptosClient.signAndSubmitTransaction.mockRejectedValue(
        new Error('Transaction failed')
      );

      await expect(aptosService.mintACT('0x123', 1000))
        .rejects.toThrow('Transaction failed');
    });

    test('should validate amount is positive', async () => {
      await expect(aptosService.mintACT('0x123', -100))
        .rejects.toThrow();
    });
  });

  describe('transferACT', () => {
    test('should transfer tokens successfully', async () => {
      const mockTxHash = '0xdef789ghi012';
      
      mockAptosClient.signAndSubmitTransaction.mockResolvedValue({
        hash: mockTxHash
      });
      
      mockAptosClient.waitForTransaction.mockResolvedValue({
        success: true
      });

      const result = await aptosService.transferACT('0x123', '0x456', 100);

      expect(result).toHaveProperty('transactionHash', mockTxHash);
      expect(result).toHaveProperty('success', true);
    });

    test('should validate addresses are different', async () => {
      await expect(aptosService.transferACT('0x123', '0x123', 100))
        .rejects.toThrow();
    });
  });

  describe('createProposal', () => {
    test('should create proposal on blockchain', async () => {
      const mockTxHash = '0xprop123456';
      const mockProposalId = 5;
      
      mockAptosClient.signAndSubmitTransaction.mockResolvedValue({
        hash: mockTxHash
      });
      
      mockAptosClient.waitForTransaction.mockResolvedValue({
        success: true
      });
      
      mockAptosClient.view.mockResolvedValue([mockProposalId]);

      const result = await aptosService.createProposal(
        'Test Proposal',
        'Description',
        50000,
        '0x123',
        7
      );

      expect(result).toHaveProperty('proposalId', mockProposalId);
      expect(result).toHaveProperty('transactionHash', mockTxHash);
    });

    test('should validate voting duration', async () => {
      await expect(
        aptosService.createProposal('Test', 'Desc', 50000, '0x123', 0)
      ).rejects.toThrow();
    });
  });

  describe('submitVote', () => {
    test('should submit vote successfully', async () => {
      const mockTxHash = '0xvote123456';
      
      mockAptosClient.signAndSubmitTransaction.mockResolvedValue({
        hash: mockTxHash
      });
      
      mockAptosClient.waitForTransaction.mockResolvedValue({
        success: true
      });

      const result = await aptosService.submitVote(5, true, '0x123');

      expect(result).toHaveProperty('transactionHash', mockTxHash);
      expect(result).toHaveProperty('success', true);
      expect(mockAptosClient.signAndSubmitTransaction).toHaveBeenCalled();
    });

    test('should handle vote for and against', async () => {
      mockAptosClient.signAndSubmitTransaction.mockResolvedValue({
        hash: '0xvote123'
      });
      
      mockAptosClient.waitForTransaction.mockResolvedValue({
        success: true
      });

      // Vote for
      const resultFor = await aptosService.submitVote(5, true, '0x123');
      expect(resultFor.success).toBe(true);

      // Vote against
      const resultAgainst = await aptosService.submitVote(5, false, '0x123');
      expect(resultAgainst.success).toBe(true);
    });
  });

  describe('getProposalDetails', () => {
    test('should return proposal details from blockchain', async () => {
      const mockProposalData = {
        proposer: '0x123',
        votesFor: 1000,
        votesAgainst: 500,
        deadline: 1706745600,
        isActive: true,
        executed: false
      };

      mockAptosClient.view.mockResolvedValue([mockProposalData]);

      const result = await aptosService.getProposalDetails(5);

      expect(result).toHaveProperty('proposer');
      expect(result).toHaveProperty('votesFor');
      expect(result).toHaveProperty('votesAgainst');
      expect(result).toHaveProperty('isActive');
    });

    test('should handle non-existent proposal', async () => {
      mockAptosClient.view.mockRejectedValue(new Error('Proposal not found'));

      await expect(aptosService.getProposalDetails(999))
        .rejects.toThrow();
    });
  });

  describe('getTreasuryBalance', () => {
    test('should return treasury balance', async () => {
      const mockBalance = 10000;
      mockAptosClient.view.mockResolvedValue([mockBalance]);

      const balance = await aptosService.getTreasuryBalance();

      expect(balance).toBe(mockBalance);
      expect(mockAptosClient.view).toHaveBeenCalled();
    });

    test('should return 0 if treasury is empty', async () => {
      mockAptosClient.view.mockResolvedValue([0]);

      const balance = await aptosService.getTreasuryBalance();

      expect(balance).toBe(0);
    });
  });

  describe('getClaimableDividends', () => {
    test('should return claimable dividend amount', async () => {
      const mockDividends = 50;
      mockAptosClient.view.mockResolvedValue([mockDividends]);

      const amount = await aptosService.getClaimableDividends('0x123');

      expect(amount).toBe(mockDividends);
    });

    test('should return 0 if no dividends available', async () => {
      mockAptosClient.view.mockResolvedValue([0]);

      const amount = await aptosService.getClaimableDividends('0x123');

      expect(amount).toBe(0);
    });
  });

  describe('claimDividends', () => {
    test('should claim dividends successfully', async () => {
      const mockTxHash = '0xdiv123456';
      const mockAmount = 50;
      
      mockAptosClient.view.mockResolvedValue([mockAmount]);
      
      mockAptosClient.signAndSubmitTransaction.mockResolvedValue({
        hash: mockTxHash
      });
      
      mockAptosClient.waitForTransaction.mockResolvedValue({
        success: true
      });

      const result = await aptosService.claimDividends('0x123');

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('transactionHash', mockTxHash);
      expect(result).toHaveProperty('amount', mockAmount);
    });

    test('should reject if no dividends to claim', async () => {
      mockAptosClient.view.mockResolvedValue([0]);

      const result = await aptosService.claimDividends('0x123');

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/no dividends/i);
    });
  });
});
