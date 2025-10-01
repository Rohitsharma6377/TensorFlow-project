const express = require('express');
const crypto = require('crypto');
const { body } = require('express-validator');
const { validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const DomainMap = require('../models/DomainMap');
const Shop = require('../models/Shop');

const router = express.Router();

// Claim a domain for a shop (seller)
router.post(
  '/claim',
  auth(['seller', 'admin', 'superadmin']),
  requireRole(['seller', 'admin', 'superadmin']),
  [body('domain').isString().isLength({ min: 4 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    try {
      const domain = String(req.body.domain).toLowerCase().trim();
      const shop = await Shop.findOne({ owner: req.user.id });
      if (!shop) return res.status(404).json({ success: false, message: 'No shop for user' });

      const token = crypto.randomBytes(8).toString('hex');
      const upsert = await DomainMap.findOneAndUpdate(
        { domain },
        { domain, shop: shop._id, status: 'pending', verificationToken: token },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      // Basic CNAME instruction (to be shown in UI)
      const instructions = {
        type: 'CNAME',
        host: `verify-${token}.${domain}`,
        value: process.env.APP_DOMAIN || 'your-app-domain.com',
        note: 'Create this CNAME record, then click verify in dashboard.'
      };

      res.json({ success: true, mapping: upsert, instructions });
    } catch (err) {
      console.error('Domain claim error', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// Resolve a host to shop slug (public)
router.get('/resolve', async (req, res) => {
  try {
    const host = String(req.query.host || '').toLowerCase();
    if (!host) return res.status(400).json({ success: false, message: 'host is required' });

    const map = await DomainMap.findOne({ domain: host, status: 'verified' }).populate('shop', 'slug');
    if (!map || !map.shop) return res.status(404).json({ success: false, message: 'Not mapped' });
    res.json({ success: true, slug: map.shop.slug });
  } catch (err) {
    console.error('Domain resolve error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Mark a domain as verified (admin)
router.post('/verify', auth(['admin', 'superadmin']), requireRole(['admin', 'superadmin']), [
  body('domain').isString(),
  body('token').isString()
], async (req, res) => {
  try {
    const { domain, token } = req.body;
    const map = await DomainMap.findOne({ domain: domain.toLowerCase().trim() });
    if (!map) return res.status(404).json({ success: false, message: 'Not found' });
    if (map.verificationToken !== token) return res.status(400).json({ success: false, message: 'Invalid token' });
    map.status = 'verified';
    await map.save();
    res.json({ success: true, mapping: map });
  } catch (err) {
    console.error('Domain verify error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
