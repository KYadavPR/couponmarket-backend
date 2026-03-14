const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const {
  getStats,
  getAllUsers,
  deleteUser,
  getAllCoupons,
  verifyCoupon,
  deleteCoupon,
  getAllTransactions
} = require("../controllers/adminController");

router.get("/stats", auth, admin, getStats);
router.get("/users", auth, admin, getAllUsers);
router.delete("/users/:id", auth, admin, deleteUser);
router.put("/users/:id/role", auth, admin, require("../controllers/adminController").toggleUserRole);
router.get("/coupons", auth, admin, getAllCoupons);
router.put("/coupons/:id/verify", auth, admin, verifyCoupon);
router.delete("/coupons/:id", auth, admin, deleteCoupon);
router.get("/transactions", auth, admin, getAllTransactions);

module.exports = router;