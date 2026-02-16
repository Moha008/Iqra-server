const jwt = require("jsonwebtoken");

module.exports = {
  // Authentication: check if logged in
  isAuthenticated: (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    try {
      const decoded = jwt.verify(token, "shksjhask38239210p_@@_#)WUOJKDDSDMSS");
      req.user = decoded; // <-- logged in user info
      next();
    } catch (error) {
      res.status(401).json({ message: "Token is not valid" });
    }
  },

  // Authorization: check specific roles (Admin, Teacher, etc.)
  isAdmin: (req, res, next) => {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Access denied: Admin only" });
    }
    next();
  }
};
