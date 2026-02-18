const SwapRequest = require('../models/SwapRequest');
const Skill       = require('../models/Skill');
const User        = require('../models/User');

const POPULATE_SWAP = [
  { path: 'senderId',   select: 'name avatar university' },
  { path: 'receiverId', select: 'name avatar university' },
];

/**
 * GET /api/dashboard
 *
 * Single aggregator endpoint for the dashboard page.
 * Returns the following in one round-trip:
 *   stats             – counters for incoming, sent, active
 *   pendingRequests   – up to 5 latest pending received swap requests
 *   activeSwaps       – up to 5 latest accepted swaps involving the user
 *   recommendedSkills – up to 6 skills NOT already in user's skillsOffered
 *   recentActivity    – last 10 swap events for the user, shaped as activity items
 */
exports.getDashboard = async (req, res, next) => {
  try {
    const uid = req.user.id;

    // Fetch user's skillsWanted so we can find matching teachers
    const user = await User.findById(uid).select('skillsWanted').lean();
    const userSkillsWanted = user?.skillsWanted ?? [];

    // Fire all DB queries in parallel
    const [
      incomingPendingCount,
      sentCount,
      activeCount,
      pendingRequests,
      activeSwaps,
      recommendedUsers,
      recentActivity,
    ] = await Promise.all([

      // ── Stats ──────────────────────────────────────────────────────
      SwapRequest.countDocuments({ receiverId: uid, status: 'pending' }),
      SwapRequest.countDocuments({ senderId:   uid }),
      SwapRequest.countDocuments({
        $or:    [{ senderId: uid }, { receiverId: uid }],
        status: 'accepted',
      }),

      // ── Pending received requests (latest 5) ───────────────────────
      SwapRequest
        .find({ receiverId: uid, status: 'pending' })
        .populate(POPULATE_SWAP)
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      // ── Active swaps (latest 5) ─────────────────────────────────────
      SwapRequest
        .find({
          $or:    [{ senderId: uid }, { receiverId: uid }],
          status: 'accepted',
        })
        .populate(POPULATE_SWAP)
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean(),

      // ── Recommended users — people who teach what I want to learn ────
      User
        .find({
          _id:  { $ne: uid },
          name: { $exists: true, $nin: [null, ''] },
          ...(userSkillsWanted.length > 0
            ? { skillsOffered: { $elemMatch: { $in: userSkillsWanted } } }
            : { skillsOffered: { $exists: true, $not: { $size: 0 } } }
          ),
        })
        .select('name email university major skillsOffered skillsWanted rating totalSwaps avatar isOnline level')
        .sort({ rating: -1 })
        .limit(6)
        .lean(),

      // ── Recent activity feed — last 10 swaps for the user ───────────
      SwapRequest
        .find({ $or: [{ senderId: uid }, { receiverId: uid }] })
        .populate(POPULATE_SWAP)
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean(),
    ]);

    // Shape recentActivity into flat event objects
    const activity = recentActivity.map(swap => {
      const senderIdStr = swap.senderId?._id?.toString() ?? swap.senderId?.toString() ?? '';
      const isSender    = senderIdStr === uid;
      const partner     = isSender ? swap.receiverId : swap.senderId;

      return {
        _id:           swap._id,
        role:          isSender ? 'sent' : 'received',
        skill:         isSender ? swap.requestedSkill : swap.offeredSkill,
        partnerName:   partner?.name    ?? 'Unknown',
        partnerAvatar: partner?.avatar  ?? null,
        status:        swap.status,
        time:          swap.updatedAt,
      };
    });

    res.json({
      stats: {
        incomingRequests: incomingPendingCount,
        sentRequests:     sentCount,
        activeSwaps:      activeCount,
      },
      pendingRequests,
      activeSwaps,
      recommendedUsers: recommendedUsers.map(u => ({
        _id:        u._id,
        name:       u.name,
        email:      u.email,
        university: u.university,
        major:      u.major,
        teaches:    u.skillsOffered  ?? [],
        wants:      u.skillsWanted   ?? [],
        rating:     u.rating         ?? 0,
        totalSwaps: u.totalSwaps     ?? 0,
        avatar:     u.avatar,
        isOnline:   u.isOnline,
        level:      u.level,
      })),
      recentActivity: activity,
    });
  } catch (err) {
    next(err);
  }
};
