const express = require('express');
const { body, validationResult } = require('express-validator');
const DeliveryPartner = require('../models/DeliveryPartner');
const auth = require('../middleware/auth');

const router = express.Router();

// Register delivery partner (admin)
router.post('/partners', auth(['admin', 'superadmin']), [body('name').isString()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  const dp = await DeliveryPartner.create({ name: req.body.name, apiKey: req.body.apiKey, settings: req.body.settings || {} });
  res.status(201).json({ success: true, partner: dp });
});

module.exports = router;
