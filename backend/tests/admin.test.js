const request = require("supertest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const createTestApp = require("./testApp");
const User = require("../models/User");

const app = createTestApp();

describe("Admin Routes", () => {
  let adminUser, adminToken, facultyUser, studentUser, studentToken;

  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);

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

    // Create existing faculty user
    facultyUser = await User.create({
      name: "Existing Faculty",
      email: "existing@faculty.com",
      password: hashedPassword,
      role: "faculty",
    });

    // Create student user
    studentUser = await User.create({
      name: "Student User",
      email: "student@test.com",
      password: hashedPassword,
      role: "student",
    });

    studentToken = jwt.sign(
      { id: studentUser._id, role: studentUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  });

  describe("POST /api/admin/faculty", () => {
    it("should create faculty account successfully", async () => {
      const facultyData = {
        name: "New Faculty",
        email: "new@faculty.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/admin/faculty")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(facultyData)
        .expect(201);

      expect(response.body.name).toBe(facultyData.name);
      expect(response.body.email).toBe(facultyData.email);
      expect(response.body.role).toBe("faculty");
      expect(response.body.id).toBeTruthy();

      // Verify user was created in database with correct role
      const createdFaculty = await User.findById(response.body.id);
      expect(createdFaculty.role).toBe("faculty");

      // Verify password is hashed
      const passwordMatch = await bcrypt.compare(
        facultyData.password,
        createdFaculty.password
      );
      expect(passwordMatch).toBe(true);
    });

    it("should reject faculty creation with existing email", async () => {
      const facultyData = {
        name: "Duplicate Faculty",
        email: "existing@faculty.com", // Email already exists
        password: "password123",
      };

      const response = await request(app)
        .post("/api/admin/faculty")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(facultyData)
        .expect(400);

      expect(response.body.message).toBe("User with this email already exists");
    });

    it("should reject faculty creation with missing fields", async () => {
      const incompleteData = {
        name: "Incomplete Faculty",
        // missing email and password
      };

      const response = await request(app)
        .post("/api/admin/faculty")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(incompleteData)
        .expect(400);

      expect(response.body.message).toBe(
        "name, email and password are required"
      );
    });

    it("should reject faculty creation for non-admin users", async () => {
      const facultyData = {
        name: "Unauthorized Faculty",
        email: "unauthorized@faculty.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/admin/faculty")
        .set("Authorization", `Bearer ${studentToken}`)
        .send(facultyData)
        .expect(403);

      expect(response.body.msg).toBe("Forbidden: insufficient role");
    });

    it("should reject faculty creation without authentication", async () => {
      const facultyData = {
        name: "Unauthenticated Faculty",
        email: "unauth@faculty.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/admin/faculty")
        .send(facultyData)
        .expect(401);

      expect(response.body.msg).toBe("No token, authorization denied");
    });
  });

  describe("GET /api/admin/faculty", () => {
    it("should list all faculty members successfully", async () => {
      // Create additional faculty members
      await User.create({
        name: "Faculty One",
        email: "faculty1@test.com",
        password: await bcrypt.hash("password123", 10),
        role: "faculty",
      });

      await User.create({
        name: "Faculty Two",
        email: "faculty2@test.com",
        password: await bcrypt.hash("password123", 10),
        role: "faculty",
      });

      const response = await request(app)
        .get("/api/admin/faculty")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveLength(3); // Including existing faculty
      expect(response.body.every((user) => user.role === "faculty")).toBe(true);

      // Check that sensitive data is not included
      expect(response.body[0].password).toBeUndefined();

      // Check that all faculty are included
      const facultyNames = response.body.map((f) => f.name);
      expect(facultyNames).toContain("Existing Faculty");
      expect(facultyNames).toContain("Faculty One");
      expect(facultyNames).toContain("Faculty Two");
    });

    it("should return empty array when no faculty exists", async () => {
      // Remove existing faculty
      await User.deleteMany({ role: "faculty" });

      const response = await request(app)
        .get("/api/admin/faculty")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });

    it("should reject access for non-admin users", async () => {
      const response = await request(app)
        .get("/api/admin/faculty")
        .set("Authorization", `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.msg).toBe("Forbidden: insufficient role");
    });

    it("should reject access without authentication", async () => {
      const response = await request(app).get("/api/admin/faculty").expect(401);

      expect(response.body.msg).toBe("No token, authorization denied");
    });
  });

  describe("Admin Role Authorization", () => {
    it("should properly validate admin role for all admin routes", async () => {
      const facultyToken = jwt.sign(
        { id: facultyUser._id, role: facultyUser.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      // Test faculty creation with faculty token
      const response1 = await request(app)
        .post("/api/admin/faculty")
        .set("Authorization", `Bearer ${facultyToken}`)
        .send({
          name: "Test Faculty",
          email: "test@faculty.com",
          password: "password123",
        })
        .expect(403);

      // Test faculty listing with faculty token
      const response2 = await request(app)
        .get("/api/admin/faculty")
        .set("Authorization", `Bearer ${facultyToken}`)
        .expect(403);

      expect(response1.body.msg).toBe("Forbidden: insufficient role");
      expect(response2.body.msg).toBe("Forbidden: insufficient role");
    });
  });
});
