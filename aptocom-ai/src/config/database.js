/**
 * Database Connection Module
 * Manages MongoDB connection with retry logic and pooling
 */

const mongoose = require('mongoose');

// Connection configuration
const config = {
  // MongoDB URI from environment
  uri: process.env.MONGODB_URI,
  
  // Connection options
  options: {
    // Server selection timeout (30 seconds)
    serverSelectionTimeoutMS: 30000,
    
    // Socket timeout (45 seconds)
    socketTimeoutMS: 45000,
    
    // Connection pooling
    maxPoolSize: 10,
    minPoolSize: 2,
    
    // Automatic index creation
    autoIndex: true,
    
    // Use new URL parser
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  
  // Retry configuration
  retry: {
    maxAttempts: 5,
    initialDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    factor: 2, // Exponential backoff
  },
};

// Connection state tracking
let connectionAttempts = 0;
let isConnecting = false;
let isShuttingDown = false;

/**
 * Calculate delay for exponential backoff
 * @param {number} attempt - Current attempt number
 * @returns {number} - Delay in milliseconds
 */
function calculateDelay(attempt) {
  const delay = Math.min(
    config.retry.initialDelay * Math.pow(config.retry.factor, attempt - 1),
    config.retry.maxDelay
  );
  return delay;
}

/**
 * Connect to MongoDB with retry logic
 * @returns {Promise<void>}
 */
async function connect() {
  // Prevent multiple simultaneous connection attempts
  if (isConnecting) {
    console.log('Connection attempt already in progress');
    return;
  }
  
  // Don't connect if shutting down
  if (isShuttingDown) {
    console.log('Cannot connect: database is shutting down');
    return;
  }
  
  // Check if already connected
  if (mongoose.connection.readyState === 1) {
    console.log('MongoDB already connected');
    return;
  }
  
  isConnecting = true;
  connectionAttempts++;
  
  try {
    console.log(`Connecting to MongoDB (attempt ${connectionAttempts}/${config.retry.maxAttempts})...`);
    
    await mongoose.connect(config.uri, config.options);
    
    console.log('✅ MongoDB connected successfully');
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Connection pool: ${config.options.maxPoolSize} max, ${config.options.minPoolSize} min`);
    
    // Reset connection attempts on success
    connectionAttempts = 0;
    isConnecting = false;
    
  } catch (error) {
    isConnecting = false;
    
    console.error(`❌ MongoDB connection failed (attempt ${connectionAttempts}):`, error.message);
    
    // Retry if attempts remain
    if (connectionAttempts < config.retry.maxAttempts && !isShuttingDown) {
      const delay = calculateDelay(connectionAttempts);
      console.log(`   Retrying in ${delay / 1000} seconds...`);
      
      setTimeout(() => connect(), delay);
    } else {
      console.error('❌ Maximum connection attempts reached. Unable to connect to MongoDB.');
      throw new Error('MongoDB connection failed after maximum retries');
    }
  }
}

/**
 * Disconnect from MongoDB gracefully
 * @returns {Promise<void>}
 */
async function disconnect() {
  if (isShuttingDown) {
    console.log('Disconnect already in progress');
    return;
  }
  
  isShuttingDown = true;
  
  try {
    console.log('Disconnecting from MongoDB...');
    
    await mongoose.connection.close();
    
    console.log('✅ MongoDB disconnected successfully');
    
  } catch (error) {
    console.error('❌ Error during MongoDB disconnect:', error.message);
    throw error;
  } finally {
    isShuttingDown = false;
  }
}

/**
 * Get current connection status
 * @returns {object} - Connection status details
 */
function getConnectionStatus() {
  const state = mongoose.connection.readyState;
  
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  
  return {
    state: states[state] || 'unknown',
    stateCode: state,
    isConnected: state === 1,
    host: mongoose.connection.host || null,
    database: mongoose.connection.name || null,
    models: Object.keys(mongoose.connection.models),
  };
}

/**
 * Check database health
 * @returns {Promise<object>} - Health check results
 */
async function healthCheck() {
  const startTime = Date.now();
  
  try {
    // Check connection state
    if (mongoose.connection.readyState !== 1) {
      return {
        status: 'unhealthy',
        connected: false,
        message: 'Database not connected',
        responseTime: Date.now() - startTime,
      };
    }
    
    // Ping database
    await mongoose.connection.db.admin().ping();
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      connected: true,
      host: mongoose.connection.host,
      database: mongoose.connection.name,
      responseTime,
      poolSize: mongoose.connection.client?.topology?.s?.pool?.totalConnectionCount || 'unknown',
    };
    
  } catch (error) {
    return {
      status: 'unhealthy',
      connected: false,
      message: error.message,
      responseTime: Date.now() - startTime,
    };
  }
}

// Event Handlers
mongoose.connection.on('connected', () => {
  console.log('📡 MongoDB connection established');
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB connection error:', error.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('📴 MongoDB disconnected');
  
  // Attempt to reconnect if not shutting down
  if (!isShuttingDown && connectionAttempts < config.retry.maxAttempts) {
    console.log('Attempting to reconnect...');
    setTimeout(() => connect(), config.retry.initialDelay);
  }
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected');
});

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Gracefully closing MongoDB connection...');
  await disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM. Gracefully closing MongoDB connection...');
  await disconnect();
  process.exit(0);
});

// Export functions
module.exports = {
  connect,
  disconnect,
  getConnectionStatus,
  healthCheck,
  mongoose,
};
