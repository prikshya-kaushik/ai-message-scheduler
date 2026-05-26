/**
 * ScheduledMessage Model
 * Core model for all scheduled messages with full lifecycle tracking
 */

const mongoose = require('mongoose');

const PLATFORMS = ['email', 'sms', 'whatsapp', 'slack', 'telegram', 'twitter'];
const STATUSES = ['scheduled', 'sent', 'failed', 'cancelled', 'draft'];

const scheduledMessageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },

    // ── Recipient Info ──────────────────────────────────────────────────────
    recipient: {
      name: {
        type: String,
        trim: true,
        maxlength: [100, 'Recipient name too long'],
      },
      contact: {
        type: String,
        required: [true, 'Recipient contact is required'],
        trim: true,
      },
    },

    // ── Message Content ────────────────────────────────────────────────────
    subject: {
      type: String,
      trim: true,
      maxlength: [200, 'Subject too long'],
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      maxlength: [5000, 'Message content too long'],
    },
    isAiGenerated: {
      type: Boolean,
      default: false,
    },
    aiPrompt: {
      type: String,
      maxlength: [500, 'AI prompt too long'],
    },

    // ── Scheduling ─────────────────────────────────────────────────────────
    scheduledAt: {
      type: Date,
      required: [true, 'Scheduled time is required'],
      index: true,
    },
    timezone: {
      type: String,
      required: [true, 'Timezone is required'],
      default: 'UTC',
    },

    // ── Platform ───────────────────────────────────────────────────────────
    platform: {
      type: String,
      required: [true, 'Platform is required'],
      enum: {
        values: PLATFORMS,
        message: `Platform must be one of: ${PLATFORMS.join(', ')}`,
      },
      lowercase: true,
    },

    // ── Status Lifecycle ───────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: STATUSES,
        message: `Status must be one of: ${STATUSES.join(', ')}`,
      },
      default: 'scheduled',
      index: true,
    },

    // ── Delivery Tracking ──────────────────────────────────────────────────
    sentAt: {
      type: Date,
    },
    failedAt: {
      type: Date,
    },
    failureReason: {
      type: String,
      maxlength: [500, 'Failure reason too long'],
    },
    retryCount: {
      type: Number,
      default: 0,
      max: [3, 'Maximum retries exceeded'],
    },
    deliveryId: {
      type: String, // External delivery confirmation ID (email message ID, etc.)
    },

    // ── Metadata ───────────────────────────────────────────────────────────
    tags: [{
      type: String,
      trim: true,
      maxlength: 30,
    }],
    notes: {
      type: String,
      maxlength: [500, 'Notes too long'],
    },
  },
  {
    timestamps: true,
  }
);

// ─── Compound Indexes ──────────────────────────────────────────────────────────
scheduledMessageSchema.index({ user: 1, status: 1 });
scheduledMessageSchema.index({ user: 1, scheduledAt: -1 });
scheduledMessageSchema.index({ status: 1, scheduledAt: 1 }); // For scheduler queries
scheduledMessageSchema.index({ user: 1, createdAt: -1 });

// ─── Virtual: isOverdue ────────────────────────────────────────────────────────
scheduledMessageSchema.virtual('isOverdue').get(function () {
  return this.status === 'scheduled' && this.scheduledAt < new Date();
});

// ─── Static: Find pending messages due for dispatch ───────────────────────────
scheduledMessageSchema.statics.findDueMessages = function () {
  return this.find({
    status: 'scheduled',
    scheduledAt: { $lte: new Date() },
  }).populate('user', 'email name notificationEmail emailNotifications');
};

module.exports = mongoose.model('ScheduledMessage', scheduledMessageSchema);
