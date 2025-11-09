/**
 * Analytics Routes
 * 
 * API endpoints for analytics and metrics
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Get dashboard overview (supports both /overview and /dashboard paths)
router.get('/overview', analyticsController.getOverview);
router.get('/dashboard', analyticsController.getOverview); // Alias for dashboard

// Get proposal metrics
router.get('/proposals', analyticsController.getProposalMetrics);

// Get token metrics
router.get('/tokens', analyticsController.getTokenMetrics);

// Get user metrics
router.get('/users', analyticsController.getUserMetrics);

module.exports = router;
