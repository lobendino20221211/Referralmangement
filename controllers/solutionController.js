// controllers/solutionController.js
const SolutionPrescriber = require('../services/solutionPrescriber');

const prescriber = new SolutionPrescriber();

exports.generatePrescription = async (req, res) => {
  try {
    const { issue, setting, urgency, constraints } = req.body;

    // Validation
    if (!issue || issue.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Issue description is required'
      });
    }

    if (issue.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Issue description is too long (max 2000 characters)'
      });
    }

    // Get solution from AI
    const result = await prescriber.prescribeSolution(issue, {
      setting,
      urgency,
      constraints
    });

    res.json({
      success: true,
      data: result,
      formatted: prescriber.formatSolution(result)
    });

  } catch (error) {
    console.error('Solution Prescriber Error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate solution',
      message: error.message
    });
  }
};

exports.generateFromReferrals = async (req, res) => {
  try {
    const { timeframe } = req.query;
    
    // TODO: Implement referral analysis logic
    res.json({
      success: true,
      message: 'Auto-generate from referrals - Coming soon',
      timeframe: timeframe || 'month'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.healthCheck = async (req, res) => {
  try {
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
    
    res.json({
      success: true,
      status: 'operational',
      apiConfigured: hasApiKey
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};