const mongoose = require("mongoose");
const User = require("./userModel"); // Import User model instead of redefining schema

const Staff = mongoose.model("Staff", User.schema); // Reuse User schema

module.exports = Staff;
