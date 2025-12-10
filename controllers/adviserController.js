// backend/controllers/adviserController.js
const User = require('../models/User');
const Student = require('../models/Student');

// Get all advisers (teachers) with student counts
exports.getAllAdvisers = async (req, res) => {
  try {
    // Get all active users with Teacher role
    const teachers = await User.find({ 
      role: 'Teacher', 
      isActive: true 
    })
    .select('fullName email department username createdAt')
    .sort({ fullName: 1 });

    // Get student counts for each teacher
    const advisersWithCounts = await Promise.all(
      teachers.map(async (teacher) => {
        const studentCount = await Student.countDocuments({ 
          adviser: teacher.fullName 
        });

        return {
          _id: teacher._id,
          fullName: teacher.fullName,
          email: teacher.email,
          department: teacher.department,
          username: teacher.username,
          studentCount,
          createdAt: teacher.createdAt
        };
      })
    );

    res.json({
      success: true,
      data: advisersWithCounts
    });

  } catch (error) {
    console.error('Error fetching advisers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch advisers',
      error: error.message
    });
  }
};

// Get students by adviser name
exports.getStudentsByAdviser = async (req, res) => {
  try {
    const adviserName = decodeURIComponent(req.params.adviserName);

    const students = await Student.find({ adviser: adviserName })
      .sort({ lastName: 1, firstName: 1 });

    res.json({
      success: true,
      data: students
    });

  } catch (error) {
    console.error('Error fetching adviser students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students',
      error: error.message
    });
  }
};

// Get all students (for student view)
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find({})
      .sort({ lastName: 1, firstName: 1 });

    res.json({
      success: true,
      data: students
    });

  } catch (error) {
    console.error('Error fetching all students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students',
      error: error.message
    });
  }
};

