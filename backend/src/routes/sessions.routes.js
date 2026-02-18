const express   = require('express');
const { protect } = require('../middleware/auth.middleware');
const ctrl        = require('../controllers/sessions.controller');

const router = express.Router();
router.use(protect);

router.get('/upcoming-count', ctrl.getUpcomingCount);
router.get('/my',             ctrl.getMySessions);
router.get('/:id',            ctrl.getSession);
router.post('/',              ctrl.createSession);
router.patch('/:id',          ctrl.updateSession);
router.delete('/:id',         ctrl.cancelSession);

module.exports = router;
