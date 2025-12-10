const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { auth, authorizeRoles } = require("../middleware/auth");
const sendEmail = require("../utils/sendEmail");

// ============================
// GET CURRENT USER PROFILE (All authenticated users)
// ============================
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id).select("-password");
    
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================
// CREATE USER (Admin only)
// ============================
router.post("/create", auth, authorizeRoles("Admin"), async (req, res) => {
  try {
    const { username, email, password, fullName, role, department } = req.body;

    if (!username || !email || !password || !fullName || !role) {
      return res.status(400).json({
        success: false,
        error: "All required fields must be provided",
      });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User with this email or username already exists",
      });
    }

    // Let the pre-save hook handle password hashing
    const user = new User({
      username,
      email,
      password, // Raw password - will be hashed by pre-save hook
      fullName,
      role,
      department,
      requirePasswordChange: true,
      isActive: true,
    });

    await user.save();

    try {
      await sendEmail({
        to: email,
        subject: "Your Account Has Been Created",
        text: `Hello ${fullName},\n\nYour account has been created.\nUsername: ${username}\nTemporary Password: ${password}\n\nPlease log in and change your password immediately.\n\nCSCQC Guidance System`,
      });
    } catch (emailErr) {
      console.error("Email error:", emailErr);
      return res.status(500).json({ success: true, message: "User created, but failed to send email" });
    }

    res.status(201).json({
      success: true,
      message: "User created successfully. They must change password on first login.",
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          department: user.department,
        },
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================
// GET ALL USERS (Admin only)
// ============================
router.get("/", auth, authorizeRoles("Admin"), async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================
// CHANGE PASSWORD
// ============================
router.post("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id);
    if (!await bcrypt.compare(currentPassword, user.password)) {
      return res.status(401).json({ success: false, error: "Current password is incorrect" });
    }

    // Let the pre-save hook handle password hashing
    user.password = newPassword;
    user.requirePasswordChange = false;
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================
// TOGGLE USER STATUS (Admin only)
// ============================
router.put("/:id/toggle-status", auth, authorizeRoles("Admin"), async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    res.json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      data: user,
    });
  } catch (error) {
    console.error("Error toggling user status:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================
// RESET PASSWORD (Admin only)
// ============================
router.put("/:id/reset-password", auth, authorizeRoles("Admin"), async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: "Password must be at least 6 characters" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    // Let the pre-save hook handle password hashing
    user.password = newPassword;
    user.requirePasswordChange = true;
    await user.save();

    try {
      await sendEmail({
        to: user.email,
        subject: "Your Password Has Been Reset",
        text: `Hello ${user.fullName},\n\nYour password has been reset.\nTemporary Password: ${newPassword}\n\nPlease log in and change your password immediately.\n\nCSCQC Guidance System`,
      });
    } catch (emailErr) {
      console.error("Email error:", emailErr);
      return res.status(500).json({ success: true, message: "Password reset, but failed to send email" });
    }

    res.json({ success: true, message: "Password reset successfully. User must change it on next login." });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================
// DELETE USER (Admin only)
// ============================
router.delete("/:id", auth, authorizeRoles("Admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    // Prevent deleting own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, error: "You cannot delete your own account" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================
// UPDATE USER (Admin or own profile)
// ============================
router.put("/:id", auth, async (req, res) => {
  try {
    const { fullName, username, email, role, department } = req.body;
    
    // Check if user is updating their own profile or is an admin
    const isOwnProfile = req.user._id.toString() === req.params.id;
    const isAdmin = req.user.role === "Admin";

    if (!isOwnProfile && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        error: "Not authorized to update this profile" 
      });
    }

    // Check for duplicate username (excluding current user)
    if (username) {
      const existingUsername = await User.findOne({ 
        username: { $regex: `^${username}$`, $options: 'i' },
        _id: { $ne: req.params.id }
      });
      
      if (existingUsername) {
        return res.status(400).json({ 
          success: false, 
          error: "Username already exists" 
        });
      }
    }

    // Check for duplicate email (excluding current user)
    if (email) {
      const existingEmail = await User.findOne({ 
        email: { $regex: `^${email}$`, $options: 'i' },
        _id: { $ne: req.params.id }
      });
      
      if (existingEmail) {
        return res.status(400).json({ 
          success: false, 
          error: "Email already exists" 
        });
      }
    }

    // Regular users can only update their fullName and username
    // Admins can update role and department
    const updateData = { fullName, username };
    
    if (isAdmin) {
      if (email) updateData.email = email;
      if (role) updateData.role = role;
      if (department) updateData.department = department;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    res.json({ success: true, message: "User updated successfully", data: user });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;