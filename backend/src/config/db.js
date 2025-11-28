// src/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eznat');

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1); // Stop the app if DB fails
  }
};

module.exports = connectDB;