/**
 * Models Index
 * Central export point for all MongoDB models
 */

const Proposal = require('./Proposal');
const AIEvaluation = require('./AIEvaluation');
const User = require('./User');
const Analytics = require('./Analytics');

module.exports = {
  Proposal,
  AIEvaluation,
  User,
  Analytics,
};
