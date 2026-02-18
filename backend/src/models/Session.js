const mongoose = require('mongoose');

/**
 * Session — a scheduled learning session tied to an accepted swap.
 *
 * swapRequestId — the accepted SwapRequest this session belongs to
 * participants  — both user IDs (sender + receiver of the swap)
 * title         — short description e.g. "React basics with Aarav"
 * scheduledAt   — ISO date/time of the session
 * durationMins  — length in minutes (default 60)
 * meetLink      — Google Meet / Zoom / any URL (optional)
 * location      — physical location or "Online" (optional)
 * notes         — agenda / prep notes
 * status        — scheduled → completed | cancelled
 */
const SESSION_STATUSES = ['scheduled', 'completed', 'cancelled'];

const sessionSchema = new mongoose.Schema(
  {
    swapRequestId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'SwapRequest',
      required: [true, 'swapRequestId is required'],
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'User',
      },
    ],
    title: {
      type:      String,
      required:  [true, 'Session title is required'],
      trim:      true,
      maxlength: [200, 'Title too long'],
    },
    scheduledAt: {
      type:     Date,
      required: [true, 'scheduledAt is required'],
    },
    durationMins: {
      type:    Number,
      default: 60,
      min:     [15,  'Minimum 15 minutes'],
      max:     [480, 'Maximum 8 hours'],
    },
    meetLink: {
      type:    String,
      trim:    true,
      default: '',
    },
    location: {
      type:    String,
      trim:    true,
      default: 'Online',
    },
    notes: {
      type:      String,
      trim:      true,
      default:   '',
      maxlength: [1000, 'Notes too long'],
    },
    status: {
      type:    String,
      enum:    { values: SESSION_STATUSES, message: 'Invalid status' },
      default: 'scheduled',
    },
  },
  { timestamps: true }
);

// Fast lookup by swap or by participant
sessionSchema.index({ swapRequestId: 1 });
sessionSchema.index({ participants: 1, scheduledAt: 1 });

module.exports = mongoose.model('Session', sessionSchema);
