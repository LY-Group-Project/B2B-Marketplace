/**
 * Example usage of the mailer service
 * This file demonstrates how to use the mailer service with various templates
 */

const { sendMail } = require('./mailerService');

// Example 1: Send email verification
async function sendEmailVerification(userEmail, userName, verificationCode, verificationLink) {
  return await sendMail({
    to: userEmail,
    subject: 'Verify Your Email - B2B Marketplace',
    templateName: 'email-verification',
    templateData: {
      name: userName,
      code: verificationCode,
      verificationLink: verificationLink,
      expiryTime: '24 hours'
    }
  });
}

// Example 2: Send login notification
async function sendLoginNotification(userEmail, userName, loginDetails) {
  return await sendMail({
    to: userEmail,
    subject: 'New Login Detected - B2B Marketplace',
    templateName: 'login-notification',
    templateData: {
      name: userName,
      loginTime: loginDetails.time,
      device: loginDetails.device,
      location: loginDetails.location,
      ipAddress: loginDetails.ip,
      secureAccountLink: `${process.env.FRONTEND_URL}/account/security`
    }
  });
}

// Example 3: Send welcome email
async function sendWelcomeEmail(userEmail, userName) {
  return await sendMail({
    to: userEmail,
    subject: 'Welcome to B2B Marketplace!',
    templateName: 'signup-welcome',
    templateData: {
      name: userName,
      dashboardLink: `${process.env.FRONTEND_URL}/dashboard`,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@b2bmarketplace.com'
    }
  });
}

// Example 4: Send passkey registration confirmation
async function sendPasskeyRegistration(userEmail, userName, passkeyDetails) {
  return await sendMail({
    to: userEmail,
    subject: 'Passkey Registered Successfully',
    templateName: 'passkey-registration',
    templateData: {
      name: userName,
      passkeyName: passkeyDetails.name,
      device: passkeyDetails.device,
      registrationTime: passkeyDetails.time,
      managePasskeysLink: `${process.env.FRONTEND_URL}/account/passkeys`
    }
  });
}

// Example 5: Send order status update to customer
async function sendOrderStatusUpdate(order, customer) {
  return await sendMail({
    to: customer.email,
    subject: `Order Update: ${order.status} - Order #${order.id}`,
    templateName: 'order-status',
    templateData: {
      customerName: customer.name,
      orderId: order.id,
      orderDate: order.createdAt,
      orderTotal: `$${order.total.toFixed(2)}`,
      orderStatus: order.status,
      statusMessage: getStatusMessage(order.status),
      trackingNumber: order.trackingNumber || 'N/A',
      estimatedDelivery: order.estimatedDelivery || 'TBD',
      orderTrackingLink: `${process.env.FRONTEND_URL}/orders/${order.id}/track`,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@b2bmarketplace.com'
    }
  });
}

// Example 6: Send dispute update notification
async function sendDisputeUpdate(dispute, user) {
  return await sendMail({
    to: user.email,
    subject: `Dispute Update - Case #${dispute.id}`,
    templateName: 'dispute-update',
    templateData: {
      name: user.name,
      disputeId: dispute.id,
      orderId: dispute.orderId,
      disputeCreatedDate: dispute.createdAt,
      disputeStatus: dispute.status,
      lastUpdateDate: dispute.updatedAt,
      updateMessage: dispute.latestMessage,
      resolutionDetails: dispute.resolution || '',
      nextSteps: getDisputeNextSteps(dispute.status),
      disputeDetailsLink: `${process.env.FRONTEND_URL}/disputes/${dispute.id}`,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@b2bmarketplace.com'
    }
  });
}

// Example 7: Send new order notification to vendor
async function sendOrderNotificationToVendor(order, vendor) {
  const itemsList = order.items.map(item => 
    `${item.name} (x${item.quantity})`
  ).join(', ');

  return await sendMail({
    to: vendor.email,
    subject: `New Order Received - Order #${order.id}`,
    templateName: 'order-notification',
    templateData: {
      vendorName: vendor.name,
      orderId: order.id,
      orderDate: order.createdAt,
      customerName: order.customer.name,
      orderTotal: `$${order.total.toFixed(2)}`,
      itemCount: order.items.length,
      orderItems: itemsList,
      shippingAddress: formatAddress(order.shippingAddress),
      orderManagementLink: `${process.env.FRONTEND_URL}/vendor/orders/${order.id}`,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@b2bmarketplace.com'
    }
  });
}

// Example 8: Send fund release notification to vendor
async function sendFundReleaseNotification(transaction, vendor) {
  return await sendMail({
    to: vendor.email,
    subject: `Funds Released - $${transaction.amount.toFixed(2)}`,
    templateName: 'fund-release',
    templateData: {
      vendorName: vendor.name,
      amount: `$${transaction.amount.toFixed(2)}`,
      transactionId: transaction.id,
      orderId: transaction.orderId,
      releaseDate: transaction.releasedAt,
      paymentMethod: transaction.paymentMethod,
      escrowAddress: transaction.escrowAddress,
      availableBalance: `$${vendor.availableBalance.toFixed(2)}`,
      viewTransactionLink: `${process.env.FRONTEND_URL}/vendor/transactions/${transaction.id}`,
      requestPayoutLink: `${process.env.FRONTEND_URL}/vendor/payouts/new`,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@b2bmarketplace.com'
    }
  });
}

// Example 9: Send fund hold notification to vendor
async function sendFundHoldNotification(hold, vendor) {
  return await sendMail({
    to: vendor.email,
    subject: `Funds on Hold - $${hold.amount.toFixed(2)}`,
    templateName: 'fund-hold',
    templateData: {
      vendorName: vendor.name,
      amount: `$${hold.amount.toFixed(2)}`,
      orderId: hold.orderId,
      holdDate: hold.createdAt,
      holdReason: hold.reason,
      holdReasonDetails: hold.reasonDetails,
      expectedReleaseDate: hold.expectedRelease,
      escrowAddress: hold.escrowAddress,
      nextSteps: hold.nextSteps || 'Please wait for the review to complete. We will notify you once funds are released.',
      orderDetailsLink: `${process.env.FRONTEND_URL}/vendor/orders/${hold.orderId}`,
      contactSupportLink: `${process.env.FRONTEND_URL}/support/contact`,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@b2bmarketplace.com'
    }
  });
}

// Helper functions
function getStatusMessage(status) {
  const messages = {
    'pending': 'Your order is being processed.',
    'confirmed': 'Your order has been confirmed and will be shipped soon.',
    'shipped': 'Your order has been shipped and is on its way!',
    'delivered': 'Your order has been delivered. Thank you for your purchase!',
    'cancelled': 'Your order has been cancelled.',
    'refunded': 'Your order has been refunded.'
  };
  return messages[status.toLowerCase()] || 'Your order status has been updated.';
}

function getDisputeNextSteps(status) {
  const steps = {
    'open': 'Our team is reviewing your dispute. We will contact you within 48 hours.',
    'under_review': 'The dispute is currently under review. Please provide any additional evidence if requested.',
    'resolved': 'The dispute has been resolved. Check the resolution details above.',
    'closed': 'The dispute has been closed.'
  };
  return steps[status.toLowerCase()] || 'Please check the dispute details for more information.';
}

function formatAddress(address) {
  return `${address.line1}${address.line2 ? ', ' + address.line2 : ''}\n${address.city}, ${address.state} ${address.postalCode}\n${address.country}`;
}

// Export all functions for use in controllers
module.exports = {
  sendEmailVerification,
  sendLoginNotification,
  sendWelcomeEmail,
  sendPasskeyRegistration,
  sendOrderStatusUpdate,
  sendDisputeUpdate,
  sendOrderNotificationToVendor,
  sendFundReleaseNotification,
  sendFundHoldNotification
};
