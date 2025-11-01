/**
 * User Routes
 * 
 * API endpoints for user operations
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Register/create user
router.post('/register', userController.registerUser);

// Get user profile
router.get('/:address', userController.getUserProfile);

// Update user profile
router.put('/:address', userController.updateUserProfile);

// Get user activity log
router.get('/:address/activity', userController.getUserActivity);

module.exports = router;
