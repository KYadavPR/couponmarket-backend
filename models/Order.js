const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  items: [
    {
      coupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coupon"
      },

      quantity: Number,

      price: Number
    }
  ],

  totalAmount: Number,

  status: {
    type: String,
    default: "completed"
  }

}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);