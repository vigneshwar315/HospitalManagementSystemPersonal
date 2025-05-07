// Migration script to fix missing prescription filePath fields
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Prescription = require('../models/prescriptionModel');
const Patient = require('../models/patientModel');
const Appointment = require('../models/appointmentModel');

const PRESCRIPTIONS_DIR = path.join(__dirname, '..', 'prescriptions');

async function main() {
  await mongoose.connect('mongodb://localhost:27017/hospital-management-system'); // Update if needed
  console.log('Connected to MongoDB');

  const missing = await Prescription.find({ $or: [ { filePath: { $exists: false } }, { filePath: '' }, { filePath: null } ] });
  console.log(`Found ${missing.length} prescriptions with missing filePath.`);

  const files = fs.readdirSync(PRESCRIPTIONS_DIR);

  for (const prescription of missing) {
    let matchedFile = null;
    // Try to match by patientId and/or appointmentId and/or createdAt
    const patient = await Patient.findById(prescription.patientId);
    const appointment = await Appointment.findById(prescription.appointmentId);
    const customId = patient ? patient.customId : null;
    const created = prescription.createdAt ? new Date(prescription.createdAt).getTime() : null;

    // Try to find a file that matches the pattern
    if (customId) {
      // Look for files like prescription_<customId>_*.pdf
      const regex = new RegExp(`prescription_${customId}.*\\.pdf$`);
      const candidates = files.filter(f => regex.test(f));
      if (candidates.length === 1) {
        matchedFile = candidates[0];
      } else if (candidates.length > 1 && created) {
        // Try to match by timestamp
        matchedFile = candidates.find(f => f.includes(String(created).slice(0, 8)));
      }
    }

    if (matchedFile) {
      prescription.filePath = matchedFile;
      await prescription.save();
      console.log(`Updated prescription ${prescription._id} with filePath: ${matchedFile}`);
    } else {
      console.warn(`Could not auto-fix prescription ${prescription._id} (patient: ${customId})`);
    }
  }

  console.log('Migration complete.');
  process.exit(0);
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 