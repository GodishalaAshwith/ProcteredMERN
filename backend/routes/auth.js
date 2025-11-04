const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const Student = require("../models/Student");

const router = express.Router();

// Register Student (default role: student)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, college, year, department, section } =
      req.body;
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: "student",
      college,
      year,
      department,
      section,
    });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login User
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    // Support login using either email or roll number (provided in the same field)
    const identifier = (email || "").trim();
    const query = identifier.includes("@")
      ? { email: identifier }
      : { rollno: identifier };
    let user = await User.findOne(query);
    // Fallback: If no user account yet, try to authenticate against Student roster
    if (!user) {
      // Try to find a Student by rollno or email
      const student = await Student.findOne(
        identifier.includes("@")
          ? { email: identifier }
          : { rollno: identifier }
      );
      if (!student) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      // Default policy: student initial password is their roll number
      if (String(password) !== String(student.rollno)) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      // Auto-provision a User account from Student roster (required by rest of app)
      const synthesizedEmail =
        student.email && String(student.email).trim().length > 0
          ? student.email
          : `${student.rollno}@students.local`;
      // Avoid duplicate key race: check again by rollno/email
      user = await User.findOne({
        $or: [{ rollno: student.rollno }, { email: synthesizedEmail }],
      });
      if (!user) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(String(student.rollno), salt);
        try {
          user = await User.create({
            name: student.name,
            email: synthesizedEmail,
            rollno: student.rollno,
            password: hashedPassword,
            role: "student",
            college: student.college,
            year: student.year,
            department: student.department,
            section: student.section,
            semester: student.semester,
          });
        } catch (e) {
          // If duplicate key due to a race, fetch existing
          if (e && e.code === 11000) {
            user = await User.findOne({
              $or: [{ rollno: student.rollno }, { email: synthesizedEmail }],
            });
          } else {
            throw e;
          }
        }
      }
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // If this is a student account, ensure they exist in Student roster
    if (user.role === "student") {
      const rosterOk = await Student.exists({
        $or: [
          user.rollno ? { rollno: user.rollno } : null,
          user.email ? { email: user.email } : null,
        ].filter(Boolean),
      });
      if (!rosterOk) {
        return res
          .status(403)
          .json({ message: "Student not found in roster. Contact admin." });
      }
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        rollno: user.rollno,
        role: user.role,
        college: user.college,
        year: user.year,
        department: user.department,
        section: user.section,
        semester: user.semester,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get User Info (Protected)
router.get("/user", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password"); // Exclude password
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// Update current user's profile (authenticated)
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, college, year, department, section } = req.body || {};

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (typeof name === "string" && name.trim().length > 0)
      user.name = name.trim();
    if (typeof college === "string") user.college = college.trim();
    if (typeof department === "string") user.department = department.trim();

    if (year !== undefined) {
      const y = Number(year);
      if (!Number.isNaN(y)) user.year = y;
    }
    if (section !== undefined) {
      const s = Number(section);
      if (!Number.isNaN(s)) user.section = s;
    }

    // basic validation bounds per schema
    if (user.year != null && (user.year < 1 || user.year > 8)) {
      return res.status(400).json({ message: "Year must be between 1 and 8" });
    }
    if (user.section != null && (user.section < 1 || user.section > 5)) {
      return res
        .status(400)
        .json({ message: "Section must be between 1 and 5" });
    }

    await user.save();

    const { password, ...safe } = user.toObject();
    return res.json(safe);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Change password (authenticated)
// POST /api/auth/change-password { currentPassword, newPassword }
router.post("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      newPassword.length < 8
    ) {
      return res.status(400).json({
        message: "Provide currentPassword and newPassword (min 8 chars)",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok)
      return res.status(400).json({ message: "Current password is incorrect" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
