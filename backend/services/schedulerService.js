/**
 * Scheduler Service
 * Uses node-cron to poll for due messages every minute and dispatch them
 */

const cron = require('node-cron');
const ScheduledMessage = require('../models/ScheduledMessage');
const { sendEmail, sendDeliveryNotification, sendFailureNotification } = require('./emailService');
const logger = require('../utils/logger');

// Track if scheduler is already running to prevent double-init
let schedulerRunning = false;

/**
 * Dispatch a single message based on its platform
 * Extend this switch block to add real SMS/WhatsApp/Slack integrations
 */
const dispatchMessage = async (message) => {
  const { platform, recipient, content, subject } = message;

  switch (platform) {
    case 'email': {
      const messageId = await sendEmail({
        to: recipient.contact,
        subject: subject || 'Message from AI Scheduler',
        text: content,
      });
      return { success: true, deliveryId: messageId };
    }

    // ── Stub handlers for other platforms ─────────────────────────────────
    // Replace these with real API integrations (Twilio, WhatsApp API, etc.)
    case 'sms':
      logger.info(`[STUB] SMS to ${recipient.contact}: ${content.substring(0, 50)}...`);
      return { success: true, deliveryId: `sms_${Date.now()}` };

    case 'whatsapp':
      logger.info(`[STUB] WhatsApp to ${recipient.contact}`);
      return { success: true, deliveryId: `wa_${Date.now()}` };

    case 'slack':
      logger.info(`[STUB] Slack to ${recipient.contact}`);
      return { success: true, deliveryId: `slack_${Date.now()}` };

    case 'telegram':
      logger.info(`[STUB] Telegram to ${recipient.contact}`);
      return { success: true, deliveryId: `tg_${Date.now()}` };

    case 'twitter':
      logger.info(`[STUB] Twitter DM to ${recipient.contact}`);
      return { success: true, deliveryId: `tw_${Date.now()}` };

    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
};

/**
 * Process all messages that are due for delivery
 */
const processDueMessages = async () => {
  const dueMessages = await ScheduledMessage.findDueMessages();

  if (dueMessages.length === 0) return;

  logger.info(`⏰ Processing ${dueMessages.length} due message(s)`);

  // Process in parallel with individual error isolation
  await Promise.allSettled(
    dueMessages.map(async (message) => {
      try {
        // Attempt dispatch
        const result = await dispatchMessage(message);

        // Mark as sent
        message.status = 'sent';
        message.sentAt = new Date();
        message.deliveryId = result.deliveryId;
        await message.save();

        logger.info(`✅ Message ${message._id} sent via ${message.platform}`);

        // Send success notification if user has email notifications enabled
        if (message.user.emailNotifications) {
          await sendDeliveryNotification({
            userEmail: message.user.notificationEmail || message.user.email,
            userName: message.user.name,
            recipientContact: message.recipient.contact,
            platform: message.platform,
            scheduledAt: message.scheduledAt,
          });
        }
      } catch (err) {
        logger.error(`❌ Failed to send message ${message._id}: ${err.message}`);

        message.retryCount = (message.retryCount || 0) + 1;

        if (message.retryCount >= 3) {
          // Permanently failed after 3 attempts
          message.status = 'failed';
          message.failedAt = new Date();
          message.failureReason = err.message;

          if (message.user.emailNotifications) {
            await sendFailureNotification({
              userEmail: message.user.notificationEmail || message.user.email,
              userName: message.user.name,
              recipientContact: message.recipient.contact,
              platform: message.platform,
              reason: err.message,
            });
          }
        } else {
          // Reschedule for retry in 5 minutes
          message.scheduledAt = new Date(Date.now() + 5 * 60 * 1000);
          logger.info(`🔄 Retrying message ${message._id} in 5 minutes (attempt ${message.retryCount}/3)`);
        }

        await message.save();
      }
    })
  );
};

/**
 * Initialize the cron scheduler
 * Runs every minute: "* * * * *"
 */
const initScheduler = () => {
  if (schedulerRunning) {
    logger.warn('Scheduler already running — skipping init');
    return;
  }

  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      await processDueMessages();
    } catch (err) {
      logger.error(`Scheduler tick error: ${err.message}`);
    }
  });

  schedulerRunning = true;
  logger.info('✅ Cron scheduler started — polling every minute');
};

module.exports = { initScheduler, processDueMessages };
