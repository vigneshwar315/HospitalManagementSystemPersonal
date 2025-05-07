const express = require('express');
const router = express.Router();
const Patient = require("../models/patientModel");
const { generateOtpHandler, verifyOtpHandler, testSmsHandler } = require("../controllers/patientController");
const sendSMS = require("../utils/sendSms");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const Appointment = require('../models/appointmentModel');
const Prescription = require('../models/prescriptionModel');
const LabReport = require('../models/labReportModel');
const { authMiddleware, protect } = require('../middlewares/authMiddleware');
const Notification = require('../models/notificationModel');
const path = require('path');
const fs = require('fs');
const patientController = require('../controllers/patientController');

// OTP Authentication
router.post('/send-otp', async (req, res) => {
  try {
    const { phone, contactNumber } = req.body;
    const phoneNumber = phone || contactNumber;
    
    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false,
        message: 'Phone number is required' 
      });
    }

    // Validate phone number format
    if (!/^[0-9]{10}$/.test(phoneNumber)) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide a valid 10-digit phone number' 
      });
    }

    // Check if patient exists
    let patient = await Patient.findOne({ contactNumber: phoneNumber });
    
    if (!patient) {
      // If patient doesn't exist, create a temporary record
      patient = new Patient({
        contactNumber: phoneNumber,
        isTemporary: true, // Mark as temporary until registration is complete
        otpAttempts: 0,
        name: "Temporary User", // Provide a temporary name
        email: `temp_${Date.now()}@temp.com` // Provide a temporary email
      });
    } else if (patient.isTemporary) {
      // If patient is temporary, allow OTP resend
      patient.otpAttempts = 0;
    } else {
      // For existing patients, check OTP cooldown
      const lastOtpSent = patient.lastOtpSent;
      if (lastOtpSent) {
        const cooldownTime = new Date(lastOtpSent.getTime() + 60 * 1000); // 1 minute cooldown
        if (new Date() < cooldownTime) {
          return res.status(429).json({
            success: false,
            message: 'Please wait before requesting another OTP',
            cooldown: Math.ceil((cooldownTime - new Date()) / 1000)
          });
        }
      }
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update patient with new OTP
    patient.otp = otp;
    patient.otpExpiry = otpExpiry;
    patient.lastOtpSent = new Date();
    await patient.save();

    // Send OTP via SMS
    const message = `Your DeccanCare OTP is: ${otp}. Valid for 10 minutes.`;
    const smsSent = await sendSMS(phoneNumber, message);

    if (!smsSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP via SMS'
      });
    }

    res.json({
      success: true,
      message: 'OTP sent successfully',
      cooldown: 60 // 1 minute cooldown
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post('/verify-otp', verifyOtpHandler);

// Test SMS route
router.post('/test-sms', testSmsHandler);

// Check if patient exists
router.post("/check", async (req, res) => {
    try {
        const { contactNumber } = req.body;
        
        if (!contactNumber) {
            return res.status(400).json({
                success: false,
                message: "Contact number is required"
            });
        }

        const patient = await Patient.findOne({ contactNumber });
        
        res.status(200).json({
            success: true,
            exists: !!patient
        });
    } catch (error) {
        console.error("Error checking patient:", error);
        res.status(500).json({
            success: false,
            message: "Error checking patient existence"
        });
    }
});

// Register new patient
router.post("/register", async (req, res) => {
  try {
    const { name, email, contactNumber } = req.body;
    
    if (!name || !email || !contactNumber) {
      return res.status(400).json({ 
        success: false,
        message: 'Name, email and contact number are required' 
      });
    }

    // Check if patient already exists
    const existingPatient = await Patient.findOne({ 
      $or: [{ email }, { contactNumber }] 
    });

    if (existingPatient) {
      return res.status(400).json({ 
        success: false,
        message: 'Patient with this email or phone number already exists' 
      });
    }

    // Create new patient with all required fields
    const patient = new Patient({
      name,
      email,
      contactNumber,
      customId: `P-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      medicalHistory: {
        appointments: [],
        prescriptions: [],
        labReports: [],
        allergies: [],
        conditions: [],
        medications: []
      }
    });

    await patient.save();

    // Send registration success SMS with customId
    const smsMessage = `Registration successful. Your Hospital ID: ${patient.customId}. Please keep this ID safe for future reference.`;
    await sendSMS(contactNumber, smsMessage);

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        phone: patient.contactNumber,
        customId: patient.customId
      }
    });
  } catch (error) {
    console.error('Error registering patient:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error registering patient',
      error: error.message 
    });
  }
});

// Protected routes
router.use(authMiddleware);

// Get patient profile
router.get('/profile', async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id)
      .select('-password -otp -otpExpiry');

    if (!patient) {
      return res.status(404).json({ 
        success: false,
        message: 'Patient not found' 
      });
    }

    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching patient profile' 
    });
  }
});

// Update patient profile
router.put('/profile', async (req, res) => {
  try {
    const updatedPatient = await Patient.findByIdAndUpdate(
      req.user._id,
      { $set: req.body },
      { new: true }
    );
    res.json({ success: true, patient: updatedPatient });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Get patient appointments
router.get('/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user._id })
      .populate('doctorId', 'username specialization')
      .sort({ date: -1 });
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Error fetching appointments' });
  }
});

// Get patient prescriptions
router.get('/prescriptions', authMiddleware, async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.user.id })
      .populate('doctorId', 'username specialization')
      .populate('appointmentId', 'date time')
      .sort({ createdAt: -1 });

    if (!prescriptions.length) {
      return res.status(200).json({ success: true, data: [] });
    }

    res.status(200).json({ success: true, data: prescriptions });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ success: false, message: 'Error fetching prescriptions' });
  }
});

// Get patient lab reports
router.get('/lab-reports', async (req, res) => {
  try {
    const labReports = await LabReport.find({ patientId: req.user._id })
      .populate('doctorId', 'username specialization')
      .sort({ date: -1 });
    res.json(labReports);
  } catch (error) {
    console.error('Error fetching lab reports:', error);
    res.status(500).json({ message: 'Error fetching lab reports' });
  }
});

// Get patient notifications
router.get('/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find({ patientId: req.user._id })
      .sort({ date: -1 });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// Download lab report
router.get('/lab-reports/:reportId/download', async (req, res) => {
  try {
    const report = await LabReport.findOne({
      _id: req.params.reportId,
      patientId: req.user._id
    });
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    res.download(report.filePath);
  } catch (error) {
    console.error('Error downloading lab report:', error);
    res.status(500).json({ message: 'Error downloading lab report' });
  }
});

// Download prescription
router.get('/prescriptions/:prescriptionId/download', async (req, res) => {
  try {
    const prescription = await Prescription.findOne({
      _id: req.params.prescriptionId,
      patientId: req.user._id
    }).populate('doctorId', 'username specialization');
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found or unauthorized' });
    }

    if (!prescription.filePath) {
      return res.status(404).json({ message: 'Prescription file not found' });
    }
    
    const filePath = path.join(__dirname, '..', prescription.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Prescription file not found on server' });
    }
    
    res.download(filePath);
  } catch (error) {
    console.error('Error downloading prescription:', error);
    res.status(500).json({ message: 'Error downloading prescription' });
  }
});

// Get patient medical history
router.get('/medical-history', async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id)
      .populate('medicalHistory.appointments')
      .populate('medicalHistory.prescriptions')
      .populate('medicalHistory.labReports');

    if (!patient) {
      return res.status(404).json({ 
        success: false,
        message: 'Patient not found' 
      });
    }

    res.json({
      success: true,
      data: patient.medicalHistory
    });
  } catch (error) {
    console.error('Error fetching medical history:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching medical history' 
    });
  }
});

module.exports = router;