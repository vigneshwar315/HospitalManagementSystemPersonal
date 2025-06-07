const mongoose = require('mongoose');
const Patient = require("../models/patientModel");
const User = require("../models/userModel");
const Appointment = require("../models/appointmentModel");

// Helper function to format time to HH:mm
const formatTime = (date) => {
  return date.toTimeString().slice(0, 5);
};


const combineDateAndTime = (date, time) => {
  const [hours, minutes] = time.split(':');
  const combined = new Date(date);
  combined.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return combined;
};

exports.bookAppointment = async (req, res) => {
  try {
    console.log("Raw request body:", req.body);
    const { doctorId, patientId, date, time, notes, status } = req.body;

   
    if (!doctorId || !patientId || !date || !time) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID, Patient ID, Date and Time are required"
      });
    }

    // For patient users, verify they can only book for themselves
    if (req.user.role === 'Patient' && req.user._id.toString() !== patientId) {
      return res.status(403).json({
        success: false,
        message: "You can only book appointments for yourself"
      });
    }

    // Parse and validate date
    const appointmentDate = combineDateAndTime(new Date(date), time);
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid date format" 
      });
    }

    // Check if date is in the past
    const now = new Date();
    if (appointmentDate < now) {
      return res.status(400).json({ 
        success: false,
        message: "Cannot book appointments in the past" 
      });
    }

    // Validate doctor exists and is approved
    const doctor = await User.findOne({
      _id: doctorId,
      role: "Doctor",
      isApproved: true,
      status: "Approved"
    });

    if (!doctor) {
      return res.status(404).json({ 
        success: false,
        message: "Doctor not found or not approved" 
      });
    }

    // Check doctor's business hours for the appointment day
    const dayOfWeek = appointmentDate.getDay();
    const businessHours = doctor.businessHours.find(h => h.day === dayOfWeek);
    
    if (!businessHours || !businessHours.isWorking) {
      return res.status(400).json({
        success: false,
        message: "Doctor is not available on this day"
      });
    }

    // Convert appointment time to 24-hour format for comparison
    const [appointmentHour, appointmentMinute] = time.split(':').map(Number);
    const [startHour, startMinute] = businessHours.startTime.split(':').map(Number);
    const [endHour, endMinute] = businessHours.endTime.split(':').map(Number);

    // Convert times to minutes for easy comparison
    const appointmentTimeInMinutes = appointmentHour * 60 + appointmentMinute;
    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;

    if (appointmentTimeInMinutes < startTimeInMinutes || appointmentTimeInMinutes >= endTimeInMinutes) {
      return res.status(400).json({
        success: false,
        message: `Appointments are only available between ${businessHours.startTime} and ${businessHours.endTime}`
      });
    }

    // Rest of the existing appointment booking logic
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ 
        success: false,
        message: "Patient not found" 
      });
    }

    // Check for overlapping appointments
    const appointmentDuration = doctor.appointmentDuration || 30; // in minutes
    const buffer = appointmentDuration * 60 * 1000; // Convert to milliseconds
    
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date: {
        $gte: new Date(appointmentDate.getTime() - buffer),
        $lt: new Date(appointmentDate.getTime() + buffer)
      },
      status: { $ne: "Cancelled" }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: "This time slot is already booked. Please choose another time."
      });
    }

    // Create appointment
    const newAppointment = new Appointment({
      doctorId,
      patientId,
      date: appointmentDate,
      time: formatTime(appointmentDate),
      notes,
      status: status || "Scheduled"
    });

    const savedAppointment = await newAppointment.save();

    // Add notifications
    await User.findByIdAndUpdate(doctorId, {
      $push: {
        notifications: {
          message: `New appointment with ${patient.name} at ${formatTime(appointmentDate)}`,
          read: false,
          type: "appointment",
          appointmentId: savedAppointment._id
        }
      }
    });

    await Patient.findByIdAndUpdate(patientId, {
      $push: {
        notifications: {
          message: `Appointment booked with Dr. ${doctor.username} at ${formatTime(appointmentDate)}`,
          read: false,
          type: "appointment",
          appointmentId: savedAppointment._id
        }
      }
    });

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      appointment: {
        ...savedAppointment.toObject(),
        doctor: {
          _id: doctor._id,
          username: doctor.username,
          specialization: doctor.specialization
        },
        patient: {
          _id: patient._id,
          name: patient.name
        }
      }
    });

  } catch (error) {
    console.error("Appointment booking error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to book appointment",
      error: error.message
    });
  }
};

// Get all appointments for a specific doctor
exports.getDoctorAppointments = async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const appointments = await Appointment.find({ 
      doctorId,
      status: { $ne: 'Cancelled' }
    })
    .populate('patientId', 'name age gender customId')
    .populate('doctorId', 'username specialization')
    .sort({ date: 1, time: 1 });

    res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error("Error fetching doctor appointments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointments",
      error: error.message
    });
  }
};

// Mark an appointment as completed
exports.completeAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    const appointment = await Appointment.findOneAndUpdate(
      { 
        _id: appointmentId,
        status: 'Scheduled'
      },
      { 
        status: 'Completed',
        completedAt: new Date()
      },
      { new: true }
    )
    .populate('patientId', 'name')
    .populate('doctorId', 'username');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found or already completed"
      });
    }

    res.status(200).json({
      success: true,
      message: "Appointment marked as completed",
      data: appointment
    });
  } catch (error) {
    console.error("Error completing appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete appointment",
      error: error.message
    });
  }
};

// Get available slots for a doctor
exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required"
      });
    }

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // Get booked appointments for the day
    const bookedAppointments = await Appointment.find({
      doctorId,
      date: { $gte: dayStart, $lte: dayEnd },
      status: { $ne: 'Cancelled' }
    });
    const bookedSlots = new Set(bookedAppointments.map(apt => apt.time));

    // Generate common slots for all doctors: 09:00 to 17:00, every 30 minutes
    const slots = [];
    const startHour = 9;
    const endHour = 17;
    const slotDuration = 30; // minutes

    let current = new Date(dayStart);
    current.setHours(startHour, 0, 0, 0);
    const end = new Date(dayStart);
    end.setHours(endHour, 0, 0, 0);

    while (current < end) {
      const time = `${current.getHours().toString().padStart(2, '0')}:${current.getMinutes().toString().padStart(2, '0')}`;
      slots.push({
        time,
        available: !bookedSlots.has(time)
      });
      current.setMinutes(current.getMinutes() + slotDuration);
    }

    // Add logging for debugging
    console.log("Generated slots for doctor", doctorId, "on", date, ":", slots);

    res.status(200).json({
      success: true,
      data: slots
    });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch available slots",
      error: error.message
    });
  }
};

// Get appointments for a specific patient
exports.getPatientAppointments = async (req, res) => {
  try {
    const { patientId } = req.params;

    // For patients, verify they can only see their own appointments
    if (req.user.role === 'Patient' && req.user._id.toString() !== patientId) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own appointments"
      });
    }

    const appointments = await Appointment.find({ patientId })
      .populate('doctorId', 'username specialization')
      .populate('patientId', 'name customId')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error("Error fetching patient appointments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointments",
      error: error.message
    });
  }
};
// Get all appointments (for Receptionist Dashboard)
exports.getAllAppointments = async (req, res) => {
  try {
    const { date, limit, sort } = req.query;

    const filter = {};
    if (date) {
      const start = new Date(date + 'T00:00:00.000Z');  // Fix timezone
      const end = new Date(date + 'T23:59:59.999Z');
      filter.date = { $gte: start, $lte: end };
    }

    const appointments = await Appointment.find(filter)
      .populate('patientId', 'name')
      .populate('doctorId', 'username')
      .sort(sort || '-date')
      .limit(Number(limit) || 10);

    res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching all appointments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch appointments', error: error.message });
  }
};

