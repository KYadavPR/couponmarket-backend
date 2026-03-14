const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, profileController.getProfile);
router.put("/", authMiddleware, profileController.updateProfile);
router.get("/stats", authMiddleware, profileController.getUserStats);
router.get("/payments", authMiddleware, profileController.getPaymentHistory);

module.exports = router;
