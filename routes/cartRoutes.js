const express = require("express");
const router = express.Router();

const cartController = require("../controllers/cartController");
const authMiddleware = require("../middleware/authMiddleware");


router.post("/add", authMiddleware, cartController.addToCart);

router.get("/", authMiddleware, cartController.getCart);

router.delete("/remove/:couponId", authMiddleware, cartController.removeFromCart);

router.put("/update", authMiddleware, cartController.updateQuantity);


module.exports = router;