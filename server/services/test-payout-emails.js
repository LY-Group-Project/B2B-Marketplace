/**
 * Test script for payout email templates
 * Run: node services/test-payout-emails.js
 */

require('dotenv').config();
const { sendMail } = require('./mailerService');

async function testPayoutEmails() {
  const testEmail = process.env.ZOHO_SMTP_USER || 'b2b@parthb.xyz';
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  
  console.log('Testing payout email templates...');
  console.log('Sending to:', testEmail);
  console.log('---');

  // Test 1: Payout Initiated
  console.log('1. Testing payout-initiated email...');
  try {
    const result1 = await sendMail({
      to: testEmail,
      subject: 'Payout Request Submitted Successfully',
      templateName: 'payout-initiated',
      templateData: {
        name: 'Test Vendor',
        amountUSD: '150.00',
        amountINR: '12500.00',
        bankName: 'HDFC Bank',
        accountLast4: '4567',
        blockExplorerUrl: 'https://hoodi.etherscan.io/tx/0x1234567890abcdef',
        txHashShort: '0x12345678...',
        payoutHistoryUrl: `${clientUrl}/payouts`
      }
    });
    console.log('✓ Payout initiated email sent:', result1.success ? 'SUCCESS' : 'FAILED');
    if (!result1.success) console.error('Error:', result1.error.message);
  } catch (err) {
    console.error('✗ Failed:', err.message);
  }

  console.log('---');

  // Test 2: Payout Completed
  console.log('2. Testing payout-completed email...');
  try {
    const result2 = await sendMail({
      to: testEmail,
      subject: 'Payout Completed Successfully',
      templateName: 'payout-completed',
      templateData: {
        name: 'Test Vendor',
        amountUSD: '150.00',
        amountINR: '12500.00',
        bankName: 'HDFC Bank',
        accountLast4: '4567',
        accountHolderName: 'John Doe',
        utr: 'UTR123456789012',
        completedDate: 'November 28, 2025',
        payoutDetailsUrl: 'http://localhost:5173/vendor/payouts/673e8f1a2b5c4d3e2f1a0b9c'
      }
    });
    console.log('✓ Payout completed email sent:', result2.success ? 'SUCCESS' : 'FAILED');
    if (!result2.success) console.error('Error:', result2.error.message);
  } catch (err) {
    console.error('✗ Failed:', err.message);
  }

  console.log('---');
  console.log('Test completed! Check your inbox at', testEmail);
}

testPayoutEmails().catch(console.error);
