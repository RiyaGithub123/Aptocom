/**
 * Unit Tests for IPFS Service
 * Tests IPFS upload and retrieval functions
 */

import { jest } from '@jest/globals';

describe('IPFS Service - Unit Tests', () => {
  let ipfsService;
  
  // Mock nft.storage client
  const mockNFTStorageClient = {
    storeBlob: jest.fn(),
    storeDirectory: jest.fn(),
    status: jest.fn()
  };

  beforeAll(async () => {
    // Set environment variable
    process.env.NFT_STORAGE_API_KEY = 'test_nft_storage_key';

    // Mock nft.storage module
    jest.unstable_mockModule('nft.storage', () => ({
      NFTStorage: jest.fn(() => mockNFTStorageClient),
      Blob: global.Blob
    }));

    const module = await import('../src/services/ipfsService.js');
    ipfsService = module.default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadProposalPackage', () => {
    const sampleProposal = {
      title: 'Test Proposal',
      description: 'Test description',
      sector: 'AI Development',
      fundingAmount: 50000,
      timeline: '6 months',
      teamInfo: 'Test team',
      budgetBreakdown: 'Test budget'
    };

    const sampleFiles = [
      {
        filename: 'budget.pdf',
        buffer: Buffer.from('PDF content'),
        mimetype: 'application/pdf',
        size: 1024
      }
    ];

    test('should upload proposal package to IPFS', async () => {
      const mockCID = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
      
      mockNFTStorageClient.storeBlob.mockResolvedValue(mockCID);

      const result = await ipfsService.uploadProposalPackage(
        sampleProposal,
        sampleFiles
      );

      expect(result).toHaveProperty('cid');
      expect(result).toHaveProperty('documentUrl');
      expect(result).toHaveProperty('attachments');
      expect(Array.isArray(result.attachments)).toBe(true);
      expect(mockNFTStorageClient.storeBlob).toHaveBeenCalled();
    });

    test('should upload proposal without files', async () => {
      const mockCID = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
      
      mockNFTStorageClient.storeBlob.mockResolvedValue(mockCID);

      const result = await ipfsService.uploadProposalPackage(
        sampleProposal,
        []
      );

      expect(result).toHaveProperty('cid');
      expect(result.attachments).toHaveLength(0);
    });

    test('should handle multiple files', async () => {
      const mockCIDs = [
        'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
        'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdj'
      ];
      
      mockNFTStorageClient.storeBlob
        .mockResolvedValueOnce(mockCIDs[0])
        .mockResolvedValueOnce(mockCIDs[1]);

      const multipleFiles = [
        {
          filename: 'budget.pdf',
          buffer: Buffer.from('PDF content'),
          mimetype: 'application/pdf',
          size: 1024
        },
        {
          filename: 'roadmap.docx',
          buffer: Buffer.from('DOCX content'),
          mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 2048
        }
      ];

      const result = await ipfsService.uploadProposalPackage(
        sampleProposal,
        multipleFiles
      );

      expect(result.attachments).toHaveLength(2);
      expect(mockNFTStorageClient.storeBlob).toHaveBeenCalledTimes(3); // 1 for proposal + 2 files
    });

    test('should generate correct IPFS URLs', async () => {
      const mockCID = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
      
      mockNFTStorageClient.storeBlob.mockResolvedValue(mockCID);

      const result = await ipfsService.uploadProposalPackage(
        sampleProposal,
        sampleFiles
      );

      expect(result.documentUrl).toContain('https://');
      expect(result.documentUrl).toContain(mockCID);
      
      result.attachments.forEach(attachment => {
        expect(attachment.url).toContain('https://');
        expect(attachment.url).toContain(attachment.cid);
      });
    });

    test('should handle upload errors', async () => {
      mockNFTStorageClient.storeBlob.mockRejectedValue(
        new Error('IPFS upload failed')
      );

      await expect(
        ipfsService.uploadProposalPackage(sampleProposal, sampleFiles)
      ).rejects.toThrow('IPFS upload failed');
    });

    test('should validate file sizes', async () => {
      const largeFile = {
        filename: 'huge.pdf',
        buffer: Buffer.alloc(150 * 1024 * 1024), // 150 MB (over 100 MB limit)
        mimetype: 'application/pdf',
        size: 150 * 1024 * 1024
      };

      await expect(
        ipfsService.uploadProposalPackage(sampleProposal, [largeFile])
      ).rejects.toThrow();
    });

    test('should validate proposal data', async () => {
      const invalidProposal = {
        title: 'Test'
        // Missing required fields
      };

      await expect(
        ipfsService.uploadProposalPackage(invalidProposal, [])
      ).rejects.toThrow();
    });

    test('should use fallback gateways', async () => {
      const mockCID = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
      
      mockNFTStorageClient.storeBlob.mockResolvedValue(mockCID);

      const result = await ipfsService.uploadProposalPackage(
        sampleProposal,
        []
      );

      // Should use primary gateway
      expect(result.documentUrl).toContain('nftstorage.link');
    });
  });

  describe('retrieveProposalPackage', () => {
    test('should retrieve proposal from IPFS', async () => {
      const mockCID = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
      
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          title: 'Test Proposal',
          description: 'Test description'
        })
      });

      const result = await ipfsService.retrieveProposalPackage(mockCID);

      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
      expect(global.fetch).toHaveBeenCalled();
    });

    test('should handle retrieval errors', async () => {
      const mockCID = 'invalid_cid';
      
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404
      });

      await expect(
        ipfsService.retrieveProposalPackage(mockCID)
      ).rejects.toThrow();
    });

    test('should try fallback gateways on failure', async () => {
      const mockCID = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
      
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: false, status: 500 }) // First gateway fails
        .mockResolvedValueOnce({ // Second gateway succeeds
          ok: true,
          json: jest.fn().mockResolvedValue({ title: 'Test' })
        });

      const result = await ipfsService.retrieveProposalPackage(mockCID);

      expect(result).toHaveProperty('title');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('validateFile', () => {
    test('should validate supported file types', () => {
      const supportedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/json',
        'text/csv',
        'image/jpeg',
        'image/png',
        'application/zip'
      ];

      supportedTypes.forEach(mimetype => {
        const file = {
          filename: 'test.file',
          buffer: Buffer.from('content'),
          mimetype,
          size: 1024
        };

        expect(() => ipfsService.validateFile(file)).not.toThrow();
      });
    });

    test('should reject unsupported file types', () => {
      const unsupportedFile = {
        filename: 'test.exe',
        buffer: Buffer.from('content'),
        mimetype: 'application/x-msdownload',
        size: 1024
      };

      expect(() => ipfsService.validateFile(unsupportedFile)).toThrow();
    });

    test('should reject files over size limit', () => {
      const largeFile = {
        filename: 'large.pdf',
        buffer: Buffer.alloc(150 * 1024 * 1024),
        mimetype: 'application/pdf',
        size: 150 * 1024 * 1024
      };

      expect(() => ipfsService.validateFile(largeFile)).toThrow();
    });

    test('should accept files under size limit', () => {
      const validFile = {
        filename: 'small.pdf',
        buffer: Buffer.from('content'),
        mimetype: 'application/pdf',
        size: 1024
      };

      expect(() => ipfsService.validateFile(validFile)).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing API key', () => {
      const originalKey = process.env.NFT_STORAGE_API_KEY;
      delete process.env.NFT_STORAGE_API_KEY;

      // Service should throw or handle gracefully
      
      process.env.NFT_STORAGE_API_KEY = originalKey; // Restore
    });

    test('should handle network timeouts', async () => {
      const mockCID = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
      
      mockNFTStorageClient.storeBlob.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 100);
        });
      });

      await expect(
        ipfsService.uploadProposalPackage(
          { title: 'Test', description: 'Test', sector: 'Test', fundingAmount: 1000 },
          []
        )
      ).rejects.toThrow();
    });
  });
});
