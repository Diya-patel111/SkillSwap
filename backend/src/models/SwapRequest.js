const mongoose = require('mongoose');

/**
 * SwapRequest — one peer asking another to exchange skills.
 *
 * senderId      — User who initiates the swap (always the logged-in user at creation time)
 * receiverId    — User who receives the request
 * offeredSkill  — Skill the sender offers to teach
 * requestedSkill— Skill the sender wants to learn from the receiver
 * status        — Lifecycle: pending → accepted | rejected | completed
 * message       — Optional personal note from the sender
 * timestamps    — createdAt / updatedAt via Mongoose option
 */

const SWAP_STATUSES = ['pending', 'accepted', 'rejected', 'completed', 'cancelled'];

const swapRequestSchema = new mongoose.Schema(
  {
    senderId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Sender is required'],
    },
    receiverId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Receiver is required'],
    },
    offeredSkill: {
      type:     String,
      required: [true, 'Offered skill is required'],
      trim:     true,
      maxlength: [100, 'Offered skill name too long'],
    },
    requestedSkill: {
      type:     String,
      required: [true, 'Requested skill is required'],
      trim:     true,
      maxlength: [100, 'Requested skill name too long'],
    },
    message: { type: String, default: '', trim: true, maxlength: 500 },
    status: {
      type:    String,
      enum:    { values: SWAP_STATUSES, message: 'Invalid status value' },
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Indexes — most queries filter by senderId and/or receiverId
swapRequestSchema.index({ senderId: 1,   status: 1 });
swapRequestSchema.index({ receiverId: 1, status: 1 });
// Prevent duplicate pending requests between the same pair
swapRequestSchema.index(
  { senderId: 1, receiverId: 1, status: 1 },
  { unique: false }  // uniqueness enforced in controller logic
);

module.exports = mongoose.model('SwapRequest', swapRequestSchema);
module.exports.SWAP_STATUSES = SWAP_STATUSES;
