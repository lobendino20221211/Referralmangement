const mongoose = require("mongoose")
const dotenv = require("dotenv")
const User = require("./models/User")

dotenv.config()

const resetAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log("✅ MongoDB Connected")

    // Delete old admin if exists
    await User.deleteOne({ username: "admin" })

    // Create admin with plain text password (will be hashed by pre-save hook)
    const admin = new User({
      username: "admin",
      email: "admin@test.com",
      password: "password",
      fullName: "System Administrator",
      role: "Admin",
    })

    await admin.save()
    console.log("🎉 Admin reset: username=admin, password=password")
    process.exit()
  } catch (err) {
    console.error("❌ Error:", err)
    process.exit(1)
  }
}

resetAdmin()
