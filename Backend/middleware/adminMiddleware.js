// Must be used AFTER authMiddleware, since it relies on req.user set there.
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access denied. Admins only.",
    });
  }
  next();
};

module.exports = adminMiddleware;
