const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ── Shared token factory (mirrors auth.controller.js) ────────────────────
const signTokens = (userId) => {
  const access = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
  const refresh = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
  return { access, refresh };
};

const CLIENT_ORIGIN = () => process.env.CLIENT_ORIGIN || 'http://localhost:4200';

/**
 * GET /api/auth/google/callback
 * Called by Passport after Google authenticates the user.
 * Signs JWT tokens and redirects back to the Angular app.
 */
exports.googleCallback = async (req, res) => {
  try {
    const user = req.user;
    const { access, refresh } = signTokens(user._id);

    // Persist new refresh token (token rotation)
    await User.findByIdAndUpdate(user._id, { refreshToken: refresh }, { new: true });

    // Redirect to Angular callback handler with tokens in query params.
    // In production prefer httpOnly cookies; query params are fine for
    // a local dev / learning project.
    res.redirect(
      `${CLIENT_ORIGIN()}/auth/callback?token=${encodeURIComponent(access)}&refreshToken=${encodeURIComponent(refresh)}`
    );
  } catch (err) {
    console.error('[OAuth] googleCallback error:', err);
    res.redirect(`${CLIENT_ORIGIN()}/auth/login?error=oauth_failed`);
  }
};
