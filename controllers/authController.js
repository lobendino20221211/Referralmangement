const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

const getRedirectPath = (role) => {
  switch(role) {
    case 'Admin':
      return 'Dashboard.html'; // Admin portal
    case 'Teacher':
      return '/Adviser/html/Home.html'; // Teacher portal (CORRECT PATH)
    case 'Counselor':
      return '/Staff/html/Dashboard.html'; // Counselor portal (CORRECT PATH)
    // NO DEFAULT - only these 3 roles exist
  }
  return null; // Invalid role
};

exports.login = async (req, res) => {
  try {
    let { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide username and password' 
      });
    }

    username = username.trim();

    // Find user case-insensitively (username)
    const user = await User.findOne({ 
      username: { $regex: `^${username}$`, $options: 'i' } 
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check password using model helper
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is inactive' 
      });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token with user info
    const token = jwt.sign(
      { 
        id: user._id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Determine redirect path based on role
    const redirectPath = getRedirectPath(user.role);

    // Security: Validate that user has a valid role
    if (!redirectPath) {
      console.error(`Invalid role detected: ${user.role} for user ${user.username}`);
      return res.status(403).json({ 
        success: false, 
        message: `Invalid role: ${user.role}. Please contact administrator.` 
      });
    }

    // Log successful login
    console.log(`✓ User ${user.username} (${user.role}) logged in successfully`);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      redirectPath, // Frontend will use this for redirect
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department,
        requirePasswordChange: user.requirePasswordChange
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and email are required' 
      });
    }

    // Find user by username (case-insensitive) and email (case-insensitive)
    const user = await User.findOne({
      username: { $regex: `^${username.trim()}$`, $options: 'i' },
      email: { $regex: `^${email.trim()}$`, $options: 'i' }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'No user found with that username and email' 
      });
    }

    // Generate temporary password (8 hex characters)
    const tempPassword = crypto.randomBytes(4).toString('hex');

    // Hash and save – let pre-save hook hash by assigning raw password
    user.password = tempPassword;
    user.requirePasswordChange = true;
    await user.save();

    // Send email with temporary password
    try {
      const sendRes = await sendEmail({
        to: user.email,
        subject: 'Your Temporary Password - CSCQC Guidance System',
        text: `Hello ${user.fullName || user.username},

A temporary password has been generated for your account.

Temporary Password: ${tempPassword}

Please log in and change your password immediately for security.

If you did not request this password reset, please contact the administrator immediately.

Best regards,
CSCQC Guidance System`
      });

      if (!sendRes.success) {
        console.error('sendEmail returned error:', sendRes.error);
        return res.status(500).json({ 
          success: false, 
          message: 'Temporary password generated but failed to send email' 
        });
      }
    } catch (emailErr) {
      console.error('Email sending error:', emailErr);
      return res.status(500).json({ 
        success: false, 
        message: 'Temporary password generated but failed to send email' 
      });
    }

    console.log(`✓ Temporary password sent to ${user.email}`);

    res.json({ 
      success: true, 
      message: 'Temporary password sent to your email' 
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};