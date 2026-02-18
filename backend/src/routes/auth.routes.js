const router     = require('express').Router();
const passport   = require('../config/passport');
const ctrl       = require('../controllers/auth.controller');
const oauthCtrl  = require('../controllers/oauth.controller');
const { protect }       = require('../middleware/auth.middleware');
const { validate }      = require('../middleware/validate.middleware');
const { registerRules, loginRules, refreshRules } = require('../validators/auth.validator');

// ── Email / password ──────────────────────────────────────────────────────
router.post('/register', registerRules, validate, ctrl.register);
router.post('/login',    loginRules,    validate, ctrl.login);
router.post('/refresh',  refreshRules,  validate, ctrl.refresh);

// ── Protected ──────────────────────────────────────────────────────────────
router.post('/logout', protect, ctrl.logout);
router.get('/me',      protect, ctrl.getMe);

// ── Google OAuth ───────────────────────────────────────────────────────────
// Step 1 – redirect browser to Google consent screen
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// Step 2 – Google redirects back here with an auth code
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session:         false,
    failureRedirect: `${process.env.CLIENT_ORIGIN || 'http://localhost:4200'}/auth/login?error=oauth_failed`,
  }),
  oauthCtrl.googleCallback
);

module.exports = router;
