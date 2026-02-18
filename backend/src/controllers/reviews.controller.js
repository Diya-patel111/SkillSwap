const Review    = require('../models/Review');
const SwapRequest = require('../models/SwapRequest');

// POST /api/reviews  ─── leave a review after a completed swap
exports.createReview = async (req, res, next) => {
  try {
    const { swapRequestId, rating, comment } = req.body;

    // Confirm the swap exists and belongs to the current user
    const swap = await SwapRequest.findById(swapRequestId);
    if (!swap) return res.status(404).json({ message: 'Swap request not found' });

    const isParticipant =
      swap.senderId.toString() === req.user.id ||
      swap.receiverId.toString() === req.user.id;
    if (!isParticipant) {
      return res.status(403).json({ message: 'You are not a participant in this swap' });
    }
    if (swap.status !== 'accepted' && swap.status !== 'completed') {
      return res.status(400).json({ message: 'You can only review accepted or completed swaps' });
    }

    // The reviewee is the other participant
    const revieweeId =
      swap.senderId.toString() === req.user.id
        ? swap.receiverId
        : swap.senderId;

    const review = await Review.create({
      reviewer:    req.user.id,
      reviewee:    revieweeId,
      swapRequest: swapRequestId,
      rating,
      comment,
      skillTaught: swap.senderId.toString() === req.user.id ? swap.requestedSkill : swap.offeredSkill,
    });

    const populated = await review.populate([
      { path: 'reviewer', select: 'name avatar' },
      { path: 'reviewee', select: 'name avatar' },
    ]);

    // Mark swap as completed after both parties review (optional simple logic)
    await SwapRequest.findByIdAndUpdate(swapRequestId, { status: 'completed' });

    res.status(201).json({ review: populated });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'You have already reviewed this swap' });
    }
    next(err);
  }
};

// GET /api/reviews/user/:userId  ─── all reviews for a user
exports.getReviewsForUser = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const [reviews, total] = await Promise.all([
      Review.find({ reviewee: req.params.userId })
        .populate('reviewer', 'name avatar university')
        .sort({ createdAt: -1 })
        .skip((+page - 1) * +limit)
        .limit(+limit)
        .lean(),
      Review.countDocuments({ reviewee: req.params.userId }),
    ]);

    // Summary stats
    const stats = await Review.aggregate([
      { $match: { reviewee: require('mongoose').Types.ObjectId.createFromHexString(req.params.userId) } },
      {
        $group: {
          _id: null,
          avg: { $avg: '$rating' },
          count: { $sum: 1 },
          dist: {
            $push: '$rating',
          },
        },
      },
    ]);

    const summary = stats[0]
      ? {
          average: Math.round(stats[0].avg * 10) / 10,
          total: stats[0].count,
          distribution: [5, 4, 3, 2, 1].map(star => ({
            star,
            count: stats[0].dist.filter(r => r === star).length,
          })),
        }
      : { average: 0, total: 0, distribution: [] };

    res.json({
      reviews,
      total,
      page: +page,
      pages: Math.ceil(total / +limit),
      summary,
    });
  } catch (err) { next(err); }
};

// GET /api/reviews/me  ─── reviews received by the current user
exports.getMyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ reviewee: req.user.id })
      .populate('reviewer', 'name avatar university')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ reviews });
  } catch (err) { next(err); }
};

// DELETE /api/reviews/:id  ─── only the reviewer can delete their own review
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findOneAndDelete({ _id: req.params.id, reviewer: req.user.id });
    if (!review) return res.status(404).json({ message: 'Review not found or not yours' });
    res.status(204).send();
  } catch (err) { next(err); }
};
