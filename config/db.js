const mongoose = require("mongoose");

const connectDB = async () => {

  try {

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

  } catch (error) {

    console.error("❌ MongoDB Connection Error:", error.message);
    console.log("⚠️ Server will continue to run, but database operations will fail until MongoDB is started.");
  }
};

module.exports = connectDB;