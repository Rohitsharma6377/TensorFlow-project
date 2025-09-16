const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

const User = require('../models/User');
const auth = require('../middleware/auth');
const { signToken } = require('../utils/jwt');

const router = express.Router();

// POST /api/v1/auth/signup
router.post(
  '/signup',
  [
    body('username').isString().trim().isLength({ min: 3 }).withMessage('Username min 3 chars'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isString().isLength({ min: 6 }).withMessage('Password min 6 chars'),
    body('role').optional().isIn(['customer', 'seller', 'admin', 'superadmin', 'delivery']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

      const { username, email, password, role } = req.body;

      const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] });
      if (existing) return res.status(400).json({ success: false, message: 'User already exists' });

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({ username, email, passwordHash, role: role || 'customer' });

      const token = signToken({ id: user._id, role: user.role, username: user.username });
      return res.status(201).json({ success: true, token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
    } catch (err) {
      console.error('Signup error', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// POST /api/v1/auth/login
router.post(
  '/login',
  [
    body('usernameOrEmail').isString().withMessage('Username or email required'),
    body('password').isString().withMessage('Password required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

      const { usernameOrEmail, password } = req.body;
      const query = usernameOrEmail.includes('@')
        ? { email: usernameOrEmail.toLowerCase() }
        : { username: usernameOrEmail.toLowerCase() };

      const user = await User.findOne(query);
      if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });

      const token = signToken({ id: user._id, role: user.role, username: user.username });
      return res.json({ success: true, token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
    } catch (err) {
      console.error('Login error', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// GET /api/v1/auth/me
router.get('/me', auth(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, user });
  } catch (err) {
    console.error('Me error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
