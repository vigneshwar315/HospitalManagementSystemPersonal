const mongoose = require("mongoose");
const User = require("./userModel"); 

const Staff = mongoose.model("Staff", User.schema);

module.exports = Staff;
