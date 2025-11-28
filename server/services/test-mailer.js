/**
 * Test script for mailer service
 * Run this to verify your SMTP configuration and test email sending
 * 
 * Usage: node server/services/test-mailer.js
 */

require('dotenv').config();
const { sendMail } = require('./mailerService');

async function testMailer() {
  console.log('Testing Mailer Service...\n');
  
  // Check environment variables
  console.log('SMTP Configuration:');
  console.log('- Host:', process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com (default)');
  console.log('- Port:', process.env.ZOHO_SMTP_PORT || '465 (default)');
  console.log('- User:', process.env.ZOHO_SMTP_USER || 'NOT SET');
  console.log('- Pass:', process.env.ZOHO_SMTP_PASS ? '***SET***' : 'NOT SET');
  console.log('- From:', process.env.MAIL_FROM || process.env.ZOHO_SMTP_USER || 'NOT SET');
  console.log();

  if (!process.env.ZOHO_SMTP_USER || !process.env.ZOHO_SMTP_PASS) {
    console.error('❌ Error: ZOHO_SMTP_USER and ZOHO_SMTP_PASS must be set in environment variables');
    process.exit(1);
  }

  const testEmail = process.argv[2] || process.env.ZOHO_SMTP_USER;
  console.log(`Sending test email to: ${testEmail}\n`);

  try {
    // Test 1: Simple inline template
    console.log('Test 1: Simple inline template...');
    const result1 = await sendMail({
      to: testEmail,
      subject: 'Test Email - B2B Marketplace Mailer Service',
      template: '<h1>Test Email</h1><p>Hello {name}!</p><p>This is a test email from the B2B Marketplace mailer service.</p><p>Token test: {1}, {2}, {3}</p>',
      templateData: {
        name: 'Test User',
        1: 'First',
        2: 'Second',
        3: 'Third'
      }
    });

    if (result1.success) {
      console.log('✅ Test 1 passed: Email sent successfully');
      console.log('   Message ID:', result1.info.messageId);
    } else {
      console.error('❌ Test 1 failed:', result1.error.message);
      return;
    }

    console.log();

    // Test 2: Email verification template
    console.log('Test 2: Email verification template...');
    const result2 = await sendMail({
      to: testEmail,
      subject: 'Test - Email Verification',
      templateName: 'email-verification',
      templateData: {
        name: 'Test User',
        code: '123456',
        verificationLink: 'https://example.com/verify?token=test123',
        expiryTime: '24 hours'
      }
    });

    if (result2.success) {
      console.log('✅ Test 2 passed: Email verification template sent');
      console.log('   Message ID:', result2.info.messageId);
    } else {
      console.error('❌ Test 2 failed:', result2.error.message);
      return;
    }

    console.log();

    // Test 3: Order status template
    console.log('Test 3: Order status template...');
    const result3 = await sendMail({
      to: testEmail,
      subject: 'Test - Order Status Update',
      templateName: 'order-status',
      templateData: {
        customerName: 'Test Customer',
        orderId: 'ORD-12345',
        orderDate: new Date().toLocaleDateString(),
        orderTotal: '$999.99',
        orderStatus: 'Shipped',
        statusMessage: 'Your order has been shipped and is on its way!',
        trackingNumber: 'TRACK123456789',
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        orderTrackingLink: 'https://example.com/track/TRACK123456789',
        supportEmail: 'support@example.com'
      }
    });

    if (result3.success) {
      console.log('✅ Test 3 passed: Order status template sent');
      console.log('   Message ID:', result3.info.messageId);
    } else {
      console.error('❌ Test 3 failed:', result3.error.message);
      return;
    }

    console.log();
    console.log('🎉 All tests passed! Mailer service is working correctly.');
    console.log(`\nCheck your inbox at ${testEmail} for 3 test emails.`);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
testMailer()
  .then(() => {
    console.log('\nTest completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('\nTest failed with error:', error);
    process.exit(1);
  });
