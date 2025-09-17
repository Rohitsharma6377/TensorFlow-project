const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const Shop = require('../models/Shop');
const auth = require('../middleware/auth');
const { signToken, generateGuestToken } = require('../utils/jwt');

// Role-based access control middleware
const requireRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
};

const router = express.Router();

// Generate guest user
router.post('/guest', async (req, res) => {
  try {
    const guestToken = generateGuestToken();
    return res.status(200).json({ 
      success: true, 
      token: guestToken,
      user: { 
        id: 'guest-' + Date.now(),
        role: 'guest',
        isGuest: true 
      } 
    });
  } catch (err) {
    console.error('Guest login error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/v1/auth/register/customer
router.post(
  '/register/customer',
  [
    body('username').isString().trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isString().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

      const { username, email, password } = req.body;

      const existing = await User.findOne({ $or: [
        { email: email.toLowerCase() }, 
        { username: username.toLowerCase() }
      ]});
      
      if (existing) {
        return res.status(400).json({ 
          success: false, 
          message: 'User with this email or username already exists' 
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({ 
        username: username.toLowerCase(), 
        email: email.toLowerCase(), 
        passwordHash, 
        role: 'customer',
        isVerified: false
      });

      const token = signToken({ 
        id: user._id, 
        role: user.role, 
        username: user.username 
      });
      
      return res.status(201).json({ 
        success: true, 
        token, 
        user: { 
          id: user._id, 
          username: user.username, 
          email: user.email, 
          role: user.role,
          isVerified: user.isVerified
        } 
      });
    } catch (err) {
      console.error('Customer registration error:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error creating customer account',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
);

// POST /api/v1/auth/register/seller
router.post(
  '/register/seller',
  [
    body('username').isString().trim().isLength({ min: 3 }),
    body('email').isEmail(),
    body('password').isString().isLength({ min: 8 }),
    body('shopName').isString().trim().notEmpty(),
    body('phone').isString().trim().notEmpty(),
    body('address').isObject(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { username, email, password, shopName, phone, address } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ 
        $or: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() }
        ]
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email or username already exists'
        });
      }

      // Create seller user
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        passwordHash,
        role: 'seller',
        isVerified: false,
        profile: {
          phone,
          address
        }
      });

      // Create shop for seller
      const shop = new Shop({
        name: shopName,
        owner: user._id,
        contact: { email, phone },
        address,
        isActive: false // Requires admin approval
      });
      
      await shop.save();

      const token = signToken({
        id: user._id,
        role: user.role,
        username: user.username,
        shopId: shop._id
      });

      return res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          shop: {
            id: shop._id,
            name: shop.name,
            isActive: shop.isActive
          }
        }
      });
    } catch (err) {
      console.error('Seller registration error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error creating seller account',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
);

// POST /api/v1/auth/login
router.post(
  '/login',
  [
    body('usernameOrEmail').isString().withMessage('Username or email is required'),
    body('password').isString().withMessage('Password is required'),
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
      console.error('Login error:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error during login',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
);

// GET /api/v1/auth/me - Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let shopInfo = null;
    if (user.role === 'seller') {
      const shop = await Shop.findOne({ owner: user._id });
      if (shop) {
        shopInfo = {
          id: shop._id,
          name: shop.name,
          isActive: shop.isActive
        };
      }
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        profile: user.profile,
        ...(shopInfo && { shop: shopInfo })
      }
    });
  } catch (err) {
    console.error('Get user error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error fetching user data'
    });
  }
});

// POST /api/v1/auth/refresh-token
router.post('/refresh-token', (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token is required'
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const token = signToken({
      id: decoded.id,
      role: decoded.role,
      username: decoded.username
    });

    return res.status(200).json({
      success: true,
      token
    });
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

// GET /api/v1/auth/me
router.get('/me', auth, async (req, res) => {
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
