const express = require("express");
const router = express.Router();
const { authMiddleware, protect, restrictTo } = require("../middlewares/authMiddleware");
const appointmentController = require("../controllers/appointmentController");
const { getAllAppointments } = require('../controllers/appointmentController');
const { verifyReceptionist } = require("../middlewares/authMiddleware");

// Logging middleware
router.use((req, res, next) => {
    console.log(`Appointment route accessed: ${req.method} ${req.originalUrl}`);
    next();
});

// Protect all routes
router.use(protect);
router.use(restrictTo('Doctor', 'Receptionist', 'Patient'));

// Route to book an appointment
router.post("/book", appointmentController.bookAppointment);

// Route to get all appointments of a specific doctor
router.get("/doctor/:doctorId", appointmentController.getDoctorAppointments);

// Route to mark an appointment as completed
router.put("/complete/:appointmentId", restrictTo('Doctor'), appointmentController.completeAppointment);

// Route to get available slots for a doctor
router.get("/slots/:doctorId", appointmentController.getAvailableSlots);

// Route to get patient's appointments
router.get("/patient/:patientId", appointmentController.getPatientAppointments);
router.get('/all', verifyReceptionist, getAllAppointments);


module.exports = router;
