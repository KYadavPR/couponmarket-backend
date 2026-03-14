const User = require("../models/User");
const Coupon = require("../models/Coupon");
const Transaction = require("../models/Transaction");

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password -refreshToken");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, upi_id } = req.body;

        // Validate phone and UPI format if provided
        if (phone && !/^\d{10}$/.test(phone)) {
            return res.status(400).json({ message: "Invalid phone number format (10 digits required)" });
        }
        if (upi_id && !/^[\w.-]+@[\w.-]+$/.test(upi_id)) {
            return res.status(400).json({ message: "Invalid UPI ID format" });
        }

        const user = await User.findByIdAndUpdate(
            req.userId,
            { name, phone, upi_id },
            { new: true }
        ).select("-password -refreshToken");

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getUserStats = async (req, res) => {
    try {
        const userId = req.userId;
        const couponsCreated = await Coupon.countDocuments({ userId });
        const couponsPurchased = await Transaction.countDocuments({ user_id: userId, payment_status: "SUCCESS" });
        const activeCoupons = await Coupon.countDocuments({ userId, status: "AVAILABLE" });

        // Total Earnings (for coupons sold by this user - only the coupon price, excluding platform fee)
        const userCoupons = await Coupon.find({ userId }).select("_id");
        const couponIds = userCoupons.map(c => c._id);
        const transactions = await Transaction.find({ coupon_id: { $in: couponIds }, payment_status: "SUCCESS" })
            .populate("coupon_id", "price");

        const totalEarnings = transactions.reduce((sum, t) => sum + (t.coupon_id ? t.coupon_id.price : 0), 0);

        res.json({
            couponsCreated,
            couponsPurchased,
            activeCoupons,
            totalEarnings
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getPaymentHistory = async (req, res) => {
    try {
        const transactions = await Transaction.find({ user_id: req.userId }).sort({ createdAt: -1 }).lean();
        
        // Manual populate to avoid CastError with Mixed type local JSON string IDs
        const populatedTransactions = await Promise.all(transactions.map(async (txn) => {
            let couponData = { title: "Custom/Local Coupon", brand: "External", price: txn.amount };
            
            if (txn.coupon_id && String(txn.coupon_id).length === 24) {
                const dbCoupon = await Coupon.findById(txn.coupon_id).select("title brand price").lean();
                if (dbCoupon) {
                    couponData = dbCoupon;
                }
            }
            
            return {
                ...txn,
                coupon_id: couponData
            };
        }));
        
        res.json(populatedTransactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
