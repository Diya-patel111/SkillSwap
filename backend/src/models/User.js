const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name:          { type: String, required: true, trim: true },
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:      { type: String, minlength: 8, select: false },
    university:    { type: String, default: '' },
    major:         { type: String, default: '' },
    bio:           { type: String, default: '' },
    avatar:        { type: String, default: '' },
    skillsOffered: [{ type: String }],
    skillsWanted:  [{ type: String }],
    level:         { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    rating:        { type: Number, default: 0, min: 0, max: 5 },
    totalRatings:  { type: Number, default: 0 },
    totalSwaps:    { type: Number, default: 0 },
    isOnline:      { type: Boolean, default: false },
    googleId:      { type: String, default: null },
    refreshToken:  { type: String, select: false },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare plain-text password with hash
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Omit password & refreshToken from JSON by default
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.refreshToken;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
