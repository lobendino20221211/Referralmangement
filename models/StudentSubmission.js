const mongoose = require('mongoose');

const studentSubmissionSchema = new mongoose.Schema({
  submissionId: {
    type: String,
    required: true,
    unique: true
  },
  studentId: {
    type: String,
    default: null
  },
  studentName: {
    type: String,
    required: true,
    default: 'Anonymous'
  },
  concern: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['Elementary', 'JHS', 'SHS', null],
    default: null
  },
  grade: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['Pending', 'Under Review', 'For Consultation', 'Processed'],
    default: 'Pending'
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Low'
  },
  notes: {
    type: String,
    default: null
  },
  nameOption: {
    type: String,
    enum: ['realName', 'anonymous', 'preferNot'],
    default: 'anonymous'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StudentSubmission', studentSubmissionSchema);