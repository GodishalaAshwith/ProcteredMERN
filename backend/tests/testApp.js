const express = require("express");
const cors = require("cors");
const authRoutes = require("../routes/auth");
const adminRoutes = require("../routes/admin");
const examRoutes = require("../routes/exams");
const attemptRoutes = require("../routes/attempts");

const createTestApp = () => {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/exams", examRoutes);
  app.use("/api/attempts", attemptRoutes);

  // Health check
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
  });

  return app;
};

module.exports = createTestApp;
