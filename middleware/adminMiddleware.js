const User = require("../models/User");

const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || (user.role !== "ADMIN" && user.role !== "admin")) {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: "Server error checking admin role" });
  }
};

module.exports = adminMiddleware;
