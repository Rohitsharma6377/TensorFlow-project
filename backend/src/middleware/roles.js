function requireRole(roles = []) {
  return function (req, res, next) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!roles.length) return next();
    if (roles.includes(req.user.role)) return next();
    return res.status(403).json({ success: false, message: 'Forbidden' });
  };
}

module.exports = { requireRole };
