const request = require("supertest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const createTestApp = require("./testApp");
const User = require("../models/User");

const app = createTestApp();

describe("Authentication Routes", () => {
  describe("POST /api/auth/register", () => {
    it("should register a new student successfully", async () => {
      const userData = {
        name: "John Doe",
        email: "john@test.com",
        password: "password123",
        college: "Test College",
        year: 2,
        department: "Computer Science",
        section: 1,
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe("User registered successfully");

      // Verify user was created in database
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user.name).toBe(userData.name);
      expect(user.role).toBe("student");

      // Verify password is hashed
      const passwordMatch = await bcrypt.compare(
        userData.password,
        user.password
      );
      expect(passwordMatch).toBe(true);
    });

    it("should reject registration with existing email", async () => {
      const userData = {
        name: "John Doe",
        email: "john@test.com",
        password: "password123",
        college: "Test College",
        year: 2,
        department: "Computer Science",
        section: 1,
      };

      // Create user first
      await User.create({
        ...userData,
        password: await bcrypt.hash(userData.password, 10),
      });

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body.message).toBe("User already exists");
    });

    it("should reject registration with missing required fields", async () => {
      const incompleteData = {
        name: "John Doe",
        email: "john@test.com",
        // missing password
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(incompleteData)
        .expect(500);
    });
  });

  describe("POST /api/auth/login", () => {
    let testUser;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      testUser = await User.create({
        name: "Test User",
        email: "test@user.com",
        password: hashedPassword,
        role: "student",
        college: "Test College",
        year: 2,
        department: "CS",
        section: 1,
      });
    });

    it("should login successfully with valid credentials", async () => {
      const loginData = {
        email: "test@user.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(200);

      expect(response.body.token).toBeTruthy();
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.role).toBe(testUser.role);

      // Verify JWT token
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(testUser._id.toString());
      expect(decoded.role).toBe(testUser.role);
    });

    it("should reject login with invalid email", async () => {
      const loginData = {
        email: "wrong@email.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(400);

      expect(response.body.message).toBe("Invalid credentials");
    });

    it("should reject login with invalid password", async () => {
      const loginData = {
        email: "test@user.com",
        password: "wrongpassword",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(400);

      expect(response.body.message).toBe("Invalid credentials");
    });
  });

  describe("GET /api/auth/user", () => {
    let testUser, token;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      testUser = await User.create({
        name: "Test User",
        email: "test@user.com",
        password: hashedPassword,
        role: "student",
      });

      token = jwt.sign(
        { id: testUser._id, role: testUser.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
    });

    it("should return user info for valid token", async () => {
      const response = await request(app)
        .get("/api/auth/user")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body._id).toBe(testUser._id.toString());
      expect(response.body.email).toBe(testUser.email);
      expect(response.body.password).toBeUndefined(); // password should be excluded
    });

    it("should reject request without token", async () => {
      const response = await request(app).get("/api/auth/user").expect(401);

      expect(response.body.msg).toBe("No token, authorization denied");
    });

    it("should reject request with invalid token", async () => {
      const response = await request(app)
        .get("/api/auth/user")
        .set("Authorization", "Bearer invalidtoken")
        .expect(401);

      expect(response.body.msg).toBe("Invalid token");
    });
  });
});
