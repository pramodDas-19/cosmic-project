require("dotenv").config({ path: __dirname + '/.env' });
const mongoose = require("mongoose");
const User = require('./src/models/User');

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing users
    await User.deleteMany({});
    console.log("Cleared existing users");

    // Define users (using plain passwords - User model will hash them)
    const users = [
      {
        name: "System Administrator",
        email: "admin@cosmicsolutions.com",
        password: "Admin@123", // Will be hashed by User model pre-save hook
        role: "superadmin",
        status: "Active",
        department: "Administration"
      },
      {
        name: "Site Manager",
        email: "manager@cosmicsolutions.com",
        password: "Manager@123",
        role: "manager",
        status: "Active",
        department: "Management"
      },
      {
        name: "Sarah Johnson",
        email: "sarah.johnson@cosmicsolutions.com",
        password: "Sarah@123",
        role: "manager",
        status: "Active",
        department: "Management"
      },
      {
        name: "David Kim",
        email: "david.kim@cosmicsolutions.com",
        password: "David@123",
        role: "manager",
        status: "Active",
        department: "Management"
      },
      {
        name: "Field Technician",
        email: "technician@cosmicsolutions.com",
        password: "Tech@123",
        role: "technician",
        status: "Active",
        department: "Field Operations"
      },
      {
        name: "Mike Chen",
        email: "mike.chen@cosmicsolutions.com",
        password: "Mike@123",
        role: "technician",
        status: "Active",
        department: "Field Operations"
      },
      {
        name: "Lisa Rodriguez",
        email: "lisa.rodriguez@cosmicsolutions.com",
        password: "Lisa@123",
        role: "technician",
        status: "Active",
        department: "Field Operations"
      },
      {
        name: "James Wilson",
        email: "james.wilson@cosmicsolutions.com",
        password: "James@123",
        role: "technician",
        status: "Active",
        department: "Field Operations"
      },
    ];

    // Create users one by one (so pre-save hooks run and hash passwords)
    const createdUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.name} (${user.email})`);
    }
    console.log(`✅ Successfully seeded ${createdUsers.length} users`);

    console.log("\n🚀 Database seeding completed successfully!");
    console.log("\n📋 Available login credentials:");
    console.log("================================");
    console.log("SUPERADMIN: admin@cosmicsolutions.com / Admin@123");
    console.log("MANAGER: manager@cosmicsolutions.com / Manager@123");
    console.log("MANAGER: sarah.johnson@cosmicsolutions.com / Sarah@123");
    console.log("MANAGER: david.kim@cosmicsolutions.com / David@123");
    console.log("TECHNICIAN: technician@cosmicsolutions.com / Tech@123");
    console.log("TECHNICIAN: mike.chen@cosmicsolutions.com / Mike@123");
    console.log("TECHNICIAN: lisa.rodriguez@cosmicsolutions.com / Lisa@123");
    console.log("TECHNICIAN: james.wilson@cosmicsolutions.com / James@123");
    console.log("\n✅ You can now login with these credentials!");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding users:", error);
    console.error("Error details:", error.message);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

seedUsers();
