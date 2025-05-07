const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { protect, restrictTo, authMiddleware } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const User = require('../models/userModel');
const Appointment = require('../models/appointmentModel');

// Protect all routes
router.use(protect);
router.use(restrictTo('Doctor', 'Receptionist', 'Patient'));

// Get available doctors and their time slots

// Prescription routes - keep these at the top
router.post('/prescriptions/generate', doctorController.generatePrescriptionPDF);
router.get('/prescriptions', doctorController.getPrescriptions);
router.get('/prescriptions/:id/download', doctorController.downloadPrescription);
router.post('/prescriptions', upload.single('prescription'), doctorController.createPrescription);
router.get('/appointments/latest/:patientId', doctorController.getLatestPatientAppointment);

// Patient APIs
router.get('/patients', doctorController.getAllPatients);
router.get('/patients/booked', doctorController.getBookedPatients);
router.get('/patients/:customId', doctorController.getPatientDetails);
router.get('/patients/:customId/prescriptions', doctorController.getPatientPrescriptions);

// Notifications
router.get('/notifications', doctorController.getNotifications);
router.patch('/notifications/read/:notificationId', doctorController.markNotificationAsRead);
router.delete('/notifications/clear', doctorController.clearReadNotifications);

// Profile and stats
router.get('/me', doctorController.getCurrentDoctor);
router.get('/stats', doctorController.getDoctorStats);

// Appointments
router.get('/appointments', doctorController.getDoctorAppointments);
router.put('/appointments/:id/complete', doctorController.completeAppointment);

// Protected routes
router.use(authMiddleware);

// Get doctor profile
router.get('/profile', async (req, res) => {
  try {
    const doctor = await User.findById(req.user.id)
      .select('-password -resetPasswordToken -resetPasswordExpires');

    if (!doctor || doctor.role !== 'Doctor') {
      return res.status(404).json({ 
        success: false,
        message: 'Doctor not found' 
      });
    }

    res.json({
      success: true,
      data: doctor
    });
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching doctor profile' 
    });
  }
});

// Update doctor profile
router.put('/profile', async (req, res) => {
  try {
    const doctor = await User.findById(req.user.id);

    if (!doctor || doctor.role !== 'Doctor') {
      return res.status(404).json({ 
        success: false,
        message: 'Doctor not found' 
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'username',
      'contactNumber',
      'specialization',
      'businessHours',
      'appointmentDuration'
    ];

    allowedUpdates.forEach(update => {
      if (req.body[update] !== undefined) {
        doctor[update] = req.body[update];
      }
    });

    await doctor.save();

    res.json({
      success: true,
      data: doctor
    });
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating doctor profile' 
    });
  }
});

module.exports = router;
