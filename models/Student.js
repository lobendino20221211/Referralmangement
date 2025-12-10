const mongoose = require("mongoose")

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
    },
    level: {
      type: String,
      enum: ["Elementary", "JHS", "SHS"],
      required: true,
    },
    grade: {
      type: String,
      required: true,
    },
    section: {
      type: String,
      trim: true,
    },
    contactNumber: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    guardianName: {
      type: String,
      trim: true,
    },
    guardianContact: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    adviser: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    medicalNotes: {
      type: String,
      trim: true,
    },
    academicNotes: {
      type: String,
      trim: true,
    },
    behavioralNotes: {
      type: String,
      trim: true,
    },
    // Track consultations and assessments
    consultations: [{
      date: Date,
      counselor: String,
      notes: String,
      attachments: [String] 
    }],
  },
  {
    timestamps: true,
  }
)

// Virtual for full name
studentSchema.virtual("fullName").get(function() {
  return `${this.lastName}, ${this.firstName}${this.middleName ? ' ' + this.middleName : ''}`
})

// Ensure virtuals are included in JSON
studentSchema.set('toJSON', { virtuals: true })
studentSchema.set('toObject', { virtuals: true })

module.exports = mongoose.model("Student", studentSchema)