const mongoose = require('mongoose');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function addSampleDoctors() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital-management');
    console.log('Connected to MongoDB');

    // Check if doctors already exist
    const existingDoctors = await User.find({ role: 'Doctor' });
    if (existingDoctors.length > 0) {
      console.log(`Found ${existingDoctors.length} doctors already in the database.`);
      console.log('Do you want to add more doctors? (y/n)');
      process.exit(0);
    }

    // Sample doctors data
    const sampleDoctors = [
      {
        username: 'Dr. John Smith',
        email: 'john.smith@hospital.com',
        password: await bcrypt.hash('password123', 10),
        role: 'Doctor',
        specialization: 'Cardiology',
        qualification: 'MD, Cardiology',
        experience: 15,
        isApproved: true,
        status: 'Approved',
        businessHours: [
          { day: 1, startTime: '09:00', endTime: '17:00', isWorking: true }, // Monday
          { day: 2, startTime: '09:00', endTime: '17:00', isWorking: true }, // Tuesday
          { day: 3, startTime: '09:00', endTime: '17:00', isWorking: true }, // Wednesday
          { day: 4, startTime: '09:00', endTime: '17:00', isWorking: true }, // Thursday
          { day: 5, startTime: '09:00', endTime: '17:00', isWorking: true }, // Friday
          { day: 6, startTime: '09:00', endTime: '13:00', isWorking: true }, // Saturday
          { day: 0, startTime: '09:00', endTime: '17:00', isWorking: false }  // Sunday
        ],
        appointmentDuration: 30
      },
      {
        username: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@hospital.com',
        password: await bcrypt.hash('password123', 10),
        role: 'Doctor',
        specialization: 'Pediatrics',
        qualification: 'MD, Pediatrics',
        experience: 10,
        isApproved: true,
        status: 'Approved',
        businessHours: [
          { day: 1, startTime: '09:00', endTime: '17:00', isWorking: true }, // Monday
          { day: 2, startTime: '09:00', endTime: '17:00', isWorking: true }, // Tuesday
          { day: 3, startTime: '09:00', endTime: '17:00', isWorking: true }, // Wednesday
          { day: 4, startTime: '09:00', endTime: '17:00', isWorking: true }, // Thursday
          { day: 5, startTime: '09:00', endTime: '17:00', isWorking: true }, // Friday
          { day: 6, startTime: '09:00', endTime: '13:00', isWorking: true }, // Saturday
          { day: 0, startTime: '09:00', endTime: '17:00', isWorking: false }  // Sunday
        ],
        appointmentDuration: 30
      },
      {
        username: 'Dr. Michael Brown',
        email: 'michael.brown@hospital.com',
        password: await bcrypt.hash('password123', 10),
        role: 'Doctor',
        specialization: 'Orthopedics',
        qualification: 'MD, Orthopedics',
        experience: 12,
        isApproved: true,
        status: 'Approved',
        businessHours: [
          { day: 1, startTime: '09:00', endTime: '17:00', isWorking: true }, // Monday
          { day: 2, startTime: '09:00', endTime: '17:00', isWorking: true }, // Tuesday
          { day: 3, startTime: '09:00', endTime: '17:00', isWorking: true }, // Wednesday
          { day: 4, startTime: '09:00', endTime: '17:00', isWorking: true }, // Thursday
          { day: 5, startTime: '09:00', endTime: '17:00', isWorking: true }, // Friday
          { day: 6, startTime: '09:00', endTime: '13:00', isWorking: true }, // Saturday
          { day: 0, startTime: '09:00', endTime: '17:00', isWorking: false }  // Sunday
        ],
        appointmentDuration: 30
      }
    ];

    console.log('Adding sample doctors to the database...');
    for (const doctor of sampleDoctors) {
      const newDoctor = new User(doctor);
      await newDoctor.save();
      console.log(`Added doctor: ${doctor.username} (${doctor.email})`);
    }
    console.log('All sample doctors have been added.');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error adding sample doctors:', error);
  }
}

addSampleDoctors(); 