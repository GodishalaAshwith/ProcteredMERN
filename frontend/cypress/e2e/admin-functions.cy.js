describe("Admin Functions", () => {
  let adminToken;

  before(() => {
    cy.waitForApi();

    // For testing, we assume an admin account exists
    // In production, this would be created through secure means
  });

  beforeEach(() => {
    cy.window().then((win) => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });
  });

  describe("Admin Authentication", () => {
    it("should login as admin successfully", () => {
      cy.visit("/login");

      // Use admin credentials (these would be environment variables in real tests)
      cy.get('input[type="email"]').type("admin@test.com");
      cy.get('input[type="password"]').type("admin123");
      cy.get('button[type="submit"]').click();

      // Should redirect to admin dashboard
      cy.url().should("include", "/dashboard");

      // Should show admin-specific interface
      cy.contains("Admin Panel").should("be.visible");
      cy.contains("Manage Faculty").should("be.visible");
    });

    it("should reject non-admin users from admin routes", () => {
      // Try to access admin route without proper role
      cy.visit("/login");
      cy.get('input[type="email"]').type("student@test.com");
      cy.get('input[type="password"]').type("password123");
      cy.get('button[type="submit"]').click();

      // Try to access admin route
      cy.visit("/admin-faculty", { failOnStatusCode: false });

      // Should be redirected or show access denied
      cy.contains("Access denied").should("be.visible");
    });
  });

  describe("Faculty Management", () => {
    beforeEach(() => {
      // Login as admin
      cy.visit("/login");
      cy.get('input[type="email"]').type("admin@test.com");
      cy.get('input[type="password"]').type("admin123");
      cy.get('button[type="submit"]').click();
    });

    it("should create new faculty account", () => {
      cy.visit("/admin-faculty");

      // Click create faculty button
      cy.get('[data-testid="create-faculty-btn"]').click();

      // Fill faculty information
      const facultyData = {
        name: `Test Faculty ${Date.now()}`,
        email: `faculty-${Date.now()}@test.com`,
        password: "faculty123",
      };

      cy.get('input[name="name"]').type(facultyData.name);
      cy.get('input[name="email"]').type(facultyData.email);
      cy.get('input[name="password"]').type(facultyData.password);

      // Submit form
      cy.get('[data-testid="submit-faculty"]').click();

      // Should show success message
      cy.contains("Faculty created successfully").should("be.visible");

      // Should appear in faculty list
      cy.contains(facultyData.name).should("be.visible");
      cy.contains(facultyData.email).should("be.visible");
    });

    it("should list all faculty members", () => {
      cy.visit("/admin-faculty");

      // Should show faculty list
      cy.get('[data-testid="faculty-list"]').should("exist");

      // Each faculty item should show required information
      cy.get('[data-testid="faculty-item"]').each(($item) => {
        cy.wrap($item).within(() => {
          cy.get('[data-testid="faculty-name"]').should("exist");
          cy.get('[data-testid="faculty-email"]').should("exist");
          cy.get('[data-testid="faculty-created"]').should("exist");
        });
      });
    });

    it("should validate faculty creation form", () => {
      cy.visit("/admin-faculty");
      cy.get('[data-testid="create-faculty-btn"]').click();

      // Try to submit empty form
      cy.get('[data-testid="submit-faculty"]').click();

      // Should show validation errors
      cy.contains("Name is required").should("be.visible");
      cy.contains("Email is required").should("be.visible");
      cy.contains("Password is required").should("be.visible");
    });

    it("should prevent duplicate faculty email", () => {
      cy.visit("/admin-faculty");

      // Get first faculty email from the list
      cy.get('[data-testid="faculty-email"]')
        .first()
        .invoke("text")
        .then((existingEmail) => {
          cy.get('[data-testid="create-faculty-btn"]').click();

          // Try to create faculty with existing email
          cy.get('input[name="name"]').type("Duplicate Faculty");
          cy.get('input[name="email"]').type(existingEmail);
          cy.get('input[name="password"]').type("password123");

          cy.get('[data-testid="submit-faculty"]').click();

          // Should show error message
          cy.contains("User with this email already exists").should(
            "be.visible"
          );
        });
    });
  });

  describe("System Overview", () => {
    beforeEach(() => {
      cy.visit("/login");
      cy.get('input[type="email"]').type("admin@test.com");
      cy.get('input[type="password"]').type("admin123");
      cy.get('button[type="submit"]').click();
    });

    it("should display system statistics", () => {
      cy.visit("/dashboard");

      // Should show key metrics
      cy.get('[data-testid="total-students"]').should("exist");
      cy.get('[data-testid="total-faculty"]').should("exist");
      cy.get('[data-testid="total-exams"]').should("exist");
      cy.get('[data-testid="active-exams"]').should("exist");

      // Numbers should be displayed
      cy.get('[data-testid="total-students"]').should(
        "contain.text",
        "Students"
      );
      cy.get('[data-testid="total-faculty"]').should("contain.text", "Faculty");
      cy.get('[data-testid="total-exams"]').should("contain.text", "Exams");
    });

    it("should show recent activity", () => {
      cy.visit("/dashboard");

      // Should show activity feed
      cy.get('[data-testid="recent-activity"]').should("exist");

      // Should show different types of activities
      cy.get('[data-testid="activity-item"]').should("exist");
    });

    it("should display system health status", () => {
      cy.visit("/dashboard");

      // Should show system status indicators
      cy.get('[data-testid="system-status"]').should("exist");
      cy.contains("System Status").should("be.visible");

      // Should show database and API status
      cy.get('[data-testid="database-status"]').should("exist");
      cy.get('[data-testid="api-status"]').should("exist");
    });
  });

  describe("User Management", () => {
    beforeEach(() => {
      cy.visit("/login");
      cy.get('input[type="email"]').type("admin@test.com");
      cy.get('input[type="password"]').type("admin123");
      cy.get('button[type="submit"]').click();
    });

    it("should view all registered students", () => {
      cy.visit("/admin-students", { failOnStatusCode: false });

      // If this route exists
      cy.get('[data-testid="student-list"]').should("exist");

      // Should show student information
      cy.get('[data-testid="student-item"]').each(($item) => {
        cy.wrap($item).within(() => {
          cy.get('[data-testid="student-name"]').should("exist");
          cy.get('[data-testid="student-email"]').should("exist");
          cy.get('[data-testid="student-college"]').should("exist");
        });
      });
    });

    it("should search and filter users", () => {
      cy.visit("/admin-faculty");

      // Should have search functionality
      cy.get('[data-testid="search-faculty"]').type("test");

      // Results should be filtered
      cy.get('[data-testid="faculty-item"]').each(($item) => {
        cy.wrap($item).should("contain.text", "test");
      });
    });
  });

  describe("Reports and Analytics", () => {
    beforeEach(() => {
      cy.visit("/login");
      cy.get('input[type="email"]').type("admin@test.com");
      cy.get('input[type="password"]').type("admin123");
      cy.get('button[type="submit"]').click();
    });

    it("should generate system reports", () => {
      cy.visit("/admin-reports", { failOnStatusCode: false });

      // Should have reporting interface
      cy.contains("Reports").should("be.visible");

      // Should have different report types
      cy.get('[data-testid="exam-report-btn"]').should("exist");
      cy.get('[data-testid="user-report-btn"]').should("exist");
      cy.get('[data-testid="proctoring-report-btn"]').should("exist");
    });

    it("should export data", () => {
      cy.visit("/admin-reports", { failOnStatusCode: false });

      // Should have export functionality
      cy.get('[data-testid="export-data-btn"]').click();

      // Should show export options
      cy.contains("Export Format").should("be.visible");
      cy.get('select[name="format"]').select("CSV");
      cy.get('[data-testid="confirm-export"]').click();

      // Should show export success message
      cy.contains("Export started").should("be.visible");
    });
  });

  describe("System Settings", () => {
    beforeEach(() => {
      cy.visit("/login");
      cy.get('input[type="email"]').type("admin@test.com");
      cy.get('input[type="password"]').type("admin123");
      cy.get('button[type="submit"]').click();
    });

    it("should manage system settings", () => {
      cy.visit("/admin-settings", { failOnStatusCode: false });

      // Should show settings interface
      cy.contains("System Settings").should("be.visible");

      // Should have various setting categories
      cy.contains("General").should("be.visible");
      cy.contains("Security").should("be.visible");
      cy.contains("Proctoring").should("be.visible");
    });

    it("should update system configuration", () => {
      cy.visit("/admin-settings", { failOnStatusCode: false });

      // Update a setting
      cy.get('input[name="systemName"]').clear().type("Updated Exam System");
      cy.get('[data-testid="save-settings"]').click();

      // Should show success message
      cy.contains("Settings updated").should("be.visible");

      // Setting should persist after reload
      cy.reload();
      cy.get('input[name="systemName"]').should(
        "have.value",
        "Updated Exam System"
      );
    });
  });
});
