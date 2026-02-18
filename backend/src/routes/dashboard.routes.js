const router  = require('express').Router();
const ctrl    = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth.middleware');

// All dashboard routes require authentication
router.use(protect);

// GET /api/dashboard  — single aggregator
router.get('/', ctrl.getDashboard);

module.exports = router;
