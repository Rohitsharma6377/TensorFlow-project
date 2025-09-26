const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const Session = require('../models/Session');

/**
 * Authentication middleware with role-based access control
 * @param {Array} allowedRoles - Array of roles allowed to access the route
 * @param {Object} options - Additional options
 * @param {Boolean} options.allowGuest - Whether to allow guest users (default: false)
 * @param {Boolean} options.requireVerified - Whether to require email verification (default: false)
 * @returns {Function} Express middleware function
 */
function auth(allowedRoles = [], options = {}) {
  const { allowGuest = false, requireVerified = false } = options;

  return async function (req, res, next) {
    try {
      console.log('[Auth] Request cookies:', req.cookies);
      console.log('[Auth] Request headers:', req.headers.authorization);
  
      // Extract token from Authorization header or cookie fallback
      const authHeader = req.headers.authorization || '';
      let token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (!token && req.cookies && req.cookies.token) {
        token = req.cookies.token;
        console.log('[Auth] Using token from cookie');
      }
      let sid = req.cookies && req.cookies.sid ? req.cookies.sid : null;
      console.log('[Auth] Extracted token:', token ? 'present' : 'none', 'sid:', sid ? 'present' : 'none');
      
      if (!token && !sid) {
        if (allowGuest) {
          req.user = { role: 'guest', isGuest: true };
          return next();
        }
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      // Prefer JWT if present, else fallback to session cookie
      let payload;
      if (token) {
        console.log('[Auth] Verifying JWT token...');
        try {
          payload = verifyToken(token);
          console.log('[Auth] JWT verified successfully, payload:', payload);
        } catch (err) {
          console.log('[Auth] JWT verification failed:', err.message);
          // If JWT invalid, try session cookie if available
          if (!sid) {
            return res.status(401).json({ 
              success: false, 
              message: err.message || 'Invalid or expired token' 
            });
          }
        }
      }

      if (!payload && sid) {
        console.log('[Auth] Checking session with sid:', sid);
        try {
          const session = await Session.findOne({ sid });
          console.log('[Auth] Session found:', session ? 'yes' : 'no');
          if (!session || !session.expiresAt || session.expiresAt.getTime() < Date.now()) {
            console.log('[Auth] Session expired or not found');
            return res.status(401).json({ success: false, message: 'Session expired' });
          }
          console.log('[Auth] Session valid, extending expiry');
          // Rolling session: extend expiry 7 days
          session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          await session.save();

          if (session.user) {
            const user = await User.findById(session.user).select('-passwordHash');
            if (!user) return res.status(401).json({ success: false, message: 'User not found' });
            req.user = {
              id: String(user._id),
              username: user.username,
              email: user.email,
              role: user.role,
              isVerified: user.isVerified,
              profile: user.profile,
              ...(user.role === 'seller' && { shop: user.shop })
            };
            return next();
          }
          // Guest or custom payload session
          if (session.payload) {
            req.user = session.payload;
            return next();
          }
          return res.status(401).json({ success: false, message: 'Invalid session' });
        } catch (e) {
          return res.status(500).json({ success: false, message: 'Session error' });
        }
      }

      // For guest tokens, check if guests are allowed
      if (payload.isGuest) {
        if (!allowGuest) {
          return res.status(403).json({ 
            success: false, 
            message: 'Guest access not allowed' 
          });
        }
        req.user = payload;
        return next();
      }

      // For regular users, verify the user exists and is not banned
      console.log('[Auth] Looking up user with ID:', payload.id);
      const user = await User.findById(payload.id).select('-passwordHash');
      console.log('[Auth] User lookup result:', user ? 'found' : 'not found');
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      if (user.isBanned) {
        return res.status(403).json({ 
          success: false, 
          message: 'This account has been suspended' 
        });
      }

      // Check if email verification is required
      if (requireVerified && !user.isVerified) {
        return res.status(403).json({ 
          success: false, 
          message: 'Please verify your email address' 
        });
      }

      // Check if user has required role
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Insufficient permissions' 
        });
      }

      // Attach user to request object
      req.user = {
        id: String(user._id),
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        profile: user.profile,
        ...(user.role === 'seller' && { shop: user.shop })
      };

      console.log('[Auth] User attached to request, calling next()');
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Authentication error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
}

// Helper middleware for common role checks
auth.customer = auth(['customer']);
auth.seller = auth(['seller']);
auth.admin = auth(['admin', 'superadmin']);
auth.superadmin = auth(['superadmin']);
auth.anyAuthenticated = auth([], { allowGuest: false });
auth.any = auth([], { allowGuest: true });

module.exports = auth;
