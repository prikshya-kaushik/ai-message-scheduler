// aiRoutes.js
const express = require('express');
const router = express.Router();
const { generateMessage, getPromptSuggestions } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const { aiGenerateValidators } = require('../middleware/validation');

router.use(protect);
router.post('/generate', aiGenerateValidators, generateMessage);
router.get('/suggestions', getPromptSuggestions);

module.exports = router;
