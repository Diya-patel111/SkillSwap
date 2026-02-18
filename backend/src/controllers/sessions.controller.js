const Session     = require('../models/Session');
const SwapRequest = require('../models/SwapRequest');
const mongoose    = require('mongoose');
const { createNotification } = require('../utils/notifications');

const POPULATE_SWAP = [
  { path: 'senderId',   select: 'name avatar university' },
  { path: 'receiverId', select: 'name avatar university' },
];

const POPULATE_PARTICIPANTS = { path: 'participants', select: 'name avatar university' };

// ─────────────────────────────────────────────────────────────────
// POST /api/sessions
// Schedule a new session for an accepted swap.
// Body: { swapRequestId, title, scheduledAt, durationMins?, meetLink?, location?, notes? }
// ─────────────────────────────────────────────────────────────────
exports.createSession = async (req, res, next) => {
  try {
    const { swapRequestId, title, scheduledAt, durationMins, meetLink, location, notes } = req.body;
    const uid = req.user.id;

    if (!swapRequestId || !title || !scheduledAt) {
      return res.status(400).json({ message: 'swapRequestId, title and scheduledAt are required' });
    }

    if (isNaN(Date.parse(scheduledAt))) {
      return res.status(400).json({ message: 'scheduledAt must be a valid date' });
    }

    const swap = await SwapRequest.findById(swapRequestId);
    if (!swap) return res.status(404).json({ message: 'Swap request not found' });

    // Must be an accepted swap
    if (swap.status !== 'accepted' && swap.status !== 'completed') {
      return res.status(400).json({ message: 'Sessions can only be scheduled for accepted swaps' });
    }

    // Must be a participant
    const isParticipant =
      swap.senderId.toString()   === uid ||
      swap.receiverId.toString() === uid;
    if (!isParticipant) {
      return res.status(403).json({ message: 'You are not a participant in this swap' });
    }

    const session = await Session.create({
      swapRequestId,
      participants: [swap.senderId, swap.receiverId],
      title:        title.trim(),
      scheduledAt:  new Date(scheduledAt),
      durationMins: durationMins ?? 60,
      meetLink:     meetLink?.trim() ?? '',
      location:     location?.trim() ?? 'Online',
      notes:        notes?.trim()    ?? '',
    });

    await session.populate(POPULATE_PARTICIPANTS);

    // Notify the OTHER participant (fire-and-forget)
    const otherId = swap.senderId.toString() === uid
      ? swap.receiverId.toString()
      : swap.senderId.toString();

    createNotification({
      userId:  otherId,
      type:    'session_scheduled',
      title:   'Session Scheduled',
      message: `A session "${title.trim()}" has been scheduled. Check your sessions page.`,
      link:    '/sessions',
      refId:   session._id,
    });

    res.status(201).json({ session });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/sessions/my
// All sessions the logged-in user is a participant of.
// Optional ?status=scheduled|completed|cancelled
// Optional ?swapRequestId=<id>
// ─────────────────────────────────────────────────────────────────
exports.getMySessions = async (req, res, next) => {
  try {
    const uid    = req.user.id;
    const filter = { participants: uid };

    if (req.query.status)         filter.status         = req.query.status;
    if (req.query.swapRequestId)  filter.swapRequestId  = req.query.swapRequestId;

    const sessions = await Session.find(filter)
      .populate(POPULATE_PARTICIPANTS)
      .populate({ path: 'swapRequestId', populate: POPULATE_SWAP })
      .sort({ scheduledAt: 1 });

    res.json({ data: sessions, total: sessions.length });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/sessions/:id
// Single session detail (must be participant).
// ─────────────────────────────────────────────────────────────────
exports.getSession = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid session ID' });
    }

    const session = await Session.findById(req.params.id)
      .populate(POPULATE_PARTICIPANTS)
      .populate({ path: 'swapRequestId', populate: POPULATE_SWAP });

    if (!session) return res.status(404).json({ message: 'Session not found' });

    const isParticipant = session.participants.some(p => p._id.toString() === req.user.id);
    if (!isParticipant) return res.status(403).json({ message: 'Access denied' });

    res.json({ session });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────
// PATCH /api/sessions/:id
// Update title, scheduledAt, durationMins, meetLink, location, notes, status.
// Only participants may update; only the scheduler (creator) can reschedule.
// ─────────────────────────────────────────────────────────────────
exports.updateSession = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid session ID' });
    }

    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const isParticipant = session.participants.some(p => p.toString() === req.user.id);
    if (!isParticipant) return res.status(403).json({ message: 'Access denied' });

    const { title, scheduledAt, durationMins, meetLink, location, notes, status } = req.body;

    if (title)        session.title        = title.trim();
    if (scheduledAt)  session.scheduledAt  = new Date(scheduledAt);
    if (durationMins) session.durationMins = durationMins;
    if (meetLink !== undefined) session.meetLink  = meetLink.trim();
    if (location !== undefined) session.location  = location.trim();
    if (notes    !== undefined) session.notes      = notes.trim();

    if (status) {
      const allowed = ['scheduled', 'completed', 'cancelled'];
      if (!allowed.includes(status)) {
        return res.status(400).json({ message: `status must be one of: ${allowed.join(', ')}` });
      }
      session.status = status;
    }

    await session.save();
    await session.populate(POPULATE_PARTICIPANTS);
    await session.populate({ path: 'swapRequestId', populate: POPULATE_SWAP });

    res.json({ session });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────
// DELETE /api/sessions/:id
// Cancel (soft-delete by setting status=cancelled).
// ─────────────────────────────────────────────────────────────────
exports.cancelSession = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid session ID' });
    }

    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const isParticipant = session.participants.some(p => p.toString() === req.user.id);
    if (!isParticipant) return res.status(403).json({ message: 'Access denied' });

    session.status = 'cancelled';
    await session.save();

    res.json({ message: 'Session cancelled', session });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/sessions/upcoming-count
// Count of upcoming scheduled sessions for the logged-in user.
// ─────────────────────────────────────────────────────────────────
exports.getUpcomingCount = async (req, res, next) => {
  try {
    const count = await Session.countDocuments({
      participants: req.user.id,
      status:       'scheduled',
      scheduledAt:  { $gte: new Date() },
    });
    res.json({ count });
  } catch (err) {
    next(err);
  }
};
