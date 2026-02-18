const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/messages.controller');

const router = express.Router();

// All message routes require authentication
router.use(protect);

router.get('/unread-count',    ctrl.getUnreadCount);
router.get('/conversations',   ctrl.getConversations);
router.get('/:partnerId',      ctrl.getThread);
router.post('/:partnerId',     ctrl.sendMessage);

module.exports = router;
