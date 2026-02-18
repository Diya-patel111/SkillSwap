const mongoose = require('mongoose');

/**
 * Message — a single chat message between two users.
 *
 * conversationId — composite key: sorted([senderId, receiverId]).join('_')
 *                  Makes it easy to query all messages in a thread.
 * senderId       — who sent it
 * receiverId     — who receives it
 * text           — message body
 * read           — has the receiver opened it?
 */
const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type:     String,
      required: true,
      index:    true,
    },
    senderId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    receiverId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    text: {
      type:      String,
      required:  [true, 'Message text is required'],
      trim:      true,
      maxlength: [1000, 'Message too long'],
    },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index to fetch a conversation thread ordered by time
messageSchema.index({ conversationId: 1, createdAt: 1 });
// Index to find unread messages for a user
messageSchema.index({ receiverId: 1, read: 1 });

module.exports = mongoose.model('Message', messageSchema);
