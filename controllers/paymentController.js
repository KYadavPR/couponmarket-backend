const Razorpay = require("razorpay");
const crypto = require("crypto");
const Coupon = require("../models/Coupon");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

const PLATFORM_FEE_PERCENT = 10; // 10% platform fee

// Lazy-init: only create instance when a payment is actually triggered
const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay keys are not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file.");
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

exports.createOrder = async (req, res) => {
  try {
    const { couponId } = req.body;
    const coupon = await Coupon.findById(couponId);

    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    if (coupon.status !== "AVAILABLE") return res.status(400).json({ message: "Coupon not available" });

    // Calculate platform fee and total
    const couponPrice = coupon.price;
    const platformFee = Math.round(couponPrice * PLATFORM_FEE_PERCENT / 100);
    const totalAmount = couponPrice + platformFee;

    const options = {
      amount: totalAmount * 100, // amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create(options);

    // Initial transaction record
    await Transaction.create({
      user_id: req.userId,
      coupon_id: couponId,
      payment_id: order.id,
      amount: totalAmount,
      payment_status: "PENDING"
    });

    res.json({
      ...order,
      couponPrice,
      platformFee,
      totalAmount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, couponId } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    // Payment verified — update transaction
    await Transaction.findOneAndUpdate(
      { payment_id: razorpay_order_id },
      { payment_status: "SUCCESS", payment_id: razorpay_payment_id }
    );

    // Mark coupon as sold
    const coupon = await Coupon.findByIdAndUpdate(couponId, {
      status: "SOLD",
      boughtBy: req.userId
    }, { new: true });

    // Credit seller's wallet
    const seller = await User.findById(coupon.userId);
    if (seller) {
      seller.walletBalance = (seller.walletBalance || 0) + coupon.price;
      await seller.save();

      // Razorpay Route: transfer seller's share to their linked account
      if (seller.razorpayAccountId) {
        try {
          const razorpay = getRazorpay();
          await razorpay.payments.transfer(razorpay_payment_id, {
            transfers: [
              {
                account: seller.razorpayAccountId,
                amount: coupon.price * 100, // seller gets original price in paise
                currency: "INR",
                notes: {
                  coupon_id: couponId,
                  seller_id: seller._id.toString(),
                  description: `Payment for coupon: ${coupon.title}`
                }
              }
            ]
          });
        } catch (transferErr) {
          console.error("Razorpay Route transfer failed:", transferErr.message);
          // Payment is still successful — transfer can be retried manually
        }
      }
    }

    res.json({ message: "Payment verified successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.dummyCheckout = async (req, res) => {
  try {
    const { couponId, amount, paymentMethod } = req.body;
    const mongoose = require("mongoose");

    console.log(`[DummyCheckout] CouponId: ${couponId}, User: ${req.userId}`);

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found in our records." });
    }

    if (coupon.status !== "AVAILABLE") {
      return res.status(400).json({ message: "This coupon has already been sold." });
    }

    if (paymentMethod === "wallet") {
      const user = await User.findById(req.userId);
      if (!user || user.walletBalance < amount) {
        return res.status(400).json({ message: "Insufficient wallet balance" });
      }
      user.walletBalance -= amount;
      await user.save();
    }

    // Mark coupon as sold
    coupon.status = "SOLD";
    coupon.boughtBy = req.userId;
    await coupon.save();

    // Credit seller's wallet
    const seller = await User.findById(coupon.userId);
    if (seller) {
      seller.walletBalance = (seller.walletBalance || 0) + coupon.price;
      await seller.save();
    }

    // Create transaction record
    const transaction = await Transaction.create({
      user_id: req.userId,
      coupon_id: couponId,
      payment_id: `TXN_${paymentMethod?.toUpperCase()}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      amount: amount || coupon.price,
      payment_status: "SUCCESS"
    });

    res.json({ message: "Payment successful", transaction });
  } catch (error) {
    console.error(`[DummyCheckout] Error:`, error);
    res.status(500).json({ error: error.message });
  }
};
