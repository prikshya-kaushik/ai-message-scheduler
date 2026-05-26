// historyRoutes.js
const express = require('express');
const router = express.Router();
const { getHistory, getAnalytics } = require('../controllers/historyController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getHistory);
router.get('/analytics', getAnalytics);

module.exports = router;
