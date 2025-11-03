const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

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
    const user = await User.findOne(query);
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

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
