// backend/utils/seedAdmin.js
const bcrypt = require("bcryptjs")
const User = require("../models/User")

const seedAdmin = async () => {
  try {
    // Check if admin exists
    const existingAdmin = await User.findOne({ username: "admin" })
    if (existingAdmin) {
      console.log("✅ Admin user already exists")
      return
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
  } catch (error) {
    console.error("❌ Error seeding admin:", error.message)
  }
}

module.exports = seedAdmin
