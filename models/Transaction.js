const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    coupon_id: {
        type: mongoose.Schema.Types.Mixed,
        ref: "Coupon",
        required: false
    },
    payment_id: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    payment_status: {
        type: String,
        enum: ["PENDING", "SUCCESS", "FAILED"],
        default: "PENDING"
    }
}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);
