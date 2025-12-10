const mongoose = require('mongoose');
const Referral = require('./models/Referral');
require('dotenv').config();

/**
 * Migration Script: Update Referral Status Values
 * 
 * This script migrates old status values to new ones:
 * - "In Progress" → "Under Review"
 * - "Resolved" → "Complete"
 * - "Cancelled" → "Complete" (or set to whatever makes sense for your workflow)
 */

async function migrateStatuses() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/referral_system');
    console.log('✅ Connected to database');

    // Map old statuses to new ones
    const statusMap = {
      'In Progress': 'Under Review',
      'Resolved': 'Complete',
      'Cancelled': 'Complete' // You can change this if cancelled should remain different
    };

    console.log('\n📊 Starting migration...\n');

    // Update each old status to new status
    for (const [oldStatus, newStatus] of Object.entries(statusMap)) {
      const result = await Referral.updateMany(
        { status: oldStatus },
        { $set: { status: newStatus } }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✅ Updated ${result.modifiedCount} referral(s) from "${oldStatus}" to "${newStatus}"`);
      } else {
        console.log(`ℹ️  No referrals found with status "${oldStatus}"`);
      }
    }

    // Verify migration
    console.log('\n📈 Current status distribution:');
    const statusCounts = await Referral.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    statusCounts.forEach(status => {
      console.log(`   ${status._id}: ${status.count}`);
    });

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateStatuses();