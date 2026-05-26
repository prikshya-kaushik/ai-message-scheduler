/**
 * History Controller
 * Provides message delivery history and analytics
 */

const ScheduledMessage = require('../models/ScheduledMessage');

/**
 * GET /api/history
 * Get sent/failed message history with pagination
 */
const getHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, platform, from, to } = req.query;

    const filter = {
      user: req.user._id,
      status: { $in: ['sent', 'failed', 'cancelled'] },
    };

    if (status && ['sent', 'failed', 'cancelled'].includes(status)) {
      filter.status = status;
    }
    if (platform) filter.platform = platform;
    if (from || to) {
      filter.scheduledAt = {};
      if (from) filter.scheduledAt.$gte = new Date(from);
      if (to) filter.scheduledAt.$lte = new Date(to);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [history, total] = await Promise.all([
      ScheduledMessage.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ScheduledMessage.countDocuments(filter),
    ]);

    res.json({
      history,
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
 * GET /api/history/analytics
 * Aggregated analytics for charts
 */
const getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Messages by day for the last 30 days
    const dailyStats = await ScheduledMessage.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    // Platform breakdown
    const platformStats = await ScheduledMessage.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$platform',
          total: { $sum: 1 },
          sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        },
      },
    ]);

    // Overall delivery rate
    const overallStats = await ScheduledMessage.aggregate([
      { $match: { user: userId, status: { $in: ['sent', 'failed'] } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
        },
      },
    ]);

    const deliveryRate = overallStats.length > 0
      ? ((overallStats[0].sent / overallStats[0].total) * 100).toFixed(1)
      : 0;

    res.json({ dailyStats, platformStats, deliveryRate: parseFloat(deliveryRate) });
  } catch (error) {
    next(error);
  }
};

module.exports = { getHistory, getAnalytics };
