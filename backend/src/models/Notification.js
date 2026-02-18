const mongoose = require('mongoose');

const NOTIF_TYPES = [
  'swap_request',    // someone sent you a swap request
  'swap_accepted',   // your swap request was accepted
  'swap_rejected',   // your swap request was rejected
  'session_scheduled', // a session was scheduled for your swap
  'session_reminder',  // reminder on session day
  'review_received', // someone left you a review
];

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    type: {
      type:    String,
      enum:    NOTIF_TYPES,
      required: true,
    },
    title:   { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 300 },
    link:    { type: String, default: '' },   // relative frontend route e.g. /swaps
    isRead:  { type: Boolean, default: false },
    /** Optional ref to the related entity */
    refId:   { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
module.exports.NOTIF_TYPES = NOTIF_TYPES;
