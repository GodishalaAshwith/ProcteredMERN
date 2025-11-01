module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.js"],
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  collectCoverageFrom: [
    "routes/**/*.js",
    "models/**/*.js",
    "middleware/**/*.js",
    "config/**/*.js",
    "!**/node_modules/**",
    "!tests/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "html", "lcov"],
  testTimeout: 30000,
  verbose: true,
  reporters: [
    "default",
    [
      "jest-html-reporter",
      {
        pageTitle: "Backend Test Report",
        outputPath: "test-reports/backend-report.html",
        includeFailureMsg: true,
        includeSuiteFailure: true,
        theme: "defaultTheme",
        logo: "",
      },
    ],
  ],
};
