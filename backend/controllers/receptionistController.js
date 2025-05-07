const Patient = require("../models/patientModel");
const Appointment = require("../models/appointmentModel");
const User = require("../models/userModel");

// Register new patient with custom ID
exports.registerPatient = async (req, res) => {
  try {
    const { name, email, contactNumber, age, gender, address, emergencyContact } = req.body;

    // Check if patient exists
    const existingPatient = await Patient.findOne({ 
      $or: [{ email }, { contactNumber }] 
    });
    
    if (existingPatient) {
      return res.status(400).json({ 
        message: "Patient with this email or contact number already exists",
        existingId: existingPatient.customId
      });
    }

    const newPatient = new Patient({
      name,
      email,
      contactNumber,
      age,
      gender,
      address,
      emergencyContact
    });

    await newPatient.save();

    res.status(201).json({
      message: "Patient registered successfully",
      patient: {
        customId: newPatient.customId,
        name: newPatient.name,
        contactNumber: newPatient.contactNumber
      }
    });

  } catch (error) {
    console.error("Patient registration error:", error);
    res.status(500).json({ 
      message: "Error registering patient",
      error: error.message 
    });
  }
};

// Get patient by custom ID
exports.getPatientByCustomId = async (req, res) => {
  try {
    const patient = await Patient.findOne({ customId: req.params.customId })
      .select("-__v -createdAt -updatedAt")
      .populate("appointments.doctor", "username specialization");

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.status(200).json(patient);
  } catch (error) {
    console.error("Error fetching patient:", error);
    res.status(500).json({ 
      message: "Error fetching patient details",
      error: error.message 
    });
  }
};

// Book new appointment with patient custom ID
exports.bookAppointment = async (req, res) => {
  try {
    const { patientCustomId, doctorId, date, notes } = req.body;

    // Find patient by custom ID
    const patient = await Patient.findOne({ customId: patientCustomId });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Verify doctor exists and is approved
    const doctor = await User.findOne({ 
      _id: doctorId, 
      role: "Doctor",
      isApproved: true,
      $or: [
        { status: { $in: ['Active', 'Approved'] } },
        { status: { $exists: false } }
      ]
    });
    
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found or not approved" });
    }

    // Check for time slot availability
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      date: new Date(date),
      status: { $ne: "Cancelled" }
    });
    if (existingAppointment) {
      return res.status(400).json({ 
        message: "Doctor already has an appointment at this time",
        conflictingAppointmentId: existingAppointment.customId
      });
    }

    // Create new appointment
    const appointment = new Appointment({
      patient: patient._id,
      doctor: doctorId,
      date,
      notes
    });
    await appointment.save();

    // Update patient's appointment history
    patient.appointments.push({
      _id: appointment._id,
      date: appointment.date,
      status: "Scheduled"
    });
    await patient.save();

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment: {
        customId: appointment.customId,
        patient: patient.name,
        patientCustomId: patient.customId,
        doctor: doctor.username,
        date: appointment.date,
        status: "Scheduled"
      }
    });

  } catch (error) {
    console.error("Appointment booking error:", error);
    res.status(500).json({ 
      message: "Error booking appointment",
      error: error.message 
    });
  }
};

// Update appointment status
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Scheduled", "Completed", "Cancelled", "No Show"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("patient", "name customId")
     .populate("doctor", "username");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Update in patient's record
    await Patient.updateOne(
      { _id: appointment.patient._id, "appointments._id": req.params.id },
      { $set: { "appointments.$.status": status } }
    );

    res.status(200).json({
      message: "Appointment status updated",
      appointment: {
        customId: appointment.customId,
        status: appointment.status,
        patient: appointment.patient.name,
        patientCustomId: appointment.patient.customId,
        doctor: appointment.doctor.username,
        date: appointment.date
      }
    });

  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(500).json({ 
      message: "Error updating appointment",
      error: error.message 
    });
  }
};

// Get all appointments with filters
exports.getAllAppointments = async (req, res) => {
  try {
    const { date, status, doctorId, patientCustomId, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (date) query.date = { $gte: new Date(date) };
    if (status) query.status = status;
    if (doctorId) query.doctor = doctorId;
    if (patientCustomId) {
      const patient = await Patient.findOne({ customId: patientCustomId });
      if (patient) query.patient = patient._id;
    }

    const appointments = await Appointment.find(query)
      .populate("patient", "name customId")
      .populate("doctor", "username specialization")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ date: 1 });

    const total = await Appointment.countDocuments(query);

    res.status(200).json({
      appointments: appointments.map(apt => ({
        customId: apt.customId,
        date: apt.date,
        status: apt.status,
        notes: apt.notes,
        patient: apt.patient,
        doctor: apt.doctor
      })),
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ 
      message: "Error fetching appointments",
      error: error.message 
    });
  }
};