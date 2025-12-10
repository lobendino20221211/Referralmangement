require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const connectDB = require('./config/database');
const seedAdmin = require('./utils/seedAdmin');

// Routes
const referralRoutes = require('./routes/referrals');
const userRoutes = require('./routes/users');
const studentRoutes = require('./routes/students');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categories');
const adviserRoutes = require('./routes/advisers');
const publicReferralRoutes = require('./routes/publicReferrals');
const studentSubmissionsRouter = require('./routes/studentSubmissions');
const solutionRoutes = require('./routes/solutionRoutes');

const { auth, authorizeRoles } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Middleware =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== Serve static files =====
// Set proper MIME types
express.static.mime.define({'text/javascript': ['js']});
express.static.mime.define({'text/css': ['css']});

// Serve the entire front-end directory
app.use(express.static(path.join(__dirname, '../frontend'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'text/javascript');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Serve specific subdirectories explicitly (for redundancy)
app.use('/pages', express.static(path.join(__dirname, '../frontend/pages')));
app.use('/css', express.static(path.join(__dirname, '../frontend/css')));
app.use('/js', express.static(path.join(__dirname, '../frontend/js')));
app.use('/api', express.static(path.join(__dirname, '../frontend/api')));
app.use('/Adviser', express.static(path.join(__dirname, '../frontend/Adviser')));
app.use('/Staff', express.static(path.join(__dirname, '../frontend/Staff')));


// ✅ NEW: Serve public student form directory
app.use('/student-form', express.static(path.join(__dirname, '../public_student_form'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'text/javascript');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// ===== API routes (MUST come AFTER static file middleware to avoid conflicts) =====
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/advisers', adviserRoutes);
app.use('/api/student-submissions', studentSubmissionsRouter);
app.use('/api/public-referrals', publicReferralRoutes);
app.use('/api/solutions', solutionRoutes);

// Import the AI prescription routes
const aiPrescriptionRoutes = require('./routes/aiPrescriptions');

// Register the routes (add this with your other routes)
app.use('/api/ai-prescriptions', aiPrescriptionRoutes);

// Make sure you have dotenv configured at the top
require('dotenv').config();

// ===== Default route - Login Page =====
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/LoginForm.html'));
});

// ===== Protected HTML Routes =====
// Admin Dashboard
app.get('/Dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/Dashboard.html'));
});

// User Management
app.get('/UserManagement.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/UserManagement.html'));
});

// Category Management
app.get('/Category.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/Category.html'));
});

// Profile Settings
app.get('/ProfileSettings.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/ProfileSettings.html'));
});

// Change Password
app.get('/ChangePassword.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/ChangePassword.html'));
});

// Login Form
app.get('/LoginForm.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/LoginForm.html'));
});

// Adviser Routes
app.get('/Adviser/html/Home.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/Adviser/pages/Home.html'));
});

app.get('/Adviser/html/ProfileSettings.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/Adviser/pages/ProfileSettings.html'));
});

app.get('/Adviser/html/StudentProfile.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/Adviser/pages/StudentProfile.html'));
});

app.get('/Adviser/html/Referral.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/Adviser/pages/Referral.html'));
});

// Staff/Counselor Routes
app.get('/Staff/html/Dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/Staff/html/Dashboard.html'));
});

app.get('/Staff/html/ProfileSettings.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/Staff/html/ProfileSettings.html'));
});

app.get('/Staff/html/Referral.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/Staff/html/Referral.html'));
});

app.get('/Staff/html/StudentProfile.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/Staff/html/StudentProfile.html'));
});

// ===== Connect to DB and seed default admin =====
connectDB()
  .then(() => seedAdmin())
  .catch(err => console.error('DB connection failed:', err));

// ===== Error handling =====
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// ===== Start server =====
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📂 Serving frontend from: ${path.join(__dirname, '../frontend')}`);
  console.log(`📋 Student form available at: http://localhost:${PORT}/student-form/Student_Form.html`);
});

// Import the analytics routes
const analyticsRoutes = require('./routes/analytics');

// Register the routes
app.use('/api/analytics', analyticsRoutes);