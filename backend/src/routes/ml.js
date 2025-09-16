const express = require('express');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../utils/async');
const path = require('path');

const router = express.Router();

// POST /api/v1/ml/refresh (admin) - trigger training stub
router.post('/refresh', auth(['admin','superadmin']), asyncHandler(async (req, res) => {
  // In real system, spawn a worker or queue a job
  // Here, just require the script to ensure embeddings dir
  require(path.join('..','ml','trainModel.js'));
  res.json({ success: true, message: 'ML refresh triggered' });
}));

module.exports = router;
