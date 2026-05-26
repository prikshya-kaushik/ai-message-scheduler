/**
 * Message Controller
 * CRUD operations for scheduled messages
 */

const ScheduledMessage = require('../models/ScheduledMessage');
const logger = require('../utils/logger');

/**
 * GET /api/messages
 * List all messages for current user with filtering and pagination
 */
const getMessages = async (req, res, next) => {
  try {
    const {
      status,
      platform,
      page = 1,
      limit = 10,
      sortBy = 'scheduledAt',
      sortOrder = 'asc',
      search,
    } = req.query;

    const filter = { user: req.user._id };

    if (status) filter.status = status;
    if (platform) filter.platform = platform;
    if (search) {
      filter.$or = [
        { 'recipient.name': { $regex: search, $options: 'i' } },
        { 'recipient.contact': { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [messages, total] = await Promise.all([
      ScheduledMessage.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ScheduledMessage.countDocuments(filter),
    ]);

    res.json({
      messages,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/messages/stats
 * Get message statistics for dashboard
 */
const getStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [stats, upcoming] = await Promise.all([
      ScheduledMessage.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      ScheduledMessage.find({
        user: userId,
        status: 'scheduled',
        scheduledAt: { $gte: new Date() },
      })
        .sort({ scheduledAt: 1 })
        .limit(5)
        .lean(),
    ]);

    const counts = { scheduled: 0, sent: 0, failed: 0, cancelled: 0, draft: 0 };
    stats.forEach(s => {
      if (counts.hasOwnProperty(s._id)) counts[s._id] = s.count;
    });

    res.json({
      stats: counts,
      total: Object.values(counts).reduce((a, b) => a + b, 0),
      upcoming,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/messages/:id
 * Get a single message by ID
 */
const getMessage = async (req, res, next) => {
  try {
    const message = await ScheduledMessage.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    res.json({ message });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/messages
 * Create a new scheduled message
 */
const createMessage = async (req, res, next) => {
  try {
    const {
      recipient,
      subject,
      content,
      scheduledAt,
      timezone,
      platform,
      isAiGenerated,
      aiPrompt,
      tags,
      notes,
    } = req.body;

    const message = await ScheduledMessage.create({
      user: req.user._id,
      recipient,
      subject,
      content,
      scheduledAt: new Date(scheduledAt),
      timezone,
      platform,
      isAiGenerated: isAiGenerated || false,
      aiPrompt,
      tags,
      notes,
      status: 'scheduled',
    });

    logger.info(`Message scheduled: ${message._id} by user ${req.user._id}`);

    res.status(201).json({
      message: 'Message scheduled successfully',
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/messages/:id
 * Update a scheduled message (only if still in 'scheduled' or 'draft' status)
 */
const updateMessage = async (req, res, next) => {
  try {
    const existing = await ScheduledMessage.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!existing) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    if (!['scheduled', 'draft'].includes(existing.status)) {
      return res.status(400).json({
        error: `Cannot edit a message with status '${existing.status}'.`,
      });
    }

    const allowedFields = [
      'recipient', 'subject', 'content', 'scheduledAt',
      'timezone', 'platform', 'tags', 'notes',
    ];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = field === 'scheduledAt' ? new Date(req.body[field]) : req.body[field];
      }
    });

    const updated = await ScheduledMessage.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    logger.info(`Message updated: ${req.params.id}`);

    res.json({
      message: 'Message updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/messages/:id
 * Cancel and delete a scheduled message
 */
const deleteMessage = async (req, res, next) => {
  try {
    const message = await ScheduledMessage.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    if (message.status === 'sent') {
      return res.status(400).json({ error: 'Cannot delete a message that has already been sent.' });
    }

    await ScheduledMessage.findByIdAndDelete(req.params.id);

    logger.info(`Message deleted: ${req.params.id}`);

    res.json({ message: 'Message deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/messages/:id/cancel
 * Cancel a scheduled message without deleting it
 */
const cancelMessage = async (req, res, next) => {
  try {
    const message = await ScheduledMessage.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    if (message.status !== 'scheduled') {
      return res.status(400).json({
        error: `Cannot cancel a message with status '${message.status}'.`,
      });
    }

    message.status = 'cancelled';
    await message.save();

    res.json({ message: 'Message cancelled.', data: message });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessages,
  getStats,
  getMessage,
  createMessage,
  updateMessage,
  deleteMessage,
  cancelMessage,
};
