require('dotenv').config();
const mongoose = require('mongoose');
const Notification = require('./src/models/Notification');

async function cleanupDemoNotifications() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cosmic-solutions';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Build query to find test/demo notifications
    // Match common test notification patterns
    const query = {
      $or: [
        { title: { $regex: /test|demo|Test Notification|Self Test/i } },
        { message: { $regex: /test notification|demo notification|verify the system|created by the user for themselves/i } },
        { title: 'Test Notification' },
        { title: 'Self Test Notification' },
        { message: { $regex: /This is a test notification/i } }
      ]
    };

    // Find matching notifications
    const testNotifications = await Notification.find(query);
    console.log(`Found ${testNotifications.length} test/demo notifications to delete`);

    if (testNotifications.length > 0) {
      // Show what will be deleted
      console.log('\nNotifications to be deleted:');
      testNotifications.forEach((notif, index) => {
        console.log(`${index + 1}. [${notif._id}] ${notif.title} - ${notif.message.substring(0, 50)}...`);
      });

      // Delete them
      const result = await Notification.deleteMany(query);
      console.log(`\n✅ Deleted ${result.deletedCount} test/demo notifications`);
    } else {
      console.log('✅ No test/demo notifications found');
    }

    // Also delete very old notifications (older than 6 months) that might be test data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const oldTestQuery = {
      createdAt: { $lt: sixMonthsAgo },
      $or: [
        { title: { $regex: /test|demo/i } },
        { message: { $regex: /test|demo/i } }
      ]
    };

    const oldTestNotifications = await Notification.find(oldTestQuery);
    if (oldTestNotifications.length > 0) {
      const oldResult = await Notification.deleteMany(oldTestQuery);
      console.log(`✅ Deleted ${oldResult.deletedCount} old test notifications (older than 6 months)`);
    }

    // Show remaining notification count
    const totalNotifications = await Notification.countDocuments();
    console.log(`\n📊 Total notifications remaining: ${totalNotifications}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning up notifications:', error);
    process.exit(1);
  }
}

cleanupDemoNotifications();
