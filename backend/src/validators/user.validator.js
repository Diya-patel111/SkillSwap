const { body } = require('express-validator');

/**
 * Validation rules for PUT /api/users/update
 *
 * All fields are optional — only provided fields are updated.
 * Array fields (skillsOffered, skillsWanted) may arrive either as:
 *   - JSON arrays (application/json)
 *   - JSON-encoded strings (multipart/form-data from FormData)
 */
exports.updateProfileValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage('Name must be between 2 and 60 characters'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be at most 500 characters'),

  body('university')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('University name must be at most 100 characters'),

  body('major')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Major must be at most 100 characters'),

  body('level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Level must be one of: beginner, intermediate, advanced'),

  // skillsOffered / skillsWanted: accept either an array or a JSON-encoded string
  body('skillsOffered')
    .optional()
    .customSanitizer(val => {
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return [val]; }
      }
      return val;
    })
    .isArray()
    .withMessage('skillsOffered must be an array'),

  body('skillsOffered.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 80 })
    .withMessage('Each skill must be between 1 and 80 characters'),

  body('skillsWanted')
    .optional()
    .customSanitizer(val => {
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return [val]; }
      }
      return val;
    })
    .isArray()
    .withMessage('skillsWanted must be an array'),

  body('skillsWanted.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 80 })
    .withMessage('Each skill must be between 1 and 80 characters'),
];
