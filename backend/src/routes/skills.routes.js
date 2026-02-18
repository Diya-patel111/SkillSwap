const router = require('express').Router();
const ctrl    = require('../controllers/skills.controller');
const { protect }    = require('../middleware/auth.middleware');
const { validate }   = require('../middleware/validate.middleware');
const { skillRules } = require('../validators/swap.validator');

// ── Public routes ─────────────────────────────────────────────────────────────

// GET /api/skills?search=&category=&level=&page=&limit=
router.get('/',           ctrl.getSkills);

// GET /api/skills/categories  — distinct category list with level enum
// NOTE: must be declared BEFORE /:id to avoid being swallowed by the wildcard
router.get('/categories', ctrl.getCategories);

// GET /api/skills/:id
router.get('/:id',        ctrl.getSkillById);

// ── Protected routes (JWT required) ──────────────────────────────────────────

// POST /api/skills
router.post('/',          protect, skillRules, validate, ctrl.createSkill);

// DELETE /api/skills/:id  — creator-only (enforced inside controller)
router.delete('/:id',     protect, ctrl.deleteSkill);

module.exports = router;

