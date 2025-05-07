const mongoose = require('mongoose');

const labReportSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  testName: {
    type: String,
    required: true,
    trim: true
  },
  testType: {
    type: String,
    required: true,
    enum: ['Blood', 'Urine', 'X-Ray', 'MRI', 'CT Scan', 'ECG', 'Other'],
    default: 'Blood'
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  results: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  fileUrl: {
    type: String,
    trim: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  labTechnicianId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabTechnician'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
labReportSchema.index({ patientId: 1, date: -1 });
labReportSchema.index({ doctorId: 1, date: -1 });
labReportSchema.index({ status: 1 });

const LabReport = mongoose.model('LabReport', labReportSchema);

module.exports = LabReport; 