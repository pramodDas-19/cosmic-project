require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function fixExistingUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Find the existing admin user
    const admin = await User.findOne({ email: 'admin@cosmicsolutions.com' });
    
    if (!admin) {
      console.log('❌ Admin user not found. Run seed.js to create users.');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('📋 Found existing user:', admin.email);
    console.log('Current status:', admin.status);
    console.log('Current isActive:', admin.isActive);

    // Update user to have proper status
    admin.status = 'Active';
    admin.isActive = true;
    
    // Add department if missing
    if (!admin.department) {
      admin.department = 'Administration';
    }

    await admin.save();
    console.log('✅ Updated user with status: Active');
    console.log('✅ User is now ready for login!');

    // Check all users and fix them
    const allUsers = await User.find({});
    console.log(`\n📊 Found ${allUsers.length} user(s) in database:`);
    
    for (const user of allUsers) {
      if (!user.status || user.status !== 'Active') {
        user.status = 'Active';
        user.isActive = true;
        await user.save();
        console.log(`✅ Fixed user: ${user.email} - Set status to Active`);
      } else {
        console.log(`✓ User ${user.email} already has Active status`);
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ All users fixed! You can now login.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing user:', error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

fixExistingUser();
