/**
 * Email Service
 * Handles all email sending via Nodemailer
 * Supports both delivery emails and user notification emails
 */

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Singleton transporter
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      pool: true,       // Use connection pool
      maxConnections: 5,
    });
  }
  return transporter;
};

/**
 * Send a raw email message (platform: 'email' delivery)
 */
const sendEmail = async ({ to, subject, text, html }) => {
  const transport = getTransporter();

  const info = await transport.sendMail({
    from: process.env.EMAIL_FROM || 'AI Message Scheduler <noreply@scheduler.app>',
    to,
    subject,
    text,
    html: html || `<div style="font-family: sans-serif; max-width: 600px; margin: auto;">
      <h2 style="color: #1a1a2e;">${subject}</h2>
      <div style="white-space: pre-wrap; line-height: 1.6;">${text}</div>
      <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;"/>
      <p style="color: #999; font-size: 12px;">Sent via AI Message Scheduler</p>
    </div>`,
  });

  logger.info(`Email sent to ${to}: ${info.messageId}`);
  return info.messageId;
};

/**
 * Send a delivery success notification to the message owner
 */
const sendDeliveryNotification = async ({ userEmail, userName, recipientContact, platform, scheduledAt }) => {
  try {
    await sendEmail({
      to: userEmail,
      subject: '✅ Message Delivered Successfully',
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; background: #f9f9f9; padding: 24px; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 8px; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 22px;">✅ Message Delivered</h1>
          </div>
          <p style="color: #333;">Hi <strong>${userName}</strong>,</p>
          <p style="color: #555;">Your scheduled message was delivered successfully!</p>
          <div style="background: white; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #667eea;">
            <p style="margin: 4px 0;"><strong>Recipient:</strong> ${recipientContact}</p>
            <p style="margin: 4px 0;"><strong>Platform:</strong> ${platform}</p>
            <p style="margin: 4px 0;"><strong>Sent at:</strong> ${new Date(scheduledAt).toLocaleString()}</p>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">AI Message Scheduler &mdash; Your messages, on time.</p>
        </div>
      `,
    });
  } catch (err) {
    logger.warn(`Failed to send delivery notification to ${userEmail}: ${err.message}`);
    // Non-critical — don't throw
  }
};

/**
 * Send a delivery failure notification to the message owner
 */
const sendFailureNotification = async ({ userEmail, userName, recipientContact, platform, reason }) => {
  try {
    await sendEmail({
      to: userEmail,
      subject: '❌ Message Delivery Failed',
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; background: #f9f9f9; padding: 24px; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 24px; border-radius: 8px; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 22px;">❌ Delivery Failed</h1>
          </div>
          <p style="color: #333;">Hi <strong>${userName}</strong>,</p>
          <p style="color: #555;">Unfortunately, your scheduled message could not be delivered.</p>
          <div style="background: white; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #f5576c;">
            <p style="margin: 4px 0;"><strong>Recipient:</strong> ${recipientContact}</p>
            <p style="margin: 4px 0;"><strong>Platform:</strong> ${platform}</p>
            <p style="margin: 4px 0;"><strong>Reason:</strong> ${reason || 'Unknown error'}</p>
          </div>
          <p style="color: #555;">Please review the message in your dashboard and try again.</p>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">AI Message Scheduler</p>
        </div>
      `,
    });
  } catch (err) {
    logger.warn(`Failed to send failure notification to ${userEmail}: ${err.message}`);
  }
};

/**
 * Verify email transporter connectivity
 */
const verifyTransporter = async () => {
  try {
    await getTransporter().verify();
    logger.info('📧 Email transporter connected');
    return true;
  } catch (err) {
    logger.warn(`Email transporter not available: ${err.message}`);
    return false;
  }
};

module.exports = {
  sendEmail,
  sendDeliveryNotification,
  sendFailureNotification,
  verifyTransporter,
};
