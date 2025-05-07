const mongoose = require('mongoose');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function addTestDoctor() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital-management');
    console.log('Connected to MongoDB');

    // Check if the test doctor already exists
    const existingDoctor = await User.findOne({ email: 'test.doctor@hospital.com' });
    if (existingDoctor) {
      console.log('Test doctor already exists.');
      await mongoose.disconnect();
      return;
    }

    // Create a test doctor
    const testDoctor = new User({
      username: 'Dr. Test Doctor',
      email: 'test.doctor@hospital.com',
      password: await bcrypt.hash('password123', 10),
      role: 'Doctor',
      specialization: 'General Medicine',
      qualification: 'MD, General Medicine',
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
    });

    await testDoctor.save();
    console.log('Test doctor added successfully.');

    // Verify the doctor was added
    const doctors = await User.find({ role: 'Doctor' });
    console.log(`Found ${doctors.length} doctors in the database.`);
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error adding test doctor:', error);
  }
}

addTestDoctor(); 