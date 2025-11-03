const express = require("express");
const Exam = require("../models/Exam");
const Attempt = require("../models/Attempt");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

// Create exam (faculty only)
router.post("/", auth, auth.requireRole("faculty"), async (req, res) => {
  try {
    const payload = req.body || {};
    const doc = new Exam({ ...payload, createdBy: req.user.id });
    await doc.validate();
    await doc.save();
    return res.status(201).json(doc);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// List my exams (faculty)
router.get("/", auth, auth.requireRole("faculty"), async (req, res) => {
  try {
    const list = await Exam.find({ createdBy: req.user.id }).sort({
      createdAt: -1,
    });
    return res.json(list);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get exam by id (faculty owned)
// Student: list exams that are active now OR scheduled in the future and match profile
router.get(
  "/available",
  auth,
  auth.requireRole("student"),
  async (req, res) => {
    try {
      const now = new Date();
      // fetch student profile
      const student = await User.findById(req.user.id).select(
        "college year department section semester role"
      );
      if (!student) return res.status(404).json({ message: "User not found" });

      // find exams that have not ended yet (active or upcoming)
      const exams = await Exam.find({
        "window.end": { $gte: now },
      })
        .select(
          "title description durationMins window assignmentCriteria retakeGrants"
        )
        .sort({ "window.start": 1 });

      // local match function (case-insensitive for text fields)
      const matches = (exam) => {
        const c = exam.assignmentCriteria || {};
        const norm = (v) =>
          typeof v === "string" ? v.trim().toLowerCase() : v;

        // college (string)
        if (c.college && student.college) {
          if (norm(c.college) !== norm(student.college)) return false;
        }

        // year (number array)
        if (Array.isArray(c.year) && c.year.length > 0) {
          if (student.year == null || !c.year.includes(student.year))
            return false;
        }

        // department (string array)
        if (Array.isArray(c.department) && c.department.length > 0) {
          if (!student.department) return false;
          const deptSet = new Set(c.department.map(norm));
          if (!deptSet.has(norm(student.department))) return false;
        }

        // section (number array)
        if (Array.isArray(c.section) && c.section.length > 0) {
          if (student.section == null || !c.section.includes(student.section))
            return false;
        }
        // semester (number array)
        if (Array.isArray(c.semester) && c.semester.length > 0) {
          if (
            student.semester == null ||
            !c.semester.includes(student.semester)
          )
            return false;
        }
        return true;
      };

      const filtered = exams.filter(matches);
      const examIds = filtered.map((e) => e._id);

      // attempts for these exams by this student
      const attempts = await Attempt.find({
        studentId: req.user.id,
        examId: { $in: examIds },
      }).select("examId status submittedAt");

      const byExam = new Map();
      attempts.forEach((a) => byExam.set(String(a.examId), a));

      const result = filtered.map((e) => {
        const a = byExam.get(String(e._id));
        let status = "not-started";
        if (a) status = a.status;

        // If already submitted/invalid but faculty granted a retake token, allow starting again
        if (
          (status === "submitted" || status === "invalid") &&
          Array.isArray(e.retakeGrants)
        ) {
          const grant = e.retakeGrants.find(
            (g) =>
              String(g.studentId) === String(req.user.id) &&
              (g.remaining || 0) > 0
          );
          if (grant) status = "not-started";
        }
        return {
          _id: e._id,
          title: e.title,
          description: e.description,
          durationMins: e.durationMins,
          window: e.window,
          status,
        };
      });

      return res.json(result);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get exam by id (faculty owned)
router.get("/:id", auth, auth.requireRole("faculty"), async (req, res) => {
  try {
    const exam = await Exam.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    return res.json(exam);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Update exam (faculty owner)
router.put("/:id", auth, auth.requireRole("faculty"), async (req, res) => {
  try {
    const update = req.body || {};
    const exam = await Exam.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    Object.assign(exam, update);
    await exam.validate();
    await exam.save();

    return res.json(exam);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Delete exam (faculty owner)
router.delete("/:id", auth, auth.requireRole("faculty"), async (req, res) => {
  try {
    const exam = await Exam.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id,
    });
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    return res.json({ message: "Exam deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
