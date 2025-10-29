const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const examRoutes = require("./routes/exams");
const attemptRoutes = require("./routes/attempts");

dotenv.config(); // Load environment variables

const app = express();
connectDB(); // Connect to MongoDB

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || "*" })); // Allow frontend to connect
app.use(express.json()); // Parse JSON body

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/attempts", attemptRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Default route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
