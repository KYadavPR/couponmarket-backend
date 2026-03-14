const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({

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

      quantity: {
        type: Number,
        default: 1
      }
    }
  ]

}, { timestamps: true });

module.exports = mongoose.model("Cart", cartSchema);