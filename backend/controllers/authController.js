/**
 * Auth Controller
 * Handles signup, login, profile management
 */

const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * POST /api/auth/signup
 * Register a new user
 */
const signup = async (req, res, next) => {
  try {
    const { name, email, password, timezone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Create user (password hashed via pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
      timezone: timezone || 'UTC',
      notificationEmail: email,
    });

    const token = generateToken(user._id);

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Authenticate user and return JWT
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with password (select: false by default)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account has been deactivated.' });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    logger.info(`User logged in: ${email}`);

    res.json({
      message: 'Login successful',
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Get current authenticated user's profile
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user: user.toSafeObject() });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/auth/profile
 * Update user profile (name, timezone, notification settings)
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, timezone, notificationEmail, emailNotifications } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        ...(name && { name }),
        ...(timezone && { timezone }),
        ...(notificationEmail !== undefined && { notificationEmail }),
        ...(emailNotifications !== undefined && { emailNotifications }),
      },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/auth/change-password
 * Change user's password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, getMe, updateProfile, changePassword };
