const Notification = require('../models/Notification');

// GET /api/notifications?limit=20&page=1
exports.getNotifications = async (req, res, next) => {
  try {
    const uid   = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const page  = Math.max(parseInt(req.query.page)  || 1,  1);
    const skip  = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId: uid })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ userId: uid }),
      Notification.countDocuments({ userId: uid, isRead: false }),
    ]);

    res.json({ notifications, total, unreadCount, page, limit });
  } catch (err) { next(err); }
};

// GET /api/notifications/unread-count
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user.id, isRead: false });
    res.json({ count });
  } catch (err) { next(err); }
};

// PATCH /api/notifications/:id/read
exports.markRead = async (req, res, next) => {
  try {
    await Notification.updateOne(
      { _id: req.params.id, userId: req.user.id },
      { $set: { isRead: true } }
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
};

// PATCH /api/notifications/read-all
exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
};

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res, next) => {
  try {
    await Notification.deleteOne({ _id: req.params.id, userId: req.user.id });
    res.json({ ok: true });
  } catch (err) { next(err); }
};
