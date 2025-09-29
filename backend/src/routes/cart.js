const express = require('express');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../utils/async');
const ctrl = require('../controllers/cartController');

const router = express.Router();

// All cart endpoints require auth
router.get('/', auth(), ctrl.getCart);
router.post('/add', auth(), ctrl.addItem);
router.patch('/item/:id', auth(), ctrl.updateQty);
router.delete('/item/:id', auth(), ctrl.removeItem);
router.delete('/clear', auth(), ctrl.clear);
router.post('/apply-coupon', auth(), ctrl.applyCoupon);

module.exports = router;
