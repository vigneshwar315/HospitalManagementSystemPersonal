const Prescription = require('../models/prescriptionModel');
const Appointment = require('../models/appointmentModel');
const User = require('../models/userModel');
const fs = require('fs').promises;
const path = require('path');


exports.createPrescription = async (req, res) => {
  try {
    const { appointmentId, diagnosis, medications, notes, fileName } = req.body;
    const doctorId = req.user._id;

    
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.doctorId.toString() !== doctorId.toString()) {
      return res.status(403).json({ message: 'Not authorized to create prescription for this appointment' });
    }

    // Check if prescription already exists or not
    const existingPrescription = await Prescription.findOne({ appointmentId });
    if (existingPrescription) {
      return res.status(400).json({ message: 'Prescription already exists for this appointment' });
    }

    // Set filePath: prefer uploaded files
    let filePath = undefined;
    if (req.file && req.file.filename) {
      filePath = `prescriptions/${req.file.filename}`;
    } else if (fileName) {
      filePath = `prescriptions/${fileName}`;
    }

    // Create prescription
    const prescription = new Prescription({
      appointmentId,
      doctorId,
      patientId: appointment.patientId,
      diagnosis,
      medications,
      filePath,
      notes
    });

    await prescription.save();

    // Update appointment status
    appointment.status = 'completed';
    await appointment.save();

    res.status(201).json({
      message: 'Prescription created successfully',
      prescription
    });
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({ message: 'Error creating prescription', error: error.message });
  }
};

// Get prescriptions for a patient
exports.getPatientPrescriptions = async (req, res) => {
  try {
    const { patientId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Check if user is authorized to view these prescriptions
    if (userRole !== 'admin' && userRole !== 'doctor' && userId.toString() !== patientId) {
      return res.status(403).json({ message: 'Not authorized to view these prescriptions' });
    }

    const prescriptions = await Prescription.find({ patientId })
      .populate('doctorId', 'name specialization')
      .populate('appointmentId', 'date time')
      .sort({ createdAt: -1 });

    res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    res.status(500).json({ message: 'Error fetching prescriptions', error: error.message });
  }
};

// Get prescriptions created by a doctor
exports.getDoctorPrescriptions = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const prescriptions = await Prescription.find({ doctorId })
      .populate('patientId', 'name')
      .populate('appointmentId', 'date time')
      .sort({ createdAt: -1 });

    res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching doctor prescriptions:', error);
    res.status(500).json({ message: 'Error fetching prescriptions', error: error.message });
  }
};

// Download prescription file
exports.downloadPrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Check if user is authorized to download
    if (userRole !== 'admin' && 
        userRole !== 'doctor' && 
        prescription.patientId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to download this prescription' });
    }

    const filePath = path.join(__dirname, '..', prescription.filePath);
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);

    if (!fileExists) {
      return res.status(404).json({ message: 'Prescription file not found' });
    }

    res.download(filePath);
  } catch (error) {
    console.error('Error downloading prescription:', error);
    res.status(500).json({ message: 'Error downloading prescription', error: error.message });
  }
};

// Delete prescription
exports.deletePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Only admin or the doctor who created it can delete
    if (userRole !== 'admin' && prescription.doctorId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this prescription' });
    }

    // Delete the file
    try {
      await fs.unlink(prescription.filePath);
    } catch (error) {
      console.error('Error deleting prescription file:', error);
    }

    // Delete the prescription record
    await prescription.remove();

    res.json({ message: 'Prescription deleted successfully' });
  } catch (error) {
    console.error('Error deleting prescription:', error);
    res.status(500).json({ message: 'Error deleting prescription', error: error.message });
  }
}; 