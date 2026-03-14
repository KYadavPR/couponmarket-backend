const Coupon = require("../models/Coupon");


exports.createCoupon = async (req, res) => {

  try {
    const { title, description, code, coupon_code, category, discount, price, expiryDate, expiry, store, brand } = req.body;

    const finalCode = code || coupon_code;
    const finalExpiry = expiryDate || expiry;
    const finalBrand = brand || store;

    if (!title || !finalCode || !discount || (price === undefined || price === null) || !finalExpiry || !store) {
      return res.status(400).json({ message: "Missing required coupon fields" });
    }

    if (new Date(finalExpiry) <= new Date()) {
      return res.status(400).json({ message: "Expiry date must be in the future" });
    }

    const existingCoupon = await Coupon.findOne({ code: String(finalCode).trim().toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ message: "A coupon with this code already exists" });
    }

    const coupon = new Coupon({
      title: String(title).trim(),
      brand: String(finalBrand).trim(),
      description: String(description || "").trim(),
      code: String(finalCode).trim().toUpperCase(),
      category: String(category || "All").trim(),
      discount: String(discount),
      price: Number(price),
      expiryDate: new Date(finalExpiry),
      store: String(store).trim(),
      userId: req.userId
    });

    await coupon.save();

    res.json(coupon);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};


exports.getCoupons = async (req, res) => {
  try {
    const { sortBy, recommended } = req.query;

    let query = { status: "AVAILABLE" };
    if (recommended === 'true') {
      query.recommended = true;
    }

    let sortOptions = { createdAt: -1 };
    if (sortBy === 'popularity') {
      sortOptions = { popularity: -1, createdAt: -1 };
    }

    const coupons = await Coupon.find(query)
      .sort(sortOptions)
      .lean();

    res.json(coupons);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};


exports.getCouponById = async (req, res) => {

  try {

    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    res.json(coupon);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};


exports.updateCoupon = async (req, res) => {
  try {
    const { title, description, category, discount, price, expiryDate, store, brand, code, coupon_code } = req.body;

    console.log(`[UpdateCoupon] ID: ${req.params.id}, Body:`, req.body);

    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    if (coupon.userId.toString() !== req.userId) {
      console.log(`[UpdateCoupon] Unauthorized. Owner: ${coupon.userId}, Request: ${req.userId}`);
      return res.status(403).json({ message: "Unauthorized to edit this coupon" });
    }

    // Handle coupon code update with uniqueness check
    const newCode = code || coupon_code;
    if (newCode !== undefined) {
      const normalizedCode = String(newCode).trim().toUpperCase();
      if (normalizedCode !== coupon.code) {
        const existingCoupon = await Coupon.findOne({ code: normalizedCode });
        if (existingCoupon) {
          return res.status(400).json({ message: "A coupon with this code already exists" });
        }
        coupon.code = normalizedCode;
      }
    }

    if (title !== undefined) coupon.title = title;
    if (brand !== undefined) coupon.brand = brand;
    if (description !== undefined) coupon.description = description;
    if (category !== undefined) coupon.category = category;
    if (discount !== undefined) coupon.discount = discount;
    if (price !== undefined) coupon.price = price;
    if (expiryDate !== undefined) coupon.expiryDate = new Date(expiryDate);
    if (store !== undefined) coupon.store = store;

    await coupon.save();
    console.log(`[UpdateCoupon] Success for ID: ${req.params.id}`);
    res.json(coupon);
  } catch (error) {
    console.error(`[UpdateCoupon] Error for ID: ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    if (coupon.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Unauthorized to delete this coupon" });
    }

    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: "Coupon deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBoughtCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({ boughtBy: req.userId, status: "SOLD" }).sort({ updatedAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getListedCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
