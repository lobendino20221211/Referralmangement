// backend/routes/referrals.js
// Routes for STAFF REFERRALS ONLY (created by Teachers, Counselors, Admin)
// Student submissions are handled in studentSubmissions.js

const express = require("express");
const router = express.Router();
const Referral = require("../models/Referral");
const { auth, authorizeRoles } = require("../middleware/auth");

// CREATE referral (any logged-in staff user)
router.post("/", auth, async (req, res) => {
  try {
    console.log("🔥 Creating staff referral:", req.body);

    const { studentName, studentId, level, grade, referralDate, reason, description, severity, referredBy } = req.body;

    // Validate required fields
    if (!studentName || !level || !grade || !reason || !referralDate) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: studentName, level, grade, reason, and referralDate are required"
      });
    }

    const newReferral = new Referral({
      studentName,
      studentId: studentId || undefined,
      level,
      grade,
      referralDate,
      reason,
      description: description || "",
      severity: severity || "Medium",
      referredBy: referredBy || undefined,
      createdBy: req.user._id, // Always set (no more null values!)
    });

    const savedReferral = await newReferral.save();
    await savedReferral.populate("createdBy", "username fullName role");
    
    console.log("✅ Staff referral created:", savedReferral.referralId);
    
    res.status(201).json({ success: true, data: savedReferral });
  } catch (error) {
    console.error("❌ Error creating referral:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET teacher's own referrals
router.get("/my-referrals", auth, async (req, res) => {
  try {
    const { search, level, severity, status } = req.query;
    
    // Only get referrals created by this user
    let filter = { createdBy: req.user._id };
    
    if (search) {
      filter.studentName = { $regex: search, $options: 'i' };
    }
    
    if (level && level !== 'all') {
      filter.level = level;
    }
    
    if (severity && severity !== 'all') {
      filter.severity = severity;
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    const referrals = await Referral.find(filter)
      .populate("createdBy", "username fullName role")
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: referrals });
  } catch (error) {
    console.error("Error fetching my referrals:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET recent referrals (last 5)
router.get("/recent", auth, async (req, res) => {
  try {
    let filter = {};
    
    // Teachers only see their own
    if (req.user.role === "Teacher") {
      filter.createdBy = req.user._id;
    }
    // Admin and Counselor see all
    
    const referrals = await Referral.find(filter)
      .populate("createdBy", "username fullName role")
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.json({ success: true, data: referrals });
  } catch (error) {
    console.error("Error fetching recent referrals:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET referral statistics (Admin or Counselor only)
router.get("/stats", auth, authorizeRoles("Admin", "Counselor"), async (req, res) => {
  try {
    const total = await Referral.countDocuments();
    const elementary = await Referral.countDocuments({ level: "Elementary" });
    const juniorHigh = await Referral.countDocuments({ level: "JHS" });
    const seniorHigh = await Referral.countDocuments({ level: "SHS" });
    
    const pending = await Referral.countDocuments({ status: "Pending" });
    const underReview = await Referral.countDocuments({ status: "Under Review" });
    const forConsultation = await Referral.countDocuments({ status: "For Consultation" });
    const complete = await Referral.countDocuments({ status: "Complete" });
    
    const lowSeverity = await Referral.countDocuments({ severity: "Low" });
    const mediumSeverity = await Referral.countDocuments({ severity: "Medium" });
    const highSeverity = await Referral.countDocuments({ severity: "High" });

    res.json({
      success: true,
      data: {
        total,
        byLevel: {
          elementary,
          juniorHigh,
          seniorHigh,
        },
        byStatus: {
          pending,
          underReview,
          forConsultation,
          complete,
        },
        bySeverity: {
          low: lowSeverity,
          medium: mediumSeverity,
          high: highSeverity,
        }
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET all referrals with filtering (Admin or Counselor only)
router.get("/", auth, authorizeRoles("Admin", "Counselor"), async (req, res) => {
  try {
    const { search, level, severity, status } = req.query;
    
    let filter = {};
    
    if (search) {
      filter.studentName = { $regex: search, $options: 'i' };
    }
    
    if (level && level !== 'all') {
      filter.level = level;
    }
    
    if (severity && severity !== 'all') {
      filter.severity = severity;
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    const referrals = await Referral.find(filter)
      .populate("createdBy", "username fullName role")
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: referrals });
  } catch (error) {
    console.error("Error fetching referrals:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET referral by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const referral = await Referral.findById(req.params.id)
      .populate("createdBy", "username fullName role");

    if (!referral) {
      return res.status(404).json({ success: false, error: "Referral not found" });
    }

    // Permission check
    const isAdminOrCounselor = req.user.role === "Admin" || req.user.role === "Counselor";
    const isOwner = referral.createdBy._id.toString() === req.user._id.toString();
    
    // No more null checks needed! createdBy is always set for staff referrals
    
    if (!isAdminOrCounselor && !isOwner) {
      return res.status(403).json({ success: false, error: "Forbidden: Access denied" });
    }

    res.json({ success: true, data: referral });
  } catch (error) {
    console.error("Error fetching referral:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// UPDATE referral
router.put("/:id", auth, async (req, res) => {
  try {
    const referral = await Referral.findById(req.params.id);

    if (!referral) {
      return res.status(404).json({ success: false, error: "Referral not found" });
    }

    // Permission check
    const isAdminOrCounselor = req.user.role === "Admin" || req.user.role === "Counselor";
    const isOwner = referral.createdBy.toString() === req.user._id.toString();
    
    // No more null checks needed! createdBy is always set
    
    if (!isAdminOrCounselor && !isOwner) {
      return res.status(403).json({ 
        success: false, 
        error: "Forbidden: You can only update your own referrals" 
      });
    }

    // Determine what can be updated based on role
    let updateData = req.body;
    
    if (!isAdminOrCounselor && isOwner) {
      // Teachers can only update basic fields
      const { studentName, studentId, level, grade, referralDate, reason, description, severity, referredBy } = req.body;
      updateData = { studentName, studentId, level, grade, referralDate, reason, description, severity, referredBy };
    }
    // Admin/Counselor can update all fields

    const updatedReferral = await Referral.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate("createdBy", "username fullName role");

    res.json({ success: true, data: updatedReferral });
  } catch (error) {
    console.error("Error updating referral:", error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE referral (Admin only)
router.delete("/:id", auth, authorizeRoles("Admin", "Counselor"), async (req, res) => {
  try {
    const referral = await Referral.findByIdAndDelete(req.params.id);
    
    if (!referral) {
      return res.status(404).json({ success: false, error: "Referral not found" });
    }

    console.log(`✅ Referral ${referral.referralId} deleted by ${req.user.role}: ${req.user.fullName || req.user.username}`);

    res.json({ success: true, message: "Referral deleted successfully" });
  } catch (error) {
    console.error("Error deleting referral:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;