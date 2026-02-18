const router = require('express').Router();
const ctrl   = require('../controllers/users.controller');
const { protect, optionalAuth } = require('../middleware/auth.middleware');
const { handleUpload } = require('../middleware/upload.middleware');
const { updateProfileValidator } = require('../validators/user.validator');
const { validate } = require('../middleware/validate.middleware');

// ── Authenticated profile endpoints (MUST come before /:id wildcard) ──────────

// GET /api/users/me  — return full profile of the logged-in user
router.get('/me',             protect, ctrl.getMyProfile);

// PUT /api/users/update  — update profile fields + optional profileImage upload
router.put('/update',         protect, handleUpload, updateProfileValidator, validate, ctrl.updateProfile);

// PATCH /api/users/me  — legacy field-update (kept for backward compat)
router.patch('/me',           protect, ctrl.updateMyProfile);

// GET /api/users/me/matches  — suggested skill matches
router.get('/me/matches',     protect, ctrl.getSuggestedMatches);

// ── Public routes ─────────────────────────────────────────────────────────────
router.get('/',               optionalAuth, ctrl.getStudents);
router.get('/:id',            ctrl.getStudentById);

module.exports = router;
