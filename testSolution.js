// testSolution.js
require('dotenv').config();
const SolutionPrescriber = require( );

async function test() {
  console.log('🧪 Testing Solution Prescriber...\n');
  
  const prescriber = new SolutionPrescriber();
  
  try {
    const result = await prescriber.prescribeSolution(
      'Students are submitting assignments late',
      { 
        setting: 'University',
        urgency: 'Medium'
      }
    );
    
    console.log(prescriber.formatSolution(result));
    console.log('\n✅ Test successful!');
    
    // Show raw data structure
    console.log('\n📊 Raw data structure:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

test();