const express = require('express');
const Follow = require('../models/Follow');
const Like = require('../models/Like');
const auth = require('../middleware/auth');

const router = express.Router();

// Follow a shop
router.post('/follow/:shopId', auth(), async (req, res) => {
  await Follow.findOneAndUpdate({ follower: req.user.id, shop: req.params.shopId }, { follower: req.user.id, shop: req.params.shopId }, { upsert: true });
  res.json({ success: true });
});

// Unfollow a shop
router.delete('/follow/:shopId', auth(), async (req, res) => {
  await Follow.findOneAndDelete({ follower: req.user.id, shop: req.params.shopId });
  res.json({ success: true });
});

module.exports = router;
