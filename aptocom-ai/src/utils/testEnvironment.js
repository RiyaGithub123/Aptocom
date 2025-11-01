/**
 * Environment Configuration Testing Script
 * Tests all external service connections and configurations
 */

const Groq = require('groq-sdk');
const { MongoClient } = require('mongodb');
const { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } = require('@aptos-labs/ts-sdk');
const { NFTStorage } = require('nft.storage');
const config = require('../config');

// ANSI colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.bold}${colors.blue}━━━ ${msg} ━━━${colors.reset}\n`),
};

/**
 * Test 1: MongoDB Connection
 */
async function testMongoDB() {
  log.section('Testing MongoDB Connection');
  
  const client = new MongoClient(config.mongodb.uri, {
    serverSelectionTimeoutMS: 5000,
  });
  
  try {
    log.info('Connecting to MongoDB Atlas...');
    await client.connect();
    
    log.info('Pinging MongoDB server...');
    await client.db('admin').command({ ping: 1 });
    
    log.info('Listing databases...');
    const databasesList = await client.db().admin().listDatabases();
    const dbNames = databasesList.databases.map(db => db.name).join(', ');
    
    log.success('MongoDB connection successful!');
    log.info(`Database URI: ${config.mongodb.uri.split('@')[1]?.split('?')[0] || 'hidden'}`);
    log.info(`Target Database: ${config.mongodb.database}`);
    log.info(`Available Databases: ${dbNames}`);
    
    return { success: true, service: 'MongoDB' };
  } catch (error) {
    log.error('MongoDB connection failed!');
    log.error(`Error: ${error.message}`);
    return { success: false, service: 'MongoDB', error: error.message };
  } finally {
    await client.close();
  }
}

/**
 * Test 2: Groq AI API
 */
async function testGroqAI() {
  log.section('Testing Groq AI API');
  
  try {
    log.info('Initializing Groq client...');
    const groq = new Groq({
      apiKey: config.ai.groq.apiKey,
    });
    
    log.info('Sending test prompt to Groq AI...');
    const startTime = Date.now();
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an AI evaluator for a DAO. Rate the following proposal on a scale of 0-100.',
        },
        {
          role: 'user',
          content: 'Proposal: Develop a mobile app for our DAO members to vote on proposals. Budget: $50,000. Timeline: 6 months.',
        },
      ],
      model: config.ai.groq.model,
      temperature: 0.7,
      max_tokens: 500,
    });
    
    const responseTime = Date.now() - startTime;
    const response = chatCompletion.choices[0]?.message?.content;
    
    log.success('Groq AI API connection successful!');
    log.info(`Model: ${config.ai.groq.model}`);
    log.info(`Response Time: ${responseTime}ms`);
    log.info(`Usage: ${chatCompletion.usage?.total_tokens || 0} tokens`);
    log.info(`Sample Response: ${response?.substring(0, 150)}...`);
    
    return { success: true, service: 'Groq AI', responseTime, tokens: chatCompletion.usage?.total_tokens };
  } catch (error) {
    log.error('Groq AI API connection failed!');
    log.error(`Error: ${error.message}`);
    return { success: false, service: 'Groq AI', error: error.message };
  }
}

/**
 * Test 3: Aptos SDK Connection
 */
async function testAptosSDK() {
  log.section('Testing Aptos SDK Connection');
  
  try {
    log.info('Initializing Aptos client...');
    const aptosConfig = new AptosConfig({ network: Network.TESTNET });
    const aptos = new Aptos(aptosConfig);
    
    log.info('Connecting to Aptos testnet...');
    const ledgerInfo = await aptos.getLedgerInfo();
    
    log.info('Loading service wallet...');
    // Remove 'ed25519-priv-' prefix and '0x' prefix if present
    let privateKeyHex = config.wallet.privateKey;
    if (privateKeyHex.startsWith('ed25519-priv-')) {
      privateKeyHex = privateKeyHex.replace('ed25519-priv-', '');
    }
    if (privateKeyHex.startsWith('0x')) {
      privateKeyHex = privateKeyHex.slice(2);
    }
    
    const privateKey = new Ed25519PrivateKey(privateKeyHex);
    const account = Account.fromPrivateKey({ privateKey });
    
    log.info('Querying wallet balance...');
    const balance = await aptos.getAccountAPTAmount({
      accountAddress: account.accountAddress,
    });
    
    log.info('Verifying smart contracts...');
    const tokenModule = await aptos.getAccountModule({
      accountAddress: config.aptos.contracts.token,
      moduleName: 'act_token',
    });
    
    log.success('Aptos SDK connection successful!');
    log.info(`Network: ${config.aptos.network}`);
    log.info(`RPC URL: ${config.aptos.rpcUrl}`);
    log.info(`Chain ID: ${ledgerInfo.chain_id}`);
    log.info(`Ledger Version: ${ledgerInfo.ledger_version}`);
    log.info(`Service Wallet: ${account.accountAddress.toString()}`);
    log.info(`Wallet Balance: ${(balance / 100000000).toFixed(6)} APT`);
    log.info(`Token Contract: ${config.aptos.contracts.token}`);
    log.info(`Token Module Found: ${tokenModule ? 'Yes' : 'No'}`);
    
    return { 
      success: true, 
      service: 'Aptos SDK', 
      chainId: ledgerInfo.chain_id,
      balance: balance / 100000000,
      contractVerified: !!tokenModule,
    };
  } catch (error) {
    log.error('Aptos SDK connection failed!');
    log.error(`Error: ${error.message}`);
    return { success: false, service: 'Aptos SDK', error: error.message };
  }
}

/**
 * Test 4: IPFS Storage (nft.storage)
 */
async function testIPFS() {
  log.section('Testing IPFS Storage (nft.storage)');
  
  try {
    log.info('Verifying nft.storage API key configuration...');
    
    // Check if API key is set
    if (!config.ipfs.apiKey || config.ipfs.apiKey.length < 10) {
      throw new Error('IPFS API key not configured or invalid');
    }
    
    log.info('Creating test file...');
    const testData = JSON.stringify({
      name: 'Test Proposal',
      description: 'This is a test proposal for AptoCom environment validation',
      timestamp: new Date().toISOString(),
    });
    
    // Use axios to test the nft.storage API directly
    const axios = require('axios');
    log.info('Testing nft.storage API connectivity...');
    
    try {
      const response = await axios.post(
        'https://api.nft.storage/upload',
        Buffer.from(testData),
        {
          headers: {
            'Authorization': `Bearer ${config.ipfs.apiKey}`,
            'Content-Type': 'application/octet-stream',
          },
          timeout: 10000,
        }
      );
      
      const cid = response.data.value.cid;
      const gatewayUrl = `https://nftstorage.link/ipfs/${cid}`;
      
      log.success('IPFS Storage connection successful!');
      log.info(`CID: ${cid}`);
      log.info(`Gateway URL: ${gatewayUrl}`);
      log.info(`Upload successful - file stored on IPFS`);
      
      return { 
        success: true, 
        service: 'IPFS (nft.storage)', 
        cid 
      };
    } catch (uploadError) {
      if (uploadError.response) {
        log.warning(`API returned status ${uploadError.response.status}`);
        log.warning(`Response: ${JSON.stringify(uploadError.response.data)}`);
      }
      throw uploadError;
    }
  } catch (error) {
    log.error('IPFS Storage connection failed!');
    log.error(`Error: ${error.message}`);
    log.warning('IPFS will be tested during actual implementation');
    return { success: false, service: 'IPFS', error: error.message, warning: 'Can be configured later' };
  }
}

/**
 * Test 5: Environment Variables Validation
 */
async function testEnvironmentVariables() {
  log.section('Validating Environment Variables');
  
  const required = {
    'Server': {
      'PORT': config.port,
      'NODE_ENV': config.nodeEnv,
    },
    'Aptos Blockchain': {
      'APTOS_NETWORK': config.aptos.network,
      'APTOS_RPC_URL': config.aptos.rpcUrl,
      'TOKEN_CONTRACT_ADDRESS': config.aptos.contracts.token,
      'GOVERNANCE_CONTRACT_ADDRESS': config.aptos.contracts.governance,
      'TREASURY_CONTRACT_ADDRESS': config.aptos.contracts.treasury,
    },
    'Service Wallet': {
      'SERVICE_WALLET_PRIVATE_KEY': config.wallet.privateKey ? '✓ Set (hidden)' : '✗ Not set',
      'SERVICE_WALLET_ADDRESS': config.wallet.address,
    },
    'AI Service': {
      'GROQ_API_KEY': config.ai.groq.apiKey ? '✓ Set (hidden)' : '✗ Not set',
      'GROQ_MODEL': config.ai.groq.model,
    },
    'Database': {
      'MONGODB_URI': config.mongodb.uri ? `✓ Set (${config.mongodb.uri.split('@')[1]?.split('?')[0] || 'hidden'})` : '✗ Not set',
      'MONGODB_DATABASE': config.mongodb.database,
    },
    'IPFS Storage': {
      'NFT_STORAGE_API_KEY': config.ipfs.apiKey ? '✓ Set (hidden)' : '✗ Not set',
    },
    'CORS & Rate Limiting': {
      'CORS_ORIGIN': config.cors.origin.join(', '),
      'RATE_LIMIT_WINDOW_MS': `${config.rateLimit.windowMs}ms (${config.rateLimit.windowMs / 60000} minutes)`,
      'RATE_LIMIT_MAX_REQUESTS': config.rateLimit.maxRequests,
    },
  };
  
  let allValid = true;
  
  for (const [category, vars] of Object.entries(required)) {
    log.info(`\n${colors.bold}${category}:${colors.reset}`);
    for (const [key, value] of Object.entries(vars)) {
      if (value && value !== '✗ Not set') {
        console.log(`  ✓ ${key}: ${value}`);
      } else {
        console.log(`  ${colors.red}✗ ${key}: Not set${colors.reset}`);
        allValid = false;
      }
    }
  }
  
  if (allValid) {
    log.success('\nAll environment variables are properly configured!');
    return { success: true, service: 'Environment Variables' };
  } else {
    log.warning('\nSome environment variables are missing!');
    return { success: false, service: 'Environment Variables', error: 'Missing variables' };
  }
}

/**
 * Main Test Runner
 */
async function runAllTests() {
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.bold}${colors.cyan}   APTOCOM ENVIRONMENT CONFIGURATION TESTING   ${colors.reset}`);
  console.log('='.repeat(70));
  
  const startTime = Date.now();
  const results = [];
  
  // Run all tests
  results.push(await testEnvironmentVariables());
  results.push(await testMongoDB());
  results.push(await testGroqAI());
  results.push(await testAptosSDK());
  results.push(await testIPFS());
  
  // Summary
  const totalTime = Date.now() - startTime;
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success && !r.warning).length;
  const warnings = results.filter(r => r.warning).length;
  
  log.section('Test Summary');
  console.log(`Total Tests: ${results.length}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.yellow}Warnings: ${warnings}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Total Time: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
  
  console.log('\n' + '='.repeat(70));
  
  if (failed === 0) {
    log.success('🎉 All critical services are configured and working correctly!');
    if (warnings > 0) {
      log.warning(`⚠️  ${warnings} service(s) have warnings but can be configured later.`);
    }
    console.log('\n✅ You can proceed to Phase 3.3: Database Schema Design\n');
    process.exit(0);
  } else {
    log.error('❌ Some critical services failed to connect. Please check the errors above.');
    console.log('\n⚠️  Fix the failing services before proceeding.\n');
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    log.error('Unexpected error during testing:');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { runAllTests };
