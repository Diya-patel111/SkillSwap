const router = require('express').Router();
const ctrl   = require('../controllers/swaps.controller');
const { protect }      = require('../middleware/auth.middleware');
const { validate }     = require('../middleware/validate.middleware');
const { createSwapRules, updateStatusRules } = require('../validators/swap.validator');

// ── All swap routes require a valid JWT ───────────────────────────────────────
router.use(protect);

// ── Required endpoints ───────────────────────────────────────────────────────

// POST /api/swaps/request  — send a new swap request
router.post('/request',       createSwapRules, validate, ctrl.createRequest);

// GET  /api/swaps/my-requests — all requests where user is sender or receiver
//   Optional query params: ?status=pending|accepted|rejected|completed&role=sent|received
router.get('/my-requests',    ctrl.getMyRequests);

// PUT  /api/swaps/:id/status  — accept | reject | complete | cancel
router.put('/:id/status',     updateStatusRules, validate, ctrl.updateStatus);

// ── Bonus: dashboard stats ────────────────────────────────────────────────────
router.get('/stats',          ctrl.getStats);

module.exports = router;
