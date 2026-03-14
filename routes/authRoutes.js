const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", authController.register);

router.post("/login", authController.login);

router.post("/forgot-password", authController.forgotPassword);

router.post("/reset-password/:token", authController.resetPassword);

router.post("/refresh-token", authController.refreshToken);

router.get("/profile", authMiddleware, authController.getProfile);

module.exports = router;
