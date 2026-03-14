const Cart = require("../models/Cart");


exports.addToCart = async (req, res) => {

  try {

    const { couponId, quantity } = req.body;

    let cart = await Cart.findOne({ user: req.userId });

    if (!cart) {
      cart = new Cart({ user: req.userId, items: [] });
    }

    const existingItem = cart.items.find(
      item => item.coupon.toString() === couponId
    );

    if (existingItem) {
      existingItem.quantity += quantity || 1;
    } else {
      cart.items.push({
        coupon: couponId,
        quantity: quantity || 1
      });
    }

    await cart.save();

    res.json(cart);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};


exports.getCart = async (req, res) => {

  try {

    const cart = await Cart.findOne({ user: req.userId })
      .populate("items.coupon");

    res.json(cart);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};


exports.removeFromCart = async (req, res) => {

  try {

    const { couponId } = req.params;

    const cart = await Cart.findOne({ user: req.userId });

    cart.items = cart.items.filter(
      item => item.coupon.toString() !== couponId
    );

    await cart.save();

    res.json(cart);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};


exports.updateQuantity = async (req, res) => {

  try {

    const { couponId, quantity } = req.body;

    const cart = await Cart.findOne({ user: req.userId });

    const item = cart.items.find(
      item => item.coupon.toString() === couponId
    );

    if (item) {
      item.quantity = quantity;
    }

    await cart.save();

    res.json(cart);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};
