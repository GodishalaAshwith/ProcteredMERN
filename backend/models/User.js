const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },

    // Role-based access
    role: {
      type: String,
      enum: ["student", "faculty", "admin"],
      default: "student",
      index: true,
    },

    // Student profile fields (optional for non-students)
    college: { type: String },
    year: { type: Number, min: 1, max: 8 },
    department: { type: String },
    section: { type: Number, min: 1, max: 5 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
