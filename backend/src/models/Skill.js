const mongoose = require('mongoose');

/**
 * Skill catalogue entry.
 * title      – human-readable display name (required, unique)
 * category   – high-level topic bucket
 * level      – target proficiency (beginner / intermediate / advanced)
 * description– what the skill covers
 * createdBy  – User who submitted the entry
 * createdAt  – auto-set by timestamps: true
 */

const CATEGORIES = [
  'Coding', 'Languages', 'Music', 'Design',
  'Marketing', 'Writing', 'Mathematics', 'Science', 'Other',
];

const LEVELS = ['beginner', 'intermediate', 'advanced'];

const skillSchema = new mongoose.Schema(
  {
    // ── Core fields ──────────────────────────────────────────────────────
    title: {
      type:     String,
      required: [true, 'Skill title is required'],
      unique:   true,
      trim:     true,
      minlength: [2,  'Title must be at least 2 characters'],
      maxlength: [80, 'Title cannot exceed 80 characters'],
    },

    // URL-safe identifier derived from title on save
    slug: {
      type:      String,
      unique:    true,
      lowercase: true,
    },

    category: {
      type:     String,
      required: [true, 'Category is required'],
      enum:     { values: CATEGORIES, message: 'Invalid category' },
      default:  'Other',
    },

    level: {
      type:    String,
      enum:    { values: LEVELS, message: 'Level must be beginner, intermediate, or advanced' },
      default: 'beginner',
    },

    description: {
      type:     String,
      default:  '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    icon:       { type: String, default: 'school' },  // Material Symbols icon name
    isApproved: { type: Boolean, default: true },      // admin moderation flag

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
    },

    // Aggregated stats (updated via hooks/background jobs)
    teacherCount: { type: Number, default: 0 },
    learnerCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ── Slug generation ────────────────────────────────────────────────────────
skillSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  }
  next();
});

// ── Indexes ────────────────────────────────────────────────────────────────
// Full-text search across title and description
skillSchema.index({ title: 'text', description: 'text' });
// Compound filter index for the most common query pattern
skillSchema.index({ category: 1, level: 1, isApproved: 1 });

// Export constants so validators / controllers can re-use them
module.exports = mongoose.model('Skill', skillSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.LEVELS      = LEVELS;

