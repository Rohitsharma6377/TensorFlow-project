// Simple plan gating middleware. Supports order: basic < silver < gold
const ORDER = { basic: 1, silver: 2, gold: 3 };

function requirePlan(minTier = 'basic') {
  return function (req, res, next) {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const userTier = user.planType || 'basic';
      if ((ORDER[userTier] || 1) >= (ORDER[minTier] || 1)) return next();
      return res.status(403).json({ success: false, message: `Requires ${minTier} plan` });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Plan check failed' });
    }
  };
}

module.exports = { requirePlan };
