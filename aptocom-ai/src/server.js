/**
 * AptoCom Backend Server
 * Main Express server for AI-powered DAO API
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { performHealthCheck } = require('./utils/healthCheck');
const { connect: connectDatabase } = require('./config/database');

// Import routes
const proposalRoutes = require('./routes/proposalRoutes');
const votingRoutes = require('./routes/votingRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const treasuryRoutes = require('./routes/treasuryRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDatabase();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Basic health check endpoint (fast)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'AptoCom Backend API',
    version: '1.0.0',
    network: process.env.APTOS_NETWORK || 'testnet'
  });
});

// Detailed health check endpoint (checks all services)
app.get('/health/detailed', async (req, res) => {
  try {
    const healthStatus = await performHealthCheck(true);
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// API routes
app.use('/api/proposals', proposalRoutes);
app.use('/api/voting', votingRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/treasury', treasuryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to AptoCom Backend API',
    docs: '/api/docs',
    health: '/health',
    endpoints: {
      proposals: '/api/proposals',
      voting: '/api/voting',
      tokens: '/api/tokens',
      treasury: '/api/treasury',
      analytics: '/api/analytics',
      users: '/api/users'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Endpoint not found',
      status: 404,
      path: req.path
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║     🚀 AptoCom Backend API Started     ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🌐 Network: ${process.env.APTOS_NETWORK || 'testnet'}`);
  console.log(`📦 Contract: ${process.env.TOKEN_CONTRACT_ADDRESS || 'Not configured'}`);
  console.log(`🤖 AI Service: ${process.env.GROQ_API_KEY ? 'Groq (Configured)' : 'Not configured'}`);
  console.log(`💾 Database: ${process.env.MONGODB_URI ? 'MongoDB (Configured)' : 'Not configured'}`);
  console.log(`📁 IPFS: ${process.env.NFT_STORAGE_API_KEY ? 'nft.storage (Configured)' : 'Not configured'}`);
  console.log('════════════════════════════════════════════');
});

module.exports = app;
