const mongoose = require('mongoose');

/**
 * A Review is left by one user for another after a completed swap.
 */
const reviewSchema = new mongoose.Schema(
  {
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    swapRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SwapRequest',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      default: '',
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    skillTaught: { type: String, default: '' },   // what the reviewee taught
  },
  { timestamps: true }
);

// One review per reviewer–reviewee pair per swap
reviewSchema.index({ reviewer: 1, swapRequest: 1 }, { unique: true });

// After a review is saved/removed, recalculate the reviewee's average rating
const recalcRating = async function (revieweeId) {
  const User = mongoose.model('User');
  const result = await mongoose.model('Review').aggregate([
    { $match: { reviewee: revieweeId } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const avg   = result.length ? Math.round(result[0].avgRating * 10) / 10 : 0;
  const count = result.length ? result[0].count : 0;
  await User.findByIdAndUpdate(revieweeId, { rating: avg, totalRatings: count });
};

reviewSchema.post('save', async function () {
  await recalcRating(this.reviewee);
});

reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) await recalcRating(doc.reviewee);
});

module.exports = mongoose.model('Review', reviewSchema);
