# Phase 3.7: Complete API Reference
## AptoCom DAO - All Backend API Endpoints

**Status**: ✅ Complete  
**Date**: January 2025  
**Version**: 1.0.0  
**Total Endpoints**: 24 across 6 modules

---

## Table of Contents

1. [Overview](#overview)
2. [Proposals API (8 endpoints)](#proposals-api)
3. [Voting API (4 endpoints)](#voting-api)
4. [Token API (5 endpoints)](#token-api)
5. [Treasury API (5 endpoints)](#treasury-api)
6. [Analytics API (4 endpoints)](#analytics-api)
7. [Users API (4 endpoints)](#users-api)
8. [Common Response Formats](#common-response-formats)
9. [Error Handling](#error-handling)
10. [Integration Guide](#integration-guide)

---

## Overview

The AptoCom DAO backend provides a comprehensive REST API for managing proposals, voting, tokens, treasury, analytics, and user profiles. All endpoints integrate with:

- **Aptos Blockchain**: On-chain operations (voting, tokens, treasury)
- **MongoDB**: Off-chain data storage
- **Groq AI**: Proposal evaluation
- **IPFS (nft.storage)**: Document storage

**Base URL**: `http://localhost:5000/api`

**Response Format**: All endpoints return JSON in the format:
```json
{
  "success": true/false,
  "data": { ... },      // On success
  "error": "...",       // On error
  "details": "..."      // Error details (optional)
}
```

---

## Proposals API

**Module**: `proposalController.js` (980 lines)  
**Routes**: `proposalRoutes.js` (220 lines)  
**Base Path**: `/api/proposals`

### 1. Create Proposal

**Endpoint**: `POST /api/proposals/create`  
**Content-Type**: `multipart/form-data`  
**Description**: Submit a new proposal with optional file attachments. Automatically triggers AI evaluation.

**Form Fields**:
```javascript
{
  title: String (required),
  description: String (required),
  sector: String (required), // e.g., "AI Development", "Infrastructure"
  fundingAmount: Number (required),
  walletAddress: String (required), // Submitter's Aptos address
  timeline: String (required),
  teamInfo: String (required),
  budgetBreakdown: String (required),
  files: Array<File> (optional) // Max 10 files, 100MB each
}
```

**Supported File Types**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, MD, JSON, CSV, XML, YAML, images (JPG, PNG, GIF, SVG, WEBP), ZIP, TAR, GZ

**Response**:
```json
{
  "success": true,
  "message": "Proposal created successfully",
  "data": {
    "proposalId": "507f1f77bcf86cd799439011",
    "title": "AI-Powered Analytics Platform",
    "sector": "AI Development",
    "fundingAmount": 50000,
    "status": "pending_evaluation",
    "ipfsMetadata": {
      "cid": "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
      "documentUrl": "https://nftstorage.link/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/proposal.json",
      "attachments": [
        {
          "filename": "budget.pdf",
          "cid": "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
          "url": "https://nftstorage.link/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/budget.pdf",
          "size": 524288
        }
      ]
    },
    "evaluationTriggered": true,
    "createdAt": "2025-01-28T12:00:00.000Z"
  }
}
```

**Notes**:
- AI evaluation starts automatically in the background
- Files are uploaded to IPFS via nft.storage
- Proposal status is set to `pending_evaluation`
- User activity is tracked in MongoDB

---

### 2. Get Proposal by ID

**Endpoint**: `GET /api/proposals/:id`  
**Description**: Retrieve full proposal details including AI evaluation and blockchain status.

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "AI-Powered Analytics Platform",
    "description": "Build a comprehensive analytics platform...",
    "sector": "AI Development",
    "fundingAmount": 50000,
    "walletAddress": "0x1a2b3c4d5e6f7g8h9i0j",
    "status": "voting",
    "onChainProposalId": 5,
    "timeline": "6 months",
    "teamInfo": "Team of 5 experienced developers...",
    "budgetBreakdown": "Development: $30k, Marketing: $10k...",
    "ipfsMetadata": { /* ... */ },
    "aiEvaluation": {
      "evaluationId": "507f1f77bcf86cd799439012",
      "totalScore": 78,
      "recommendationSummary": "Highly viable project with strong fundamentals",
      "scores": {
        "innovation": 85,
        "feasibility": 75,
        "impactPotential": 80,
        "teamExpertise": 78,
        "budgetClarity": 72,
        "timelineRealism": 80,
        "riskAssessment": 70,
        "communityAlignment": 85
      },
      "strengths": [
        "Clear problem statement",
        "Experienced team"
      ],
      "weaknesses": [
        "Budget could be more detailed"
      ],
      "evaluatedAt": "2025-01-28T12:05:00.000Z"
    },
    "blockchainData": {
      "onChainProposalId": 5,
      "proposer": "0x1a2b3c4d5e6f7g8h9i0j",
      "votingDeadline": "2025-02-04T12:00:00.000Z",
      "votesFor": 15000,
      "votesAgainst": 5000,
      "isActive": true,
      "executed": false
    },
    "createdAt": "2025-01-28T12:00:00.000Z",
    "updatedAt": "2025-01-28T12:10:00.000Z"
  }
}
```

---

### 3. List Proposals

**Endpoint**: `GET /api/proposals`  
**Description**: Get a paginated list of proposals with filtering and sorting.

**Query Parameters**:
- `status`: Filter by status (pending_evaluation, voting, approved, rejected)
- `sector`: Filter by sector
- `submitter`: Filter by wallet address
- `minScore`: Filter by minimum AI score (0-100)
- `sortBy`: Sort field (createdAt, fundingAmount, aiScore)
- `sortOrder`: Sort order (asc, desc)
- `page`: Page number (default: 1)
- `limit`: Items per page (max: 100, default: 20)

**Example**: `GET /api/proposals?status=voting&sector=AI Development&sortBy=aiScore&sortOrder=desc&page=1&limit=10`

**Response**:
```json
{
  "success": true,
  "data": {
    "proposals": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "title": "AI-Powered Analytics Platform",
        "sector": "AI Development",
        "fundingAmount": 50000,
        "status": "voting",
        "aiScore": 78,
        "createdAt": "2025-01-28T12:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalCount": 25,
      "limit": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### 4. Get Proposal Statistics

**Endpoint**: `GET /api/proposals/stats`  
**Description**: Get aggregate proposal statistics.

**Response**:
```json
{
  "success": true,
  "data": {
    "totalProposals": 50,
    "byStatus": {
      "pending_evaluation": 10,
      "voting": 8,
      "approved": 15,
      "rejected": 12,
      "executed": 5
    },
    "bySector": {
      "AI Development": 20,
      "Infrastructure": 15,
      "Community": 10,
      "Marketing": 5
    },
    "totalFundingRequested": 2500000,
    "avgAIScore": 72.5,
    "timestamp": "2025-01-28T12:00:00.000Z"
  }
}
```

---

### 5. Trigger AI Evaluation

**Endpoint**: `POST /api/proposals/:id/evaluate`  
**Description**: Manually trigger or re-trigger AI evaluation.

**Request Body**:
```json
{
  "force": true  // Optional: Force re-evaluation even if already evaluated
}
```

**Response**:
```json
{
  "success": true,
  "message": "AI evaluation completed successfully",
  "data": {
    "evaluationId": "507f1f77bcf86cd799439012",
    "totalScore": 78,
    "evaluatedAt": "2025-01-28T12:05:00.000Z"
  }
}
```

---

### 6. Get AI Evaluation Results

**Endpoint**: `GET /api/proposals/:id/evaluation`  
**Description**: Retrieve detailed AI evaluation results.

**Response**:
```json
{
  "success": true,
  "data": {
    "evaluationId": "507f1f77bcf86cd799439012",
    "proposalId": "507f1f77bcf86cd799439011",
    "totalScore": 78,
    "recommendationSummary": "Highly viable project with strong fundamentals",
    "scores": {
      "innovation": 85,
      "feasibility": 75,
      "impactPotential": 80,
      "teamExpertise": 78,
      "budgetClarity": 72,
      "timelineRealism": 80,
      "riskAssessment": 70,
      "communityAlignment": 85
    },
    "detailedAnalysis": {
      "innovation": "The project demonstrates strong innovation...",
      "feasibility": "Technical feasibility is well-established..."
    },
    "strengths": [
      "Clear problem statement and solution approach",
      "Experienced team with proven track record"
    ],
    "weaknesses": [
      "Budget breakdown could be more detailed"
    ],
    "recommendations": [
      "Consider adding more granular budget milestones"
    ],
    "evaluatedAt": "2025-01-28T12:05:00.000Z"
  }
}
```

---

### 7. Submit to Blockchain

**Endpoint**: `POST /api/proposals/:id/submit-chain`  
**Description**: Submit an approved proposal to the Aptos blockchain.

**Requirements**:
- AI score must be ≥ 40
- Proposal must be in `approved` or `pending_vote` status

**Request Body**:
```json
{
  "votingDurationDays": 7  // Optional: default is 7 days
}
```

**Response**:
```json
{
  "success": true,
  "message": "Proposal submitted to blockchain successfully",
  "data": {
    "onChainProposalId": 5,
    "transactionHash": "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p",
    "votingDeadline": "2025-02-04T12:00:00.000Z",
    "status": "voting"
  }
}
```

---

### 8. Update Proposal

**Endpoint**: `PUT /api/proposals/:id/update`  
**Description**: Update proposal status or milestones (submitter or admin only).

**Request Body**:
```json
{
  "status": "approved",  // Optional: new status
  "milestones": [        // Optional: milestone updates
    {
      "description": "Phase 1: Design",
      "completed": true
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Proposal updated successfully",
  "data": {
    "proposalId": "507f1f77bcf86cd799439011",
    "status": "approved",
    "updatedAt": "2025-01-28T12:15:00.000Z"
  }
}
```

---

## Voting API

**Module**: `votingController.js` (460 lines)  
**Routes**: `votingRoutes.js` (80 lines)  
**Base Path**: `/api/voting`

### 1. Cast Vote

**Endpoint**: `POST /api/voting/vote`  
**Description**: Submit a vote on a proposal. Voting power is based on ACT token balance.

**Request Body**:
```json
{
  "proposalId": "507f1f77bcf86cd799439011",
  "onChainProposalId": 5,
  "walletAddress": "0x1a2b3c4d5e6f7g8h9i0j",
  "voteFor": true  // true = vote for, false = vote against
}
```

**Validation**:
- Proposal must exist and be on-chain
- Proposal must be in `voting` status
- Voter must hold ACT tokens (balance > 0)

**Response**:
```json
{
  "success": true,
  "message": "Vote cast successfully",
  "data": {
    "proposalId": "507f1f77bcf86cd799439011",
    "onChainProposalId": 5,
    "voteFor": true,
    "votingPower": 1000,  // ACT balance
    "transactionHash": "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p",
    "timestamp": "2025-01-28T12:20:00.000Z"
  }
}
```

---

### 2. Get Proposal Votes

**Endpoint**: `GET /api/voting/proposal/:id`  
**Description**: Get voting results and statistics for a proposal.

**Query Parameters**:
- `includeVoters`: Include full voter list with voting power (true/false)

**Response**:
```json
{
  "success": true,
  "data": {
    "onChainProposalId": 5,
    "voting": {
      "votesFor": 15000,
      "votesAgainst": 5000,
      "totalVotes": 20000,
      "forPercentage": 75,
      "againstPercentage": 25
    },
    "deadline": "2025-02-04T12:00:00.000Z",
    "isActive": true,
    "executed": false,
    "voters": [  // Only if includeVoters=true
      {
        "walletAddress": "0x1a2b3c4d5e6f7g8h9i0j",
        "voteFor": true,
        "votingPower": 1000,
        "timestamp": "2025-01-28T12:20:00.000Z"
      }
    ]
  }
}
```

---

### 3. Get User Voting History

**Endpoint**: `GET /api/voting/user/:wallet`  
**Description**: Get a user's complete voting history with pagination.

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (max: 100, default: 20)

**Response**:
```json
{
  "success": true,
  "data": {
    "walletAddress": "0x1a2b3c4d5e6f7g8h9i0j",
    "votes": [
      {
        "proposalId": "507f1f77bcf86cd799439011",
        "onChainProposalId": 5,
        "proposalTitle": "AI-Powered Analytics Platform",
        "proposalSector": "AI Development",
        "proposalStatus": "voting",
        "voteFor": true,
        "votingPower": 1000,
        "timestamp": "2025-01-28T12:20:00.000Z",
        "transactionHash": "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalCount": 15,
      "limit": 20
    }
  }
}
```

---

### 4. Get Voting Statistics

**Endpoint**: `GET /api/voting/stats`  
**Description**: Get aggregate voting statistics across all proposals.

**Response**:
```json
{
  "success": true,
  "data": {
    "totalVotes": 1500,
    "uniqueVoters": 120,
    "totalProposalsWithVoting": 25,
    "averageParticipation": 60,  // Votes per proposal
    "byStatus": {
      "voting": 8,
      "executed": 15,
      "rejected": 2
    }
  }
}
```

---

## Token API

**Module**: `tokenController.js` (380 lines)  
**Routes**: `tokenRoutes.js` (70 lines)  
**Base Path**: `/api/tokens`

### 1. Get Token Balance

**Endpoint**: `GET /api/tokens/balance/:address`  
**Description**: Query ACT and APT token balances for a wallet.

**Response**:
```json
{
  "success": true,
  "data": {
    "walletAddress": "0x1a2b3c4d5e6f7g8h9i0j",
    "balances": {
      "ACT": 1000,
      "APT": 5.5
    },
    "timestamp": "2025-01-28T12:00:00.000Z"
  }
}
```

---

### 2. Mint Tokens (Admin Only)

**Endpoint**: `POST /api/tokens/mint`  
**Description**: Mint new ACT tokens to a recipient address. Admin operation only.

**Request Body**:
```json
{
  "toAddress": "0x1a2b3c4d5e6f7g8h9i0j",
  "amount": 1000,
  "adminWallet": "0xadmin..."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Tokens minted successfully",
  "data": {
    "toAddress": "0x1a2b3c4d5e6f7g8h9i0j",
    "amount": 1000,
    "transactionHash": "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p",
    "timestamp": "2025-01-28T12:00:00.000Z"
  }
}
```

---

### 3. Transfer Tokens

**Endpoint**: `POST /api/tokens/transfer`  
**Description**: Transfer ACT tokens between wallets.

**Request Body**:
```json
{
  "fromAddress": "0x1a2b3c4d5e6f7g8h9i0j",
  "toAddress": "0x2b3c4d5e6f7g8h9i0j1k",
  "amount": 100
}
```

**Validation**:
- Sender must have sufficient ACT balance

**Response**:
```json
{
  "success": true,
  "message": "Tokens transferred successfully",
  "data": {
    "fromAddress": "0x1a2b3c4d5e6f7g8h9i0j",
    "toAddress": "0x2b3c4d5e6f7g8h9i0j1k",
    "amount": 100,
    "transactionHash": "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p",
    "timestamp": "2025-01-28T12:00:00.000Z"
  }
}
```

---

### 4. Get Token Info

**Endpoint**: `GET /api/tokens/info`  
**Description**: Get ACT token metadata and features.

**Response**:
```json
{
  "success": true,
  "data": {
    "name": "AptoCom Token",
    "symbol": "ACT",
    "decimals": 8,
    "standard": "Aptos Fungible Asset (FA)",
    "features": [
      "Voting power in DAO governance",
      "Dividend entitlement",
      "Tradable on DEXs",
      "Transferable between wallets"
    ],
    "links": {
      "explorer": "https://explorer.aptoslabs.com/token/0x...",
      "docs": "https://aptocom.io/docs/token"
    }
  }
}
```

---

### 5. Get Token Statistics

**Endpoint**: `GET /api/tokens/stats`  
**Description**: Get aggregate token distribution and holder statistics.

**Response**:
```json
{
  "success": true,
  "data": {
    "totalSupply": 1000000,
    "totalHolders": 500,
    "averageBalance": 2000,
    "distribution": {
      "largestHolder": 50000,
      "smallestNonZeroHolder": 10,
      "top10Holders": 10,
      "top10Supply": 300000,
      "top10Percentage": 30
    },
    "timestamp": "2025-01-28T12:00:00.000Z"
  }
}
```

---

## Treasury API

**Module**: `treasuryController.js` (230 lines)  
**Routes**: `treasuryRoutes.js` (60 lines)  
**Base Path**: `/api/treasury`

### 1. Get Treasury Balance

**Endpoint**: `GET /api/treasury/balance`  
**Description**: Get the current APT balance in the treasury contract.

**Response**:
```json
{
  "success": true,
  "data": {
    "balance": 10000,
    "currency": "APT",
    "timestamp": "2025-01-28T12:00:00.000Z"
  }
}
```

---

### 2. Get Treasury Transactions

**Endpoint**: `GET /api/treasury/transactions`  
**Description**: Get treasury transaction history with pagination.

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response** (Coming Soon):
```json
{
  "success": true,
  "data": {
    "transactions": [],
    "pagination": {
      "currentPage": 1,
      "totalPages": 0,
      "totalCount": 0,
      "limit": 20
    }
  },
  "message": "Transaction history feature coming soon"
}
```

---

### 3. Distribute Dividends (Admin Only)

**Endpoint**: `POST /api/treasury/distribute`  
**Description**: Trigger dividend distribution to ACT token holders. Admin operation only.

**Request Body**:
```json
{
  "amount": 1000,
  "adminWallet": "0xadmin..."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Dividend distribution initiated",
  "data": {
    "amount": 1000,
    "timestamp": "2025-01-28T12:00:00.000Z"
  }
}
```

---

### 4. Get Claimable Dividends

**Endpoint**: `GET /api/treasury/dividends/:address`  
**Description**: Query the amount of dividends claimable by a wallet.

**Response**:
```json
{
  "success": true,
  "data": {
    "walletAddress": "0x1a2b3c4d5e6f7g8h9i0j",
    "claimableAmount": 50,
    "currency": "APT",
    "timestamp": "2025-01-28T12:00:00.000Z"
  }
}
```

---

### 5. Claim Dividends

**Endpoint**: `POST /api/treasury/claim`  
**Description**: Claim available dividends for a wallet.

**Request Body**:
```json
{
  "walletAddress": "0x1a2b3c4d5e6f7g8h9i0j"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Dividends claimed successfully",
  "data": {
    "walletAddress": "0x1a2b3c4d5e6f7g8h9i0j",
    "amount": 50,
    "transactionHash": "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p",
    "timestamp": "2025-01-28T12:00:00.000Z"
  }
}
```

---

## Analytics API

**Module**: `analyticsController.js` (210 lines)  
**Routes**: `analyticsRoutes.js` (50 lines)  
**Base Path**: `/api/analytics`

### 1. Get Dashboard Overview

**Endpoint**: `GET /api/analytics/overview`  
**Description**: Get comprehensive dashboard statistics including proposals, users, and treasury.

**Response**:
```json
{
  "success": true,
  "data": {
    "proposals": {
      "total": 50,
      "pending": 10,
      "voting": 8,
      "approved": 15,
      "rejected": 12,
      "totalFunding": 2500000
    },
    "users": {
      "totalUsers": 500,
      "activeVoters": 120,
      "totalVotes": 1500
    },
    "treasury": {
      "balance": 10000,
      "currency": "APT"
    },
    "timestamp": "2025-01-28T12:00:00.000Z"
  }
}
```

---

### 2. Get Proposal Metrics

**Endpoint**: `GET /api/analytics/proposals`  
**Description**: Get detailed proposal analytics by sector, status, AI scores, and funding.

**Response**:
```json
{
  "success": true,
  "data": {
    "bySector": [
      { "_id": "AI Development", "count": 20, "totalFunding": 1000000 },
      { "_id": "Infrastructure", "count": 15, "totalFunding": 750000 }
    ],
    "byStatus": [
      { "_id": "approved", "count": 15 },
      { "_id": "voting", "count": 8 }
    ],
    "aiScoreDistribution": [
      { "_id": 80, "count": 12 },  // Scores 80-100
      { "_id": 60, "count": 20 },  // Scores 60-79
      { "_id": 40, "count": 10 }   // Scores 40-59
    ],
    "fundingAnalysis": {
      "totalRequested": 2500000,
      "avgFunding": 50000,
      "maxFunding": 200000,
      "minFunding": 10000
    }
  },
  "timestamp": "2025-01-28T12:00:00.000Z"
}
```

---

### 3. Get Token Metrics

**Endpoint**: `GET /api/analytics/tokens`  
**Description**: Get token distribution and holder analytics.

**Response**:
```json
{
  "success": true,
  "data": {
    "totalSupply": 1000000,
    "totalHolders": 500,
    "averageBalance": 2000,
    "distribution": {
      "top10Holders": 10,
      "top10Supply": 300000,
      "top10Percentage": 30
    },
    "timestamp": "2025-01-28T12:00:00.000Z"
  }
}
```

---

### 4. Get User Engagement Metrics

**Endpoint**: `GET /api/analytics/users`  
**Description**: Get user engagement statistics including voting and proposal activity.

**Response**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 500,
      "totalVotes": 1500,
      "totalProposals": 50
    },
    "engagement": [
      { "_id": 0, "count": 380 },    // 0 votes
      { "_id": 1, "count": 80 },     // 1-4 votes
      { "_id": 5, "count": 30 },     // 5-9 votes
      { "_id": 10, "count": 10 }     // 10-19 votes
    ],
    "topVoters": [
      { "walletAddress": "0x1a2b...", "voteCount": 25 },
      { "walletAddress": "0x2b3c...", "voteCount": 20 }
    ]
  },
  "timestamp": "2025-01-28T12:00:00.000Z"
}
```

---

## Users API

**Module**: `userController.js` (200 lines)  
**Routes**: `userRoutes.js` (50 lines)  
**Base Path**: `/api/users`

### 1. Register User

**Endpoint**: `POST /api/users/register`  
**Description**: Create or register a user profile with their wallet address.

**Request Body**:
```json
{
  "walletAddress": "0x1a2b3c4d5e6f7g8h9i0j",
  "name": "John Doe",  // Optional
  "bio": "AI researcher and blockchain enthusiast",  // Optional
  "socials": {  // Optional
    "twitter": "johndoe",
    "github": "johndoe",
    "linkedin": "johndoe"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "walletAddress": "0x1a2b3c4d5e6f7g8h9i0j",
    "name": "John Doe",
    "registeredAt": "2025-01-28T12:00:00.000Z"
  }
}
```

---

### 2. Get User Profile

**Endpoint**: `GET /api/users/:address`  
**Description**: Retrieve a user's complete profile including stats and ACT balance.

**Response**:
```json
{
  "success": true,
  "data": {
    "walletAddress": "0x1a2b3c4d5e6f7g8h9i0j",
    "name": "John Doe",
    "bio": "AI researcher and blockchain enthusiast",
    "socials": {
      "twitter": "johndoe",
      "github": "johndoe",
      "linkedin": "johndoe"
    },
    "actBalance": 1000,
    "stats": {
      "votingCount": 15,
      "proposalCount": 3,
      "registeredAt": "2025-01-28T12:00:00.000Z"
    }
  }
}
```

---

### 3. Update User Profile

**Endpoint**: `PUT /api/users/:address`  
**Description**: Update a user's profile information.

**Request Body**:
```json
{
  "name": "John Doe Updated",  // Optional
  "bio": "Updated bio",  // Optional
  "socials": {  // Optional
    "twitter": "johndoe_updated"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "walletAddress": "0x1a2b3c4d5e6f7g8h9i0j",
    "name": "John Doe Updated",
    "bio": "Updated bio",
    "socials": {
      "twitter": "johndoe_updated",
      "github": "johndoe",
      "linkedin": "johndoe"
    }
  }
}
```

---

### 4. Get User Activity Log

**Endpoint**: `GET /api/users/:address/activity`  
**Description**: Get a user's activity history with pagination.

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response**:
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "action": "vote_cast",
        "timestamp": "2025-01-28T12:20:00.000Z",
        "details": {
          "proposalId": "507f1f77bcf86cd799439011",
          "voteFor": true
        }
      },
      {
        "action": "tokens_received",
        "timestamp": "2025-01-28T12:00:00.000Z",
        "details": {
          "amount": 1000,
          "tokenType": "ACT"
        }
      },
      {
        "action": "proposal_submitted",
        "timestamp": "2025-01-28T11:00:00.000Z",
        "details": {
          "proposalId": "507f1f77bcf86cd799439011"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalCount": 25,
      "limit": 20
    }
  }
}
```

---

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "data": { /* ... */ },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "details": "Detailed error message (optional)"
}
```

---

## Error Handling

### HTTP Status Codes

- **200 OK**: Successful GET/PUT request
- **201 Created**: Successful POST request (resource created)
- **400 Bad Request**: Invalid input or validation error
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

### Common Error Messages

**Validation Errors**:
```json
{
  "success": false,
  "error": "Missing required field: walletAddress"
}
```

**Blockchain Errors**:
```json
{
  "success": false,
  "error": "Failed to submit vote to blockchain",
  "details": "Transaction simulation failed"
}
```

**Authorization Errors**:
```json
{
  "success": false,
  "error": "Only proposal submitter can update this proposal"
}
```

---

## Integration Guide

### Server Configuration

**Start Server**:
```bash
cd aptocom-ai
npm start
```

**Server runs on**: `http://localhost:5000`

### Environment Variables

Required `.env` configuration:
```
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aptocom

# Aptos Blockchain
APTOS_NETWORK=testnet
TOKEN_CONTRACT_ADDRESS=0x346a0fa6...
GOVERNANCE_CONTRACT_ADDRESS=0x346a0fa6...
TREASURY_CONTRACT_ADDRESS=0x346a0fa6...

# AI Service (Groq)
GROQ_API_KEY=gsk_...

# IPFS (nft.storage)
NFT_STORAGE_API_KEY=eyJhbGciOi...
```

### Testing Endpoints

**Health Check**:
```bash
curl http://localhost:5000/health
```

**Create Proposal** (with curl):
```bash
curl -X POST http://localhost:5000/api/proposals/create \
  -F "title=Test Proposal" \
  -F "description=This is a test" \
  -F "sector=AI Development" \
  -F "fundingAmount=50000" \
  -F "walletAddress=0x1a2b3c4d5e6f7g8h9i0j" \
  -F "timeline=6 months" \
  -F "teamInfo=Test team" \
  -F "budgetBreakdown=Development: $50k" \
  -F "files=@budget.pdf"
```

**Get Proposals**:
```bash
curl http://localhost:5000/api/proposals?status=voting&page=1&limit=10
```

**Cast Vote**:
```bash
curl -X POST http://localhost:5000/api/voting/vote \
  -H "Content-Type: application/json" \
  -d '{
    "proposalId": "507f1f77bcf86cd799439011",
    "onChainProposalId": 5,
    "walletAddress": "0x1a2b3c4d5e6f7g8h9i0j",
    "voteFor": true
  }'
```

### Frontend Integration

**Example: Fetch Proposals**
```javascript
async function fetchProposals() {
  const response = await fetch('http://localhost:5000/api/proposals?status=voting');
  const data = await response.json();
  
  if (data.success) {
    console.log(data.data.proposals);
  }
}
```

**Example: Cast Vote**
```javascript
async function castVote(proposalId, onChainId, wallet, voteFor) {
  const response = await fetch('http://localhost:5000/api/voting/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      proposalId,
      onChainProposalId: onChainId,
      walletAddress: wallet,
      voteFor
    })
  });
  
  const data = await response.json();
  return data;
}
```

---

## Summary

**Phase 3.7: Complete ✅**

- **Total Endpoints**: 24
- **Total Code**: ~2,900 lines

**API Modules**:
1. ✅ Proposals (8 endpoints)
2. ✅ Voting (4 endpoints)
3. ✅ Token (5 endpoints)
4. ✅ Treasury (5 endpoints)
5. ✅ Analytics (4 endpoints)
6. ✅ Users (4 endpoints)

**Ready For**:
- Frontend development (Phase 4)
- Integration testing (Phase 5)
- Production deployment (Phase 6)

**Next Steps**:
- Phase 3.8: Backend Testing
- Phase 3.9: Backend Deployment Preparation

---

**Documentation Version**: 1.0.0  
**Last Updated**: January 2025  
**Contact**: GitHub Copilot  
**License**: MIT
