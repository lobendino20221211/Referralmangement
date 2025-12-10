const express = require("express")
const router = express.Router()
const multer = require("multer")
const Student = require("../models/Student")
const { auth, authorizeRoles } = require("../middleware/auth")
const studentController = require("../controllers/studentController")

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only Excel and CSV files
    const allowedMimes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel and CSV files are allowed.'));
    }
  }
});

// BULK UPLOAD students - Admin AND Teacher roles
router.post("/bulk-upload", auth, authorizeRoles("Admin", "Teacher"), upload.single("file"), studentController.bulkUploadStudents);

// GET all advisers with student counts (Counselor/Staff view)
router.get("/advisers", auth, authorizeRoles("Admin", "Counselor"), studentController.getAllAdvisersWithStudents);

// GET students by adviser (for teachers and counselors)
router.get("/adviser/:adviserName", auth, authorizeRoles("Teacher", "Counselor", "Admin"), studentController.getStudentsByAdviser);

// SEARCH students for autocomplete - MUST BE BEFORE /:id route
// ✅ NOW ALLOWS TEACHERS! Teachers only see their own students
router.get("/search", auth, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }
    
    const query = {
      isActive: true,
      $or: [
        { studentId: { $regex: q, $options: "i" } },
        { firstName: { $regex: q, $options: "i" } },
        { lastName: { $regex: q, $options: "i" } }
      ]
    };
    
    // ✅ TEACHER FILTER: If user is a teacher, only show their students
    if (req.user.role === "Teacher") {
      query.adviser = req.user.fullName;
    }
    
    const students = await Student.find(query)
      .select('studentId firstName lastName middleName level grade')
      .limit(10)
      .sort({ studentId: 1 });
    
    // Format response for autocomplete
    const formattedStudents = students.map(student => ({
      _id: student._id,
      studentId: student.studentId,
      name: `${student.lastName}, ${student.firstName}${student.middleName ? ' ' + student.middleName : ''}`,
      level: student.level,
      grade: student.grade
    }));
    
    res.json({ success: true, data: formattedStudents });
  } catch (error) {
    console.error("Error searching students:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// GET statistics - MUST BE BEFORE /:id route
router.get("/stats/overview", auth, authorizeRoles("Admin", "Counselor"), async (req, res) => {
  try {
    const total = await Student.countDocuments({ isActive: true })
    const elementary = await Student.countDocuments({ level: "Elementary", isActive: true })
    const juniorHigh = await Student.countDocuments({ level: "JHS", isActive: true })
    const seniorHigh = await Student.countDocuments({ level: "SHS", isActive: true })
    
    res.json({
      success: true,
      data: {
        total,
        elementary,
        juniorHigh,
        seniorHigh
      }
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// GET all students (Admin, Counselor, Teacher)
router.get("/", auth, async (req, res) => {
  try {
    const { search, level, grade, isActive } = req.query
    
    const query = {
      isActive: isActive !== undefined ? isActive === "true" : true
    }
    
    // If user is a teacher, only show their students
    if (req.user.role === "Teacher") {
      query.adviser = req.user.fullName;
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
      ]
    }
    
    if (level) {
      query.level = level
    }
    
    if (grade) {
      query.grade = grade
    }
    
    const students = await Student.find(query).sort({ lastName: 1, firstName: 1 })
    
    res.json({
      success: true,
      data: students,
      count: students.length
    })
  } catch (error) {
    console.error("Error fetching students:", error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// GET student by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
    
    if (!student) {
      return res.status(404).json({ success: false, error: "Student not found" })
    }
    
    res.json({ success: true, data: student })
  } catch (error) {
    console.error("Error fetching student:", error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// CREATE new student (Admin, Counselor only)
router.post("/", auth, authorizeRoles("Admin", "Counselor"), async (req, res) => {
  try {
    const {
      studentId,
      firstName,
      lastName,
      middleName,
      level,
      grade,
      section,
      contactNumber,
      email,
      guardianName,
      guardianContact,
      address,
      dateOfBirth,
      adviser,
      medicalNotes,
      academicNotes,
      behavioralNotes
    } = req.body
    
    // Check for duplicates: studentId, contactNumber, or name+level+grade
    let existingStudent = null;
    if (studentId) existingStudent = await Student.findOne({ studentId });
    if (!existingStudent && contactNumber) existingStudent = await Student.findOne({ contactNumber });
    if (!existingStudent) {
      existingStudent = await Student.findOne({
        firstName: new RegExp(`^${firstName}$`, 'i'),
        lastName: new RegExp(`^${lastName}$`, 'i'),
        level: level,
        grade: grade
      });
    }

    if (existingStudent) {
      return res.status(400).json({ success: false, error: 'Duplicate student exists' });
    }
    
    const student = new Student({
      studentId,
      firstName,
      lastName,
      middleName,
      level,
      grade,
      section,
      contactNumber,
      email,
      guardianName,
      guardianContact,
      address,
      dateOfBirth,
      adviser,
      medicalNotes,
      academicNotes,
      behavioralNotes
    })
    
    await student.save()
    
    res.status(201).json({
      success: true,
      data: student,
      message: "Student created successfully"
    })
  } catch (error) {
    console.error("Error creating student:", error)
    res.status(400).json({ success: false, error: error.message })
  }
})

// UPDATE student (Admin, Counselor only)
router.put("/:id", auth, authorizeRoles("Admin", "Counselor"), async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    
    if (!student) {
      return res.status(404).json({ success: false, error: "Student not found" })
    }
    
    res.json({
      success: true,
      data: student,
      message: "Student updated successfully"
    })
  } catch (error) {
    console.error("Error updating student:", error)
    res.status(400).json({ success: false, error: error.message })
  }
})

// DELETE student (Admin only - soft delete)
router.delete("/:id", auth, authorizeRoles("Admin"), async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    )
    
    if (!student) {
      return res.status(404).json({ success: false, error: "Student not found" })
    }
    
    res.json({
      success: true,
      message: "Student deactivated successfully"
    })
  } catch (error) {
    console.error("Error deleting student:", error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ADD consultation record
router.post("/:id/consultation", auth, authorizeRoles("Admin", "Counselor"), async (req, res) => {
  try {
    const { notes, attachments } = req.body
    
    const student = await Student.findById(req.params.id)
    
    if (!student) {
      return res.status(404).json({ success: false, error: "Student not found" })
    }
    
    student.consultations.push({
      date: new Date(),
      counselor: req.user.fullName,
      notes,
      attachments: attachments || []
    })
    
    await student.save()
    
    res.json({
      success: true,
      data: student,
      message: "Consultation added successfully"
    })
  } catch (error) {
    console.error("Error adding consultation:", error)
    res.status(400).json({ success: false, error: error.message })
  }
})

module.exports = router