// backend/routes/advisers.js
const express = require('express');
const router = express.Router();
const adviserController = require('../controllers/adviserController');
const { auth } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get all advisers with student counts
router.get('/advisers', adviserController.getAllAdvisers);

// Get students by adviser name
router.get('/adviser/:adviserName', adviserController.getStudentsByAdviser);

// Get all students
router.get('/all-students', adviserController.getAllStudents);

module.exports = router;