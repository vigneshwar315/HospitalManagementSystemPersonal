const User = require("../models/userModel"); // Use User model
const Patient = require("../models/patientModel");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const Appointment = require("../models/appointmentModel"); // Added missing import
const Prescription = require("../models/prescriptionModel"); // Add Prescription model import


// Fetch patient details by customId (For Doctors)

exports.searchPatient = async (req, res) => {
  try {
    const { searchTerm } = req.params;
    const patients = await Patient.find({
      $or: [
        { customId: searchTerm },
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: searchTerm },
        { contactNumber: searchTerm }
      ]
    });
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



exports.getPatientDetails = async (req, res) => {
  console.log('Fetching patient with customId:', req.params.customId);
  try {
    const patient = await Patient.findOne({ customId: req.params.customId })
      .select('-password -otp -otpExpiry')
      .populate('medicalHistory.doctorId', 'name specialization avatar')
      .lean();

    console.log('Found patient:', patient?._id);

    if (!patient) {
      console.log('Patient not found');
      return res.status(404).json({ message: "Patient not found" });
    }

    const hasRelationship = await Appointment.exists({
      doctorId: req.user.id,
      patientId: patient._id
    });

    if (!hasRelationship) {
      console.log('No doctor-patient relationship');
      return res.status(403).json({ message: "Not authorized to view this patient" });
    }

    const appointments = await Appointment.find({
      patientId: patient._id,
      status: { $in: ['Scheduled', 'Confirmed'] },
      date: { $gte: new Date() }
    })
    .sort({ date: 1 })
    .populate('doctorId', 'name specialization')
    .lean();

    console.log('Found appointments:', appointments.length);

    res.status(200).json({
      ...patient,
      upcomingAppointments: appointments
    });
  } catch (error) {
    console.error("Patient details error:", error);
    res.status(500).json({ 
      message: "Error fetching patient details",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getPatientPrescriptions = async (req, res) => {
  try {
    const patient = await Patient.findOne({ customId: req.params.customId });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const prescriptions = await Prescription.find({ patientId: patient._id })
      .sort({ createdAt: -1 })
      .populate('doctorId', 'name specialization');

    res.status(200).json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get doctor notifications (Fix: Use User model instead of Doctor)
exports.getNotifications = async (req, res) => {
  try {
    const doctor = await User.findById(req.user.id)
      .select('notifications')
      .populate('notifications.sender', 'name role');
    
    res.status(200).json({
      notifications: doctor.notifications.map(n => ({
        id: n._id,
        title: n.title || 'Notification',
        message: n.message,
        type: n.type || 'general',
        read: n.read,
        date: n.createdAt,
        sender: n.sender
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Mark a specific notification as read (Fix: Use User model)
exports.markNotificationAsRead = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const { notificationId } = req.params;

        const doctor = await User.findOne({ _id: doctorId, role: "Doctor" });
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        // Find notification by ID and mark it as read
        const notification = doctor.notifications.id(notificationId);
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        notification.read = true;
        await doctor.save();

        res.status(200).json({ message: "Notification marked as read", notification });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Clear all read notifications (Fix: Use User model)
exports.clearReadNotifications = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const doctor = await User.findOne({ _id: doctorId, role: "Doctor" });

        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        // Remove only notifications that are marked as read
        doctor.notifications = doctor.notifications.filter(notification => !notification.read);
        await doctor.save();

        res.status(200).json({ message: "Read notifications cleared successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Generate Prescription PDF
exports.generatePrescriptionPDF = async (req, res) => {
  try {
    const { patientId, appointmentId, diagnosis, medications, notes } = req.body;

    // Validate required fields
    if (!patientId || !appointmentId) {
      return res.status(400).json({ 
        success: false,
        message: "Patient ID and Appointment ID are required" 
      });
    }

    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "At least one medication is required" 
      });
    }

    // Find patient, appointment and doctor details
    const [patient, appointment, doctor] = await Promise.all([
      Patient.findById(patientId),
      Appointment.findById(appointmentId),
      User.findById(req.user.id).select('username specialization')
    ]);

    if (!patient) {
      return res.status(404).json({ 
        success: false,
        message: "Patient not found" 
      });
    }

    if (!appointment) {
      return res.status(404).json({ 
        success: false,
        message: "Appointment not found" 
      });
    }

    if (!doctor) {
      return res.status(404).json({ 
        success: false,
        message: "Doctor not found" 
      });
    }

    // Verify this is the correct doctor for this appointment
    if (appointment.doctorId.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: "Unauthorized to generate prescription for this appointment" 
      });
    }

    // Create prescriptions directory if it doesn't exist
    const prescriptionsDir = path.join(__dirname, "..", "prescriptions");
    if (!fs.existsSync(prescriptionsDir)) {
      fs.mkdirSync(prescriptionsDir, { recursive: true });
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const fileName = `prescription_${patient.customId}_${timestamp}.pdf`;
    const filePath = path.join(prescriptionsDir, fileName);

    // Create PDF with promise-based stream handling
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(filePath);

    // Handle stream errors
    writeStream.on('error', (err) => {
      console.error('PDF write stream error:', err);
      return res.status(500).json({ 
        success: false,
        message: "Error generating prescription PDF" 
      });
    });
    
    // Pipe the PDF to the write stream
    doc.pipe(writeStream);

    // --- PDF Content ---
    // Title and subheading
    doc.fontSize(22).font('Helvetica-Bold').text('THE DECCANCARE', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(16).font('Helvetica').text('Medical prescription', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).font('Helvetica').text(`Patient Name: ${patient.name}`);
    doc.text(`Patient ID: ${patient.customId}`);
    doc.text(`Age: ${patient.age || 'N/A'}`);
    doc.text(`Gender: ${patient.gender || 'N/A'}`);
    doc.moveDown();

    doc.text(`Doctor: Dr. ${doctor.username}`);
    doc.text(`Specialization: ${doctor.specialization || 'General Physician'}`);
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`); // DD/MM/YYYY
    doc.moveDown();

    // Diagnosis
    doc.font('Helvetica-Bold').text('Diagnosis:', { underline: true });
    doc.font('Helvetica').text(diagnosis || '');
    doc.moveDown();

    // Medications
    doc.font('Helvetica-Bold').text('Prescribed Medications:', { underline: true });
    doc.font('Helvetica');
    if (medications && medications.length > 0) {
      medications.forEach((med, index) => {
        doc.text(`${index + 1}. ${med.name}`);
        doc.text(`   Dosage: ${med.dosage}`);
        doc.text(`   Frequency: ${med.frequency}`);
        doc.text(`   Duration: ${med.duration}`);
        if (med.instructions) doc.text(`   Instructions: ${med.instructions}`);
        doc.moveDown(0.5);
      });
    } else {
      doc.text("No medications prescribed");
    }
    doc.moveDown();

    // Notes
    doc.font('Helvetica-Bold').text('Additional Notes:', { underline: true });
    doc.font('Helvetica').text(notes || '');

    // Footer (bottom of page)
    doc.moveDown(8); // Add vertical space to push footer to bottom
    const bottomY = doc.page.height - 100;
    doc.fontSize(12).text('This is a digital prescription', 0, bottomY, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 0, bottomY + 20, { align: 'right' });
    doc.text(`Dr. ${doctor.username}`, { align: 'right' });
    doc.text(`${doctor.specialization || 'General Physician'}`, { align: 'right' });

    // End document and handle stream completion
    doc.end();

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // Create prescription record
    const prescription = new Prescription({
      doctorId: req.user.id,
      patientId: patient._id,
      appointmentId: appointment._id,
      diagnosis,
      medications,
      notes,
      filePath: fileName,
      status: 'Completed'
    });

    await prescription.save();

    // Mark appointment as having prescription generated
    await Appointment.findByIdAndUpdate(appointmentId, {
      prescriptionGenerated: true,
      status: 'Completed'
    });

    // Add to patient's medical history
    await Patient.findByIdAndUpdate(patient._id, {
      $push: {
        medicalHistory: {
          date: new Date(),
          doctorId: req.user.id,
          diagnosis,
          prescriptionId: prescription._id
        }
      }
    });

    // Return success response with fileName
    res.status(200).json({
      success: true,
      message: "Prescription generated successfully",
      prescriptionId: prescription._id,
      fileName
    });

  } catch (error) {
    console.error("Prescription generation error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error generating prescription",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get current doctor profile
// In doctorController.js
exports.getCurrentDoctor = async (req, res) => {
  try {
    const doctor = await User.findById(req.user.id)
      .select('-password -notifications')
      .lean();
    
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Format response to match frontend expectations
    const response = {
      username: doctor.username,
      specialization: doctor.specialization || 'General Practitioner',
      avatar: doctor.avatar || null,
      email: doctor.email,
      contactNumber: doctor.contactNumber,
      experience: doctor.experience || 0,
      qualifications: doctor.qualifications || [],
      bio: doctor.bio || ''
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get doctor statistics
// In doctorController.js
exports.getDoctorStats = async (req, res) => {
  try {
    const doctorId = req.user.id;
    
    // Get today's date range in IST
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    todayStart.setMinutes(todayStart.getMinutes() - todayStart.getTimezoneOffset() - 330);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    todayEnd.setMinutes(todayEnd.getMinutes() - todayEnd.getTimezoneOffset() - 330);

    const stats = {
      totalAppointments: await Appointment.countDocuments({ doctorId }),
      patientsToday: await Appointment.countDocuments({ 
        doctorId,
        date: { 
          $gte: todayStart,
          $lt: todayEnd
        },
        status: { $ne: 'Cancelled' }
      }),
      pendingPrescriptions: await Appointment.countDocuments({
        doctorId,
        status: 'Scheduled',
        prescriptionGenerated: { $ne: true }
      }),
      completedVisits: await Appointment.countDocuments({
        doctorId,
        status: 'Completed'
      }),
      cancellationRate: await calculateCancellationRate(doctorId),
      averageRating: await calculateAverageRating(doctorId)
    };

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

async function calculateCancellationRate(doctorId) {
  const total = await Appointment.countDocuments({ doctorId });
  if (total === 0) return '0%';
  
  const cancelled = await Appointment.countDocuments({ 
    doctorId, 
    status: 'Cancelled' 
  });
  
  return `${Math.round((cancelled / total) * 100)}%`;
}

async function calculateAverageRating(doctorId) {
  // Implement your rating calculation logic here
  return 4.5; // Example value
}
// Make sure this is at the bottom of your doctorController.js
// Add this new function to get all patients
exports.getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find({}).select('name age gender customId diagnosis medicalHistory');
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCurrentDoctor = async (req, res) => {
  try {
    const doctor = await User.findById(req.user.id)
      .select('username email avatar specialization contactNumber experience qualifications bio')
      .lean();
    
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.status(200).json({
      ...doctor,
      name: doctor.username, // For frontend compatibility
      fullProfile: true // Flag to indicate complete profile
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Enhanced getNotifications
exports.getNotifications = async (req, res) => {
  try {
    const doctor = await User.findById(req.user.id)
      .select('notifications')
      .populate('notifications.sender', 'name role');
    
    // Return empty array if no notifications rather than error
    res.status(200).json({
      notifications: doctor.notifications.map(n => ({
        id: n._id,
        title: n.title || 'Notification',
        message: n.message,
        type: n.type || 'general',
        read: n.read,
        date: n.createdAt,
        sender: n.sender
      })) || [] // Ensure array is returned even if null
    });
  } catch (error) {
    res.status(200).json({ notifications: [] }); // Return empty array on error
  }
};

// Get doctor appointments
exports.getDoctorAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.user.id })
      .populate({
        path: 'patientId',
        select: 'name age gender avatar customId contactNumber email'
      })
      .populate({
        path: 'doctorId',
        select: 'username specialization'
      })
      .sort({ date: 1, time: 1 })
      .lean();

    // Ensure all patient and doctor details are properly formatted
    const formattedAppointments = appointments.map(appointment => ({
      ...appointment,
      patient: appointment.patientId ? {
        _id: appointment.patientId._id,
        name: appointment.patientId.name,
        age: appointment.patientId.age,
        gender: appointment.patientId.gender,
        avatar: appointment.patientId.avatar,
        customId: appointment.patientId.customId,
        contactNumber: appointment.patientId.contactNumber,
        email: appointment.patientId.email
      } : null,
      doctor: appointment.doctorId ? {
        _id: appointment.doctorId._id,
        name: appointment.doctorId.username,
        specialization: appointment.doctorId.specialization
      } : null
    }));

    res.status(200).json(formattedAppointments);
  } catch (error) {
    console.error("Get doctor appointments error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching appointments",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// controllers/doctorController.js
exports.createPrescription = async (req, res) => {
  try {
    const { patientId, appointmentId, diagnosis, notes, fileName } = req.body;
    const medications = JSON.parse(req.body.medications);
    // Ensure every medication has a duration
    const safeMedications = (Array.isArray(medications) ? medications : []).map(med => ({
      ...med,
      duration: med.duration || "N/A"
    }));
    
    // Validate required fields
    if (!patientId || !appointmentId || !diagnosis || !safeMedications || !safeMedications.length) {
      return res.status(400).json({ 
        success: false,
        message: "Missing required fields" 
      });
    }

    // Validate appointment exists and belongs to the doctor (no date check)
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId: req.user.id,
      patientId: patientId
    });

    if (!appointment) {
      return res.status(404).json({ 
        success: false,
        message: "Appointment not found or unauthorized" 
      });
    }

    // Set filePath: prefer uploaded file, else generated fileName from body
    let filePath = undefined;
    if (req.file && req.file.filename) {
      filePath = req.file.filename;
    } else if (fileName) {
      filePath = fileName;
    }
    // Validation: filePath must be set
    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: 'filePath is required for prescription. Please upload a file or provide a generated fileName.'
      });
    }

    // Create prescription
    const prescription = new Prescription({
      doctorId: req.user.id,
      patientId,
      appointmentId,
      diagnosis,
      medications: safeMedications,
      notes,
      filePath,
      status: 'Completed'
    });

    await prescription.save();
    
    // Update appointment status
    appointment.status = 'Completed';
    appointment.prescriptionGenerated = true;
    await appointment.save();
    
    // Add to patient's medical history
    await Patient.findByIdAndUpdate(patientId, {
      $push: {
        medicalHistory: {
          date: new Date(),
          doctorId: req.user.id,
          diagnosis,
          prescriptionId: prescription._id,
          notes
        }
      }
    });

    // Notify patient
    await Patient.findByIdAndUpdate(patientId, {
      $push: {
        notifications: {
          title: 'New Prescription',
          message: `Dr. ${req.user.username} has created a new prescription for you`,
          type: 'prescription',
          read: false
        }
      }
    });

    res.status(201).json({
      success: true,
      message: "Prescription created successfully",
      prescription: await Prescription.findById(prescription._id)
        .populate('doctorId', 'username specialization')
        .populate('patientId', 'name customId')
        .populate('appointmentId', 'date time')
    });
  } catch (error) {
    console.error("Create prescription error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error creating prescription",
      error: error.message 
    });
  }
};

exports.getPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ doctorId: req.user.id })
      .populate({
        path: 'patientId',
        select: 'name customId'
      })
      .sort({ createdAt: -1 })
      .lean();

    // Always map patientId to patient field for frontend
    const formattedPrescriptions = prescriptions.map(prescription => ({
      ...prescription,
      patient: prescription.patientId ? {
        _id: prescription.patientId._id,
        name: prescription.patientId.name,
        customId: prescription.patientId.customId
      } : null,
      createdAt: prescription.createdAt,
      status: prescription.status || 'Completed'
    }));

    res.status(200).json(formattedPrescriptions);
  } catch (error) {
    console.error("Get prescriptions error:", error);
    res.status(500).json({ 
      message: "Error fetching prescriptions",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.downloadPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      console.error('Prescription not found for ID:', req.params.id);
      return res.status(404).json({ message: 'Prescription not found' });
    }

    if (prescription.doctorId.toString() !== req.user.id) {
      console.error('Unauthorized download attempt by user:', req.user.id, 'for prescription:', prescription._id);
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Check if filePath exists
    if (!prescription.filePath) {
      console.error('Prescription filePath missing in DB for prescription:', prescription._id);
      return res.status(404).json({ message: 'Prescription file not found (no filePath)' });
    }

    // Construct the full file path
    const prescriptionsDir = path.join(__dirname, "..", "prescriptions");
    const filePath = path.join(prescriptionsDir, prescription.filePath);
    const fileExists = fs.existsSync(filePath);
    console.log('Attempting download:', {
      prescriptionId: prescription._id,
      filePath,
      fileExists
    });

    // Check if file exists
    if (!fileExists) {
      console.error('Prescription file not found on disk:', filePath);
      return res.status(404).json({ message: 'Prescription file not found' });
    }

    res.download(filePath);
  } catch (error) {
    console.error("Download prescription error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error downloading prescription",
      error: error.message 
    });
  }
};

// In doctorController.js
exports.markAppointmentComplete = async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user.id },
      { status: 'Completed' },
      { new: true }
    );
    
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// In doctorController.js
exports.completeAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { 
        _id: req.params.id, 
        doctorId: req.user.id,
        status: 'Scheduled'
      },
      { 
        status: 'Completed',
        completedAt: new Date()
      },
      { new: true }
    ).populate('patientId', 'name email customId');
    
    if (!appointment) {
      return res.status(404).json({ 
        success: false,
        message: "Appointment not found, already completed, or not authorized" 
      });
    }

    // Add notification to patient
    await Patient.findByIdAndUpdate(appointment.patientId._id, {
      $push: {
        notifications: {
          message: `Your appointment with Dr. ${req.user.name} has been completed`,
          type: "appointment",
          appointmentId: appointment._id,
          read: false
        }
      }
    });

    // Update doctor's stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'stats.completedAppointments': 1 }
    });

    res.status(200).json({
      success: true,
      message: "Appointment marked as completed",
      appointment
    });
  } catch (error) {
    console.error("Complete appointment error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error completing appointment",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to generate time slots
const generateTimeSlots = (startTime, endTime, duration) => {
  const slots = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  let currentHour = startHour;
  let currentMinute = startMinute;
  
  while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
    slots.push(`${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`);
    
    currentMinute += duration;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    }
  }
  
  return slots;
};

// Get available doctors and their time slots for a given date
exports.getAvailableDoctors = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ 
        success: false,
        message: "Date is required" 
      });
    }

    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid date format" 
      });
    }

    // Get day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = appointmentDate.getDay();

    // Get all approved doctors
    const doctors = await User.find({ 
      role: "Doctor",
      status: "Approved"
    }).select('name specialization avatar businessHours appointmentDuration');

    // Get all appointments for the given date
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      date: { $gte: startOfDay, $lt: endOfDay },
      status: { $ne: "Cancelled" }
    }).select('doctorId date');

    // Create a map of booked time slots for each doctor
    const bookedSlots = {};
    appointments.forEach(apt => {
      const doctorId = apt.doctorId.toString();
      const time = apt.date.getHours().toString().padStart(2, '0') + ':' + 
                  apt.date.getMinutes().toString().padStart(2, '0');
      if (!bookedSlots[doctorId]) {
        bookedSlots[doctorId] = new Set();
      }
      bookedSlots[doctorId].add(time);
    });

    // Prepare response with available time slots for each doctor
    const availableDoctors = doctors.map(doctor => {
      const businessDay = doctor.businessHours.find(h => h.day === dayOfWeek);
      
      if (!businessDay || !businessDay.isWorking) {
        return {
          _id: doctor._id,
          name: doctor.name,
          specialization: doctor.specialization,
          avatar: doctor.avatar,
          availableSlots: [],
          message: "Not available on this day"
        };
      }

      // Generate all possible time slots based on business hours and appointment duration
      const allTimeSlots = generateTimeSlots(
        businessDay.startTime,
        businessDay.endTime,
        doctor.appointmentDuration || 30
      );

      // Filter out booked slots
      const bookedTimes = bookedSlots[doctor._id.toString()] || new Set();
      const availableSlots = allTimeSlots.filter(slot => !bookedTimes.has(slot));
      
      return {
        _id: doctor._id,
        name: doctor.name,
        specialization: doctor.specialization,
        avatar: doctor.avatar,
        availableSlots,
        businessHours: {
          start: businessDay.startTime,
          end: businessDay.endTime
        }
      };
    });

    res.status(200).json({
      success: true,
      data: availableDoctors
    });

  } catch (error) {
    console.error("Get available doctors error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching available doctors",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getLatestPatientAppointment = async (req, res) => {
  try {
    const { patientId } = req.params;
    const appointment = await Appointment.findOne({
      patientId,
      doctorId: req.user.id,
      status: 'Scheduled'
    })
    .sort({ date: -1 })
    .select('_id date status');

    if (!appointment) {
      return res.status(404).json({ 
        success: false,
        message: "No scheduled appointment found for this patient" 
      });
    }

    res.status(200).json(appointment);
  } catch (error) {
    console.error("Get latest appointment error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching latest appointment",
      error: error.message 
    });
  }
};

// For Patients sidebar: Only show patients booked with this doctor
exports.getBookedPatients = async (req, res) => {
  try {
    // Find all patientIds with non-cancelled appointments for this doctor
    const appointments = await Appointment.find({
      doctorId: req.user.id,
      status: { $ne: 'Cancelled' }
    }).distinct('patientId');

    const patients = await Patient.find({
      _id: { $in: appointments }
    }).select('name age gender customId diagnosis medicalHistory');

    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};