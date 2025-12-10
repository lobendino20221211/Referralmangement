const express = require('express');
const router = express.Router();
const { auth, authorizeRoles } = require('../middleware/auth');
const aiPrescriptionController = require('../controllers/aiPrescriptionController');

// All routes require authentication
// Only Admin and Counselor/Staff can access AI prescriptions

// Check if prescription is allowed this week
router.get('/check-availability', auth, aiPrescriptionController.checkAvailability);

// Get this week's prescription
router.get('/this-week', auth, aiPrescriptionController.getThisWeek);

// Get all prescriptions history
router.get('/history', auth, aiPrescriptionController.getHistory);

// Create new prescription (Admin and Counselor only)
router.post('/prescribe', auth, aiPrescriptionController.createPrescription);

module.exports = router;