const SwapRequest = require('../models/SwapRequest');
const { createNotification } = require('../utils/notifications');

const POPULATE_OPTS = [
  { path: 'senderId',   select: 'name avatar university' },
  { path: 'receiverId', select: 'name avatar university' },
];

// ── POST /api/swaps/request ───────────────────────────────────────────────────
// Body: { receiverId, offeredSkill, requestedSkill, message? }
// Creates a new swap request from the authenticated user to another user.
// Returns 409 if a pending request already exists between the same pair.
exports.createRequest = async (req, res, next) => {
  try {
    const { receiverId, offeredSkill, requestedSkill, message } = req.body;

    // Self-swap guard
    if (receiverId === req.user.id) {
      return res.status(400).json({ message: 'You cannot send a swap request to yourself' });
    }

    // Duplicate-pending guard
    const existing = await SwapRequest.findOne({
      senderId:   req.user.id,
      receiverId,
      status:     'pending',
    });
    if (existing) {
      return res.status(409).json({
        message: 'You already have a pending swap request with this user',
        swapId:  existing._id,
      });
    }

    const swap = await SwapRequest.create({
      senderId:       req.user.id,
      receiverId,
      offeredSkill,
      requestedSkill,
      message: message?.trim() || '',
    });

    await swap.populate(POPULATE_OPTS);

    // Notify the receiver about the new swap request (fire-and-forget)
    createNotification({
      userId:  receiverId,
      type:    'swap_request',
      title:   'New Swap Request',
      message: `Someone wants to swap "${offeredSkill}" for "${requestedSkill}"`,
      link:    '/swaps',
      refId:   swap._id,
    });

    res.status(201).json({ swap });
  } catch (err) { next(err); }
};

// ── GET /api/swaps/my-requests ────────────────────────────────────────────────
// Returns all swap requests where the authenticated user is the sender OR receiver.
// Supports ?status= filter and ?role=sent|received.
exports.getMyRequests = async (req, res, next) => {
  try {
    const { status, role } = req.query;
    const uid = req.user.id;

    let filter;
    if (role === 'sent') {
      filter = { senderId: uid };
    } else if (role === 'received') {
      filter = { receiverId: uid };
    } else {
      filter = { $or: [{ senderId: uid }, { receiverId: uid }] };
    }

    if (status) filter.status = status;

    const swaps = await SwapRequest.find(filter)
      .populate(POPULATE_OPTS)
      .sort({ createdAt: -1 });

    // Group for convenience
    // Use optional chaining on senderId/receiverId in case a referenced user was deleted (null after populate)
    const sent     = swaps.filter(s => s.senderId?._id?.toString() === uid || s.senderId?.toString() === uid);
    const received = swaps.filter(s => s.receiverId?._id?.toString() === uid || s.receiverId?.toString() === uid);

    res.json({
      data:  swaps,
      sent,
      received,
      total: swaps.length,
    });
  } catch (err) { next(err); }
};

// ── PUT /api/swaps/:id/status ─────────────────────────────────────────────────
// Body: { status: 'accepted' | 'rejected' | 'completed' | 'cancelled' }
// Rules:
//   accepted / rejected — only the RECEIVER may set (while pending)
//   completed          — either party may set (while accepted)
//   cancelled          — only the SENDER may set (while pending)
exports.updateStatus = async (req, res, next) => {
  try {
    const newStatus = req.body.status;
    const uid       = req.user.id;

    const allowed = ['accepted', 'rejected', 'completed', 'cancelled'];
    if (!allowed.includes(newStatus)) {
      return res.status(400).json({
        message: `status must be one of: ${allowed.join(', ')}`,
      });
    }

    const swap = await SwapRequest.findById(req.params.id);
    if (!swap) return res.status(404).json({ message: 'Swap request not found' });

    const isSender   = swap.senderId.toString()   === uid;
    const isReceiver = swap.receiverId.toString() === uid;

    if (!isSender && !isReceiver) {
      return res.status(403).json({ message: 'You are not a participant in this swap' });
    }

    // Permission matrix
    const permError = checkPermission({ swap, newStatus, isSender, isReceiver });
    if (permError) return res.status(403).json({ message: permError });

    swap.status = newStatus;
    await swap.save();
    await swap.populate(POPULATE_OPTS);

    // Notify the original sender when their request is accepted or rejected
    if (newStatus === 'accepted') {
      createNotification({
        userId:  swap.senderId.toString(),
        type:    'swap_accepted',
        title:   'Swap Request Accepted',
        message: `Your swap request for "${swap.requestedSkill}" was accepted!`,
        link:    '/swaps',
        refId:   swap._id,
      });
    } else if (newStatus === 'rejected') {
      createNotification({
        userId:  swap.senderId.toString(),
        type:    'swap_rejected',
        title:   'Swap Request Declined',
        message: `Your swap request for "${swap.requestedSkill}" was declined.`,
        link:    '/swaps',
        refId:   swap._id,
      });
    }

    res.json({ swap });
  } catch (err) { next(err); }
};

/** Returns an error string if the transition is not allowed, undefined otherwise. */
function checkPermission({ swap, newStatus, isSender, isReceiver }) {
  const { status } = swap;

  if (newStatus === 'accepted' || newStatus === 'rejected') {
    if (!isReceiver)         return 'Only the receiver can accept or reject a request';
    if (status !== 'pending') return `Cannot ${newStatus} a request that is already '${status}'`;
  }
  if (newStatus === 'cancelled') {
    if (!isSender)           return 'Only the sender can cancel their request';
    if (status !== 'pending') return `Cannot cancel a request that is already '${status}'`;
  }
  if (newStatus === 'completed') {
    if (status !== 'accepted') return "Cannot mark as completed unless the swap has been accepted";
  }
}

// ── GET /api/swaps/stats  (dashboard helper) ──────────────────────────────────
exports.getStats = async (req, res, next) => {
  try {
    const uid = req.user.id;
    const [incomingPending, sent, active] = await Promise.all([
      SwapRequest.countDocuments({ receiverId: uid, status: 'pending' }),
      SwapRequest.countDocuments({ senderId:   uid }),
      SwapRequest.countDocuments({
        $or: [{ senderId: uid }, { receiverId: uid }],
        status: 'accepted',
      }),
    ]);
    res.json({ incomingRequests: incomingPending, sentRequests: sent, activeSwaps: active });
  } catch (err) { next(err); }
};
