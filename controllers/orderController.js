const Order = require("../models/Order");
const Cart = require("../models/Cart");

exports.checkout = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId }).populate("items.coupon");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const price = item.coupon.price * item.quantity;
      totalAmount += price;

      orderItems.push({
        coupon: item.coupon._id,
        quantity: item.quantity,
        price: item.coupon.price
      });

      // Update coupon status and boughtBy
      const Coupon = require("../models/Coupon");
      await Coupon.findByIdAndUpdate(item.coupon._id, {
        status: "SOLD",
        boughtBy: req.userId
      });

      // Credit Seller
      const User = require("../models/User");
      const seller = await User.findById(item.coupon.userId);
      if (seller) {
        seller.walletBalance = (seller.walletBalance || 0) + item.coupon.price;
        await seller.save();
      }

      // Add Transaction for each coupon
      const Transaction = require("../models/Transaction");
      await Transaction.create({
        user_id: req.userId,
        coupon_id: item.coupon._id,
        payment_id: `WALLET_ORDER_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        amount: item.coupon.price,
        payment_status: "SUCCESS"
      });
    }

    const User = require("../models/User");
    const user = await User.findById(req.userId);

    if ((user.walletBalance || 0) < totalAmount) {
      return res.status(400).json({ message: "Insufficient wallet balance. Please add funds." });
    }

    const order = new Order({
      user: req.userId,
      items: orderItems,
      totalAmount
    });

    await order.save();

    user.walletBalance = (user.walletBalance || 0) - totalAmount;
    await user.save();

    cart.items = [];
    await cart.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId }).populate("items.coupon");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
