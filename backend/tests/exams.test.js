const request = require("supertest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const createTestApp = require("./testApp");
const User = require("../models/User");
const Exam = require("../models/Exam");

const app = createTestApp();

describe("Exam Routes", () => {
  let facultyUser,
    facultyToken,
    studentUser,
    studentToken,
    adminUser,
    adminToken;

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

    // Create admin user
    adminUser = await User.create({
      name: "Admin User",
      email: "admin@test.com",
      password: hashedPassword,
      role: "admin",
    });

    adminToken = jwt.sign(
      { id: adminUser._id, role: adminUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  });

  describe("POST /api/exams (Create Exam)", () => {
    it("should create exam successfully for faculty", async () => {
      const examData = {
        title: "Test Exam",
        description: "A test exam",
        durationMins: 60,
        window: {
          start: new Date("2025-12-01T10:00:00Z"),
          end: new Date("2025-12-01T12:00:00Z"),
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
            type: "mcq",
            text: "Select even numbers:",
            options: ["1", "2", "3", "4"],
            correctAnswers: [1, 3],
            points: 3,
          },
          {
            type: "text",
            text: "Explain polymorphism",
            points: 5,
          },
        ],
        assignmentCriteria: {
          college: "Test College",
          year: [2, 3],
          department: ["Computer Science"],
          section: [1, 2],
        },
      };

      const response = await request(app)
        .post("/api/exams")
        .set("Authorization", `Bearer ${facultyToken}`)
        .send(examData)
        .expect(201);

      expect(response.body.title).toBe(examData.title);
      expect(response.body.createdBy).toBe(facultyUser._id.toString());
      expect(response.body.questions).toHaveLength(3);
    });

    it("should reject exam creation for students", async () => {
      const examData = {
        title: "Test Exam",
        durationMins: 60,
        window: {
          start: new Date("2025-12-01T10:00:00Z"),
          end: new Date("2025-12-01T12:00:00Z"),
        },
      };

      const response = await request(app)
        .post("/api/exams")
        .set("Authorization", `Bearer ${studentToken}`)
        .send(examData)
        .expect(403);

      expect(response.body.msg).toBe("Forbidden: insufficient role");
    });

    it("should reject exam with invalid window", async () => {
      const examData = {
        title: "Test Exam",
        durationMins: 60,
        window: {
          start: new Date("2025-12-01T12:00:00Z"),
          end: new Date("2025-12-01T10:00:00Z"), // end before start
        },
      };

      const response = await request(app)
        .post("/api/exams")
        .set("Authorization", `Bearer ${facultyToken}`)
        .send(examData)
        .expect(400);

      expect(response.body.message).toContain("window");
    });
  });

  describe("GET /api/exams (List Faculty Exams)", () => {
    it("should return faculty's own exams", async () => {
      // Create exams for faculty
      const exam1 = await Exam.create({
        title: "Exam 1",
        durationMins: 60,
        window: {
          start: new Date("2025-12-01T10:00:00Z"),
          end: new Date("2025-12-01T12:00:00Z"),
        },
        createdBy: facultyUser._id,
      });

      const exam2 = await Exam.create({
        title: "Exam 2",
        durationMins: 90,
        window: {
          start: new Date("2025-12-02T10:00:00Z"),
          end: new Date("2025-12-02T12:00:00Z"),
        },
        createdBy: facultyUser._id,
      });

      const response = await request(app)
        .get("/api/exams")
        .set("Authorization", `Bearer ${facultyToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body.map((e) => e.title)).toContain("Exam 1");
      expect(response.body.map((e) => e.title)).toContain("Exam 2");
    });

    it("should reject access for students", async () => {
      const response = await request(app)
        .get("/api/exams")
        .set("Authorization", `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.msg).toBe("Forbidden: insufficient role");
    });
  });

  describe("GET /api/exams/available (Student Available Exams)", () => {
    it("should return available exams for student", async () => {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

      // Create exam that matches student criteria and is currently active
      const exam = await Exam.create({
        title: "Available Exam",
        durationMins: 60,
        window: {
          start: now,
          end: oneHourLater,
        },
        assignmentCriteria: {
          college: "Test College",
          year: [2],
          department: ["Computer Science"],
          section: [1],
        },
        createdBy: facultyUser._id,
      });

      const response = await request(app)
        .get("/api/exams/available")
        .set("Authorization", `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe("Available Exam");
      expect(response.body[0].status).toBe("not-started");
    });

    it("should not return exams outside time window", async () => {
      const pastStart = new Date("2024-01-01T10:00:00Z");
      const pastEnd = new Date("2024-01-01T12:00:00Z");

      await Exam.create({
        title: "Past Exam",
        durationMins: 60,
        window: {
          start: pastStart,
          end: pastEnd,
        },
        assignmentCriteria: {
          college: "Test College",
          year: [2],
          department: ["Computer Science"],
          section: [1],
        },
        createdBy: facultyUser._id,
      });

      const response = await request(app)
        .get("/api/exams/available")
        .set("Authorization", `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe("PUT /api/exams/:id (Update Exam)", () => {
    let exam;

    beforeEach(async () => {
      exam = await Exam.create({
        title: "Original Title",
        durationMins: 60,
        window: {
          start: new Date("2025-12-01T10:00:00Z"),
          end: new Date("2025-12-01T12:00:00Z"),
        },
        createdBy: facultyUser._id,
      });
    });

    it("should update exam successfully for owner", async () => {
      const updateData = {
        title: "Updated Title",
        durationMins: 90,
      };

      const response = await request(app)
        .put(`/api/exams/${exam._id}`)
        .set("Authorization", `Bearer ${facultyToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe("Updated Title");
      expect(response.body.durationMins).toBe(90);
    });

    it("should reject update for non-owner faculty", async () => {
      // Create another faculty user
      const otherFaculty = await User.create({
        name: "Other Faculty",
        email: "other@faculty.com",
        password: await bcrypt.hash("password123", 10),
        role: "faculty",
      });

      const otherToken = jwt.sign(
        { id: otherFaculty._id, role: otherFaculty.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      const response = await request(app)
        .put(`/api/exams/${exam._id}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({ title: "Hacked Title" })
        .expect(404);
    });
  });

  describe("DELETE /api/exams/:id (Delete Exam)", () => {
    let exam;

    beforeEach(async () => {
      exam = await Exam.create({
        title: "To Delete",
        durationMins: 60,
        window: {
          start: new Date("2025-12-01T10:00:00Z"),
          end: new Date("2025-12-01T12:00:00Z"),
        },
        createdBy: facultyUser._id,
      });
    });

    it("should delete exam successfully for owner", async () => {
      const response = await request(app)
        .delete(`/api/exams/${exam._id}`)
        .set("Authorization", `Bearer ${facultyToken}`)
        .expect(200);

      expect(response.body.message).toBe("Exam deleted");

      // Verify exam is deleted
      const deletedExam = await Exam.findById(exam._id);
      expect(deletedExam).toBe(null);
    });

    it("should reject deletion for students", async () => {
      const response = await request(app)
        .delete(`/api/exams/${exam._id}`)
        .set("Authorization", `Bearer ${studentToken}`)
        .expect(403);
    });
  });
});
