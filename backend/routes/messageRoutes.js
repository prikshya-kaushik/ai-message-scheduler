const express = require('express');
const router = express.Router();
const {
  getMessages, getStats, getMessage,
  createMessage, updateMessage, deleteMessage, cancelMessage,
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { messageValidators, messageUpdateValidators, idParamValidator } = require('../middleware/validation');

// All routes require authentication
router.use(protect);

router.get('/', getMessages);
router.get('/stats', getStats);
router.get('/:id', idParamValidator, getMessage);
router.post('/', messageValidators, createMessage);
router.put('/:id', idParamValidator, messageUpdateValidators, updateMessage);
router.delete('/:id', idParamValidator, deleteMessage);
router.patch('/:id/cancel', idParamValidator, cancelMessage);

module.exports = router;
