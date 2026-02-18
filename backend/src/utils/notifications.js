const Notification = require('../models/Notification');

/**
 * Utility — call this from any controller to persist a notification.
 * Safe to call fire-and-forget (non-awaited) if you don't need to block.
 *
 * @param {{ userId, type, title, message, link?, refId? }} payload
 */
async function createNotification(payload) {
  try {
    await Notification.create(payload);
  } catch {
    // Notifications are non-critical — swallow errors silently
  }
}

module.exports = { createNotification };
