/**
 * Health Check Module
 * Provides health status for all external services
 * Can be used by the /health endpoint
 */

const { MongoClient } = require('mongodb');
const { Aptos, AptosConfig, Network } = require('@aptos-labs/ts-sdk');
const axios = require('axios');
const config = require('../config');

/**
 * Check MongoDB connection
 */
async function checkMongoDB() {
  const client = new MongoClient(config.mongodb.uri, {
    serverSelectionTimeoutMS: 3000,
  });
  
  try {
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    return { status: 'healthy', message: 'MongoDB connected' };
  } catch (error) {
    return { status: 'unhealthy', message: error.message };
  } finally {
    await client.close();
  }
}

/**
 * Check Aptos blockchain connection
 */
async function checkAptos() {
  try {
    const aptosConfig = new AptosConfig({ network: Network.TESTNET });
    const aptos = new Aptos(aptosConfig);
    const ledgerInfo = await aptos.getLedgerInfo();
    
    return { 
      status: 'healthy', 
      message: 'Aptos testnet connected',
      chainId: ledgerInfo.chain_id,
      ledgerVersion: ledgerInfo.ledger_version,
    };
  } catch (error) {
    return { status: 'unhealthy', message: error.message };
  }
}

/**
 * Check Groq AI API
 */
async function checkGroqAI() {
  try {
    // We don't want to make actual API calls for health checks
    // Just verify the API key is set
    if (config.ai.groq.apiKey && config.ai.groq.apiKey.startsWith('gsk_')) {
      return { status: 'healthy', message: 'Groq API key configured' };
    } else {
      return { status: 'unhealthy', message: 'Invalid Groq API key' };
    }
  } catch (error) {
    return { status: 'unhealthy', message: error.message };
  }
}

/**
 * Check IPFS (nft.storage) connection
 */
async function checkIPFS() {
  try {
    // Verify API key is set
    if (config.ipfs.apiKey) {
      return { status: 'healthy', message: 'IPFS API key configured' };
    } else {
      return { status: 'unhealthy', message: 'IPFS API key not set' };
    }
  } catch (error) {
    return { status: 'unhealthy', message: error.message };
  }
}

/**
 * Check smart contract deployment
 */
async function checkSmartContracts() {
  try {
    const aptosConfig = new AptosConfig({ network: Network.TESTNET });
    const aptos = new Aptos(aptosConfig);
    
    // Check if token module exists
    const tokenModule = await aptos.getAccountModule({
      accountAddress: config.aptos.contracts.token,
      moduleName: 'act_token',
    });
    
    if (tokenModule) {
      return { 
        status: 'healthy', 
        message: 'Smart contracts verified',
        contracts: {
          token: config.aptos.contracts.token,
          governance: config.aptos.contracts.governance,
          treasury: config.aptos.contracts.treasury,
        },
      };
    } else {
      return { status: 'unhealthy', message: 'Smart contract not found' };
    }
  } catch (error) {
    return { status: 'unhealthy', message: error.message };
  }
}

/**
 * Perform full health check
 */
async function performHealthCheck(detailed = false) {
  const checks = {
    timestamp: new Date().toISOString(),
    service: 'AptoCom Backend API',
    version: '1.0.0',
    environment: config.nodeEnv,
    network: config.aptos.network,
  };
  
  if (detailed) {
    // Run all checks in parallel
    const [mongodb, aptos, groqAI, ipfs, contracts] = await Promise.all([
      checkMongoDB(),
      checkAptos(),
      checkGroqAI(),
      checkIPFS(),
      checkSmartContracts(),
    ]);
    
    checks.services = {
      mongodb,
      aptos,
      groqAI,
      ipfs,
      smartContracts: contracts,
    };
    
    // Overall status
    const allHealthy = Object.values(checks.services).every(s => s.status === 'healthy');
    checks.status = allHealthy ? 'healthy' : 'degraded';
  } else {
    // Quick health check
    checks.status = 'ok';
  }
  
  return checks;
}

module.exports = {
  checkMongoDB,
  checkAptos,
  checkGroqAI,
  checkIPFS,
  checkSmartContracts,
  performHealthCheck,
};
