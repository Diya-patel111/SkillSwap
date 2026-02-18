const router = require('express').Router();
const ctrl   = require('../controllers/notifications.controller');
const { protect } = require('../middleware/auth.middleware');

// All notification routes require authentication
router.use(protect);

// GET  /api/notifications              — paginated list + unreadCount
router.get('/',               ctrl.getNotifications);

// GET  /api/notifications/unread-count — quick badge count
router.get('/unread-count',   ctrl.getUnreadCount);

// PATCH /api/notifications/read-all   — mark every unread notification as read
router.patch('/read-all',     ctrl.markAllRead);

// PATCH /api/notifications/:id/read   — mark a single notification as read
router.patch('/:id/read',     ctrl.markRead);

// DELETE /api/notifications/:id       — delete a notification
router.delete('/:id',         ctrl.deleteNotification);

module.exports = router;
