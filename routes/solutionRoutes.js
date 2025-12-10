// routes/solutionRoutes.js
const express = require('express');
const router = express.Router();
const solutionController = require('../controllers/solutionController');

// Optional: Add your auth middleware if needed
// const { authenticateToken } = require('../middleware/auth');

/**
 * @route   POST /api/solutions/prescribe
 * @desc    Get AI-powered solution for a problem
 * @access  Public (or add authenticateToken middleware)
 */
router.post('/generate', solutionController.generatePrescription);

/**
 * @route   GET /api/prescriptions/auto
 * @desc    Auto-generate prescription based on referral database
 * @access  Public (or add authenticateToken middleware)
 * @query   timeframe - "week", "month", etc.
 * 
 * This will analyze your referrals and generate a prescription for the top issue
 */
router.get('/auto', solutionController.generateFromReferrals);

/**
 * @route   GET /api/prescriptions/health
 * @desc    Check if prescription service is configured
 * @access  Public
 */
router.get('/health', solutionController.healthCheck);

module.exports = router;