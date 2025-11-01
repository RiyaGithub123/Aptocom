/**
 * Treasury Routes
 * 
 * API endpoints for treasury operations
 */

const express = require('express');
const router = express.Router();
const treasuryController = require('../controllers/treasuryController');

// Get treasury balance
router.get('/balance', treasuryController.getTreasuryBalance);

// Get treasury transactions (paginated)
router.get('/transactions', treasuryController.getTreasuryTransactions);

// Distribute dividends (admin only)
router.post('/distribute', treasuryController.distributeDividends);

// Get claimable dividends for address
router.get('/dividends/:address', treasuryController.getClaimableDividends);

// Claim dividends
router.post('/claim', treasuryController.claimDividends);

module.exports = router;
