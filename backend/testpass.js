// const bcrypt = require("bcryptjs");

// const testPasswordComparison = async () => {
//     const enteredPassword = "Shashi@123"; // Replace with the actual password
//     const hashedPasswordFromDB = "$2b$10$TcdUBUMT4Ntm2epDo4O2lOn8RmIJFO7i.imFksw6LLy0bIjSb1MJa";

//     const isMatch = await bcrypt.compare(enteredPassword, hashedPasswordFromDB);
//     console.log("Password match:", isMatch);
// };

// testPasswordComparison();

const bcrypt = require("bcrypt");

const generateHash = async (password) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("Hashed Password:", hashedPassword);
};

generateHash(" $2b$10$zK6IQaJlo/.L7tajVeHNxufk3Sd8ELf1dVNM5NXyQ/n3E550mPxGa");
