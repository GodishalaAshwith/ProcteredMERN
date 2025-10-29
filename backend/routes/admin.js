const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

// Admin-only: Create a faculty account
// POST /api/admin/faculty
router.post("/faculty", auth, auth.requireRole("admin"), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "name, email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "faculty",
    });

    return res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Admin-only: List all faculty
// GET /api/admin/faculty
router.get("/faculty", auth, auth.requireRole("admin"), async (_req, res) => {
  try {
    const faculty = await User.find({ role: "faculty" })
      .select("name email role createdAt")
      .sort({ createdAt: -1 });
    return res.json(faculty);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
