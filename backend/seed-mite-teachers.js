const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// MITE Department Teachers - 2 per department
const miteTeachers = [
  // Computer Science & Engineering (CSE)
  { name: 'Dr. Rajesh Kumar', email: 'cse.hod@mite.ac.in', department: 'CSE', username: 'cse_hod' },
  { name: 'Prof. Priya Sharma', email: 'cse.prof@mite.ac.in', department: 'CSE', username: 'cse_prof' },
  
  // Electronics & Communication Engineering (ECE)
  { name: 'Dr. Suresh Patel', email: 'ece.hod@mite.ac.in', department: 'ECE', username: 'ece_hod' },
  { name: 'Prof. Anita Desai', email: 'ece.prof@mite.ac.in', department: 'ECE', username: 'ece_prof' },
  
  // Mechanical Engineering (ME)
  { name: 'Dr. Vikram Singh', email: 'me.hod@mite.ac.in', department: 'ME', username: 'me_hod' },
  { name: 'Prof. Lakshmi Reddy', email: 'me.prof@mite.ac.in', department: 'ME', username: 'me_prof' },
  
  // Civil Engineering (CE)
  { name: 'Dr. Arun Nair', email: 'ce.hod@mite.ac.in', department: 'CE', username: 'ce_hod' },
  { name: 'Prof. Meera Iyer', email: 'ce.prof@mite.ac.in', department: 'CE', username: 'ce_prof' },
  
  // Electrical & Electronics Engineering (EEE)
  { name: 'Dr. Mahesh Gupta', email: 'eee.hod@mite.ac.in', department: 'EEE', username: 'eee_hod' },
  { name: 'Prof. Kavita Menon', email: 'eee.prof@mite.ac.in', department: 'EEE', username: 'eee_prof' },
  
  // Information Science & Engineering (ISE)
  { name: 'Dr. Ramesh Bhat', email: 'ise.hod@mite.ac.in', department: 'ISE', username: 'ise_hod' },
  { name: 'Prof. Deepa Krishnan', email: 'ise.prof@mite.ac.in', department: 'ISE', username: 'ise_prof' }
];

const seedTeachers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student-task-manager');
    console.log('MongoDB Connected');

    // Clear existing teachers (optional - remove if you want to keep existing data)
    const deleteResult = await User.deleteMany({ role: 'teacher' });
    console.log(`Cleared ${deleteResult.deletedCount} existing teachers`);

    // Create all MITE teachers with password "Admin@123"
    const teacherPromises = miteTeachers.map(async (teacher) => {
      const newTeacher = new User({
        name: teacher.name,
        email: teacher.email,
        password: 'Admin@123', // This will be hashed automatically by the model
        role: 'teacher',
        department: teacher.department
      });
      
      await newTeacher.save();
      console.log(`✓ Created teacher: ${teacher.name} (${teacher.department}) - Username: ${teacher.email}`);
      return newTeacher;
    });

    await Promise.all(teacherPromises);

    console.log('\n✅ Successfully seeded all 12 MITE teachers!');
    console.log('\n📋 Login Credentials for all teachers:');
    console.log('Password: Admin@123');
    console.log('\nTeachers by Department:');
    
    miteTeachers.forEach(teacher => {
      console.log(`  ${teacher.department}: ${teacher.email}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding teachers:', error);
    process.exit(1);
  }
};

// Run the seed function
seedTeachers();
