const express = require('express');
const router = express.Router();
const Referral = require('../models/Referral');
const StudentSubmission = require('../models/StudentSubmission');
const { auth } = require('../middleware/auth');

// GET combined incident categories from both referrals and student submissions
router.get('/incident-categories', auth, async (req, res) => {
  try {
    console.log('📊 Fetching incident categories...');
    
    // Get all referrals
    const referrals = await Referral.find({});
    console.log(`Found ${referrals.length} referrals`);
    
    // Get all student submissions
    const submissions = await StudentSubmission.find({});
    console.log(`Found ${submissions.length} student submissions`);
    
    // Aggregate categories from both sources
    const categoryCounts = {};
    
    // Count from referrals
    referrals.forEach(referral => {
      if (referral.incidentCategory) {
        const categoryName = typeof referral.incidentCategory === 'object' 
          ? referral.incidentCategory.name 
          : referral.incidentCategory;
        
        if (categoryName) {
          categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
        }
      }
    });
    
    // Count from student submissions (if they have category field)
    submissions.forEach(submission => {
      if (submission.category) {
        const categoryName = typeof submission.category === 'object' 
          ? submission.category.name 
          : submission.category;
        
        if (categoryName) {
          categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
        }
      }
    });
    
    // Convert to array and sort by count
    const categories = Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    
    console.log('📊 Category counts:', categories);
    
    res.json({
      success: true,
      data: {
        categories,
        totalReferrals: referrals.length,
        totalSubmissions: submissions.length,
        totalIncidents: referrals.length + submissions.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching incident categories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET categories filtered by time range
router.get('/incident-categories/filtered', auth, async (req, res) => {
  try {
    const { timeFilter, month, quarter } = req.query;
    
    console.log('📊 Fetching filtered incident categories...');
    console.log('Filters:', { timeFilter, month, quarter });
    
    let dateFilter = {};
    
    // Apply time filter
    if (timeFilter === 'month' && month) {
      const [year, monthNum] = month.split('-').map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0, 23, 59, 59);
      dateFilter = { createdAt: { $gte: startDate, $lte: endDate } };
    } else if (timeFilter === 'quarter' && quarter) {
      const [year, quarterNum] = quarter.split('-Q').map(Number);
      const startMonth = (quarterNum - 1) * 3;
      const startDate = new Date(year, startMonth, 1);
      const endDate = new Date(year, startMonth + 3, 0, 23, 59, 59);
      dateFilter = { createdAt: { $gte: startDate, $lte: endDate } };
    }
    
    // Get filtered data
    const referrals = await Referral.find(dateFilter);
    const submissions = await StudentSubmission.find(dateFilter);
    
    // Aggregate categories
    const categoryCounts = {};
    
    referrals.forEach(referral => {
      if (referral.incidentCategory) {
        const categoryName = typeof referral.incidentCategory === 'object' 
          ? referral.incidentCategory.name 
          : referral.incidentCategory;
        
        if (categoryName) {
          categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
        }
      }
    });
    
    submissions.forEach(submission => {
      if (submission.category) {
        const categoryName = typeof submission.category === 'object' 
          ? submission.category.name 
          : submission.category;
        
        if (categoryName) {
          categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
        }
      }
    });
    
    const categories = Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    
    res.json({
      success: true,
      data: {
        categories,
        totalReferrals: referrals.length,
        totalSubmissions: submissions.length,
        totalIncidents: referrals.length + submissions.length,
        filters: { timeFilter, month, quarter }
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;