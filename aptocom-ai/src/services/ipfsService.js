/**
 * IPFS Service for AptoCom DAO
 * Decentralized file storage for proposal documents and metadata
 * 
 * Features:
 * - File upload to IPFS via nft.storage API
 * - Multiple file type support (PDF, images, docs, JSON)
 * - Content retrieval by CID (Content Identifier)
 * - Metadata storage and retrieval
 * - File pinning for persistence
 * - Retry logic with exponential backoff
 * - Error handling and validation
 * - Gateway URL generation
 * 
 * Use Cases:
 * - Proposal documents (whitepapers, budgets, roadmaps)
 * - Team credentials and portfolios
 * - Milestone deliverables and evidence
 * - Analytics reports and snapshots
 * - Immutable backup of proposal data
 * 
 * Provider: nft.storage (free tier, backed by Filecoin)
 */

const { NFTStorage, File, Blob } = require('nft.storage');
const fs = require('fs');
const path = require('path');

// Initialize NFT.Storage client
const client = new NFTStorage({
  token: process.env.IPFS_API_KEY,
});

// Configuration
const config = {
  maxRetries: 3,
  retryDelay: 2000, // 2 seconds base delay
  maxFileSize: 100 * 1024 * 1024, // 100 MB
  
  // Supported file types
  supportedTypes: {
    // Documents
    'application/pdf': { ext: '.pdf', category: 'document' },
    'application/msword': { ext: '.doc', category: 'document' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: '.docx', category: 'document' },
    'application/vnd.ms-excel': { ext: '.xls', category: 'document' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: '.xlsx', category: 'document' },
    'application/vnd.ms-powerpoint': { ext: '.ppt', category: 'document' },
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': { ext: '.pptx', category: 'document' },
    'text/plain': { ext: '.txt', category: 'document' },
    'text/markdown': { ext: '.md', category: 'document' },
    
    // Images
    'image/jpeg': { ext: '.jpg', category: 'image' },
    'image/png': { ext: '.png', category: 'image' },
    'image/gif': { ext: '.gif', category: 'image' },
    'image/svg+xml': { ext: '.svg', category: 'image' },
    'image/webp': { ext: '.webp', category: 'image' },
    
    // Data
    'application/json': { ext: '.json', category: 'data' },
    'text/csv': { ext: '.csv', category: 'data' },
    
    // Archives
    'application/zip': { ext: '.zip', category: 'archive' },
    'application/x-rar-compressed': { ext: '.rar', category: 'archive' },
  },
  
  // Gateway URLs for retrieval
  gateways: [
    'https://nftstorage.link/ipfs/',
    'https://ipfs.io/ipfs/',
    'https://dweb.link/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
  ],
  
  // Default gateway
  defaultGateway: 'https://nftstorage.link/ipfs/',
};

/**
 * Sleep utility for retry delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper with exponential backoff
 */
async function withRetry(operation, operationName, maxRetries = config.maxRetries) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`${operationName} attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        const delay = config.retryDelay * attempt; // Exponential backoff
        console.log(`Retrying in ${delay}ms...`);
        await sleep(delay);
      } else {
        throw new Error(`${operationName} failed after ${maxRetries} attempts: ${error.message}`);
      }
    }
  }
}

/**
 * Validate file type
 */
function validateFileType(mimeType) {
  if (!config.supportedTypes[mimeType]) {
    const supported = Object.keys(config.supportedTypes).join(', ');
    throw new Error(`Unsupported file type: ${mimeType}. Supported types: ${supported}`);
  }
  return config.supportedTypes[mimeType];
}

/**
 * Validate file size
 */
function validateFileSize(size) {
  if (size > config.maxFileSize) {
    throw new Error(`File size ${size} bytes exceeds maximum ${config.maxFileSize} bytes (${config.maxFileSize / 1024 / 1024} MB)`);
  }
}

/**
 * Generate gateway URL for a CID
 */
function generateGatewayUrl(cid, gateway = config.defaultGateway) {
  return `${gateway}${cid}`;
}

/**
 * Upload file to IPFS
 * 
 * @param {Buffer|string} fileData - File data as Buffer or file path
 * @param {Object} options - Upload options
 * @param {string} options.filename - Original filename
 * @param {string} options.mimeType - MIME type
 * @param {Object} options.metadata - Additional metadata
 * @returns {Promise<Object>} - Upload result with CID and URLs
 */
async function uploadFile(fileData, options = {}) {
  console.log('Starting IPFS file upload...');
  
  try {
    // Validate options
    if (!options.filename) {
      throw new Error('Filename is required');
    }
    if (!options.mimeType) {
      throw new Error('MIME type is required');
    }
    
    // Validate file type
    const typeInfo = validateFileType(options.mimeType);
    console.log(`Uploading ${typeInfo.category} file: ${options.filename}`);
    
    // Get file data
    let buffer;
    if (typeof fileData === 'string') {
      // File path provided
      if (!fs.existsSync(fileData)) {
        throw new Error(`File not found: ${fileData}`);
      }
      buffer = fs.readFileSync(fileData);
      console.log(`Read file from path: ${fileData}`);
    } else if (Buffer.isBuffer(fileData)) {
      buffer = fileData;
    } else {
      throw new Error('File data must be a Buffer or file path string');
    }
    
    // Validate file size
    validateFileSize(buffer.length);
    console.log(`File size: ${buffer.length} bytes (${(buffer.length / 1024).toFixed(2)} KB)`);
    
    // Create File object for nft.storage
    const file = new File([buffer], options.filename, { type: options.mimeType });
    
    // Upload with retry logic
    const cid = await withRetry(async () => {
      return await client.storeBlob(file);
    }, 'IPFS upload');
    
    console.log(`✅ File uploaded successfully! CID: ${cid}`);
    
    // Generate gateway URLs
    const urls = config.gateways.map(gateway => generateGatewayUrl(cid, gateway));
    
    // Prepare result
    const result = {
      success: true,
      cid: cid,
      filename: options.filename,
      mimeType: options.mimeType,
      size: buffer.length,
      category: typeInfo.category,
      uploadedAt: new Date(),
      
      // Gateway URLs
      url: urls[0], // Primary URL
      gatewayUrls: urls,
      
      // Metadata
      metadata: options.metadata || {},
    };
    
    console.log('Upload result:', result);
    return result;
    
  } catch (error) {
    console.error('IPFS upload failed:', error);
    return {
      success: false,
      error: error.message,
      cid: null,
    };
  }
}

/**
 * Upload multiple files to IPFS
 * 
 * @param {Array} files - Array of file objects with data and options
 * @returns {Promise<Object>} - Upload results for all files
 */
async function uploadMultipleFiles(files) {
  console.log(`Starting batch upload of ${files.length} files...`);
  
  const results = [];
  let successCount = 0;
  let failCount = 0;
  
  for (const file of files) {
    try {
      const result = await uploadFile(file.data, file.options);
      results.push({
        filename: file.options.filename,
        ...result,
      });
      
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
      
      // Add small delay between uploads to avoid rate limiting
      await sleep(500);
      
    } catch (error) {
      console.error(`Failed to upload file ${file.options.filename}:`, error);
      results.push({
        filename: file.options.filename,
        success: false,
        error: error.message,
      });
      failCount++;
    }
  }
  
  console.log(`Batch upload completed: ${successCount} succeeded, ${failCount} failed`);
  
  return {
    success: failCount === 0,
    total: files.length,
    successful: successCount,
    failed: failCount,
    results,
  };
}

/**
 * Upload JSON data to IPFS
 * Convenient method for storing structured data
 * 
 * @param {Object} data - JSON-serializable data
 * @param {string} filename - Filename (e.g., 'proposal-metadata.json')
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} - Upload result with CID
 */
async function uploadJSON(data, filename = 'data.json', metadata = {}) {
  console.log('Uploading JSON data to IPFS...');
  
  try {
    // Validate data is JSON-serializable
    const jsonString = JSON.stringify(data, null, 2);
    const buffer = Buffer.from(jsonString, 'utf-8');
    
    return await uploadFile(buffer, {
      filename,
      mimeType: 'application/json',
      metadata: {
        ...metadata,
        dataType: 'json',
        objectKeys: Object.keys(data),
      },
    });
  } catch (error) {
    console.error('JSON upload failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Upload text content to IPFS
 * 
 * @param {string} text - Text content
 * @param {string} filename - Filename
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} - Upload result with CID
 */
async function uploadText(text, filename = 'document.txt', metadata = {}) {
  console.log('Uploading text to IPFS...');
  
  const buffer = Buffer.from(text, 'utf-8');
  
  return await uploadFile(buffer, {
    filename,
    mimeType: 'text/plain',
    metadata: {
      ...metadata,
      dataType: 'text',
      length: text.length,
    },
  });
}

/**
 * Retrieve file from IPFS by CID
 * 
 * @param {string} cid - Content Identifier
 * @param {string} gateway - Gateway URL to use
 * @returns {Promise<Object>} - File data and metadata
 */
async function retrieveFile(cid, gateway = config.defaultGateway) {
  console.log(`Retrieving file from IPFS: ${cid}`);
  
  try {
    // Validate CID format (basic check)
    if (!cid || typeof cid !== 'string' || cid.length < 10) {
      throw new Error('Invalid CID format');
    }
    
    const url = generateGatewayUrl(cid, gateway);
    console.log(`Fetching from: ${url}`);
    
    // Use fetch or axios to retrieve file
    const axios = require('axios');
    const response = await withRetry(async () => {
      return await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 second timeout
      });
    }, 'IPFS retrieval');
    
    console.log(`✅ File retrieved successfully!`);
    console.log(`Size: ${response.data.length} bytes`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    
    return {
      success: true,
      cid,
      data: Buffer.from(response.data),
      contentType: response.headers['content-type'],
      size: response.data.length,
      url,
    };
    
  } catch (error) {
    console.error('IPFS retrieval failed:', error);
    
    // Try fallback gateways
    if (gateway === config.defaultGateway && config.gateways.length > 1) {
      console.log('Trying fallback gateways...');
      for (const fallbackGateway of config.gateways.slice(1)) {
        try {
          console.log(`Attempting with gateway: ${fallbackGateway}`);
          return await retrieveFile(cid, fallbackGateway);
        } catch (fallbackError) {
          console.error(`Fallback gateway failed: ${fallbackGateway}`);
        }
      }
    }
    
    return {
      success: false,
      error: error.message,
      cid,
    };
  }
}

/**
 * Retrieve JSON data from IPFS
 * 
 * @param {string} cid - Content Identifier
 * @returns {Promise<Object>} - Parsed JSON data
 */
async function retrieveJSON(cid) {
  console.log(`Retrieving JSON from IPFS: ${cid}`);
  
  const result = await retrieveFile(cid);
  
  if (!result.success) {
    return result;
  }
  
  try {
    const jsonString = result.data.toString('utf-8');
    const data = JSON.parse(jsonString);
    
    return {
      success: true,
      cid,
      data,
      size: result.size,
    };
  } catch (error) {
    console.error('JSON parsing failed:', error);
    return {
      success: false,
      error: `Failed to parse JSON: ${error.message}`,
      cid,
    };
  }
}

/**
 * Retrieve text content from IPFS
 * 
 * @param {string} cid - Content Identifier
 * @returns {Promise<Object>} - Text content
 */
async function retrieveText(cid) {
  console.log(`Retrieving text from IPFS: ${cid}`);
  
  const result = await retrieveFile(cid);
  
  if (!result.success) {
    return result;
  }
  
  const text = result.data.toString('utf-8');
  
  return {
    success: true,
    cid,
    text,
    length: text.length,
    size: result.size,
  };
}

/**
 * Check if CID is accessible (pinning status)
 * 
 * @param {string} cid - Content Identifier
 * @returns {Promise<boolean>} - True if accessible
 */
async function checkCIDStatus(cid) {
  console.log(`Checking CID status: ${cid}`);
  
  try {
    const result = await client.check(cid);
    console.log('CID status:', result);
    
    return {
      success: true,
      cid,
      pinned: result.pin?.status === 'pinned',
      status: result,
    };
  } catch (error) {
    console.error('CID check failed:', error);
    return {
      success: false,
      error: error.message,
      cid,
    };
  }
}

/**
 * Store proposal document package to IPFS
 * Uploads all proposal-related files and returns manifest
 * 
 * @param {Object} proposalData - Proposal data
 * @param {Array} files - Array of file objects
 * @returns {Promise<Object>} - Manifest with all CIDs
 */
async function storeProposalPackage(proposalData, files = []) {
  console.log('Creating proposal package for IPFS...');
  
  try {
    // Upload individual files
    const fileResults = await uploadMultipleFiles(files);
    
    // Create manifest
    const manifest = {
      proposalId: proposalData.proposalId || null,
      title: proposalData.title,
      createdAt: new Date(),
      
      // Proposal metadata
      metadata: {
        description: proposalData.description,
        sector: proposalData.sector,
        amountRequested: proposalData.amountRequested,
        submitter: proposalData.submitter,
      },
      
      // Team information
      team: proposalData.team || [],
      
      // Milestones
      milestones: proposalData.milestones || [],
      
      // Budget breakdown
      budgetBreakdown: proposalData.budgetBreakdown || [],
      
      // Uploaded files
      files: fileResults.results.filter(r => r.success).map(r => ({
        filename: r.filename,
        cid: r.cid,
        url: r.url,
        mimeType: r.mimeType,
        size: r.size,
        category: r.category,
      })),
    };
    
    // Upload manifest itself
    const manifestResult = await uploadJSON(
      manifest,
      `proposal-${proposalData.proposalId || 'draft'}-manifest.json`,
      {
        type: 'proposal-manifest',
        proposalId: proposalData.proposalId,
      }
    );
    
    if (!manifestResult.success) {
      throw new Error(`Failed to upload manifest: ${manifestResult.error}`);
    }
    
    console.log(`✅ Proposal package created! Manifest CID: ${manifestResult.cid}`);
    
    return {
      success: true,
      manifestCid: manifestResult.cid,
      manifestUrl: manifestResult.url,
      manifest,
      filesUploaded: fileResults.successful,
      filesFailed: fileResults.failed,
    };
    
  } catch (error) {
    console.error('Failed to store proposal package:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Retrieve complete proposal package from IPFS
 * 
 * @param {string} manifestCid - Manifest CID
 * @returns {Promise<Object>} - Complete proposal package
 */
async function retrieveProposalPackage(manifestCid) {
  console.log(`Retrieving proposal package: ${manifestCid}`);
  
  try {
    // Retrieve manifest
    const manifestResult = await retrieveJSON(manifestCid);
    
    if (!manifestResult.success) {
      throw new Error(`Failed to retrieve manifest: ${manifestResult.error}`);
    }
    
    const manifest = manifestResult.data;
    console.log(`✅ Manifest retrieved: ${manifest.title}`);
    
    // Optionally retrieve all files (can be done on-demand)
    console.log(`Package contains ${manifest.files?.length || 0} files`);
    
    return {
      success: true,
      manifestCid,
      manifest,
      filesAvailable: manifest.files || [],
    };
    
  } catch (error) {
    console.error('Failed to retrieve proposal package:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Health check for IPFS service
 */
async function healthCheck() {
  try {
    // Test with small text upload
    const testData = Buffer.from('IPFS health check', 'utf-8');
    const testResult = await uploadFile(testData, {
      filename: 'healthcheck.txt',
      mimeType: 'text/plain',
      metadata: { test: true },
    });
    
    if (!testResult.success) {
      throw new Error(`Upload test failed: ${testResult.error}`);
    }
    
    // Test retrieval
    const retrieveResult = await retrieveFile(testResult.cid);
    
    if (!retrieveResult.success) {
      throw new Error(`Retrieval test failed: ${retrieveResult.error}`);
    }
    
    return {
      status: 'healthy',
      ipfsConnected: true,
      provider: 'nft.storage',
      testCid: testResult.cid,
      uploadWorking: testResult.success,
      retrievalWorking: retrieveResult.success,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      ipfsConnected: false,
      error: error.message,
    };
  }
}

// Export all functions
module.exports = {
  // Core upload functions
  uploadFile,
  uploadMultipleFiles,
  uploadJSON,
  uploadText,
  
  // Core retrieval functions
  retrieveFile,
  retrieveJSON,
  retrieveText,
  
  // CID management
  checkCIDStatus,
  generateGatewayUrl,
  
  // Proposal package functions
  storeProposalPackage,
  retrieveProposalPackage,
  
  // Utilities
  validateFileType,
  validateFileSize,
  healthCheck,
  
  // Configuration (for testing/debugging)
  config,
};
