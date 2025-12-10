// backend/utils/seedStudents.js
const mongoose = require("mongoose")
const Student = require("../models/Student")
require("dotenv").config()

const connectDB = require("../config/database")

const sampleStudents = [
  {
    studentId: "20221202",
    firstName: "Jennylyn",
    lastName: "Calabucal",
    middleName: "A",
    level: "JHS",
    grade: "10",
    section: "A",
    contactNumber: "09301750922",
    email: "jennylyn.calabucal@student.cscqc.edu.ph",
    guardianName: "Julieta A. Calabucal",
    guardianContact: "09301750922",
    address: "Lot 44 Blk. & Brgy. 160 Libis Baesa Caloocan City",
    dateOfBirth: new Date("2005-03-15"),
    adviser: "Garcia, Shirbenly",
    isActive: true,
  },
  {
    studentId: "20221204",
    firstName: "Rochelle Jane",
    lastName: "Cepeda",
    middleName: "B",
    level: "Elementary",
    grade: "4",
    section: "B",
    contactNumber: "09944194531",
    email: "rochelle.cepeda@student.cscqc.edu.ph",
    guardianName: "Maria Jovita B. Cepeda",
    guardianContact: "09944194531",
    address: "344 Tullahan Rd. St. Dela Cruz Comp. Sta. Quiteria Caloocan City",
    dateOfBirth: new Date("2011-08-22"),
    adviser: "Perez, Rubea",
    isActive: true,
  },
  {
    studentId: "20221205",
    firstName: "Joanna Rose",
    lastName: "Delmonte",
    middleName: "L",
    level: "SHS",
    grade: "11",
    section: "STEM-A",
    contactNumber: "09755244955",
    email: "joanna.delmonte@student.cscqc.edu.ph",
    guardianName: "Juvy U. Delmonte",
    guardianContact: "09755244955",
    address: "Area 5, Namalu Hoa Luzon Avenue Quezon City",
    dateOfBirth: new Date("2006-05-10"),
    adviser: "Santos, Maria",
    academicNotes: "High achiever in Science subjects",
    isActive: true,
  },
  {
    studentId: "20221206",
    firstName: "Joshua",
    lastName: "Lobendino",
    middleName: "N",
    level: "SHS",
    grade: "12",
    section: "ICT-A",
    contactNumber: "09928066064",
    email: "joshua.lobendino@student.cscqc.edu.ph",
    guardianName: "Violeta N. Lobendino",
    guardianContact: "09928066064",
    address: "101 Bayanihan St. Bagong Barrio Caloocan City",
    dateOfBirth: new Date("2005-07-01"),
    adviser: "Cruz, Ana",
    academicNotes: "Excellent in programming and web development",
    isActive: true,
  },
  {
    studentId: "20221207",
    firstName: "Maria",
    lastName: "Garcia",
    middleName: "S",
    level: "Elementary",
    grade: "6",
    section: "A",
    contactNumber: "09123456789",
    guardianName: "Pedro Garcia",
    guardianContact: "09123456789",
    address: "123 Main St. Quezon City",
    dateOfBirth: new Date("2012-03-20"),
    adviser: "Reyes, Linda",
    isActive: true,
  },
  {
    studentId: "20221208",
    firstName: "Juan",
    lastName: "Dela Cruz",
    middleName: "P",
    level: "JHS",
    grade: "7",
    section: "B",
    contactNumber: "09234567890",
    guardianName: "Rosa Dela Cruz",
    guardianContact: "09234567890",
    address: "456 Secondary Rd. Caloocan City",
    dateOfBirth: new Date("2009-11-15"),
    adviser: "Garcia, Shirbenly",
    behavioralNotes: "Needs support with time management",
    isActive: true,
  },
  {
    studentId: "20221209",
    firstName: "Ana",
    lastName: "Mercado",
    middleName: "R",
    level: "JHS",
    grade: "8",
    section: "C",
    contactNumber: "09345678901",
    guardianName: "Luis Mercado",
    guardianContact: "09345678901",
    address: "789 Tertiary Ave. Quezon City",
    dateOfBirth: new Date("2008-06-30"),
    adviser: "Perez, Rubea",
    medicalNotes: "Asthma - needs inhaler during PE",
    isActive: true,
  },
  {
    studentId: "20221210",
    firstName: "Carlos",
    lastName: "Ramos",
    middleName: "T",
    level: "Elementary",
    grade: "5",
    section: "A",
    contactNumber: "09456789012",
    guardianName: "Elena Ramos",
    guardianContact: "09456789012",
    address: "321 Fourth St. Caloocan City",
    dateOfBirth: new Date("2013-01-12"),
    adviser: "Reyes, Linda",
    isActive: true,
  },
  {
    studentId: "20221211",
    firstName: "Sofia",
    lastName: "Torres",
    middleName: "M",
    level: "SHS",
    grade: "11",
    section: "ABM-A",
    contactNumber: "09567890123",
    guardianName: "Roberto Torres",
    guardianContact: "09567890123",
    address: "654 Fifth Blvd. Quezon City",
    dateOfBirth: new Date("2006-09-25"),
    adviser: "Santos, Maria",
    academicNotes: "Strong in Business and Accounting",
    isActive: true,
  },
  {
    studentId: "20221212",
    firstName: "Miguel",
    lastName: "Santos",
    middleName: "D",
    level: "JHS",
    grade: "9",
    section: "A",
    contactNumber: "09678901234",
    guardianName: "Carmen Santos",
    guardianContact: "09678901234",
    address: "987 Sixth Rd. Caloocan City",
    dateOfBirth: new Date("2007-12-08"),
    adviser: "Garcia, Shirbenly",
    behavioralNotes: "Participates actively in class discussions",
    isActive: true,
  },
]

const seedStudents = async () => {
  try {
    await connectDB()

    // Clear existing students
    await Student.deleteMany({})
    console.log("🗑️  Cleared existing students")

    // Insert sample students
    await Student.insertMany(sampleStudents)
    console.log(`🎉 Successfully seeded ${sampleStudents.length} students`)

    process.exit(0)
  } catch (error) {
    console.error("❌ Error seeding students:", error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  seedStudents()
}

module.exports = seedStudents