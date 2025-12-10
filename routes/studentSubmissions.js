const express = require('express');
const router = express.Router();
const StudentSubmission = require('../models/StudentSubmission');

// PUBLIC ROUTE - No authentication
router.post('/submit', async (req, res) => {
  try {
    console.log('📋 Received submission:', req.body);
    
    const { studentName, concern, nameOption } = req.body;
    
    // Validate
    if (!concern || concern.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Concern is required'
      });
    }
    
    // Generate unique submission ID with retry logic
    let submissionId;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      
      // Find the highest existing submission number for today
      const todayPattern = new RegExp(`^SUB-${dateStr}-`);
      const existingSubmissions = await StudentSubmission.find({
        submissionId: todayPattern
      }).sort({ submissionId: -1 }).limit(1);
      
      let nextNumber = 1;
      if (existingSubmissions.length > 0) {
        const lastId = existingSubmissions[0].submissionId;
        const lastNumber = parseInt(lastId.split('-')[2]);
        nextNumber = lastNumber + 1;
      }
      
      submissionId = `SUB-${dateStr}-${String(nextNumber).padStart(3, '0')}`;
      
      // Check if this ID already exists (safety check)
      const exists = await StudentSubmission.findOne({ submissionId });
      if (!exists) {
        break; // ID is unique, we can use it
      }
      
      attempts++;
      console.log(`⚠️ Duplicate ID detected, retrying... (attempt ${attempts})`);
    }
    
    if (attempts >= maxAttempts) {
      throw new Error('Could not generate unique submission ID');
    }
    
    // Create submission
    const submission = new StudentSubmission({
      submissionId,
      studentName: studentName || 'Anonymous',
      concern: concern.trim(),
      nameOption: nameOption || 'anonymous',
      status: 'Pending',
      severity: 'Low'
    });
    
    await submission.save();
    
    console.log('✅ Submission created:', submissionId);
    
    res.status(201).json({
      success: true,
      message: 'Concern submitted successfully',
      data: {
        submissionId: submission.submissionId,
        _id: submission._id
      }
    });
    
  } catch (error) {
    console.error('❌ Submission error:', error);
    
    // Handle duplicate key error specifically
    if (error.code === 11000) {
      return res.status(500).json({
        success: false,
        error: 'Duplicate submission detected. Please try again.',
        message: 'A submission with this ID already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to submit concern',
      message: error.message
    });
  }
});

// Get all submissions (for counselor view)
router.get('/', async (req, res) => {
  try {
    const { status, severity } = req.query;
    
    const filters = {};
    if (status && status !== 'all') filters.status = status;
    if (severity && severity !== 'all') filters.severity = severity;
    
    const submissions = await StudentSubmission.find(filters)
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get single submission
router.get('/:id', async (req, res) => {
  try {
    const submission = await StudentSubmission.findById(req.params.id);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }
    
    res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update submission
router.put('/:id', async (req, res) => {
  try {
    const { studentId, studentName, level, grade, status, severity, notes } = req.body;
    
    const submission = await StudentSubmission.findByIdAndUpdate(
      req.params.id,
      { studentId, studentName, level, grade, status, severity, notes },
      { new: true, runValidators: true }
    );
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Submission updated successfully',
      data: submission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete submission
router.delete('/:id', async (req, res) => {
  try {
    const submission = await StudentSubmission.findByIdAndDelete(req.params.id);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Submission deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;