/**
 * Token Routes
 * 
 * RESTful API endpoints for token operations
 * 
 * Routes:
 * - GET    /api/tokens/balance/:address   - Get ACT and APT balances
 * - POST   /api/tokens/mint               - Mint ACT tokens (admin)
 * - POST   /api/tokens/transfer           - Transfer ACT tokens
 * - GET    /api/tokens/info               - Get token metadata
 * - GET    /api/tokens/stats              - Get token statistics
 */

const express = require('express');
const tokenController = require('../controllers/tokenController');

const router = express.Router();

/**
 * GET /api/tokens/balance/:address
 * Get ACT and APT token balances for a wallet
 * 
 * Params:
 * - address: Aptos wallet address
 * 
 * Response:
 * - walletAddress: string
 * - balances: { ACT: number, APT: number }
 * - timestamp: date
 */
router.get('/balance/:address', tokenController.getBalance);

/**
 * POST /api/tokens/mint
 * Mint ACT tokens to an address (admin only)
 * 
 * Body:
 * - toAddress: string (recipient)
 * - amount: number (tokens to mint)
 * - adminWallet: string (admin authorization)
 * 
 * Response:
 * - toAddress, amount, transactionHash, timestamp
 */
router.post('/mint', tokenController.mintTokens);

/**
 * POST /api/tokens/transfer
 * Transfer ACT tokens between addresses
 * 
 * Body:
 * - fromAddress: string (sender)
 * - toAddress: string (recipient)
 * - amount: number (tokens to transfer)
 * 
 * Response:
 * - fromAddress, toAddress, amount, transactionHash, timestamp
 */
router.post('/transfer', tokenController.transferTokens);

/**
 * GET /api/tokens/info
 * Get ACT token metadata and information
 * 
 * Response:
 * - name, symbol, decimals, description
 * - network, standard, contractAddress
 * - features, links
 */
router.get('/info', tokenController.getTokenInfo);

/**
 * GET /api/tokens/stats
 * Get aggregate token statistics
 * 
 * Response:
 * - totalSupply: number
 * - totalHolders: number
 * - averageHolding: number
 * - largestHolder: number
 * - smallestHolder: number
 */
router.get('/stats', tokenController.getTokenStats);

module.exports = router;
