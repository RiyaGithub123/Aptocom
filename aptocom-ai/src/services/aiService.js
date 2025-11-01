/**
 * AI Service for AptoCom DAO
 * Groq-powered AI evaluation engine for proposal analysis
 * 
 * Features:
 * - Proposal evaluation with 8 scoring parameters
 * - Weighted scoring algorithm
 * - 5-tier recommendation system
 * - SWOT analysis generation
 * - Clarification request logic
 * - Treasury monitoring insights
 * - Milestone quality assessment
 * 
 * Evaluation Parameters (from prompt file):
 * 1. Strategic Alignment (15%) - Alignment with DAO goals and ecosystem
 * 2. Feasibility (20%) - Technical viability and execution capability
 * 3. Team Capability (15%) - Team qualifications and track record
 * 4. Financial Reasonableness (15%) - Budget justification and efficiency
 * 5. ROI Potential (10%) - Expected return on investment
 * 6. Risk Assessment (10%) - Risk identification and mitigation
 * 7. Milestone Clarity (10%) - Clear, measurable milestones
 * 8. Transparency (5%) - Information completeness and openness
 */

const Groq = require('groq-sdk');
const { AIEvaluation } = require('../models/AIEvaluation');

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Configuration
const config = {
  model: 'llama-3.3-70b-versatile', // Groq's most capable model
  temperature: 0.3, // Lower temperature for more consistent evaluation
  maxRetries: 3,
  retryDelay: 2000, // 2 seconds
  
  // Scoring weights (must sum to 100%)
  weights: {
    strategicAlignment: 0.15,   // 15%
    feasibility: 0.20,          // 20%
    teamCapability: 0.15,       // 15%
    financialReasonableness: 0.15, // 15%
    roiPotential: 0.10,         // 10%
    riskLevel: 0.10,            // 10%
    milestoneClarity: 0.10,     // 10%
    transparency: 0.05,         // 5%
  },
  
  // Recommendation thresholds
  thresholds: {
    stronglyApprove: 80,
    approve: 60,
    review: 40,
    reject: 20,
    // Below 20 is strongly-reject
  },
  
  // Clarification thresholds
  clarificationThresholds: {
    missingInfo: 3, // Request clarification if 3+ critical info pieces missing
    lowScore: 30,   // Request clarification if any parameter scores below 30
  },
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
 * Generate evaluation prompt for AI
 * Creates a comprehensive prompt with all proposal details
 */
function generateEvaluationPrompt(proposal) {
  const prompt = `You are an expert AI evaluator for AptoCom DAO, an autonomous decentralized organization on the Aptos blockchain.

Evaluate the following proposal using EXACTLY these 8 parameters. Provide a score from 0-100 for each parameter, along with detailed reasoning.

**PROPOSAL INFORMATION:**

**Title:** ${proposal.title}

**Sector:** ${proposal.sector || 'Not specified'}

**Description:**
${proposal.description}

**Amount Requested:** ${proposal.amountRequested || 0} APT (Aptos Testnet tokens)

**Team Members:**
${proposal.team && proposal.team.length > 0 
  ? proposal.team.map((member, idx) => `${idx + 1}. ${member.name} - ${member.role}
   Bio: ${member.bio}
   Wallet: ${member.walletAddress}
   Commitment: ${member.timeCommitment}`).join('\n\n')
  : 'No team members specified'}

**Milestones:**
${proposal.milestones && proposal.milestones.length > 0
  ? proposal.milestones.map((milestone, idx) => `${idx + 1}. ${milestone.title}
   Description: ${milestone.description}
   Deliverables: ${milestone.deliverables?.join(', ') || 'Not specified'}
   Funding Amount: ${milestone.fundingAmount || 0} APT
   Duration: ${milestone.durationDays || 0} days
   Success Criteria: ${milestone.successCriteria || 'Not specified'}`).join('\n\n')
  : 'No milestones specified'}

**Budget Breakdown:**
${proposal.budgetBreakdown && proposal.budgetBreakdown.length > 0
  ? proposal.budgetBreakdown.map((item, idx) => `${idx + 1}. ${item.category}: ${item.amount} APT
   Description: ${item.description}
   Justification: ${item.justification || 'Not provided'}`).join('\n\n')
  : 'No budget breakdown provided'}

**Additional Information:**
- Risks & Mitigation: ${proposal.risks || 'Not specified'}
- Success Metrics: ${proposal.successMetrics || 'Not specified'}
- Timeline: ${proposal.timeline || 'Not specified'}

---

**EVALUATION FRAMEWORK:**

Evaluate EACH of the following 8 parameters. For each parameter, provide:
1. Score (0-100)
2. Reasoning (2-3 sentences explaining the score)

**1. Strategic Alignment (0-100)**
How well does this proposal align with AptoCom DAO's mission to advance the Aptos ecosystem? Consider:
- Relevance to DAO goals and vision
- Potential impact on Aptos ecosystem
- Alignment with community priorities
- Innovation and uniqueness

**2. Feasibility (0-100)**
How technically and operationally viable is this proposal? Consider:
- Technical complexity vs. team capability
- Resource requirements vs. availability
- Timeline realism
- Dependencies and blockers
- Proof of concept or prior work

**3. Team Capability (0-100)**
How qualified is the team to execute this proposal? Consider:
- Relevant experience and expertise
- Team composition and completeness
- Track record and reputation
- Time commitment adequacy
- Skill gaps or concerns

**4. Financial Reasonableness (0-100)**
Is the budget justified and efficient? Consider:
- Budget size vs. scope appropriateness
- Cost breakdown clarity and detail
- Market rate comparison
- Contingency planning
- Value for money

**5. ROI Potential (0-100)**
What is the expected return on investment for the DAO? Consider:
- Quantifiable benefits (revenue, tokens, users)
- Strategic benefits (partnerships, visibility)
- Long-term value creation
- Measurability of returns
- Time to value

**6. Risk Assessment (0-100)**
How well are risks identified and mitigated? Consider:
- Risk identification completeness
- Mitigation strategies quality
- Likelihood and impact of risks
- Contingency plans
- Risk/reward balance

**7. Milestone Clarity (0-100)**
How clear, measurable, and achievable are the milestones? Consider:
- Milestone definition clarity
- Deliverables specificity
- Success criteria measurability
- Timeline appropriateness
- Progress tracking feasibility

**8. Transparency (0-100)**
How transparent and complete is the information provided? Consider:
- Information completeness
- Documentation quality
- Communication clarity
- Team identification and verification
- Openness about challenges

---

**REQUIRED OUTPUT FORMAT:**

Respond with a valid JSON object (no markdown code blocks, just raw JSON) in this EXACT structure:

{
  "scores": {
    "strategicAlignment": <number 0-100>,
    "feasibility": <number 0-100>,
    "teamCapability": <number 0-100>,
    "financialReasonableness": <number 0-100>,
    "roiPotential": <number 0-100>,
    "riskLevel": <number 0-100>,
    "milestoneClarity": <number 0-100>,
    "transparency": <number 0-100>
  },
  "reasoning": {
    "strategicAlignment": "<string: 2-3 sentences>",
    "feasibility": "<string: 2-3 sentences>",
    "feasibility": "<string: 2-3 sentences>",
    "teamCapability": "<string: 2-3 sentences>",
    "financialReasonableness": "<string: 2-3 sentences>",
    "roiPotential": "<string: 2-3 sentences>",
    "riskLevel": "<string: 2-3 sentences>",
    "milestoneClarity": "<string: 2-3 sentences>",
    "transparency": "<string: 2-3 sentences>"
  },
  "strengths": ["<string>", "<string>", "<string>"],
  "weaknesses": ["<string>", "<string>", "<string>"],
  "opportunities": ["<string>", "<string>"],
  "threats": ["<string>", "<string>"],
  "missingInformation": ["<string>", "<string>"],
  "clarificationQuestions": ["<string>", "<string>"],
  "overallAssessment": "<string: 3-4 sentences summarizing the evaluation>"
}

Ensure all scores are integers between 0-100. Be objective, thorough, and constructive.`;

  return prompt;
}

/**
 * Parse AI response and extract structured evaluation data
 */
function parseAIResponse(responseText) {
  try {
    // Try to parse the entire response as JSON first
    const parsed = JSON.parse(responseText);
    
    // Validate structure
    if (!parsed.scores || !parsed.reasoning) {
      throw new Error('Missing required fields in AI response');
    }
    
    // Validate all scores are present and in valid range
    const requiredScores = [
      'strategicAlignment', 'feasibility', 'teamCapability', 
      'financialReasonableness', 'roiPotential', 'riskLevel',
      'milestoneClarity', 'transparency'
    ];
    
    for (const scoreKey of requiredScores) {
      if (typeof parsed.scores[scoreKey] !== 'number') {
        throw new Error(`Missing or invalid score: ${scoreKey}`);
      }
      if (parsed.scores[scoreKey] < 0 || parsed.scores[scoreKey] > 100) {
        throw new Error(`Score out of range (0-100): ${scoreKey} = ${parsed.scores[scoreKey]}`);
      }
    }
    
    return parsed;
  } catch (error) {
    // If parsing fails, try to extract JSON from markdown code blocks
    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (e) {
        throw new Error(`Failed to parse AI response JSON: ${e.message}`);
      }
    }
    
    throw new Error(`Failed to parse AI response: ${error.message}`);
  }
}

/**
 * Calculate weighted overall score
 */
function calculateOverallScore(scores) {
  const overallScore = 
    scores.strategicAlignment * config.weights.strategicAlignment +
    scores.feasibility * config.weights.feasibility +
    scores.teamCapability * config.weights.teamCapability +
    scores.financialReasonableness * config.weights.financialReasonableness +
    scores.roiPotential * config.weights.roiPotential +
    scores.riskLevel * config.weights.riskLevel +
    scores.milestoneClarity * config.weights.milestoneClarity +
    scores.transparency * config.weights.transparency;
  
  return Math.round(overallScore * 100) / 100; // Round to 2 decimal places
}

/**
 * Determine recommendation based on overall score
 */
function determineRecommendation(overallScore) {
  if (overallScore >= config.thresholds.stronglyApprove) {
    return 'strongly-approve';
  } else if (overallScore >= config.thresholds.approve) {
    return 'approve';
  } else if (overallScore >= config.thresholds.review) {
    return 'review';
  } else if (overallScore >= config.thresholds.reject) {
    return 'reject';
  } else {
    return 'strongly-reject';
  }
}

/**
 * Check if clarification is needed
 */
function needsClarification(parsedResponse, scores) {
  // Check if there's significant missing information
  const missingInfoCount = parsedResponse.missingInformation?.length || 0;
  if (missingInfoCount >= config.clarificationThresholds.missingInfo) {
    return true;
  }
  
  // Check if any critical scores are too low
  const criticalScores = [
    scores.feasibility,
    scores.teamCapability,
    scores.financialReasonableness,
  ];
  
  const hasLowScore = criticalScores.some(
    score => score < config.clarificationThresholds.lowScore
  );
  
  return hasLowScore && missingInfoCount > 0;
}

/**
 * Main evaluation function
 * Evaluates a proposal using Groq AI and returns structured evaluation
 * 
 * @param {Object} proposal - Proposal object from database
 * @returns {Promise<Object>} - Evaluation results
 */
async function evaluateProposal(proposal) {
  console.log(`Starting AI evaluation for proposal: ${proposal._id || proposal.title}`);
  
  try {
    // Generate evaluation prompt
    const prompt = generateEvaluationPrompt(proposal);
    console.log('Generated evaluation prompt');
    
    // Call Groq AI with retry logic
    const completion = await withRetry(async () => {
      return await groq.chat.completions.create({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert proposal evaluator for a DAO on Aptos blockchain. Respond with valid JSON only, no markdown formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: config.temperature,
        max_tokens: 4000,
      });
    }, 'Groq AI evaluation');
    
    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('Empty response from Groq AI');
    }
    
    console.log('Received AI response, parsing...');
    
    // Parse AI response
    const parsedResponse = parseAIResponse(responseText);
    console.log('Successfully parsed AI response');
    
    // Extract scores
    const scores = parsedResponse.scores;
    
    // Calculate overall score
    const overallScore = calculateOverallScore(scores);
    console.log(`Calculated overall score: ${overallScore}`);
    
    // Determine recommendation
    const recommendation = determineRecommendation(overallScore);
    console.log(`Recommendation: ${recommendation}`);
    
    // Check if clarification needed
    const clarificationNeeded = needsClarification(parsedResponse, scores);
    
    // Prepare evaluation result
    const evaluation = {
      proposalId: proposal._id,
      
      // Scores
      strategicAlignment: scores.strategicAlignment,
      feasibility: scores.feasibility,
      teamCapability: scores.teamCapability,
      financialReasonableness: scores.financialReasonableness,
      roiPotential: scores.roiPotential,
      riskLevel: scores.riskLevel,
      milestoneClarity: scores.milestoneClarity,
      transparency: scores.transparency,
      overallScore,
      
      // Reasoning
      reasoning: {
        strategicAlignment: parsedResponse.reasoning.strategicAlignment,
        feasibility: parsedResponse.reasoning.feasibility,
        teamCapability: parsedResponse.reasoning.teamCapability,
        financialReasonableness: parsedResponse.reasoning.financialReasonableness,
        roiPotential: parsedResponse.reasoning.roiPotential,
        riskLevel: parsedResponse.reasoning.riskLevel,
        milestoneClarity: parsedResponse.reasoning.milestoneClarity,
        transparency: parsedResponse.reasoning.transparency,
      },
      
      // SWOT Analysis
      strengths: parsedResponse.strengths || [],
      weaknesses: parsedResponse.weaknesses || [],
      opportunities: parsedResponse.opportunities || [],
      threats: parsedResponse.threats || [],
      
      // Recommendation
      recommendation,
      aiExplanation: parsedResponse.overallAssessment || '',
      
      // Clarifications
      clarificationNeeded,
      clarificationQuestions: parsedResponse.clarificationQuestions || [],
      missingInformation: parsedResponse.missingInformation || [],
      
      // Metadata
      evaluatedAt: new Date(),
      model: config.model,
      tokensUsed: completion.usage?.total_tokens || 0,
    };
    
    console.log('Evaluation completed successfully');
    return {
      success: true,
      evaluation,
    };
    
  } catch (error) {
    console.error('AI evaluation failed:', error);
    return {
      success: false,
      error: error.message,
      evaluation: null,
    };
  }
}

/**
 * Save evaluation to database
 * Creates a new AIEvaluation document
 */
async function saveEvaluation(evaluationData) {
  try {
    const evaluation = new AIEvaluation(evaluationData);
    await evaluation.save();
    console.log(`Saved evaluation to database: ${evaluation._id}`);
    return {
      success: true,
      evaluationId: evaluation._id,
      evaluation,
    };
  } catch (error) {
    console.error('Failed to save evaluation:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get evaluation by proposal ID
 */
async function getEvaluationByProposalId(proposalId) {
  try {
    const evaluation = await AIEvaluation.findOne({ proposalId })
      .sort({ evaluatedAt: -1 }) // Get most recent
      .exec();
    
    if (!evaluation) {
      return {
        success: false,
        error: 'Evaluation not found',
      };
    }
    
    return {
      success: true,
      evaluation,
    };
  } catch (error) {
    console.error('Failed to get evaluation:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Re-evaluate a proposal
 * Useful when proposal is updated or human requests re-evaluation
 */
async function reevaluateProposal(proposalId, proposal) {
  console.log(`Re-evaluating proposal: ${proposalId}`);
  
  // Get existing evaluation
  const existingResult = await getEvaluationByProposalId(proposalId);
  
  // Perform new evaluation
  const newEvalResult = await evaluateProposal(proposal);
  
  if (!newEvalResult.success) {
    return newEvalResult;
  }
  
  // If there was an existing evaluation, mark it
  if (existingResult.success) {
    console.log('Previous evaluation exists, this is a re-evaluation');
    newEvalResult.evaluation.previousEvaluationId = existingResult.evaluation._id;
  }
  
  // Save new evaluation
  const saveResult = await saveEvaluation(newEvalResult.evaluation);
  
  return {
    success: saveResult.success,
    evaluation: saveResult.evaluation,
    isReeval: existingResult.success,
  };
}

/**
 * Apply human override to evaluation
 * Updates an existing evaluation with human judgment
 */
async function overrideEvaluation(evaluationId, overrideData) {
  try {
    const evaluation = await AIEvaluation.findById(evaluationId);
    
    if (!evaluation) {
      return {
        success: false,
        error: 'Evaluation not found',
      };
    }
    
    // Store original recommendation if this is first override
    if (!evaluation.overridden) {
      evaluation.originalRecommendation = evaluation.recommendation;
    }
    
    // Apply override
    evaluation.overridden = true;
    evaluation.overriddenBy = overrideData.overriddenBy; // Wallet address
    evaluation.overrideReason = overrideData.reason;
    evaluation.recommendation = overrideData.newRecommendation;
    evaluation.overriddenAt = new Date();
    
    await evaluation.save();
    
    console.log(`Applied human override to evaluation: ${evaluationId}`);
    return {
      success: true,
      evaluation,
    };
  } catch (error) {
    console.error('Failed to override evaluation:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Batch evaluate multiple proposals
 * Useful for evaluating all pending proposals at once
 */
async function batchEvaluateProposals(proposals) {
  console.log(`Starting batch evaluation of ${proposals.length} proposals`);
  
  const results = [];
  
  for (const proposal of proposals) {
    try {
      const result = await evaluateProposal(proposal);
      
      if (result.success) {
        // Save evaluation
        const saveResult = await saveEvaluation(result.evaluation);
        results.push({
          proposalId: proposal._id,
          success: saveResult.success,
          evaluationId: saveResult.evaluationId,
        });
      } else {
        results.push({
          proposalId: proposal._id,
          success: false,
          error: result.error,
        });
      }
      
      // Add delay between evaluations to avoid rate limiting
      await sleep(1000);
      
    } catch (error) {
      console.error(`Batch evaluation failed for proposal ${proposal._id}:`, error);
      results.push({
        proposalId: proposal._id,
        success: false,
        error: error.message,
      });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`Batch evaluation completed: ${successCount}/${proposals.length} successful`);
  
  return {
    success: true,
    results,
    total: proposals.length,
    successful: successCount,
    failed: proposals.length - successCount,
  };
}

/**
 * Generate treasury monitoring insights
 * AI analysis of treasury health and spending patterns
 */
async function generateTreasuryInsights(treasuryData) {
  console.log('Generating treasury insights with AI');
  
  try {
    const prompt = `You are a financial advisor for AptoCom DAO treasury management.

**TREASURY DATA:**

Current Balance: ${treasuryData.currentBalance} APT
Monthly Burn Rate: ${treasuryData.monthlyBurnRate} APT
Runway: ${treasuryData.runwayMonths} months
Total Allocated: ${treasuryData.totalAllocated} APT
Total Spent: ${treasuryData.totalSpent} APT

**Recent Transactions:**
${treasuryData.recentTransactions.map(tx => 
  `- ${tx.type}: ${tx.amount} APT (${tx.description})`
).join('\n')}

Analyze the treasury health and provide insights in JSON format:

{
  "healthStatus": "<string: healthy|concerning|critical>",
  "healthScore": <number 0-100>,
  "insights": ["<string>", "<string>", "<string>"],
  "recommendations": ["<string>", "<string>", "<string>"],
  "risks": ["<string>", "<string>"],
  "opportunities": ["<string>", "<string>"]
}`;

    const completion = await withRetry(async () => {
      return await groq.chat.completions.create({
        model: config.model,
        messages: [
          { role: 'system', content: 'You are a treasury management expert. Respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });
    }, 'Treasury insights generation');
    
    const responseText = completion.choices[0]?.message?.content;
    const insights = parseAIResponse(responseText);
    
    console.log('Treasury insights generated successfully');
    return {
      success: true,
      insights,
    };
    
  } catch (error) {
    console.error('Failed to generate treasury insights:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Validate milestone completion
 * AI assessment of whether milestone deliverables meet criteria
 */
async function validateMilestone(milestone, submittedEvidence) {
  console.log(`Validating milestone: ${milestone.title}`);
  
  try {
    const prompt = `You are a milestone validation expert for AptoCom DAO.

**MILESTONE INFORMATION:**

Title: ${milestone.title}
Description: ${milestone.description}
Success Criteria: ${milestone.successCriteria}
Expected Deliverables: ${milestone.deliverables?.join(', ')}
Funding Amount: ${milestone.fundingAmount} APT

**SUBMITTED EVIDENCE:**

${submittedEvidence.description}

Evidence Links:
${submittedEvidence.links?.join('\n')}

Validate whether the milestone is complete and deliverables meet the success criteria.

Respond with JSON:

{
  "isComplete": <boolean>,
  "completionScore": <number 0-100>,
  "deliverablesMet": ["<string>", "<string>"],
  "deliverablesNotMet": ["<string>", "<string>"],
  "assessment": "<string: 3-4 sentences>",
  "recommendation": "<string: approve-payment|request-revision|reject>"
}`;

    const completion = await withRetry(async () => {
      return await groq.chat.completions.create({
        model: config.model,
        messages: [
          { role: 'system', content: 'You are a milestone validation expert. Respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2, // Lower temperature for validation
        max_tokens: 1500,
      });
    }, 'Milestone validation');
    
    const responseText = completion.choices[0]?.message?.content;
    const validation = parseAIResponse(responseText);
    
    console.log(`Milestone validation completed: ${validation.isComplete ? 'Complete' : 'Incomplete'}`);
    return {
      success: true,
      validation,
    };
    
  } catch (error) {
    console.error('Failed to validate milestone:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Health check for AI service
 */
async function healthCheck() {
  try {
    // Test Groq API connection with simple request
    const completion = await groq.chat.completions.create({
      model: config.model,
      messages: [{ role: 'user', content: 'Respond with: OK' }],
      max_tokens: 10,
    });
    
    const response = completion.choices[0]?.message?.content;
    
    return {
      status: 'healthy',
      groqConnected: true,
      model: config.model,
      response: response?.substring(0, 50),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      groqConnected: false,
      error: error.message,
    };
  }
}

// Export all functions
module.exports = {
  // Core evaluation
  evaluateProposal,
  reevaluateProposal,
  saveEvaluation,
  getEvaluationByProposalId,
  
  // Batch operations
  batchEvaluateProposals,
  
  // Human oversight
  overrideEvaluation,
  
  // Treasury & milestones
  generateTreasuryInsights,
  validateMilestone,
  
  // Utilities
  calculateOverallScore,
  determineRecommendation,
  healthCheck,
  
  // Configuration (for testing/debugging)
  config,
};
