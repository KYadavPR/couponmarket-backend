const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true
  },

  description: {
    type: String
  },

  store: {
    type: String,
    required: true
  },

  discount: {
    type: String,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  expiryDate: {
    type: Date,
    required: true
  },

  code: {
    type: String,
    required: true
  },

  brand: {
    type: String,
    required: true
  },

  category: {
    type: String,
    default: "All"
  },

  image: {
    type: String,
    default: ""
  },

  verified: {
    type: Boolean,
    default: false
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  status: {
    type: String,
    enum: ["AVAILABLE", "SOLD", "EXPIRED", "LOCKED"],
    default: "AVAILABLE"
  },

  boughtBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

couponSchema.index({ status: 1, category: 1 });
couponSchema.index({ userId: 1 });
couponSchema.index({ code: 1 }, { unique: true });

module.exports = mongoose.model("Coupon", couponSchema);
