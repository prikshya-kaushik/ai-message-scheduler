/**
 * Request Validation Middleware
 * Uses express-validator to validate incoming request bodies
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Run validations and return 400 if any fail
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── Auth Validators ───────────────────────────────────────────────────────────
const signupValidators = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),
  validate,
];

const loginValidators = [
  body('email')
    .trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email'),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validate,
];

// ─── Message Validators ────────────────────────────────────────────────────────
const messageValidators = [
  body('recipient.contact')
    .trim().notEmpty().withMessage('Recipient contact is required'),
  body('content')
    .trim().notEmpty().withMessage('Message content is required')
    .isLength({ max: 5000 }).withMessage('Content must not exceed 5000 characters'),
  body('scheduledAt')
    .notEmpty().withMessage('Scheduled time is required')
    .isISO8601().withMessage('Invalid date format — use ISO 8601')
    .custom(value => {
      if (new Date(value) <= new Date()) {
        throw new Error('Scheduled time must be in the future');
      }
      return true;
    }),
  body('timezone')
    .notEmpty().withMessage('Timezone is required'),
  body('platform')
    .notEmpty().withMessage('Platform is required')
    .isIn(['email', 'sms', 'whatsapp', 'slack', 'telegram', 'twitter'])
    .withMessage('Invalid platform'),
  validate,
];

const messageUpdateValidators = [
  body('content')
    .optional()
    .trim().notEmpty().withMessage('Content cannot be empty')
    .isLength({ max: 5000 }).withMessage('Content must not exceed 5000 characters'),
  body('scheduledAt')
    .optional()
    .isISO8601().withMessage('Invalid date format')
    .custom(value => {
      if (new Date(value) <= new Date()) throw new Error('Scheduled time must be in the future');
      return true;
    }),
  body('platform')
    .optional()
    .isIn(['email', 'sms', 'whatsapp', 'slack', 'telegram', 'twitter'])
    .withMessage('Invalid platform'),
  validate,
];

const idParamValidator = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  validate,
];

// ─── AI Validator ──────────────────────────────────────────────────────────────
const aiGenerateValidators = [
  body('prompt')
    .trim().notEmpty().withMessage('Prompt is required')
    .isLength({ min: 5, max: 500 }).withMessage('Prompt must be 5–500 characters'),
  body('platform')
    .optional()
    .isIn(['email', 'sms', 'whatsapp', 'slack', 'telegram', 'twitter']),
  validate,
];

module.exports = {
  signupValidators,
  loginValidators,
  messageValidators,
  messageUpdateValidators,
  idParamValidator,
  aiGenerateValidators,
};
