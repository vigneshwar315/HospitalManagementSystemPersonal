const mongoose = require('mongoose');
const User = require('../models/userModel');
require('dotenv').config();

async function checkDoctorApproval() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital-management');
    console.log('Connected to MongoDB');

    console.log('Checking for doctors in the database...');
    const doctors = await User.find({ role: 'Doctor' });
    
    console.log(`Found ${doctors.length} doctors in total`);
    
    if (doctors.length === 0) {
      console.log('No doctors found in the database.');
    } else {
      console.log('Doctor details:');
      doctors.forEach(d => {
        console.log(`- ${d.username} (${d.email}): isApproved=${d.isApproved}, status=${d.status}`);
      });
      
      const approvedDoctors = doctors.filter(d => d.isApproved);
      console.log(`Found ${approvedDoctors.length} approved doctors`);
      
      if (approvedDoctors.length === 0) {
        console.log('No approved doctors found. This is likely the cause of the issue.');
        console.log('To fix this, you need to approve the doctors in the database.');
      } else {
        console.log('Approved doctors:');
        approvedDoctors.forEach(d => {
          console.log(`- ${d.username} (${d.email}): specialization=${d.specialization}`);
        });
      }
    }
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error checking doctors:', error);
  }
}

checkDoctorApproval(); 