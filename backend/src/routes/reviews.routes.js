const router = require('express').Router();
const ctrl   = require('../controllers/reviews.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { reviewRules } = require('../validators/swap.validator');

// All review routes require authentication
router.use(protect);

router.post('/',                     reviewRules, validate, ctrl.createReview);
router.get('/me',                    ctrl.getMyReviews);
router.get('/user/:userId',          ctrl.getReviewsForUser);
router.delete('/:id',                ctrl.deleteReview);

module.exports = router;
