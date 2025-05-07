const Patient = require("../models/patientModel");
const twilio = require("twilio");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const sendSms = require("../utils/sendSms"); // Import your SMS utility
const nodemailer = require('nodemailer');
const crypto = require('crypto');
dotenv.config();

// Constants for OTP handling
const OTP_EXPIRY_MINUTES = 10;
const OTP_RESEND_COOLDOWN_MINUTES = 1;
const MAX_OTP_ATTEMPTS = 3;

// Validate environment variables
const validateEnv = () => {
    const requiredVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER', 'JWT_SECRET'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
};

try {
    validateEnv();
} catch (error) {
    console.error('❌ Environment configuration error:', error.message);
    process.exit(1);
}

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Generate OTP
const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

// Check if OTP can be resent
const canResendOTP = (lastOtpSent) => {
    if (!lastOtpSent) return true;
    const cooldownTime = new Date(lastOtpSent.getTime() + OTP_RESEND_COOLDOWN_MINUTES * 60 * 1000);
    return new Date() > cooldownTime;
};

// Send OTP via email
const sendOTPEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP for Hospital Management System',
    text: `Your OTP is: ${otp}. This OTP will expire in 5 minutes.`
  };

  await transporter.sendMail(mailOptions);
};

// Send OTP via SMS
const sendOTPSMS = async (phone, otp) => {
    try {
        const message = `Your Hospital login OTP is: ${otp}. This OTP will expire in 5 minutes.`;
        await sendSms(phone, message);
        return true;
    } catch (error) {
        console.error('Error sending SMS:', error);
        return false;
    }
};

const generateToken = (patient) => {
    return jwt.sign(
        { 
            id: patient._id, 
            customId: patient.customId,
            role: 'patient'
        }, 
        process.env.JWT_SECRET, 
        {
            expiresIn: "7d",
            issuer: 'hospital-management-system'
        }
    );
};

// Generate and send OTP
const generateOtpHandler = async (req, res) => {
  try {
    const { contactNumber } = req.body;

    // Validate phone number
    if (!contactNumber || !/^[0-9]{10}$/.test(contactNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit phone number'
      });
    }

    // Check if patient exists
    const patient = await Patient.findOne({ contactNumber });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found. Please register first.'
      });
    }

    // Check if OTP can be resent
    if (!canResendOTP(patient.lastOtpSent)) {
      return res.status(429).json({
        success: false,
        message: 'Please wait before requesting another OTP',
        cooldown: OTP_RESEND_COOLDOWN_MINUTES * 60
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Update patient with new OTP
    patient.otp = otp;
    patient.otpExpiry = otpExpiry;
    patient.otpAttempts = 0;
    patient.lastOtpSent = new Date();
    await patient.save();

    // Send OTP via SMS
    const smsSent = await sendOTPSMS(contactNumber, otp);
    if (!smsSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP via SMS'
      });
    }

    res.json({
      success: true,
      message: 'OTP sent successfully',
      cooldown: OTP_RESEND_COOLDOWN_MINUTES * 60
    });
  } catch (error) {
    console.error('Error in generateOtpHandler:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify OTP
const verifyOtpHandler = async (req, res) => {
    try {
        const { contactNumber, otp } = req.body;

        // Validate inputs
        if (!/^[0-9]{10}$/.test(contactNumber) || !/^[0-9]{6}$/.test(otp)) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number or OTP format"
            });
        }

        const patient = await Patient.findOne({ contactNumber });
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        // Check OTP attempts
        if (patient.otpAttempts >= MAX_OTP_ATTEMPTS) {
            return res.status(429).json({
                success: false,
                message: "Maximum OTP attempts exceeded. Please try again later."
            });
        }

        // Verify OTP
        if (!patient.otp || patient.otp !== otp || Date.now() > patient.otpExpiry) {
            patient.otpAttempts = (patient.otpAttempts || 0) + 1;
            await patient.save();
            
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
        }

        // Clear OTP fields and reset attempts
        patient.otp = undefined;
        patient.otpExpiry = undefined;
        patient.otpAttempts = 0;
        patient.lastLogin = new Date();
        await patient.save();

        // Generate token
        const token = generateToken(patient);

        // Send success message via SMS
        const smsSent = await sendOTPSMS(contactNumber, `Login successful. Your Hospital ID: ${patient.customId}`);

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            patient: {
                id: patient._id,
                name: patient.name,
                email: patient.email,
                contactNumber: patient.contactNumber,
                customId: patient.customId
            }
        });
    } catch (error) {
        console.error("OTP verification error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Add this with your other routes
const testSmsHandler = async (req, res) => {
  try {
    // Replace with your actual mobile number (without +91)
    const testNumber = "8919621062"; // Example: 9876543210 with 91 prefix
    const testMessage = "Test SMS from Hospital System";
    
    const success = await sendOTPSMS(testNumber, testMessage);
    
    res.json({ 
      success,
      message: success ? "Test SMS sent successfully" : "Failed to send test SMS",
      number: testNumber
    });
  } catch (error) {
    console.error("Test SMS failed:", error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Send OTP
const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    
    // Check if patient exists
    let patient = await Patient.findOne({ phone });
    
    if (!patient) {
      // Create new patient if doesn't exist
      patient = new Patient({ phone });
    }

    // Generate and save OTP
    const otp = generateOTP();
    patient.otp = otp;
    patient.otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes expiry
    await patient.save();

    // Send OTP via SMS
    const smsSent = await sendOTPSMS(phone, otp);

    if (!smsSent) {
      return res.status(500).json({ 
        success: false,
        message: "Failed to send OTP via SMS" 
      });
    }

    res.status(200).json({ 
      success: true,
      message: 'OTP sent successfully' 
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error sending OTP' 
    });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    const patient = await Patient.findOne({ 
      phone,
      otp,
      otpExpiry: { $gt: Date.now() }
    });

    if (!patient) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired OTP' 
      });
    }

    // Clear OTP
    patient.otp = undefined;
    patient.otpExpiry = undefined;
    await patient.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: patient._id, 
        role: 'patient' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({ 
      success: true,
      token,
      patient: {
        id: patient._id,
        phone: patient.phone
      }
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error verifying OTP' 
    });
  }
};

// Get patient profile
const getProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id).select('-otp -otpExpiry');
    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

// Update patient profile
const updateProfile = async (req, res) => {
  try {
    const allowedUpdates = [
      'name',
      'email',
      'contactNumber',
      'age',
      'gender',
      'address',
      'emergencyContact',
      'bloodGroup',
      'allergies'
    ];

    const updateData = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    const patient = await Patient.findByIdAndUpdate(
      req.user.id,
      updateData,
      { 
        new: true, 
        runValidators: true,
        context: 'query'
      }
    ).select('-otp -otpExpiry -password');

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: patient
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating profile',
      error: error.message 
    });
  }
};

// Get patient appointments
const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user.id })
      .populate('doctorId', 'name specialization')
      .sort({ date: -1 });
    
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments' });
  }
};

// Get patient prescriptions
const getPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.user._id })
      .populate({
        path: 'doctorId',
        select: 'username specialization'
      })
      .populate({
        path: 'appointmentId',
        select: 'date time'
      })
      .sort({ createdAt: -1 });
    
    if (!prescriptions.length) {
      return res.status(200).json([]);
    }

    const formattedPrescriptions = prescriptions.map(prescription => ({
      ...prescription.toObject(),
      doctor: prescription.doctorId ? {
        name: `Dr. ${prescription.doctorId.username}`,
        specialization: prescription.doctorId.specialization
      } : null,
      appointmentTime: prescription.appointmentId ? {
        date: prescription.appointmentId.date,
        time: prescription.appointmentId.time,
        formattedDateTime: new Date(prescription.appointmentId.date).toLocaleString()
      } : null,
      createdAt: prescription.createdAt,
    }));
    
    res.status(200).json(formattedPrescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ message: 'Error fetching prescriptions' });
  }
};

module.exports = { 
    generateOtpHandler, 
    verifyOtpHandler,
    testSmsHandler,
    sendOTP,
    verifyOTP,
    getProfile,
    updateProfile,
    getAppointments,
    getPrescriptions
};