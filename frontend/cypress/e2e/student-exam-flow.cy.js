describe("Student Exam Taking Flow", () => {
  let testStudent, studentToken, testFaculty, facultyToken, testExam;

  before(() => {
    cy.waitForApi();

    // Create test student
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
      cy.getAuthToken(testStudent.email, testStudent.password).then((token) => {
        studentToken = token;
      });
    });

    // Create test faculty (assuming admin exists)
    testFaculty = {
      name: "Test Faculty",
      email: `faculty-${Date.now()}@example.com`,
      password: "password123",
    };

    // For this test, we'll assume faculty account creation or use existing faculty
  });

  beforeEach(() => {
    cy.window().then((win) => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });
  });

  describe("Student Dashboard", () => {
    it("should display available exams for student", () => {
      cy.visit("/login");
      cy.setAuthToken(studentToken);
      cy.visit("/dashboard");

      // Should show student dashboard
      cy.contains("Available Exams").should("be.visible");

      // Should show exam cards or empty state
      cy.get('[data-testid="exam-list"]').should("exist");
    });

    it("should allow student to view exam details", () => {
      cy.visit("/login");
      cy.setAuthToken(studentToken);
      cy.visit("/student-exams");

      // If exams exist, should be able to view details
      cy.get('[data-testid="exam-card"]')
        .first()
        .then(($card) => {
          if ($card.length > 0) {
            cy.wrap($card).click();
            cy.url().should("include", "/exam/");
          }
        });
    });
  });

  describe("Exam Taking Process", () => {
    it("should start an exam successfully", () => {
      cy.visit("/login");
      cy.setAuthToken(studentToken);
      cy.visit("/student-exams");

      // Look for an available exam
      cy.get('[data-testid="start-exam-btn"]')
        .first()
        .then(($btn) => {
          if ($btn.length > 0) {
            cy.wrap($btn).click();

            // Should navigate to exam runner
            cy.url().should("include", "/exam-runner");

            // Should show exam interface
            cy.contains("Question").should("be.visible");
            cy.get('[data-testid="timer"]').should("be.visible");
          }
        });
    });

    it("should save answers during exam", () => {
      // This test assumes an exam is already started
      cy.visit("/login");
      cy.setAuthToken(studentToken);

      // Navigate to exam runner (this would normally be through starting an exam)
      cy.visit("/exam-runner/test-exam-id", { failOnStatusCode: false });

      // Try to answer questions
      cy.get('[data-testid="question-answer"]')
        .first()
        .then(($answer) => {
          if ($answer.length > 0) {
            // For multiple choice questions
            if ($answer.is('input[type="radio"]')) {
              cy.wrap($answer).check();
            }
            // For text questions
            else if ($answer.is("textarea")) {
              cy.wrap($answer).type("This is my answer to the question.");
            }

            // Should auto-save answer
            cy.contains("Answer saved").should("be.visible", { timeout: 5000 });
          }
        });
    });

    it("should submit exam successfully", () => {
      cy.visit("/login");
      cy.setAuthToken(studentToken);
      cy.visit("/exam-runner/test-exam-id", { failOnStatusCode: false });

      // Submit the exam
      cy.get('[data-testid="submit-exam-btn"]').click();

      // Confirm submission
      cy.get('[data-testid="confirm-submit"]').click();

      // Should redirect to results or dashboard
      cy.url().should("not.include", "/exam-runner");
      cy.contains("Exam submitted").should("be.visible");
    });

    it("should handle exam time expiration", () => {
      cy.visit("/login");
      cy.setAuthToken(studentToken);
      cy.visit("/exam-runner/test-exam-id", { failOnStatusCode: false });

      // Mock timer expiration (would need to be implemented in app)
      cy.window().then((win) => {
        // Trigger time expiration event if implemented
        win.dispatchEvent(new CustomEvent("examTimeExpired"));
      });

      // Should auto-submit exam
      cy.contains("Time expired").should("be.visible");
      cy.url().should("not.include", "/exam-runner");
    });
  });

  describe("Exam Results and History", () => {
    it("should display exam results", () => {
      cy.visit("/login");
      cy.setAuthToken(studentToken);
      cy.visit("/student-profile");

      // Should show exam history
      cy.contains("Exam History").should("be.visible");

      // Should show submitted exams with scores
      cy.get('[data-testid="exam-result"]').each(($result) => {
        cy.wrap($result).should("contain", "Score:");
        cy.wrap($result).should("contain", "Status:");
      });
    });

    it("should prevent retaking completed exams", () => {
      cy.visit("/login");
      cy.setAuthToken(studentToken);
      cy.visit("/student-exams");

      // Completed exams should not have start button
      cy.get('[data-testid="exam-card"]').each(($card) => {
        cy.wrap($card).within(() => {
          cy.get('[data-testid="exam-status"]').then(($status) => {
            if ($status.text().includes("Completed")) {
              cy.get('[data-testid="start-exam-btn"]').should("not.exist");
            }
          });
        });
      });
    });
  });

  describe("Proctoring Features", () => {
    it("should request camera and microphone permissions", () => {
      cy.visit("/login");
      cy.setAuthToken(studentToken);

      // Mock permission request
      cy.window().then((win) => {
        cy.stub(win.navigator.mediaDevices, "getUserMedia").resolves({
          getTracks: () => [],
        });
      });

      cy.visit("/exam-runner/test-exam-id", { failOnStatusCode: false });

      // Should request permissions (mocked)
      cy.contains("Camera and microphone access required").should("be.visible");
    });

    it("should detect and report suspicious activities", () => {
      cy.visit("/login");
      cy.setAuthToken(studentToken);
      cy.visit("/exam-runner/test-exam-id", { failOnStatusCode: false });

      // Simulate tab switch (browser event)
      cy.window().then((win) => {
        win.dispatchEvent(new Event("blur"));
        win.dispatchEvent(new Event("focus"));
      });

      // Should log proctoring event
      cy.contains("Tab switch detected").should("be.visible");
    });

    it("should handle full-screen mode", () => {
      cy.visit("/login");
      cy.setAuthToken(studentToken);
      cy.visit("/exam-runner/test-exam-id", { failOnStatusCode: false });

      // Should be in full-screen mode during exam
      cy.get('[data-testid="fullscreen-warning"]').should("not.exist");

      // Simulate exiting fullscreen
      cy.window().then((win) => {
        win.dispatchEvent(new Event("fullscreenchange"));
      });

      // Should show warning
      cy.contains("Please remain in full-screen mode").should("be.visible");
    });
  });
});
