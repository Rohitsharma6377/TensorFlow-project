const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

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
      // Extract token from Authorization header
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      
      if (!token) {
        if (allowGuest) {
          req.user = { role: 'guest', isGuest: true };
          return next();
        }
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      // Verify token
      let payload;
      try {
        payload = verifyToken(token);
      } catch (err) {
        return res.status(401).json({ 
          success: false, 
          message: err.message || 'Invalid or expired token' 
        });
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
      const user = await User.findById(payload.id).select('-passwordHash');
      
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
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        profile: user.profile,
        ...(user.role === 'seller' && { shop: user.shop })
      };

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
