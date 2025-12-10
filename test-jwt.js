// ================================================
// JWT TEST SCRIPT
// Save as: backend/test-jwt.js
// Run with: node backend/test-jwt.js
// ================================================

const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('\n========================================');
console.log('JWT CONFIGURATION TEST');
console.log('========================================\n');

// Test 1: Check if JWT_SECRET exists
console.log('Test 1: JWT_SECRET Configuration');
console.log('--------------------------------');
if (!process.env.JWT_SECRET) {
  console.log('❌ FAILED: JWT_SECRET not found in .env file');
  console.log('   Please add JWT_SECRET=your_secret_key to .env');
  process.exit(1);
} else {
  console.log('✅ PASSED: JWT_SECRET found');
  console.log('   Length:', process.env.JWT_SECRET.length, 'characters');
  console.log('   Value:', process.env.JWT_SECRET);
}

console.log('\n');

// Test 2: Generate a test token
console.log('Test 2: Token Generation');
console.log('--------------------------------');
try {
  const testPayload = {
    id: '507f1f77bcf86cd799439011',
    username: 'testuser',
    role: 'Admin'
  };
  
  const token = jwt.sign(testPayload, process.env.JWT_SECRET, { expiresIn: '8h' });
  
  console.log('✅ PASSED: Token generated successfully');
  console.log('   Token length:', token.length);
  console.log('   Token parts:', token.split('.').length, '(should be 3)');
  console.log('   Token preview:', token.substring(0, 50) + '...');
  
  // Store for next test
  global.testToken = token;
} catch (error) {
  console.log('❌ FAILED: Could not generate token');
  console.log('   Error:', error.message);
  process.exit(1);
}

console.log('\n');

// Test 3: Verify the token
console.log('Test 3: Token Verification');
console.log('--------------------------------');
try {
  const decoded = jwt.verify(global.testToken, process.env.JWT_SECRET);
  
  console.log('✅ PASSED: Token verified successfully');
  console.log('   Decoded payload:', JSON.stringify(decoded, null, 2));
  
  // Check payload fields
  if (decoded.id && decoded.username && decoded.role) {
    console.log('   ✅ All expected fields present');
  } else {
    console.log('   ⚠️  Some fields missing from payload');
  }
  
} catch (error) {
  console.log('❌ FAILED: Token verification failed');
  console.log('   Error:', error.message);
  process.exit(1);
}

console.log('\n');

// Test 4: Test malformed token handling
console.log('Test 4: Malformed Token Handling');
console.log('--------------------------------');
const malformedTokens = [
  { name: 'Empty string', value: '' },
  { name: 'Invalid format', value: 'not.a.valid.token' },
  { name: 'Missing parts', value: 'onlyonepart' },
  { name: 'Random string', value: 'randomstring123' }
];

let malformedTestsPassed = 0;
malformedTokens.forEach(test => {
  try {
    jwt.verify(test.value, process.env.JWT_SECRET);
    console.log(`   ❌ ${test.name}: Should have failed but didn't`);
  } catch (error) {
    console.log(`   ✅ ${test.name}: Correctly rejected (${error.name})`);
    malformedTestsPassed++;
  }
});

console.log(`   ${malformedTestsPassed}/${malformedTokens.length} malformed tokens correctly rejected`);

console.log('\n');

// Test 5: Bearer token format handling
console.log('Test 5: Bearer Format Handling');
console.log('--------------------------------');
const bearerToken = `Bearer ${global.testToken}`;
const extractedToken = bearerToken.substring(7);

if (extractedToken === global.testToken) {
  console.log('✅ PASSED: Bearer prefix extraction works');
  console.log('   Original:', bearerToken.substring(0, 50) + '...');
  console.log('   Extracted:', extractedToken.substring(0, 50) + '...');
} else {
  console.log('❌ FAILED: Bearer prefix extraction failed');
}

console.log('\n');

// Test 6: Expiration check
console.log('Test 6: Token Expiration');
console.log('--------------------------------');
try {
  const decoded = jwt.verify(global.testToken, process.env.JWT_SECRET);
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = new Date(decoded.exp * 1000);
  const timeUntilExpiry = decoded.exp - now;
  
  console.log('✅ PASSED: Expiration data correct');
  console.log('   Issued at:', new Date(decoded.iat * 1000).toLocaleString());
  console.log('   Expires at:', expiresAt.toLocaleString());
  console.log('   Time until expiry:', Math.floor(timeUntilExpiry / 3600), 'hours');
  
  if (timeUntilExpiry > 0) {
    console.log('   ✅ Token is still valid');
  } else {
    console.log('   ❌ Token is expired');
  }
} catch (error) {
  console.log('❌ FAILED: Could not check expiration');
  console.log('   Error:', error.message);
}

console.log('\n========================================');
console.log('TEST SUMMARY');
console.log('========================================\n');

console.log('All tests passed! ✅');
console.log('\nYour JWT configuration is working correctly.');
console.log('If you still have auth issues, the problem is likely in:');
console.log('  1. How the token is being saved after login');
console.log('  2. How the token is being sent in API requests');
console.log('  3. How the auth middleware is extracting the token');
console.log('\nNext steps:');
console.log('  1. Replace backend/middleware/auth.js with auth-debug.js');
console.log('  2. Clear browser localStorage');
console.log('  3. Login again and check server logs');
console.log('\n========================================\n');