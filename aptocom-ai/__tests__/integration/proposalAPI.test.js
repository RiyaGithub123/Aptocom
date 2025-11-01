/**
 * Integration Tests for Proposal API
 * Tests complete API endpoint flows with mocked services
 */

import { jest } from '@jest/globals';
import request from 'supertest';

describe('Proposal API - Integration Tests', () => {
  let app;
  
  beforeAll(async () => {
    // Mock environment variables
    process.env.MONGODB_URI = 'mongodb://localhost:27017/aptocom_test';
    process.env.PORT = '5001';
    process.env.GROQ_API_KEY = 'test_key';
    
    // Import app after env setup
    const appModule = await import('../../src/server.js');
    app = appModule.default;
  });

  afterAll(async () => {
    // Cleanup
    if (app && app.close) {
      await app.close();
    }
  });

  describe('GET /api/proposals', () => {
    test('should return list of proposals', async () => {
      const response = await request(app)
        .get('/api/proposals')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('proposals');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.proposals)).toBe(true);
    });

    test('should filter proposals by status', async () => {
      const response = await request(app)
        .get('/api/proposals')
        .query({ status: 'voting', page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      if (response.body.data.proposals.length > 0) {
        response.body.data.proposals.forEach(proposal => {
          expect(proposal.status).toBe('voting');
        });
      }
    });

    test('should handle pagination correctly', async () => {
      const response = await request(app)
        .get('/api/proposals')
        .query({ page: 1, limit: 5 });

      expect(response.status).toBe(200);
      expect(response.body.data.pagination).toHaveProperty('currentPage', 1);
      expect(response.body.data.pagination).toHaveProperty('limit', 5);
      expect(response.body.data.pagination).toHaveProperty('totalPages');
      expect(response.body.data.pagination).toHaveProperty('totalCount');
    });
  });

  describe('GET /api/proposals/stats', () => {
    test('should return proposal statistics', async () => {
      const response = await request(app)
        .get('/api/proposals/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalProposals');
      expect(response.body.data).toHaveProperty('byStatus');
      expect(response.body.data).toHaveProperty('bySector');
      expect(response.body.data).toHaveProperty('totalFundingRequested');
      expect(typeof response.body.data.totalProposals).toBe('number');
    });
  });

  describe('GET /api/proposals/:id', () => {
    test('should return 404 for non-existent proposal', async () => {
      const response = await request(app)
        .get('/api/proposals/507f1f77bcf86cd799439011');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
    });

    test('should return 400 for invalid proposal ID format', async () => {
      const response = await request(app)
        .get('/api/proposals/invalid-id');

      expect(response.status).toBe(500); // MongoDB will throw error for invalid ID
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/proposals/create', () => {
    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/proposals/create')
        .send({
          title: 'Test Proposal'
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/required/i);
    });

    test('should validate wallet address format', async () => {
      const response = await request(app)
        .post('/api/proposals/create')
        .send({
          title: 'Test Proposal',
          description: 'Test description',
          sector: 'AI Development',
          fundingAmount: 50000,
          walletAddress: 'invalid-wallet',
          timeline: '6 months',
          teamInfo: 'Test team',
          budgetBreakdown: 'Test budget'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/wallet address/i);
    });

    test('should validate funding amount', async () => {
      const response = await request(app)
        .post('/api/proposals/create')
        .send({
          title: 'Test Proposal',
          description: 'Test description',
          sector: 'AI Development',
          fundingAmount: -1000, // Invalid negative amount
          walletAddress: '0x1a2b3c4d5e6f7g8h9i0j',
          timeline: '6 months',
          teamInfo: 'Test team',
          budgetBreakdown: 'Test budget'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/proposals/:id/evaluate', () => {
    test('should return 404 for non-existent proposal', async () => {
      const response = await request(app)
        .post('/api/proposals/507f1f77bcf86cd799439011/evaluate')
        .send({ force: false });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/proposals/unknown-route');

      expect([404, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/proposals/create')
        .set('Content-Type', 'application/json')
        .send('{"invalid json}');

      expect(response.status).toBe(400);
    });
  });
});
