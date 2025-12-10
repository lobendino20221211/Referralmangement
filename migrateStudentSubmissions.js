// Migration script to move student submissions to their own table

const mongoose = require("mongoose");
require("dotenv").config();

// Import models
const Referral = require("../models/Referral");
const StudentSubmission = require("../models/StudentSubmission");

async function migrateStudentSubmissions() {
  try {
    console.log("🔄 Starting migration: Separating student submissions from referrals...\n");
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Find all referrals that were student submissions
    // (identified by: isStudentSubmitted = true OR createdBy = null)
    const studentReferrals = await Referral.find({
      $or: [
        { isStudentSubmitted: true },
        { createdBy: null }
      ]
    });

    console.log(`📊 Found ${studentReferrals.length} student submissions to migrate\n`);

    if (studentReferrals.length === 0) {
      console.log("✅ No student submissions found. Migration complete!\n");
      process.exit(0);
    }

    let migratedCount = 0;
    let errorCount = 0;

    // Migrate each student referral to StudentSubmission table
    for (const referral of studentReferrals) {
      try {
        // Create new student submission
        const submission = new StudentSubmission({
          studentName: referral.studentName || 'Anonymous',
          concern: referral.reason || referral.description || 'No concern provided',
          studentNameOption: referral.studentNameOption || 'preferNot',
          status: 'Pending', // Reset to pending for counselor review
          reviewNotes: referral.notes || '',
          createdAt: referral.createdAt,
          updatedAt: referral.updatedAt
        });

        await submission.save();
        
        // Delete the old referral record
        await Referral.findByIdAndDelete(referral._id);
        
        migratedCount++;
        console.log(`✅ Migrated: ${referral.referralId || referral._id} → ${submission.submissionId}`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error migrating ${referral._id}:`, error.message);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 MIGRATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total found:     ${studentReferrals.length}`);
    console.log(`Successfully migrated: ${migratedCount}`);
    console.log(`Errors:          ${errorCount}`);
    console.log("=".repeat(60) + "\n");

    if (migratedCount > 0) {
      console.log("✅ Student submissions have been moved to the StudentSubmission table");
      console.log("✅ Referral table now contains ONLY staff-created referrals");
      console.log("\nNext steps:");
      console.log("1. Update your server.js to include the new studentSubmissions routes");
      console.log("2. Update your frontend to use the new endpoints");
      console.log("3. Counselors can now process student submissions separately\n");
    }

  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    process.exit(0);
  }
}

// Run migration
migrateStudentSubmissions();