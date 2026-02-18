const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const crypto         = require('crypto');
const User           = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email  = profile.emails?.[0]?.value;
        const avatar = profile.photos?.[0]?.value || '';

        // Try to find by googleId first; fall back to email match (account linking)
        let user = await User.findOne({
          $or: [{ googleId: profile.id }, { email }],
        });

        if (user) {
          // Link Google ID if not already linked
          if (!user.googleId) {
            user.googleId = profile.id;
            if (!user.avatar) user.avatar = avatar;
            await user.save({ validateBeforeSave: false });
          }
          return done(null, user);
        }

        // Create brand-new user from Google profile
        user = await User.create({
          name:     profile.displayName || 'SkillSwap User',
          email,
          googleId: profile.id,
          avatar,
          // Assign an unusable random password so schema minlength passes.
          // Google users will never use this password.
          password: crypto.randomBytes(40).toString('hex'),
        });

        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

// Stateless (JWT-based) — no session serialisation needed
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
