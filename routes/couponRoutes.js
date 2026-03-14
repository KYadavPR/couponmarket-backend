const express = require("express");
const router = express.Router();

const couponController = require("../controllers/couponController");
const authMiddleware = require("../middleware/authMiddleware");


// Specific routes first
router.get("/bought", authMiddleware, couponController.getBoughtCoupons);
router.get("/listed", authMiddleware, couponController.getListedCoupons);

// Generic routes next
router.get("/", couponController.getCoupons);
router.get("/:id", couponController.getCouponById);
router.post("/", authMiddleware, couponController.createCoupon);
router.put("/:id", authMiddleware, couponController.updateCoupon);
router.delete("/:id", authMiddleware, couponController.deleteCoupon);


module.exports = router;