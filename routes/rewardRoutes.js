const express = require("express");
const router = express.Router();
const rewardController = require("../controllers/rewardController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/claim", authMiddleware, rewardController.claimDailyReward);

module.exports = router;
