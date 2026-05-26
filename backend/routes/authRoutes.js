const express = require('express');
const router = express.Router();
const { signup, login, getMe, updateProfile, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { signupValidators, loginValidators } = require('../middleware/validation');

router.post('/signup', signupValidators, signup);
router.post('/login', loginValidators, login);
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfile);
router.patch('/change-password', protect, changePassword);

module.exports = router;
