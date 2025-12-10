// backend/seed.js
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
require("dotenv").config()

const connectDB = require("./config/database")
const User = require("./models/User")

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await connectDB()

    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: "admin" })
    if (existingAdmin) {
      console.log("✅ Admin user already exists:", existingAdmin.username)
      process.exit(0)
    }

    // Create bcrypt hash for "password"
    const hashedPassword = await bcrypt.hash("password", 10)

    // Create new admin user
    const adminUser = new User({
      username: "admin",
      email: "admin@test.com",
      password: hashedPassword,
      fullName: "System Administrator",
      role: "Admin",
      isActive: true,
    })

    await adminUser.save()
    console.log("🎉 Default admin created: username=admin, password=password")

    process.exit(0)
  } catch (error) {
    console.error("❌ Error seeding admin:", error)
    process.exit(1)
  }
}

seedAdmin()
