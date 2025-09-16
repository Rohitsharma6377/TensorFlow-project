const { recommendProductsForUser, similarProducts, recommendShopsForUser } = require('../ml/recommendService');

async function getRecommendedProducts(req, res, next) {
  try {
    const limit = parseInt(req.query.limit || '20', 10);
    const items = await recommendProductsForUser(req.user.id, limit);
    res.json({ success: true, items });
  } catch (err) {
    next(err);
  }
}

async function getSimilarProducts(req, res, next) {
  try {
    const limit = parseInt(req.query.limit || '12', 10);
    const items = await similarProducts(req.params.productId, limit);
    res.json({ success: true, items });
  } catch (err) {
    next(err);
  }
}

async function getRecommendedShops(req, res, next) {
  try {
    const limit = parseInt(req.query.limit || '10', 10);
    const shopIds = await recommendShopsForUser(req.user.id, limit);
    res.json({ success: true, shopIds });
  } catch (err) {
    next(err);
  }
}

module.exports = { getRecommendedProducts, getSimilarProducts, getRecommendedShops };
