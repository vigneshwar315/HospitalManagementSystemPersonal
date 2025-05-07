const mongoose = require('mongoose');
const User = require('../models/userModel');
require('dotenv').config();

async function approveExistingDoctors() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital-management');
    console.log('Connected to MongoDB');

    console.log('Finding unapproved doctors...');
    const unapprovedDoctors = await User.find({ 
      role: 'Doctor',
      isApproved: false 
    });
    
    console.log(`Found ${unapprovedDoctors.length} unapproved doctors`);
    
    if (unapprovedDoctors.length === 0) {
      console.log('No unapproved doctors found.');
    } else {
      console.log('Approving doctors...');
      for (const doctor of unapprovedDoctors) {
        doctor.isApproved = true;
        doctor.status = 'Approved';
        await doctor.save();
        console.log(`Approved doctor: ${doctor.username} (${doctor.email})`);
      }
      console.log('All doctors have been approved.');
    }
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error approving doctors:', error);
  }
}

approveExistingDoctors(); 