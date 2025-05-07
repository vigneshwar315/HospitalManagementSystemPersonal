const mongoose = require('mongoose');
const Patient = require('../models/patientModel');
require('dotenv').config();

async function migrateMedicalHistory() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const patients = await Patient.find({
            'medicalHistory': { $exists: true, $type: 'array' }
        });

        console.log(`Found ${patients.length} patients with old medicalHistory format`);

        for (const patient of patients) {
            const oldMedicalHistory = patient.medicalHistory;
            const newMedicalHistory = {
                appointments: [],
                prescriptions: [],
                labReports: [],
                allergies: [],
                conditions: [],
                medications: []
            };

            // Convert old format to new format
            if (Array.isArray(oldMedicalHistory)) {
                oldMedicalHistory.forEach(entry => {
                    if (entry.prescriptions) {
                        newMedicalHistory.prescriptions.push(entry.prescriptions);
                    }
                });
            }

            // Update the patient document
            await Patient.updateOne(
                { _id: patient._id },
                { $set: { medicalHistory: newMedicalHistory } }
            );

            console.log(`Migrated medicalHistory for patient ${patient._id}`);
        }

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

migrateMedicalHistory(); 