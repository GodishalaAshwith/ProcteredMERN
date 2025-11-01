describe("Authentication Flow", () => {
  beforeEach(() => {
    // Wait for API to be ready
    cy.waitForApi();

    // Clear any existing auth state
    cy.window().then((win) => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });
  });

  describe("User Registration", () => {
    it("should register a new student successfully", () => {
      const studentData = {
        name: "John Doe",
        email: `test-${Date.now()}@example.com`,
        password: "password123",
        college: "Test College",
        year: 2,
        department: "Computer Science",
        section: 1,
      };

      cy.register(studentData);

      // Should redirect to login page after successful registration
      cy.url().should("include", "/login");

      // Should show success message
      cy.contains("User registered successfully").should("be.visible");
    });

    it("should show validation errors for invalid data", () => {
      cy.visit("/register");

      // Try to submit empty form
      cy.get('button[type="submit"]').click();

      // Should show validation errors
      cy.contains("required").should("be.visible");
    });

    it("should prevent duplicate email registration", () => {
      const studentData = {
        name: "John Doe",
        email: "duplicate@example.com",
        password: "password123",
        college: "Test College",
        year: 2,
        department: "Computer Science",
        section: 1,
      };

      // Create user via API first
      cy.createTestUser(studentData);

      // Try to register with same email
      cy.register(studentData);

      // Should show error message
      cy.contains("User already exists").should("be.visible");
    });
  });

  describe("User Login", () => {
    let testStudent;

    beforeEach(() => {
      testStudent = {
        name: "Test Student",
        email: `student-${Date.now()}@example.com`,
        password: "password123",
        college: "Test College",
        year: 2,
        department: "Computer Science",
        section: 1,
      };

      // Create test user
      cy.createTestUser(testStudent);
    });

    it("should login successfully with valid credentials", () => {
      cy.login(testStudent.email, testStudent.password);

      // Should redirect to dashboard
      cy.url().should("include", "/dashboard");

      // Should show user info in navbar
      cy.get('[data-testid="user-menu"]').should("contain", testStudent.name);
    });

    it("should show error for invalid credentials", () => {
      cy.login(testStudent.email, "wrongpassword");

      // Should show error message
      cy.contains("Invalid credentials").should("be.visible");

      // Should stay on login page
      cy.url().should("include", "/login");
    });

    it("should show error for non-existent user", () => {
      cy.login("nonexistent@example.com", "password123");

      // Should show error message
      cy.contains("Invalid credentials").should("be.visible");
    });
  });

  describe("Authentication State", () => {
    let testStudent, authToken;

    beforeEach(() => {
      testStudent = {
        name: "Test Student",
        email: `student-${Date.now()}@example.com`,
        password: "password123",
        college: "Test College",
        year: 2,
        department: "Computer Science",
        section: 1,
      };

      cy.createTestUser(testStudent).then(() => {
        cy.getAuthToken(testStudent.email, testStudent.password).then(
          (token) => {
            authToken = token;
          }
        );
      });
    });

    it("should maintain authentication state across page refreshes", () => {
      cy.visit("/login");
      cy.setAuthToken(authToken);

      cy.visit("/dashboard");
      cy.reload();

      // Should still be authenticated
      cy.url().should("include", "/dashboard");
      cy.get('[data-testid="user-menu"]').should("contain", testStudent.name);
    });

    it("should redirect to login when accessing protected routes without auth", () => {
      cy.visit("/dashboard");

      // Should redirect to login
      cy.url().should("include", "/login");
    });

    it("should logout successfully", () => {
      cy.visit("/login");
      cy.setAuthToken(authToken);
      cy.visit("/dashboard");

      // Click logout button
      cy.get('[data-testid="logout-btn"]').click();

      // Should redirect to home/login
      cy.url().should("not.include", "/dashboard");

      // Should not be able to access protected routes
      cy.visit("/dashboard");
      cy.url().should("include", "/login");
    });
  });
});
