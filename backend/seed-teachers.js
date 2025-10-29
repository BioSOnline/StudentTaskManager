const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const teachers = [
  // CSE Department
  { name: 'Dr. Rajesh Kumar', email: 'rajesh.cse@mite.ac.in', department: 'CSE' },
  { name: 'Dr. Priya Sharma', email: 'priya.cse@mite.ac.in', department: 'CSE' },
  
  // ECE Department
  { name: 'Dr. Suresh Reddy', email: 'suresh.ece@mite.ac.in', department: 'ECE' },
  { name: 'Dr. Lakshmi Devi', email: 'lakshmi.ece@mite.ac.in', department: 'ECE' },
  
  // ME Department
  { name: 'Dr. Venkatesh Rao', email: 'venkatesh.me@mite.ac.in', department: 'ME' },
  { name: 'Dr. Anita Singh', email: 'anita.me@mite.ac.in', department: 'ME' },
  
  // CE Department
  { name: 'Dr. Ramesh Naik', email: 'ramesh.ce@mite.ac.in', department: 'CE' },
  { name: 'Dr. Kavitha Rao', email: 'kavitha.ce@mite.ac.in', department: 'CE' },
  
  // EEE Department
  { name: 'Dr. Mohan Krishna', email: 'mohan.eee@mite.ac.in', department: 'EEE' },
  { name: 'Dr. Shanthi Kumari', email: 'shanthi.eee@mite.ac.in', department: 'EEE' },
  
  // ISE Department
  { name: 'Dr. Arun Kumar', email: 'arun.ise@mite.ac.in', department: 'ISE' },
  { name: 'Dr. Deepa Rani', email: 'deepa.ise@mite.ac.in', department: 'ISE' }
];

const seedTeachers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student-task-manager');
    console.log('Connected to MongoDB');

    // Clear existing teachers (optional - comment out if you want to keep existing data)
    // await User.deleteMany({ role: 'teacher' });
    // console.log('Cleared existing teachers');

    // Create teachers
    for (const teacherData of teachers) {
      // Check if teacher already exists
      const existingTeacher = await User.findOne({ email: teacherData.email });
      
      if (existingTeacher) {
        console.log(`Teacher ${teacherData.name} already exists, skipping...`);
        continue;
      }

      const teacher = new User({
        name: teacherData.name,
        email: teacherData.email,
        password: 'Admin@123',
        role: 'teacher',
        department: teacherData.department
      });

      await teacher.save();
      console.log(`✓ Created teacher: ${teacherData.name} (${teacherData.department})`);
    }

    console.log('\n✅ Successfully seeded all MITE teachers!');
    console.log('\nTeacher Login Credentials:');
    console.log('Email: [teacher-email]@mite.ac.in');
    console.log('Password: Admin@123');
    console.log('\nExample:');
    console.log('Email: rajesh.cse@mite.ac.in');
    console.log('Password: Admin@123');

  } catch (error) {
    console.error('Error seeding teachers:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

seedTeachers();
