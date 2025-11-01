const request = require("supertest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const createTestApp = require("./testApp");
const User = require("../models/User");
const Exam = require("../models/Exam");
const Attempt = require("../models/Attempt");

const app = createTestApp();

describe("Attempt Routes", () => {
  let facultyUser, facultyToken, studentUser, studentToken, exam;

  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Create faculty user
    facultyUser = await User.create({
      name: "Faculty User",
      email: "faculty@test.com",
      password: hashedPassword,
      role: "faculty",
    });

    facultyToken = jwt.sign(
      { id: facultyUser._id, role: facultyUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Create student user
    studentUser = await User.create({
      name: "Student User",
      email: "student@test.com",
      password: hashedPassword,
      role: "student",
      college: "Test College",
      year: 2,
      department: "Computer Science",
      section: 1,
    });

    studentToken = jwt.sign(
      { id: studentUser._id, role: studentUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Create an active exam
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    exam = await Exam.create({
      title: "Test Exam",
      description: "A test exam",
      durationMins: 60,
      window: {
        start: now,
        end: oneHourLater,
      },
      questions: [
        {
          type: "single",
          text: "What is 2+2?",
          options: ["3", "4", "5", "6"],
          correctAnswers: [1],
          points: 2,
        },
        {
          type: "text",
          text: "Explain OOP",
          points: 5,
        },
      ],
      assignmentCriteria: {
        college: "Test College",
        year: [2],
        department: ["Computer Science"],
        section: [1],
      },
      createdBy: facultyUser._id,
    });
  });

  describe("POST /api/attempts/start", () => {
    it("should start exam attempt successfully", async () => {
      const response = await request(app)
        .post("/api/attempts/start")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ examId: exam._id })
        .expect(200);

      expect(response.body.attempt).toBeTruthy();
      expect(response.body.attempt.status).toBe("in-progress");
      expect(response.body.exam.title).toBe(exam.title);
      expect(response.body.exam.questions).toHaveLength(2);
      expect(response.body.exam.questions[0].correctAnswers).toBeUndefined(); // answers hidden
    });

    it("should reject starting exam not assigned to student", async () => {
      // Create exam not assigned to this student
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

      const restrictedExam = await Exam.create({
        title: "Restricted Exam",
        durationMins: 60,
        window: { start: now, end: oneHourLater },
        assignmentCriteria: {
          college: "Other College", // Different college
          year: [2],
          department: ["Computer Science"],
          section: [1],
        },
        createdBy: facultyUser._id,
      });

      const response = await request(app)
        .post("/api/attempts/start")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ examId: restrictedExam._id })
        .expect(403);

      expect(response.body.message).toBe("You are not assigned to this exam");
    });

    it("should reject starting exam outside time window", async () => {
      // Create exam with past time window
      const pastStart = new Date("2024-01-01T10:00:00Z");
      const pastEnd = new Date("2024-01-01T12:00:00Z");

      const pastExam = await Exam.create({
        title: "Past Exam",
        durationMins: 60,
        window: { start: pastStart, end: pastEnd },
        assignmentCriteria: {
          college: "Test College",
          year: [2],
          department: ["Computer Science"],
          section: [1],
        },
        createdBy: facultyUser._id,
      });

      const response = await request(app)
        .post("/api/attempts/start")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ examId: pastExam._id })
        .expect(400);

      expect(response.body.message).toBe("Exam is not active right now");
    });

    it("should return existing in-progress attempt", async () => {
      // Start attempt first time
      const response1 = await request(app)
        .post("/api/attempts/start")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ examId: exam._id })
        .expect(200);

      const attemptId1 = response1.body.attempt._id;

      // Start attempt second time - should return same attempt
      const response2 = await request(app)
        .post("/api/attempts/start")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ examId: exam._id })
        .expect(200);

      expect(response2.body.attempt._id).toBe(attemptId1);
      expect(response2.body.attempt.status).toBe("in-progress");
    });
  });

  describe("POST /api/attempts/answer", () => {
    let attempt;

    beforeEach(async () => {
      // Start an attempt first
      const response = await request(app)
        .post("/api/attempts/start")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ examId: exam._id });

      attempt = response.body.attempt;
    });

    it("should save answer successfully", async () => {
      const answerData = {
        attemptId: attempt._id,
        questionIndex: 0,
        answer: [1], // Answer option index 1 for single choice
      };

      const response = await request(app)
        .post("/api/attempts/answer")
        .set("Authorization", `Bearer ${studentToken}`)
        .send(answerData)
        .expect(200);

      expect(response.body.message).toBe("Answer saved");

      // Verify answer was saved in database
      const updatedAttempt = await Attempt.findById(attempt._id);
      expect(updatedAttempt.answers.get("0")).toEqual([1]);
    });

    it("should save text answer successfully", async () => {
      const answerData = {
        attemptId: attempt._id,
        questionIndex: 1,
        answer: "Object-oriented programming is a paradigm...",
      };

      const response = await request(app)
        .post("/api/attempts/answer")
        .set("Authorization", `Bearer ${studentToken}`)
        .send(answerData)
        .expect(200);

      expect(response.body.message).toBe("Answer saved");

      const updatedAttempt = await Attempt.findById(attempt._id);
      expect(updatedAttempt.answers.get("1")).toBe(
        "Object-oriented programming is a paradigm..."
      );
    });

    it("should reject answer for invalid attempt", async () => {
      const answerData = {
        attemptId: "507f1f77bcf86cd799439011", // Invalid ID
        questionIndex: 0,
        answer: [1],
      };

      const response = await request(app)
        .post("/api/attempts/answer")
        .set("Authorization", `Bearer ${studentToken}`)
        .send(answerData)
        .expect(404);

      expect(response.body.message).toBe("Attempt not found");
    });
  });

  describe("POST /api/attempts/submit", () => {
    let attempt;

    beforeEach(async () => {
      // Start an attempt first
      const response = await request(app)
        .post("/api/attempts/start")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ examId: exam._id });

      attempt = response.body.attempt;
    });

    it("should submit attempt successfully", async () => {
      // Save some answers first
      await request(app)
        .post("/api/attempts/answer")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          attemptId: attempt._id,
          questionIndex: 0,
          answer: [1], // Correct answer
        });

      await request(app)
        .post("/api/attempts/answer")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          attemptId: attempt._id,
          questionIndex: 1,
          answer: "OOP explanation...",
        });

      const response = await request(app)
        .post("/api/attempts/submit")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ attemptId: attempt._id })
        .expect(200);

      expect(response.body.attempt.status).toBe("submitted");
      expect(response.body.attempt.score).toBeGreaterThan(0);
      expect(response.body.attempt.submittedAt).toBeTruthy();
    });

    it("should reject submitting already submitted attempt", async () => {
      // Submit first time
      await request(app)
        .post("/api/attempts/submit")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ attemptId: attempt._id });

      // Try to submit again
      const response = await request(app)
        .post("/api/attempts/submit")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ attemptId: attempt._id })
        .expect(400);

      expect(response.body.message).toBe("Attempt already submitted");
    });
  });

  describe("GET /api/attempts/my-attempts", () => {
    it("should return student's attempts", async () => {
      // Create an attempt
      const attempt = await Attempt.create({
        examId: exam._id,
        studentId: studentUser._id,
        status: "submitted",
        startedAt: new Date(),
        submittedAt: new Date(),
        score: 5,
      });

      const response = await request(app)
        .get("/api/attempts/my-attempts")
        .set("Authorization", `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].examTitle).toBe(exam.title);
      expect(response.body[0].status).toBe("submitted");
    });

    it("should reject access for faculty", async () => {
      const response = await request(app)
        .get("/api/attempts/my-attempts")
        .set("Authorization", `Bearer ${facultyToken}`)
        .expect(403);

      expect(response.body.msg).toBe("Forbidden: insufficient role");
    });
  });
});
