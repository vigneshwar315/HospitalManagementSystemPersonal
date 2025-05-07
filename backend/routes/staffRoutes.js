const express = require("express");
const { 
    registerDoctor, 
    doctorLogin, 
    registerReceptionist, 
    receptionistLogin,
    requestPasswordReset,
    resetPassword
} = require("../controllers/staffController");

const router = express.Router();

// Doctor routes
router.post("/register-doctor", registerDoctor);
router.post("/login-doctor", doctorLogin);

// Receptionist routes
router.post('/register-receptionist', registerReceptionist);
router.post('/login-receptionist', receptionistLogin);

// Password reset routes
router.post('/receptionist/forgot-password', requestPasswordReset);
router.post('/receptionist/reset-password/:token', resetPassword);

module.exports = router;