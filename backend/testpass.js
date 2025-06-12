// this file is used to test password hashing and comparision

// testPasswordComparison();

const bcrypt = require("bcrypt");

const generateHash = async (password) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("Hashed Password:", hashedPassword);
};

generateHash(" $2b$10$zK6IQaJlo/.L7tajVeHNxufk3Sd8ELf1dVNM5NXyQ/n3E550mPxGa");
