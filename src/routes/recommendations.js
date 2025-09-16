const express = require('express');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../utils/async');
const { getRecommendedProducts, getSimilarProducts, getRecommendedShops } = require('../controllers/recommendationController');

const router = express.Router();

router.get('/products', auth(), asyncHandler(getRecommendedProducts));
router.get('/products/:productId/similar', auth(), asyncHandler(getSimilarProducts));
router.get('/shops', auth(), asyncHandler(getRecommendedShops));

module.exports = router;
