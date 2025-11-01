/**
 * Configuration Loader
 * Validates and loads environment variables with defaults
 */

require('dotenv').config();

const config = {
  // Server
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Aptos Blockchain
  aptos: {
    network: process.env.APTOS_NETWORK || 'testnet',
    rpcUrl: process.env.APTOS_RPC_URL || 'https://fullnode.testnet.aptoslabs.com/v1',
    contracts: {
      token: process.env.TOKEN_CONTRACT_ADDRESS,
      governance: process.env.GOVERNANCE_CONTRACT_ADDRESS,
      treasury: process.env.TREASURY_CONTRACT_ADDRESS,
    },
  },
  
  // Service Wallet
  wallet: {
    privateKey: process.env.SERVICE_WALLET_PRIVATE_KEY,
    address: process.env.SERVICE_WALLET_ADDRESS,
  },
  
  // AI Service
  ai: {
    provider: 'groq', // or 'openai'
    groq: {
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || 'mixtral-8x7b-32768',
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4',
    },
  },
  
  // Database
  mongodb: {
    uri: process.env.MONGODB_URI,
    database: process.env.MONGODB_DATABASE || 'aptocom',
  },
  
  // IPFS
  ipfs: {
    apiKey: process.env.NFT_STORAGE_API_KEY,
  },
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

/**
 * Validate required environment variables
 */
function validateConfig() {
  const required = [
    'TOKEN_CONTRACT_ADDRESS',
    'GOVERNANCE_CONTRACT_ADDRESS',
    'TREASURY_CONTRACT_ADDRESS',
    'SERVICE_WALLET_PRIVATE_KEY',
    'GROQ_API_KEY',
    'MONGODB_URI',
    'NFT_STORAGE_API_KEY',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn('⚠️  Missing environment variables:');
    missing.forEach(key => console.warn(`   - ${key}`));
    console.warn('⚠️  Some features may not work correctly.');
    console.warn('💡 Check .env.example for required variables.\n');
  } else {
    console.log('✅ All required environment variables are set.\n');
  }
}

// Run validation on load
validateConfig();

module.exports = config;
