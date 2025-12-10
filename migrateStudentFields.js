const mongoose = require('mongoose');
const Referral = require('./models/Referral');
require('dotenv').config();

async function migrateStudentFields() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update referrals that are student concerns but don't have N/A values
    const result = await Referral.updateMany(
      { 
        isStudentConcern: true,
        $or: [
          { level: { $ne: 'N/A' } },
          { grade: { $ne: 'N/A' } }
        ]
      },
      { 
        $set: { 
          level: 'N/A',
          grade: 'N/A'
        } 
      }
    );

    console.log(`Migration complete: ${result.modifiedCount} referrals updated`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateStudentFields();