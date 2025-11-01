// Test script to verify Twilio connection
const fs = require('fs');
const path = require('path');

// Manually load .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      process.env[key] = value;
    }
  });
}

const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

console.log('=== Twilio Connection Test ===');
console.log('Account SID:', accountSid ? `${accountSid.substring(0, 10)}...` : 'MISSING');
console.log('Auth Token:', authToken ? 'Present (length: ' + authToken.length + ')' : 'MISSING');

if (!accountSid || !authToken) {
  console.error('ERROR: Twilio credentials not found in .env.local');
  process.exit(1);
}

console.log('\n1. Testing Twilio client initialization...');
const client = twilio(accountSid, authToken);
console.log('   ✓ Client initialized\n');

console.log('2. Testing Twilio account verification (fetching account info)...');
const startTime = Date.now();

client.api.accounts(accountSid)
  .fetch()
  .then(account => {
    const endTime = Date.now();
    console.log(`   ✓ Account verified in ${endTime - startTime}ms`);
    console.log('   Account Status:', account.status);
    console.log('   Account Type:', account.type);
    console.log('\n3. Testing available phone numbers API (searching for 1 local number in US)...');

    const searchStart = Date.now();
    return client.availablePhoneNumbers('US')
      .local
      .list({ limit: 1 })
      .then(numbers => {
        const searchEnd = Date.now();
        console.log(`   ✓ Search completed in ${searchEnd - searchStart}ms`);
        console.log(`   Found ${numbers.length} number(s)`);
        if (numbers.length > 0) {
          console.log('   Sample number:', numbers[0].phoneNumber);
        }
        console.log('\n=== SUCCESS: Twilio connection is working! ===');
        process.exit(0);
      });
  })
  .catch(error => {
    const endTime = Date.now();
    console.error(`\n   ✗ Error after ${endTime - startTime}ms`);
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);
    console.error('   More info:', error.moreInfo);

    if (error.code === 20003) {
      console.error('\n   DIAGNOSIS: Invalid credentials (Authentication failed)');
      console.error('   - Check that TWILIO_ACCOUNT_SID starts with "AC"');
      console.error('   - Verify AUTH_TOKEN is correct in Twilio console');
    } else if (error.code === 20404) {
      console.error('\n   DIAGNOSIS: Account not found');
      console.error('   - Verify the Account SID is correct');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.error('\n   DIAGNOSIS: Network/connectivity issue');
      console.error('   - Check internet connection');
      console.error('   - Check if firewall is blocking Twilio API');
    }

    console.error('\n=== FAILED: Twilio connection test failed ===');
    process.exit(1);
  });
