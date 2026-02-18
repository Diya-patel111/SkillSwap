const { body } = require('express-validator');
const Skill    = require('../models/Skill');

const { CATEGORIES, LEVELS } = Skill;

// ── POST /api/swaps/request ───────────────────────────────────────────────────
const createSwapRules = [
  body('receiverId')
    .notEmpty().withMessage('Receiver user ID is required')
    .isMongoId().withMessage('receiverId must be a valid Mongo ID'),

  body('offeredSkill')
    .trim()
    .notEmpty().withMessage('offeredSkill is required')
    .isLength({ max: 100 }).withMessage('offeredSkill cannot exceed 100 characters'),

  body('requestedSkill')
    .trim()
    .notEmpty().withMessage('requestedSkill is required')
    .isLength({ max: 100 }).withMessage('requestedSkill cannot exceed 100 characters'),

  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Message cannot exceed 500 characters'),
];

// ── PUT /api/swaps/:id/status ─────────────────────────────────────────────────
const updateStatusRules = [
  body('status')
    .notEmpty().withMessage('status is required')
    .isIn(['accepted', 'rejected', 'completed', 'cancelled'])
    .withMessage('status must be one of: accepted, rejected, completed, cancelled'),
];

// Keep legacy alias so any callers using proposeSwapRules still compile
const proposeSwapRules = createSwapRules;

const reviewRules = [
  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),

  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters'),

  body('swapRequestId')
    .notEmpty().withMessage('Swap request ID is required')
    .isMongoId().withMessage('Invalid swap request ID'),
];

const skillRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Skill title is required')
    .isLength({ min: 2, max: 80 }).withMessage('Title must be 2–80 characters'),

  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(CATEGORIES)
    .withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),

  body('level')
    .optional()
    .isIn(LEVELS)
    .withMessage(`Level must be one of: ${LEVELS.join(', ')}`),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
];

module.exports = { proposeSwapRules, createSwapRules, updateStatusRules, reviewRules, skillRules };

