const User = require("../models/User");
const Coupon = require("../models/Coupon");
const Transaction = require("../models/Transaction");

exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCoupons = await Coupon.countDocuments();
    const totalTransactions = await Transaction.countDocuments();
    
    // Total Revenue across the entire platform
    const transactions = await Transaction.find({ payment_status: "SUCCESS" });
    const totalRevenue = transactions.reduce((sum, txn) => sum + (txn.amount || 0), 0);
    
    res.json({
      totalUsers,
      totalCoupons,
      totalTransactions,
      totalRevenue
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.toggleUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    user.role = user.role === "ADMIN" ? "USER" : "ADMIN";
    await user.save();
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().populate("userId", "name email").sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.verifyCoupon = async (req, res) => {
  try {
    const { verified } = req.body;
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id, 
      { verified: verified }, 
      { new: true }
    );
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: "Coupon deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("user_id", "name email")
      .sort({ createdAt: -1 })
      .lean();
      
    const populatedTransactions = await Promise.all(transactions.map(async (txn) => {
      let couponData = { title: "Custom/Local Coupon", code: "EXTERNAL" };
      if (txn.coupon_id && String(txn.coupon_id).length === 24) {
          const dbCoupon = await Coupon.findById(txn.coupon_id).select("title code").lean();
          if (dbCoupon) {
              couponData = dbCoupon;
          }
      }
      return { ...txn, coupon_id: couponData };
    }));
    
    res.json(populatedTransactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};