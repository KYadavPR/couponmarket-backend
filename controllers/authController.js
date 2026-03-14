const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/emailService");


exports.register = async (req, res) => {

  try {

    const { email, password, name, phone, upi_id } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    if (phone && !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
    }

    if (upi_id && !/^[\w.-]+@[\w.-]+$/.test(upi_id)) {
      return res.status(400).json({ message: "Invalid UPI ID format" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email: normalizedEmail,
      password: hashedPassword,
      name: name ? String(name).trim() : undefined,
      phone: phone ? String(phone).trim() : undefined,
      upi_id: upi_id ? String(upi_id).trim() : undefined
    });

    await user.save();

    res.json({ message: "User registered successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }

};


exports.login = async (req, res) => {

  try {

    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      token,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        upi_id: user.upi_id,
        walletBalance: user.walletBalance,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }

};

exports.refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(401).json({ message: "Refresh token required" });

    const user = await User.findOne({ refreshToken: token });
    if (!user) return res.status(403).json({ message: "Invalid refresh token" });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ message: "Invalid or expired refresh token" });

      const newAccessToken = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({ token: newAccessToken });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("_id email name role createdAt walletBalance");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user._id,
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      walletBalance: user.walletBalance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.forgotPassword = async (req, res) => {

  try {

    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 3600000;

    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetLink = `${frontendUrl}/reset-password/${token}`;

    await sendEmail(
      user.email,
      "Reset Password",
      `<p>Click the link to reset your password:</p>
       <a href="${resetLink}">${resetLink}</a>`
    );

    res.json({ message: "Reset password email sent" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }

};


exports.resetPassword = async (req, res) => {

  try {

    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;

    await user.save();

    res.json({ message: "Password reset successful" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }

};
