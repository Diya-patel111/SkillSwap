const Message  = require('../models/Message');
const User     = require('../models/User');
const mongoose = require('mongoose');

/** Build a stable conversation ID from two user IDs */
function convId(a, b) {
  return [a.toString(), b.toString()].sort().join('_');
}

// ─────────────────────────────────────────────────────────────────
// GET /api/messages/conversations
// Returns the list of users the logged-in user has chatted with,
// one entry per partner, with the latest message preview.
// ─────────────────────────────────────────────────────────────────
exports.getConversations = async (req, res, next) => {
  try {
    const me = req.user.id;

    // All messages where I'm sender or receiver
    const msgs = await Message.find({
      $or: [{ senderId: me }, { receiverId: me }],
    })
      .sort({ createdAt: -1 })
      .lean();

    // Deduplicate by partner — keep only the most recent message per partner
    const seen    = new Set();
    const threads = [];
    for (const m of msgs) {
      const partnerId = m.senderId.toString() === me
        ? m.receiverId.toString()
        : m.senderId.toString();
      if (!seen.has(partnerId)) {
        seen.add(partnerId);
        threads.push({ partnerId, lastMessage: m });
      }
    }

    // Fetch partner profiles
    const partnerIds  = threads.map(t => t.partnerId);
    const partners    = await User.find({ _id: { $in: partnerIds } })
      .select('name avatar university major')
      .lean();
    const partnerMap  = Object.fromEntries(partners.map(p => [p._id.toString(), p]));

    // Count unread per partner
    const unreadCounts = await Message.aggregate([
      { $match: { receiverId: new mongoose.Types.ObjectId(me), read: false } },
      { $group: { _id: '$senderId', count: { $sum: 1 } } },
    ]);
    const unreadMap = Object.fromEntries(
      unreadCounts.map(u => [u._id.toString(), u.count])
    );

    const result = threads.map(t => ({
      partnerId:   t.partnerId,
      partner:     partnerMap[t.partnerId] || null,
      lastMessage: {
        text:       t.lastMessage.text,
        createdAt:  t.lastMessage.createdAt,
        isMine:     t.lastMessage.senderId.toString() === me,
      },
      unread: unreadMap[t.partnerId] || 0,
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/messages/:partnerId
// Returns all messages in the thread between me and :partnerId,
// and marks unread messages as read.
// ─────────────────────────────────────────────────────────────────
exports.getThread = async (req, res, next) => {
  try {
    const me        = req.user.id;
    const partnerId = req.params.partnerId;

    if (!mongoose.isValidObjectId(partnerId)) {
      return res.status(400).json({ message: 'Invalid partner ID' });
    }

    const cid = convId(me, partnerId);

    // Mark messages sent to me as read
    await Message.updateMany(
      { conversationId: cid, receiverId: me, read: false },
      { read: true }
    );

    const messages = await Message.find({ conversationId: cid })
      .sort({ createdAt: 1 })
      .lean();

    // Also return partner info
    const partner = await User.findById(partnerId)
      .select('name avatar university major')
      .lean();

    res.json({ partner, messages });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────
// POST /api/messages/:partnerId
// Send a message to :partnerId.
// ─────────────────────────────────────────────────────────────────
exports.sendMessage = async (req, res, next) => {
  try {
    const me        = req.user.id;
    const partnerId = req.params.partnerId;
    const { text }  = req.body;

    if (!mongoose.isValidObjectId(partnerId)) {
      return res.status(400).json({ message: 'Invalid partner ID' });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const partnerExists = await User.exists({ _id: partnerId });
    if (!partnerExists) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    const msg = await Message.create({
      conversationId: convId(me, partnerId),
      senderId:   me,
      receiverId: partnerId,
      text:       text.trim(),
    });

    res.status(201).json(msg);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/messages/unread-count
// Total unread messages for the logged-in user.
// ─────────────────────────────────────────────────────────────────
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Message.countDocuments({
      receiverId: req.user.id,
      read:       false,
    });
    res.json({ count });
  } catch (err) {
    next(err);
  }
};
