const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

// Staff Login Function (For all staff roles)
const staffLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Trim and validate input
        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();

        if (!trimmedEmail || !trimmedPassword) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Find the user by email
        const user = await User.findOne({ email: trimmedEmail });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if the user is approved
        if (!user.isApproved) {
            return res.status(403).json({ message: "Approval pending. Please wait for admin approval." });
        }

        // Compare the entered password with the hashed password
        const isMatch = await bcrypt.compare(trimmedPassword, user.password);
        console.log("Entered password:", trimmedPassword); // Debugging
        console.log("Hashed password in DB:", user.password); // Debugging
        console.log("Password match:", isMatch); // Debugging

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            }
        });

    } catch (error) {
        console.error("Staff Login Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Register a Doctor (Requires Admin Approval)
const registerDoctor = async (req, res) => {
    try {
        const { username, email, password, specialization } = req.body;

        // Trim and validate input
        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();

        if (!trimmedEmail || !trimmedPassword) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Check if doctor already exists
        const existingUser = await User.findOne({ email: trimmedEmail });
        if (existingUser) {
            return res.status(400).json({ message: "Doctor already registered" });
        }

        // Create new doctor (Approval Pending) with proper status
        const newDoctor = new User({
            username,
            email: trimmedEmail,
            password: trimmedPassword,
            role: "Doctor",
            specialization,
            isApproved: false,
            status: 'Active', // Set initial status as Active
        });

        await newDoctor.save();
        res.status(201).json({ message: "Registration successful. Awaiting admin approval." });

    } catch (error) {
        console.error("Doctor registration error:", error);
        res.status(500).json({ message: "Registration failed", error: error.message });
    }
};

// Doctor Login (Only if Approved)
const doctorLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Trim and validate input
        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();

        if (!trimmedEmail || !trimmedPassword) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Find doctor in DB
        const doctor = await User.findOne({ email: trimmedEmail, role: "Doctor" });

        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        // Check if approved by Admin
        if (!doctor.isApproved) {
            return res.status(403).json({ message: "Approval pending. Please wait for admin approval." });
        }

        // Compare password
        const isMatch = await bcrypt.compare(trimmedPassword, doctor.password);
        console.log("Entered password:", trimmedPassword); // Debugging
        console.log("Hashed password in DB:", doctor.password); // Debugging
        console.log("Password match:", isMatch); // Debugging

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: doctor._id, role: doctor.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            doctor: {
                id: doctor._id,
                username: doctor.username,
                email: doctor.email,
                role: doctor.role,
            }
        });

    } catch (error) {
        console.error("Doctor Login Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const registerReceptionist = async (req, res) => {
    try {
        const { username, email, password, contactNumber } = req.body;

        // Trim and validate input
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedPassword = password.trim();
        const trimmedUsername = username.trim();
        const trimmedContact = contactNumber.trim();

        // Validate required fields
        if (!trimmedEmail || !trimmedPassword || !trimmedUsername || !trimmedContact) {
            return res.status(400).json({ 
                success: false,
                message: "All fields are required" 
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address"
            });
        }

        // Password validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(trimmedPassword)) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"
            });
        }

        // Contact number validation
        const contactRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
        if (!contactRegex.test(trimmedContact)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid contact number"
            });
        }

        // Check if receptionist already exists
        const existingUser = await User.findOne({ 
            $or: [
                { email: trimmedEmail },
                { contactNumber: trimmedContact }
            ] 
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                message: existingUser.email === trimmedEmail 
                    ? "Email already registered" 
                    : "Contact number already registered"
            });
        }

        // Create new receptionist - password will be hashed by pre-save hook
        const newReceptionist = new User({
            username: trimmedUsername,
            email: trimmedEmail,
            password: trimmedPassword,
            contactNumber: trimmedContact,
            role: "Receptionist",
            isApproved: false,
            registrationDate: new Date()
        });

        await newReceptionist.save();
        
        // Send email to admin
        const adminUsers = await User.find({ role: "Admin" }).select('email');
        const adminEmails = adminUsers.map(admin => admin.email);
        
        if (adminEmails.length > 0) {
            try {
                await sendEmail(
                    adminEmails,
                    "New Receptionist Approval Request",
                    `A new receptionist has registered and requires approval.\n\n` +
                    `Name: ${trimmedUsername}\n` +
                    `Email: ${trimmedEmail}\n` +
                    `Contact: ${trimmedContact}\n\n` +
                    `Please review in the admin dashboard.`
                );
            } catch (emailError) {
                console.error("Email notification failed:", emailError);
                // Don't fail registration if email fails
            }
        }

        // Log the registration
        console.log(`New receptionist registered: ${trimmedEmail}`);

        res.status(201).json({ 
            success: true,
            message: "Registration successful. Awaiting admin approval.",
            redirectUrl: "/awaiting-approval",
            data: {
                username: trimmedUsername,
                email: trimmedEmail
            }
        });

    } catch (error) {
        console.error("Registration Error:", error);
        
        // Handle specific errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors
            });
        }

        res.status(500).json({ 
            success: false,
            message: "Server error during registration",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
// Receptionist Login (Only if Approved)
const receptionistLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Enhanced validation
        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: "Email and password are required",
                field: !email ? "email" : "password"
            });
        }

        const user = await User.findOne({ 
            email: email.trim().toLowerCase(),
            role: "Receptionist" // Strict role check
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No receptionist account found with this email"
            });
        }

        // Debug logging
        console.log(`Login attempt for: ${user.email}`);
        console.log(`Account approved: ${user.isApproved}`);

        if (!user.isApproved) {
            return res.status(403).json({
                success: false,
                message: "Account pending admin approval",
                resolution: "Contact your administrator"
            });
        }

        const isMatch = await bcrypt.compare(password.trim(), user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Incorrect password",
                resolution: "Reset password if forgotten"
            });
        }

        // Verify JWT_SECRET exists
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET missing in environment");
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.username,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Authentication server error",
            error: process.env.NODE_ENV === "development" ? error.message : null
        });
    }
};

// ... (keep all your existing functions)

// Add these new functions for password reset
const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email, role: "Receptionist" });

        if (!user) {
            return res.status(404).json({ message: "Receptionist not found" });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await user.save();

        const resetLink = `http://localhost:3000/reset-password/${resetToken}`;
        
        await sendEmail(
            user.email,
            "Password Reset Request",
            `Click the link to reset your password: ${resetLink}`
        );

        res.status(200).json({ message: "Password reset link sent to email" });
    } catch (error) {
        console.error("Password reset error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
            role: "Receptionist"
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
        console.error("Password reset error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { 
    staffLogin, 
    registerDoctor, 
    doctorLogin, 
    registerReceptionist, 
    receptionistLogin,
    requestPasswordReset,
    resetPassword
};