// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Login command for reusability
Cypress.Commands.add("login", (email, password) => {
  cy.visit("/login");
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"]').click();
});

// Register command for reusability
Cypress.Commands.add("register", (userData) => {
  cy.visit("/register");
  cy.get('input[name="name"]').type(userData.name);
  cy.get('input[name="email"]').type(userData.email);
  cy.get('input[name="password"]').type(userData.password);
  cy.get('input[name="college"]').type(userData.college);
  cy.get('select[name="year"]').select(userData.year.toString());
  cy.get('input[name="department"]').type(userData.department);
  cy.get('select[name="section"]').select(userData.section.toString());
  cy.get('button[type="submit"]').click();
});

// Create test user via API
Cypress.Commands.add("createTestUser", (userData) => {
  cy.request({
    method: "POST",
    url: `${Cypress.env("apiUrl")}/auth/register`,
    body: userData,
  });
});

// Create test faculty via API
Cypress.Commands.add("createTestFaculty", (adminToken, facultyData) => {
  cy.request({
    method: "POST",
    url: `${Cypress.env("apiUrl")}/admin/faculty`,
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    body: facultyData,
  });
});

// Create test exam via API
Cypress.Commands.add("createTestExam", (facultyToken, examData) => {
  cy.request({
    method: "POST",
    url: `${Cypress.env("apiUrl")}/exams`,
    headers: {
      Authorization: `Bearer ${facultyToken}`,
    },
    body: examData,
  });
});

// Get auth token via API
Cypress.Commands.add("getAuthToken", (email, password) => {
  return cy
    .request({
      method: "POST",
      url: `${Cypress.env("apiUrl")}/auth/login`,
      body: { email, password },
    })
    .then((response) => {
      return response.body.token;
    });
});

// Set auth token in localStorage
Cypress.Commands.add("setAuthToken", (token) => {
  window.localStorage.setItem("token", token);
});

// Wait for API to be ready
Cypress.Commands.add("waitForApi", () => {
  cy.request({
    method: "GET",
    url: `${Cypress.env("apiUrl").replace("/api", "")}/health`,
    retryOnStatusCodeFailure: true,
    timeout: 30000,
  });
});
