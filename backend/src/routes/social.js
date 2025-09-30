const express = require('express');
const Follow = require('../models/Follow');
const Like = require('../models/Like');
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');
const Shop = require('../models/Shop');

const router = express.Router();

// Follow a shop
router.post('/follow/:shopId', auth(), async (req, res) => {
  await Follow.findOneAndUpdate({ follower: req.user.id, shop: req.params.shopId }, { follower: req.user.id, shop: req.params.shopId }, { upsert: true });
  try {
    const shop = await Shop.findById(req.params.shopId).select('ownerId');
    if (shop?.ownerId) {
      await Notification.create({ user: shop.ownerId, type: 'follow', actor: req.user.id, shop: req.params.shopId });
    }
  } catch {}
  res.json({ success: true });
});

// Unfollow a shop
router.delete('/follow/:shopId', auth(), async (req, res) => {
  await Follow.findOneAndDelete({ follower: req.user.id, shop: req.params.shopId });
  try {
    const shop = await Shop.findById(req.params.shopId).select('ownerId');
    if (shop?.ownerId) {
      await Notification.create({ user: shop.ownerId, type: 'unfollow', actor: req.user.id, shop: req.params.shopId });
    }
  } catch {}
  res.json({ success: true });
});

// List shops the current user follows
router.get('/following', auth(), async (req, res) => {
  const docs = await Follow.find({ follower: req.user.id }).select('shop').lean();
  const shopIds = docs.map(d => String(d.shop));
  res.json({ success: true, shops: shopIds });
});

module.exports = router;
