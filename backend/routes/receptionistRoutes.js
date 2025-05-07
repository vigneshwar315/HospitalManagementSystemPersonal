const express = require("express");
const router = express.Router();
const receptionistController = require("../controllers/receptionistController");
const { verifyReceptionist } = require("../middlewares/authMiddleware");
const Patient = require('../models/patientModel');
const Appointment = require('../models/appointmentModel');
const User = require('../models/userModel');


// Patient Routes
router.post("/patients", verifyReceptionist, receptionistController.registerPatient);
router.get("/patients/:customId", verifyReceptionist, receptionistController.getPatientByCustomId);

// Appointment Routes
router.post("/appointments", verifyReceptionist, receptionistController.bookAppointment);
router.put("/appointments/:id", verifyReceptionist, receptionistController.updateAppointmentStatus);
router.get("/appointments", verifyReceptionist, receptionistController.getAllAppointments);

// Get patient count
router.get('/patients/count',async (req, res) => {
  try {
    const count = await Patient.countDocuments();
    res.json({ success: true, count });
  } catch (error) {
    console.error('Error getting patient count:', error);
    res.status(500).json({ success: false, message: 'Error getting patient count' });
  }
});

// Get all patients
router.get('/patients',async (req, res) => {
  try {
    const patients = await Patient.find().select('-password -otp -otpExpiry');
    res.json({ success: true, data: patients });
  } catch (error) {
    console.error('Error getting patients:', error);
    res.status(500).json({ success: false, message: 'Error getting patients' });
  }
});

// Search patients
router.get('/patients/search',async (req, res) => {
  try {
    const { query } = req.query;
    const patients = await Patient.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { contactNumber: { $regex: query, $options: 'i' } },
        { customId: { $regex: query, $options: 'i' } }
      ]
    }).select('-password -otp -otpExpiry');
    
    res.json({ success: true, data: patients });
  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).json({ success: false, message: 'Error searching patients' });
  }
});

// Register new patient
router.post('/patients/register',async (req, res) => {
  try {
    const { name, email, contactNumber, address, dateOfBirth, gender, bloodGroup } = req.body;
    
    const existingPatient = await Patient.findOne({
      $or: [{ email }, { contactNumber }]
    });

    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: 'Patient with this email or contact number already exists'
      });
    }

    const patient = new Patient({
      name,
      email,
      contactNumber,
      address,
      dateOfBirth,
      gender,
      bloodGroup,
      customId: `P-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    });

    await patient.save();
    res.status(201).json({ success: true, data: patient });
  } catch (error) {
    console.error('Error registering patient:', error);
    res.status(500).json({ success: false, message: 'Error registering patient' });
  }
});

// Get appointments with filters
router.get('/appointments', verifyReceptionist, async (req, res) => {
  try {
    const { date, status, limit, sort } = req.query;
    let query = {};

    if (date) {
      // Match appointments for the specific date
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    if (status) {
      query.status = status;
    }

    let appointmentsQuery = Appointment.find(query)
      .populate('patientId', 'name email contactNumber')
      .populate('doctorId', 'name specialization');

    if (sort) {
      appointmentsQuery = appointmentsQuery.sort(sort);
    }

    if (limit) {
      appointmentsQuery = appointmentsQuery.limit(parseInt(limit));
    }

    const appointments = await appointmentsQuery;

    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments'
    });
  }
});

// Get all approved doctors
router.get('/doctors', verifyReceptionist, async (req, res) => {
  try {
    console.log('Fetching doctors for receptionist...');
    
    // First, let's check all doctors regardless of approval status
    const allDoctors = await User.find({ role: 'Doctor' });
    console.log(`Total doctors in database: ${allDoctors.length}`);
    
    // Log details of all doctors
    allDoctors.forEach(d => {
      console.log(`Doctor: ${d.username}, isApproved: ${d.isApproved}, status: ${d.status}`);
    });
    
    // Now get only approved doctors
    const doctors = await User.find({ 
      role: 'Doctor',
      isApproved: true 
    }).select('username specialization businessHours appointmentDuration');
    
    console.log(`Found ${doctors.length} approved doctors:`, doctors.map(d => ({ 
      id: d._id, 
      username: d.username, 
      specialization: d.specialization,
      isApproved: d.isApproved
    })));
    
    // If no approved doctors found, check if there are any doctors with isApproved=false
    if (doctors.length === 0 && allDoctors.length > 0) {
      console.log('No approved doctors found, but there are doctors in the database.');
      console.log('This suggests that doctors exist but are not approved.');
    }
    
    res.json({ 
      success: true, 
      data: doctors 
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching doctors' 
    });
  }
});

module.exports = router;