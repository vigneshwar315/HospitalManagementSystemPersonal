const mongoose = require('mongoose');
require('dotenv').config();

async function checkCollections() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital-management');
    console.log('Connected to MongoDB');

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in the database:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });

    // Check if there are any documents in the users collection
    const usersCount = await mongoose.connection.db.collection('users').countDocuments();
    console.log(`Number of documents in users collection: ${usersCount}`);

    // Check if there are any documents with role=Doctor
    const doctorsCount = await mongoose.connection.db.collection('users').countDocuments({ role: 'Doctor' });
    console.log(`Number of doctors in users collection: ${doctorsCount}`);

    // Check if there are any documents with role=Doctor and isApproved=true
    const approvedDoctorsCount = await mongoose.connection.db.collection('users').countDocuments({ 
      role: 'Doctor',
      isApproved: true 
    });
    console.log(`Number of approved doctors in users collection: ${approvedDoctorsCount}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error checking collections:', error);
  }
}

checkCollections(); 