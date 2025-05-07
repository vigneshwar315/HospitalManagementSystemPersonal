const bcrypt = require('bcrypt');

const password = "admin_hospital";
bcrypt.hash(password, 10, function(err, hash) {
    if (err) {
        console.log("Error hashing password:", err);
    } else {
        console.log("Hashed Password:", hash);
    }
});
