// controllers/userController.js
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// ---------------- Get all users ----------------
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ---------------- Create user ----------------
exports.createUser = async (req, res) => {
  try {
    const { fullName, username, email, role, department, password, requirePasswordChange } = req.body;

    // Check duplicates case-insensitively
    const existingEmail = await User.findOne({ email: { $regex: `^${email}$`, $options: 'i' } });
    if (existingEmail) return res.status(400).json({ success: false, message: 'Email already exists' });

    const existingUsername = await User.findOne({ username: { $regex: `^${username}$`, $options: 'i' } });
    if (existingUsername) return res.status(400).json({ success: false, message: 'Username already exists' });

    const newUser = new User({
      fullName,
      username,
      email,
      role,
      department,
      password, // raw password, hashed by pre-save hook
      requirePasswordChange,
      isActive: true
    });

    await newUser.save();

    // Send email with temporary password
    try {
      await sendEmail({
        to: email,
        subject: 'Your Account Has Been Created',
        text: `Hello ${fullName},\n\nYour account has been created.\nUsername: ${username}\nTemporary Password: ${password}\n\nPlease log in and change your password immediately.\n\nCSCQC Guidance System`
      });
    } catch (emailErr) {
      console.error('Email error:', emailErr);
      return res.status(201).json({ success: true, message: 'User created, but failed to send email', data: newUser });
    }

    res.status(201).json({ success: true, message: 'User created successfully', data: newUser });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ---------------- Toggle user status ----------------
exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ---------------- Reset password ----------------
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.password = newPassword; // hashed by pre-save hook
    user.requirePasswordChange = true;
    await user.save();

    try {
      await sendEmail({
        to: user.email,
        subject: 'Your Password Has Been Reset',
        text: `Hello ${user.fullName},\n\nYour password has been reset.\nTemporary Password: ${newPassword}\n\nPlease log in and change your password immediately.\n\nCSCQC Guidance System`
      });
    } catch (emailErr) {
      console.error('Email error:', emailErr);
      return res.status(500).json({ success: true, message: 'Password reset, but failed to send email' });
    }

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ---------------- Delete user ----------------
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
