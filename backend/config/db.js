const mongoose = require('mongoose');
require('dotenv').config(); // Loads .env variables

const connectDB = async () => {
  try {
    // Ensure that MONGO_URI exists in your .env file
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in .env');
    }

    // Connecting to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Optional: set timeout in milliseconds (5 seconds)
    });

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); // Exit the process if the connection fails
  }
};

module.exports = connectDB;
