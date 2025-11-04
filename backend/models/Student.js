const mongoose = require("mongoose");

// Roster of students uploaded by admin. Not used for authentication.
const StudentSchema = new mongoose.Schema(
  {
    // University-issued roll number (unique identifier)
    rollno: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },

    // Optional contact
    email: { type: String },

    // Academic profile
    college: { type: String },
    year: { type: Number, min: 1, max: 8 },
    department: { type: String },
    section: { type: Number, min: 1, max: 5 },
    semester: { type: Number, min: 1, max: 16 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", StudentSchema);
