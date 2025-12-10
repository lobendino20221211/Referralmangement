// clearTestSubmissions.js
// Run this to clear all test student submissions from the database

// Load from _env file explicitly
require('dotenv').config({ path: './_env' });

const mongoose = require('mongoose');
const StudentSubmission = require('./models/StudentSubmission');

async function clearSubmissions() {
  try {
    console.log('🔌 Connecting to:', process.env.MONGODB_URI);
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Show current count
    const currentCount = await StudentSubmission.countDocuments({});
    console.log(`📊 Current submissions: ${currentCount}`);
    
    // Delete all student submissions
    const result = await StudentSubmission.deleteMany({});
    console.log(`🗑️ Deleted ${result.deletedCount} student submissions`);
    
    console.log('✅ Database cleared successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

clearSubmissions();