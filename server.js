const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

const connectDB = require("./config/db");

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Serve static images from /public/images
app.use("/images", express.static(path.join(__dirname, "public/images")));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/coupons", require("./routes/couponRoutes"));
app.use("/api/profile", require("./routes/profileRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/rewards", require("./routes/rewardRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));

const authMiddleware = require("./middleware/authMiddleware");
const Coupon = require("./models/Coupon");

// Removed redundant stats endpoint, now handled by profileRoutes

const PORT = process.env.PORT;

app.listen(PORT, () => {

  console.log(`Server running on port ${PORT}`);

});
