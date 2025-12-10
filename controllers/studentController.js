// ============================================
// FILE: controllers/studentController.js
// ============================================

const Student = require("../models/Student");
const User = require("../models/User");
const XLSX = require("xlsx");

// ================================================================
// 📌 BULK UPLOAD STUDENTS (Admin + Teacher)
// ================================================================
exports.bulkUploadStudents = async (req, res) => {
  try {
    console.log("📤 Bulk upload started");
    console.log("👤 User:", req.user.fullName, "Role:", req.user.role);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded"
      });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    if (!data || data.length === 0) {
      return res.status(400).json({
        success: false,
        error: "The uploaded file is empty or invalid"
      });
    }

    const studentsToAdd = [];
    const errors = [];
    const duplicates = [];

    const adviserName = req.user.role === "Teacher" ? req.user.fullName : null;

    const existingStudentIds = await Student.find({ isActive: true })
      .select("studentId")
      .lean();

    const studentIdSet = new Set(existingStudentIds.map(s => s.studentId.toLowerCase()));

    // Helper: get column case-insensitive
    const getColumn = (row, variations) => {
      for (let key of Object.keys(row)) {
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        for (let variation of variations) {
          const normalizedVariation = variation.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (normalizedKey === normalizedVariation) {
            const value = row[key];
            return value !== null && value !== undefined ? String(value).trim() : "";
          }
        }
      }
      return "";
    };

    // ============================================
    // PROCESS EACH ROW
    // ============================================
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2;

      try {
        const studentId = getColumn(row, ["StudentID", "Student ID", "ID", "student_id"]);
        const studentName = getColumn(row, ["Student Name", "StudentName", "Name", "FullName"]);
        const level = getColumn(row, ["Level"]);
        const grade = getColumn(row, ["Grade"]);
        const contactNumber = getColumn(row, ["Contact Number", "ContactNumber", "Contact"]);

        if (!studentId || !studentName || !level || !grade) {
          errors.push({
            row: rowNumber,
            error: "Missing required fields (StudentID, Student Name, Level, Grade)"
          });
          continue;
        }

        // Parse name
        let lastName, firstName, middleName = "";

        if (studentName.includes(",")) {
          const parts = studentName.split(",").map(p => p.trim());
          lastName = parts[0];
          const nameParts = parts[1]?.split(/\s+/).filter(p => p) || [];
          firstName = nameParts[0] || "";
          middleName = nameParts.slice(1).join(" ") || "";
        } else {
          const nameParts = studentName.split(/\s+/).filter(p => p);
          if (nameParts.length === 1) {
            firstName = nameParts[0];
            lastName = nameParts[0];
          } else if (nameParts.length === 2) {
            firstName = nameParts[0];
            lastName = nameParts[1];
          } else {
            firstName = nameParts[0];
            middleName = nameParts.slice(1, -1).join(" ");
            lastName = nameParts[nameParts.length - 1];
          }
        }

        if (!["Elementary", "JHS", "SHS"].includes(level)) {
          errors.push({
            row: rowNumber,
            error: `Invalid level "${level}". Must be Elementary, JHS, SHS`
          });
          continue;
        }

        const normalizedId = studentId.toLowerCase();

        if (studentIdSet.has(normalizedId)) {
          duplicates.push({
            row: rowNumber,
            studentId,
            name: studentName,
            reason: "Student ID already exists"
          });
          continue;
        }

        // Prevent duplicate name+level+grade
        const nameExists = await Student.findOne({
          firstName: new RegExp(`^${firstName}$`, "i"),
          lastName: new RegExp(`^${lastName}$`, "i"),
          level,
          grade,
          isActive: true
        });

        if (nameExists) {
          duplicates.push({
            row: rowNumber,
            studentId,
            name: studentName,
            reason: "Student with same name, level, grade already exists"
          });
          continue;
        }

        // Build student object
        const studentData = {
          studentId,
          firstName,
          lastName,
          level,
          grade,
          isActive: true
        };

        if (middleName) studentData.middleName = middleName;
        if (contactNumber) studentData.contactNumber = contactNumber;

        if (adviserName) {
          studentData.adviser = adviserName;
        } else {
          const adviserColumn = getColumn(row, ["Adviser", "Advisor", "Teacher"]);
          if (adviserColumn) studentData.adviser = adviserColumn;
        }

        const section = getColumn(row, ["Section"]);
        if (section) studentData.section = section;

        const email = getColumn(row, ["Email"]);
        if (email) studentData.email = email;

        const guardianName = getColumn(row, ["Guardian Name", "Guardian"]);
        if (guardianName) studentData.guardianName = guardianName;

        const guardianContact = getColumn(row, ["Guardian Contact"]);
        if (guardianContact) studentData.guardianContact = guardianContact;

        studentsToAdd.push(studentData);
        studentIdSet.add(normalizedId);

      } catch (err) {
        errors.push({
          row: rowNumber,
          error: err.message || "Unknown error processing row"
        });
      }
    }

    // Insert valid students
    let insertedCount = 0;

    if (studentsToAdd.length > 0) {
      try {
        const result = await Student.insertMany(studentsToAdd, { ordered: false });
        insertedCount = result.length;
      } catch (insertErr) {
        if (insertErr.writeErrors) {
          insertedCount = studentsToAdd.length - insertErr.writeErrors.length;
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Upload completed. ${insertedCount} added.`,
      summary: {
        totalRows: data.length,
        inserted: insertedCount,
        duplicates: duplicates.length,
        errors: errors.length
      },
      duplicates,
      errors
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Bulk upload failed",
      details: error.message
    });
  }
};

// ================================================================
// 📌 GET STUDENTS BY ADVISER
// ================================================================
exports.getStudentsByAdviser = async (req, res) => {
  try {
    const adviserName = decodeURIComponent(req.params.adviserName);

    if (req.user.role === "Teacher" && req.user.fullName !== adviserName) {
      return res.status(403).json({
        success: false,
        error: "You can only view your own students"
      });
    }

    const students = await Student.find({
      adviser: adviserName,
      isActive: true
    }).sort({ lastName: 1, firstName: 1 });

    res.json({
      success: true,
      data: students,
      count: students.length
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 📌 GET ALL ADVISERS (Teacher + Adviser roles)
// ================================================================
exports.getAllAdvisersWithStudents = async (req, res) => {
  try {
    console.log("📋 Fetching advisers");

    const advisers = await User.find({
      role: { $in: ["Adviser", "Teacher"] },
      isActive: true
    })
      .select("fullName email department")
      .sort({ fullName: 1 })
      .lean();

    const adviserData = await Promise.all(
      advisers.map(async (adviser) => {
        const studentCount = await Student.countDocuments({
          adviser: adviser.fullName,
          isActive: true
        });

        return {
          fullName: adviser.fullName,
          email: adviser.email || "N/A",
          department: adviser.department || "N/A",
          studentCount
        };
      })
    );

    res.json({
      success: true,
      data: adviserData,
      count: adviserData.length
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
