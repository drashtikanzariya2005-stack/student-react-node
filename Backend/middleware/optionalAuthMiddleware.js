const jwt = require("jsonwebtoken");

/**
 * Attaches req.user IF a valid token was sent, but never blocks the request.
 *
 * Needed for routes that are public but behave differently for an admin —
 * e.g. GET /api/offers returns only active offers to customers, but all
 * offers (including hidden ones) to a logged-in admin.
 */
const optionalAuthMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return next();
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    // An invalid/expired token simply means "treat this as a guest".
  }

  next();
};

module.exports = optionalAuthMiddleware;
