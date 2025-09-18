const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const Shop = require('../models/Shop');
const auth = require('../middleware/auth');
const { signToken, generateGuestToken } = require('../utils/jwt');
const Session = require('../models/Session');
const crypto = require('crypto');

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

// Helper to set HttpOnly auth cookie
function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  console.log('[setAuthCookie] Setting token cookie, isProd:', isProd);
  // Default sameSite to 'lax' for typical SPA flows
  const cookieOptions = {
    httpOnly: true,
    secure: isProd, // set true behind HTTPS
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
  
  // For development, ensure domain is not set to allow localhost
  if (!isProd) {
    // Don't set domain for localhost
    console.log('[setAuthCookie] Development mode - not setting domain');
  }
  
  res.cookie('token', token, cookieOptions);
  console.log('[setAuthCookie] Cookie set with options:', cookieOptions);
}

function clearAuthCookie(res) {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
  });
}

// Helper to create a Mongo session and set sid cookie
async function createSession(res, { userId, payload, days = 7 }) {
  const sid = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  console.log('[createSession] Creating session with sid:', sid, 'for user:', userId);
  await Session.create({ sid, user: userId || undefined, payload: payload || undefined, expiresAt });
  const isProd = process.env.NODE_ENV === 'production';
  console.log('[createSession] Setting sid cookie, isProd:', isProd);
  
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: days * 24 * 60 * 60 * 1000,
    path: '/',
  };
  
  res.cookie('sid', sid, cookieOptions);
  console.log('[createSession] SID cookie set with options:', cookieOptions);
}

async function deleteSession(req, res) {
  try {
    const sid = req.cookies && req.cookies.sid;
    if (sid) {
      await Session.deleteOne({ sid });
    }
  } catch {}
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('sid', { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/' });
}

// Generate guest user
router.post('/guest', async (req, res) => {
  try {
    const guestToken = generateGuestToken();
    // Set cookie for guest session
    setAuthCookie(res, guestToken);
    await createSession(res, { payload: { role: 'guest', isGuest: true }, days: 7 });
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
      
      // Set cookies for customer
      setAuthCookie(res, token);
      await createSession(res, { userId: user._id, days: 7 });
      
      // Set role cookie for Next.js middleware
      const isProd = process.env.NODE_ENV === 'production';
      res.cookie('role', user.role, {
        httpOnly: false, // Next.js middleware needs to read this
        secure: isProd,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
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

      // Set cookies for seller
      setAuthCookie(res, token);
      await createSession(res, { userId: user._id, days: 7 });
      
      // Set role cookie for Next.js middleware
      const isProd = process.env.NODE_ENV === 'production';
      res.cookie('role', user.role, {
        httpOnly: false, // Next.js middleware needs to read this
        secure: isProd,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
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
router.post('/login',
  [
    body('usernameOrEmail').notEmpty().withMessage('Username or email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    console.log('[Auth Route] POST /login called with:', { usernameOrEmail: req.body.usernameOrEmail });
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { usernameOrEmail, password } = req.body;
    
    try {
      const query = usernameOrEmail.includes('@')
        ? { email: usernameOrEmail.toLowerCase() }
        : { username: usernameOrEmail.toLowerCase() };

      const user = await User.findOne(query);
      if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });

      const token = signToken({ id: user._id, role: user.role, username: user.username });
      // Set cookies for login
      setAuthCookie(res, token);
      await createSession(res, { userId: user._id, days: 7 });
      
      // Set role cookie for Next.js middleware
      const isProd = process.env.NODE_ENV === 'production';
      res.cookie('role', user.role, {
        httpOnly: false, // Next.js middleware needs to read this
        secure: isProd,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });
      console.log('[Auth Route] Set role cookie:', user.role);
      
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
router.get('/me', auth.anyAuthenticated, async (req, res) => {
  console.log('[Auth Route] /me called, req.user:', req.user);
  
  // Disable caching for this endpoint
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    console.log('[Auth Route] User from DB:', user ? 'found' : 'not found');
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

    const responseData = {
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
    };
    
    console.log('[Auth Route] Sending response:', responseData);
    return res.status(200).json(responseData);
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


module.exports = router;

// Debug endpoint to check sessions (development only)
router.get('/debug/sessions', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  try {
    const sessions = await Session.find().limit(10).sort({ createdAt: -1 });
    return res.json({ success: true, sessions });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Debug endpoint to check cookies (development only)
router.get('/debug/cookies', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  console.log('[Debug] Request cookies:', req.cookies);
  console.log('[Debug] Request headers:', req.headers);
  return res.json({ 
    success: true, 
    cookies: req.cookies,
    headers: {
      cookie: req.headers.cookie,
      origin: req.headers.origin,
      referer: req.headers.referer
    }
  });
});

// Logout route to clear cookie
router.post('/logout', async (req, res) => {
  try {
    clearAuthCookie(res);
    await deleteSession(req, res);
    
    // Clear role cookie
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('role', { httpOnly: false, secure: isProd, sameSite: 'lax', path: '/' });
    
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to logout' });
  }
});
