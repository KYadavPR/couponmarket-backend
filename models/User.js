const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  resetToken: String,

  resetTokenExpiry: Date,

  walletBalance: {
    type: Number,
    default: 0
  },

  refreshToken: String,

  name: {
    type: String,
    required: false
  },

  phone: {
    type: String,
    required: false
  },

  upi_id: {
    type: String,
    required: false
  },

  razorpayAccountId: {
    type: String,
    required: false
  },

  role: {
    type: String,
    enum: ["USER", "ADMIN", "user", "admin"],
    default: "USER"
  }

}, { timestamps: true });

userSchema.index({ refreshToken: 1 });
userSchema.index({ resetToken: 1 });

module.exports = mongoose.model("User", userSchema);