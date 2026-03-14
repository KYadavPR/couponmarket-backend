const Reward = require("../models/Reward");
const User = require("../models/User");

exports.claimDailyReward = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingReward = await Reward.findOne({
      user: req.userId,
      dateClaimed: { $gte: today }
    });

    if (existingReward) {
      return res.status(400).json({ message: "Daily reward already claimed today" });
    }

    // Use rewardAmount from body if provided, otherwise fallback to random
    const rewardAmount = req.body.rewardAmount !== undefined ? req.body.rewardAmount : Math.floor(Math.random() * (100 - 10 + 1)) + 10;

    const reward = new Reward({
      user: req.userId,
      amount: rewardAmount
    });

    await reward.save();

    const user = await User.findById(req.userId);
    user.walletBalance = (user.walletBalance || 0) + rewardAmount;
    await user.save();

    res.json({ message: "Reward claimed", amount: rewardAmount, walletBalance: user.walletBalance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
