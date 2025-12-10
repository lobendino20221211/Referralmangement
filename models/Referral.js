// backend/models/Referral.js
// Model for STAFF REFERRALS ONLY (Teachers, Counselors, Admin)
// Student submissions are now in StudentSubmission model

const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
  {
    referralId: {
      type: String,
      unique: true,
      // Auto-generated in pre-save hook
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    studentId: {
      type: String,
      trim: true,
      default: null
    },
    level: {
      type: String,
      enum: ["Elementary", "JHS", "SHS"],
      required: true
    },
    grade: {
      type: String,
      required: true,
      trim: true
    },
    referralDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Pending", "Under Review", "For Consultation", "Complete"],
      default: "Pending",
    },
    category: {
      type: String,
      required: false,
      trim: true,
      default: null,
      validate: {
        validator: async function(value) {
          if (!value || value === '') return true;
          
          const Category = mongoose.model('Category');
          const categoryExists = await Category.findOne({ 
            name: value,
            isActive: true
          });
          
          return !!categoryExists;
        },
        message: props => `Category "${props.value}" is not a valid category.`
      }
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    referredBy: {
      type: String,
      trim: true,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true // Now ALWAYS required (all referrals must have a creator)
    }
  },
  { timestamps: true }
);

// Generate referralId before saving
referralSchema.pre("save", async function (next) {
  if (this.isNew && !this.referralId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}${month}${day}`;

    const count = await mongoose.model("Referral").countDocuments({
      referralId: new RegExp(`^REF-${dateStr}-`),
    });

    const sequence = String(count + 1).padStart(3, "0");
    this.referralId = `REF-${dateStr}-${sequence}`;
  }
  next();
});

module.exports = mongoose.model("Referral", referralSchema);