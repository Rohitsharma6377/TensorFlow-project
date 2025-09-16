const express = require('express');
const { asyncHandler } = require('../utils/async');
const Escrow = require('../models/Escrow');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/v1/escrow/:orderId
router.get('/:orderId', auth(), asyncHandler(async (req, res) => {
  const escrow = await Escrow.findOne({ order: req.params.orderId });
  if (!escrow) return res.status(404).json({ success: false, message: 'Escrow not found' });
  res.json({ success: true, escrow });
}));

module.exports = router;
