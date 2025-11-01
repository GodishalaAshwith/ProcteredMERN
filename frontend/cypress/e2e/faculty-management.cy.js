describe("Faculty Exam Management", () => {
  let testFaculty, facultyToken, adminToken;

  before(() => {
    cy.waitForApi();

    // For testing purposes, we'll create faculty account
    // In a real scenario, this would be done by admin
    testFaculty = {
      name: "Test Faculty",
      email: `faculty-${Date.now()}@example.com`,
      password: "password123",
    };
  });

  beforeEach(() => {
    cy.window().then((win) => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });
  });

  describe("Faculty Dashboard", () => {
    it("should display faculty dashboard with exam management options", () => {
      // Mock faculty login (assuming faculty account exists)
      cy.visit("/login");

      // This would need actual faculty credentials
      cy.get('input[type="email"]').type("faculty@test.com");
      cy.get('input[type="password"]').type("password123");
      cy.get('button[type="submit"]').click();

      // Should redirect to faculty dashboard
      cy.url().should("include", "/dashboard");

      // Should show faculty-specific options
      cy.contains("Create Exam").should("be.visible");
      cy.contains("My Exams").should("be.visible");
      cy.contains("Submissions").should("be.visible");
    });
  });

  describe("Exam Creation", () => {
    beforeEach(() => {
      // Mock faculty authentication
      cy.visit("/login");
      cy.get('input[type="email"]').type("faculty@test.com");
      cy.get('input[type="password"]').type("password123");
      cy.get('button[type="submit"]').click();
    });

    it("should create a new exam successfully", () => {
      cy.visit("/exam-editor");

      // Fill exam details
      cy.get('input[name="title"]').type("Test Exam " + Date.now());
      cy.get('textarea[name="description"]').type(
        "This is a test exam for automation testing"
      );
      cy.get('input[name="durationMins"]').type("60");

      // Set exam window
      const startTime = new Date();
      startTime.setHours(startTime.getHours() + 1);
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 2);

      cy.get('input[name="startTime"]').type(
        startTime.toISOString().slice(0, 16)
      );
      cy.get('input[name="endTime"]').type(endTime.toISOString().slice(0, 16));

      // Add assignment criteria
      cy.get('input[name="college"]').type("Test College");
      cy.get('select[name="year"]').select("2");
      cy.get('input[name="department"]').type("Computer Science");
      cy.get('select[name="section"]').select("1");

      // Add questions
      cy.get('[data-testid="add-question-btn"]').click();
      cy.get('select[name="questionType"]').last().select("single");
      cy.get('textarea[name="questionText"]').last().type("What is 2 + 2?");

      // Add options
      cy.get('[data-testid="add-option-btn"]').click();
      cy.get('input[name="option"]').eq(0).type("3");
      cy.get('[data-testid="add-option-btn"]').click();
      cy.get('input[name="option"]').eq(1).type("4");
      cy.get('[data-testid="add-option-btn"]').click();
      cy.get('input[name="option"]').eq(2).type("5");

      // Mark correct answer
      cy.get('input[type="checkbox"][data-option="1"]').check();

      cy.get('input[name="points"]').last().clear().type("2");

      // Save exam
      cy.get('[data-testid="save-exam-btn"]').click();

      // Should redirect to faculty exams
      cy.url().should("include", "/faculty-exams");
      cy.contains("Exam created successfully").should("be.visible");
    });

    it("should validate required fields", () => {
      cy.visit("/exam-editor");

      // Try to save without filling required fields
      cy.get('[data-testid="save-exam-btn"]').click();

      // Should show validation errors
      cy.contains("Title is required").should("be.visible");
      cy.contains("Duration is required").should("be.visible");
    });

    it("should validate exam time window", () => {
      cy.visit("/exam-editor");

      cy.get('input[name="title"]').type("Test Exam");
      cy.get('input[name="durationMins"]').type("60");

      // Set invalid time window (end before start)
      const now = new Date();
      const past = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

      cy.get('input[name="startTime"]').type(now.toISOString().slice(0, 16));
      cy.get('input[name="endTime"]').type(past.toISOString().slice(0, 16));

      cy.get('[data-testid="save-exam-btn"]').click();

      // Should show validation error
      cy.contains("End time must be after start time").should("be.visible");
    });
  });

  describe("Exam Management", () => {
    beforeEach(() => {
      cy.visit("/login");
      cy.get('input[type="email"]').type("faculty@test.com");
      cy.get('input[type="password"]').type("password123");
      cy.get('button[type="submit"]').click();
    });

    it("should list all faculty exams", () => {
      cy.visit("/faculty-exams");

      // Should show list of exams
      cy.get('[data-testid="exam-list"]').should("exist");

      // Each exam should have management options
      cy.get('[data-testid="exam-item"]').each(($item) => {
        cy.wrap($item).within(() => {
          cy.get('[data-testid="edit-exam-btn"]').should("exist");
          cy.get('[data-testid="delete-exam-btn"]').should("exist");
          cy.get('[data-testid="view-submissions-btn"]').should("exist");
        });
      });
    });

    it("should edit an existing exam", () => {
      cy.visit("/faculty-exams");

      // Click edit on first exam
      cy.get('[data-testid="edit-exam-btn"]').first().click();

      // Should navigate to exam editor with populated data
      cy.url().should("include", "/exam-editor/");
      cy.get('input[name="title"]').should("have.value");

      // Make changes
      cy.get('input[name="title"]').clear().type("Updated Test Exam");
      cy.get('[data-testid="save-exam-btn"]').click();

      // Should show success message
      cy.contains("Exam updated successfully").should("be.visible");
    });

    it("should delete an exam with confirmation", () => {
      cy.visit("/faculty-exams");

      // Get initial count
      cy.get('[data-testid="exam-item"]').then(($items) => {
        const initialCount = $items.length;

        if (initialCount > 0) {
          // Click delete on first exam
          cy.get('[data-testid="delete-exam-btn"]').first().click();

          // Should show confirmation dialog
          cy.contains("Are you sure you want to delete this exam?").should(
            "be.visible"
          );
          cy.get('[data-testid="confirm-delete"]').click();

          // Should show success message
          cy.contains("Exam deleted successfully").should("be.visible");

          // Should have one less exam
          cy.get('[data-testid="exam-item"]').should(
            "have.length",
            initialCount - 1
          );
        }
      });
    });
  });

  describe("Submissions Management", () => {
    beforeEach(() => {
      cy.visit("/login");
      cy.get('input[type="email"]').type("faculty@test.com");
      cy.get('input[type="password"]').type("password123");
      cy.get('button[type="submit"]').click();
    });

    it("should view exam submissions", () => {
      cy.visit("/faculty-submissions");

      // Should show list of exams with submission counts
      cy.get('[data-testid="exam-submissions"]').should("exist");

      // Click on an exam to view submissions
      cy.get('[data-testid="view-submissions-btn"]').first().click();

      // Should show submissions list
      cy.get('[data-testid="submission-list"]').should("exist");

      // Each submission should show student info and score
      cy.get('[data-testid="submission-item"]').each(($item) => {
        cy.wrap($item).within(() => {
          cy.contains("Student:").should("exist");
          cy.contains("Score:").should("exist");
          cy.contains("Submitted:").should("exist");
        });
      });
    });

    it("should view individual submission details", () => {
      cy.visit("/faculty-submissions");
      cy.get('[data-testid="view-submissions-btn"]').first().click();

      // Click on a submission
      cy.get('[data-testid="view-submission-btn"]').first().click();

      // Should show detailed submission view
      cy.contains("Student Answers").should("be.visible");
      cy.contains("Score Breakdown").should("be.visible");

      // Should show each question and answer
      cy.get('[data-testid="question-review"]').should("exist");
    });

    it("should export submissions data", () => {
      cy.visit("/faculty-submissions");
      cy.get('[data-testid="view-submissions-btn"]').first().click();

      // Should have export functionality
      cy.get('[data-testid="export-submissions"]').click();

      // Should trigger download (mocked in test environment)
      cy.contains("Export started").should("be.visible");
    });
  });

  describe("Real-time Monitoring", () => {
    beforeEach(() => {
      cy.visit("/login");
      cy.get('input[type="email"]').type("faculty@test.com");
      cy.get('input[type="password"]').type("password123");
      cy.get('button[type="submit"]').click();
    });

    it("should show live exam monitoring", () => {
      cy.visit("/faculty-submissions");

      // Select an active exam
      cy.get('[data-testid="monitor-exam-btn"]').first().click();

      // Should show real-time monitoring interface
      cy.contains("Live Monitoring").should("be.visible");
      cy.get('[data-testid="active-students"]').should("exist");

      // Should show proctoring alerts if any
      cy.get('[data-testid="proctoring-alerts"]').should("exist");
    });

    it("should display proctoring events", () => {
      cy.visit("/faculty-submissions");
      cy.get('[data-testid="monitor-exam-btn"]').first().click();

      // Should show proctoring events list
      cy.get('[data-testid="proctoring-events"]').should("exist");

      // Events should include timestamps and descriptions
      cy.get('[data-testid="proctoring-event"]').each(($event) => {
        cy.wrap($event).within(() => {
          cy.contains("Student:").should("exist");
          cy.contains("Event:").should("exist");
          cy.contains("Time:").should("exist");
        });
      });
    });
  });
});
