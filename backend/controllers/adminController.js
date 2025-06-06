const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const verifyAdmin = require("../middlewares/authMiddleware");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();
const testEmailConfig = async () => {
    try {
        console.log('Testing email configuration...');
        console.log('Using email:', process.env.EMAIL_USER);
        
        const testTransporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        
        await testTransporter.verify();
        console.log('Email configuration is valid!');

        
        const testResult = await testTransporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, 
            subject: 'Test Email from Hospital System',
            text: 'This is a test email to verify your email configuration is working correctly.'
        });

        console.log('Test email sent successfully!');
        console.log('Message ID:', testResult.messageId);
        return true;
    } catch (error) {
        console.error('Email configuration test failed:', error);
        return false;
    }
};

// Create email transporter with detailed configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify email configuration on startup
testEmailConfig().then(success => {
    if (success) {
        console.log('Email system is ready to use!');
    } else {
        console.error('Email system configuration failed. Please check your settings.');
    }
});

// Send email notification with detailed error handling
const sendEmailNotification = async (to, subject, html) => {
    try {
        console.log('Starting email send process...');
        console.log('Recipient:', to);
        console.log('Subject:', subject);
        console.log('Using email:', process.env.EMAIL_USER);

        const mailOptions = {
            from: `"Hospital Management System" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: html
        };

        console.log('Sending email with options:', {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject
        });

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
        
        return info;
    } catch (error) {
        console.error('Detailed email error:', {
            message: error.message,
            code: error.code,
            response: error.response,
            stack: error.stack
        });
        throw error;
    }
};

// Admin Login
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find admin in the "users" collection with role "Admin"
        const admin = await User.findOne({ email, role: "Admin" });
        console.log("Admin from DB:", admin);

        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        // Verify the hashed password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate JWT token for authentication
        const token = jwt.sign(
            { id: admin._id, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role,
            }
        });

    } catch (error) {
        console.error("Admin Login Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get Pending Staff for Approval (Doctors, Receptionists, Lab Technicians)
const getPendingStaff = async (req, res) => {
    try {
        const pendingUsers = await User.find({ isApproved: false, role: { $in: ["Doctor", "Receptionist", "LabTechnician"] } });
        
        // Send email notification to admin if there are new pending requests
        if (pendingUsers.length > 0) {
            const adminEmail = process.env.ADMIN_EMAIL;
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: adminEmail,
                subject: 'New Staff Registration Requests',
                html: `
                    <h2>New Staff Registration Requests</h2>
                    <p>You have new staff registration requests waiting for your approval:</p>
                    <ul>
                        ${pendingUsers.length > 0 ? `<li>${pendingUsers.length} new staff member(s)</li>` : ''}
                    </ul>
                    <p>Please log in to your dashboard to review these requests.</p>
                    <p><a href="${process.env.FRONTEND_URL}/admin-dashboard">Go to Dashboard</a></p>
                `
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Email notification error:', error);
                } else {
                    console.log('Email notification sent:', info.response);
                }
            });
        }

        res.status(200).json(pendingUsers);
    } catch (error) {
        console.error("Error fetching pending staff:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Approve Staff by Admin
const approveStaff = async (req, res) => {
    try {
        const { userId } = req.body;

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update approval status
        user.isApproved = true;
        await user.save();

        res.status(200).json({ message: `${user.role} approved successfully` });

    } catch (error) {
        console.error("Error approving staff:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Reject Staff by Admin
const rejectStaff = async (req, res) => {
    try {
        const { userId } = req.body;

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Delete the user
        await User.findByIdAndDelete(userId);

        res.status(200).json({ message: `${user.role} rejected and removed` });

    } catch (error) {
        console.error("Error rejecting staff:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const getAllUsers = async (req, res) => {
    try {
        // Fetch all users except Admin
        const users = await User.find({ role: { $ne: "Admin" } });

        if (!users.length) {
            return res.status(404).json({ message: "No users found" });
        }

        // Calculate counts
        const stats = {
            totalUsers: users.length,
            pendingApprovals: users.filter(user => !user.isApproved && !user.isRejected).length,
            approvedStaff: users.filter(user => user.isApproved).length,
            rejectedStaff: users.filter(user => user.isRejected).length,
            doctors: {
                total: users.filter(user => user.role === "Doctor").length,
                pending: users.filter(user => !user.isApproved && !user.isRejected && user.role === "Doctor").length,
                approved: users.filter(user => user.isApproved && user.role === "Doctor").length,
                rejected: users.filter(user => user.isRejected && user.role === "Doctor").length
            },
            receptionists: {
                total: users.filter(user => user.role === "Receptionist").length,
                pending: users.filter(user => !user.isApproved && !user.isRejected && user.role === "Receptionist").length,
                approved: users.filter(user => user.isApproved && user.role === "Receptionist").length,
                rejected: users.filter(user => user.isRejected && user.role === "Receptionist").length
            },
            labTechnicians: {
                total: users.filter(user => user.role === "LabTechnician").length,
                pending: users.filter(user => !user.isApproved && !user.isRejected && user.role === "LabTechnician").length,
                approved: users.filter(user => user.isApproved && user.role === "LabTechnician").length,
                rejected: users.filter(user => user.isRejected && user.role === "LabTechnician").length
            }
        };

        res.status(200).json({ users, stats });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const registerStaff = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Allowed roles for staff
        const allowedRoles = ["Doctor", "Receptionist", "LabTechnician"];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new staff user (pending approval)
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            role,
            isApproved: false, // User needs admin approval
        });

        await newUser.save();

        res.status(201).json({ message: "Registration successful. Awaiting admin approval." });

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Approve Doctor
const approveDoctor = async (req, res) => {
    try {
        console.log('Starting doctor approval process...');
        const { id } = req.params;
        
        console.log('Finding doctor with ID:', id);
        const doctor = await User.findByIdAndUpdate(
            id,
            { isApproved: true, status: "Approved" },
            { new: true }
        );

        if (!doctor) {
            console.log('Doctor not found with ID:', id);
            return res.status(404).json({ message: "Doctor not found" });
        }

        console.log('Doctor found:', {
            id: doctor._id,
            email: doctor.email,
            username: doctor.username
        });

        // Send approval email
        const welcomeEmail = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2c3e50; text-align: center;">Welcome to Hospital Management System</h1>
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-top: 20px;">
                    <p style="font-size: 16px;">Dear Dr. ${doctor.username},</p>
                    <p style="font-size: 16px;">We are pleased to inform you that your registration has been approved by the admin.</p>
                    <p style="font-size: 16px;">You can now log in to your account using the following credentials:</p>
                    <ul style="font-size: 16px;">
                        <li>Email: ${doctor.email}</li>
                        <li>Role: Doctor</li>
                    </ul>
                    <p style="font-size: 16px;">Please log in to complete your profile setup and start managing your appointments.</p>
                    <div style="text-align: center; margin-top: 20px;">
                        <a href="http://localhost:5173/login" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Login to Dashboard</a>
                    </div>
                </div>
                <p style="text-align: center; margin-top: 20px; color: #7f8c8d;">Best regards,<br>Hospital Management System</p>
            </div>
        `;

        console.log('Attempting to send approval email to:', doctor.email);
        
        try {
            const emailResult = await transporter.sendMail({
                from: `"Hospital Management System" <${process.env.EMAIL_USER}>`,
                to: doctor.email,
                subject: "Registration Approved - Welcome to Hospital Management System",
                html: welcomeEmail
            });

            console.log('Approval email sent successfully:', {
                to: doctor.email,
                messageId: emailResult.messageId
            });

            res.status(200).json({
                message: "Doctor approved successfully and welcome email sent",
                doctor: {
                    id: doctor._id,
                    username: doctor.username,
                    email: doctor.email,
                    isApproved: true
                }
            });
        } catch (emailError) {
            console.error('Failed to send approval email:', {
                error: emailError.message,
                stack: emailError.stack,
                to: doctor.email
            });
            
            // Even if email fails, still approve the doctor
            res.status(200).json({
                message: "Doctor approved successfully but email could not be sent",
                doctor: {
                    id: doctor._id,
                    username: doctor.username,
                    email: doctor.email,
                    isApproved: true
                },
                emailError: emailError.message
            });
        }
    } catch (error) {
        console.error("Approve doctor error:", {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({ 
            message: error.message,
            error: error
        });
    }
};

// Reject Doctor
const rejectDoctor = async (req, res) => {
    try {
        console.log('Starting doctor rejection process...');
        const { id } = req.params;
        const doctor = await User.findById(id);

        if (!doctor) {
            console.log('Doctor not found with ID:', id);
            return res.status(404).json({ message: "Doctor not found" });
        }

        console.log('Doctor found for rejection:', {
            id: doctor._id,
            email: doctor.email,
            username: doctor.username
        });

        // Send rejection email
        const rejectionEmail = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2c3e50; text-align: center;">Registration Status Update</h1>
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-top: 20px;">
                    <p style="font-size: 16px;">Dear Dr. ${doctor.username},</p>
                    <p style="font-size: 16px;">We regret to inform you that your registration request has been reviewed and unfortunately, we are unable to approve it at this time.</p>
                    <p style="font-size: 16px;">If you believe this is a mistake or would like to discuss this further, please contact our hospital administration at:</p>
                    <ul style="font-size: 16px;">
                        <li>Email: admin@hospital.com</li>
                        <li>Phone: +1 (555) 123-4567</li>
                    </ul>
                    <p style="font-size: 16px;">Thank you for your interest in joining our hospital.</p>
                </div>
                <p style="text-align: center; margin-top: 20px; color: #7f8c8d;">Best regards,<br>Hospital Management System</p>
            </div>
        `;

        console.log('Attempting to send rejection email to:', doctor.email);
        
        try {
            const emailResult = await transporter.sendMail({
                from: `"Hospital Management System" <${process.env.EMAIL_USER}>`,
                to: doctor.email,
                subject: "Registration Status Update - Hospital Management System",
                html: rejectionEmail
            });

            console.log('Rejection email sent successfully:', {
                to: doctor.email,
                messageId: emailResult.messageId
            });
        } catch (emailError) {
            console.error('Failed to send rejection email:', {
                error: emailError.message,
                stack: emailError.stack,
                to: doctor.email
            });
        }

        // Delete the doctor's account
        await User.findByIdAndDelete(id);

        res.status(200).json({ 
            message: "Doctor rejected and account deleted",
            emailSent: true
        });
    } catch (error) {
        console.error("Reject doctor error:", error);
        res.status(500).json({ 
            message: error.message,
            error: error
        });
    }
};

// Approve Receptionist
const approveReceptionist = async (req, res) => {
    try {
        const { id } = req.params;
        const receptionist = await User.findByIdAndUpdate(
            id,
            { isApproved: true, status: "Approved" },
            { new: true }
        );

        if (!receptionist) {
            return res.status(404).json({ message: "Receptionist not found" });
        }

        // Send approval email
        const welcomeEmail = `
            <h1>Welcome to Hospital Management System</h1>
            <p>Dear ${receptionist.username},</p>
            <p>Your registration has been approved by the admin. You can now log in to your account.</p>
            <p>Your login credentials:</p>
            <ul>
                <li>Email: ${receptionist.email}</li>
                <li>Role: Receptionist</li>
            </ul>
            <p>Please log in to complete your profile setup.</p>
            <p>Best regards,<br>Hospital Management System</p>
        `;

        await sendEmailNotification(
            receptionist.email,
            "Registration Approved - Hospital Management System",
            welcomeEmail
        );

        res.status(200).json({
            message: "Receptionist approved successfully",
            receptionist: {
                id: receptionist._id,
                username: receptionist.username,
                email: receptionist.email,
                isApproved: true
            }
        });
    } catch (error) {
        console.error("Approve receptionist error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Reject Receptionist
const rejectReceptionist = async (req, res) => {
    try {
        console.log('Starting receptionist rejection process...');
        const { id } = req.params;
        const receptionist = await User.findById(id);

        if (!receptionist) {
            console.log('Receptionist not found with ID:', id);
            return res.status(404).json({ message: "Receptionist not found" });
        }

        console.log('Receptionist found for rejection:', {
            id: receptionist._id,
            email: receptionist.email,
            username: receptionist.username
        });

        // Send rejection email
        const rejectionEmail = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2c3e50; text-align: center;">Registration Status Update</h1>
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-top: 20px;">
                    <p style="font-size: 16px;">Dear ${receptionist.username},</p>
                    <p style="font-size: 16px;">We regret to inform you that your registration request has been reviewed and unfortunately, we are unable to approve it at this time.</p>
                    <p style="font-size: 16px;">If you believe this is a mistake or would like to discuss this further, please contact our hospital administration at:</p>
                    <ul style="font-size: 16px;">
                        <li>Email: admin@hospital.com</li>
                        <li>Phone: +1 (555) 123-4567</li>
                    </ul>
                    <p style="font-size: 16px;">Thank you for your interest in joining our hospital.</p>
                </div>
                <p style="text-align: center; margin-top: 20px; color: #7f8c8d;">Best regards,<br>Hospital Management System</p>
            </div>
        `;

        console.log('Attempting to send rejection email to:', receptionist.email);
        
        try {
            const emailResult = await transporter.sendMail({
                from: `"Hospital Management System" <${process.env.EMAIL_USER}>`,
                to: receptionist.email,
                subject: "Registration Status Update - Hospital Management System",
                html: rejectionEmail
            });

            console.log('Rejection email sent successfully:', {
                to: receptionist.email,
                messageId: emailResult.messageId
            });
        } catch (emailError) {
            console.error('Failed to send rejection email:', {
                error: emailError.message,
                stack: emailError.stack,
                to: receptionist.email
            });
        }

        // Delete the receptionist's account
        await User.findByIdAndDelete(id);

        res.status(200).json({ 
            message: "Receptionist rejected and account deleted",
            emailSent: true
        });
    } catch (error) {
        console.error("Reject receptionist error:", error);
        res.status(500).json({ 
            message: error.message,
            error: error
        });
    }
};

module.exports = { adminLogin, getPendingStaff, approveStaff, rejectStaff, getAllUsers, registerStaff, approveDoctor, rejectDoctor, approveReceptionist, rejectReceptionist };
