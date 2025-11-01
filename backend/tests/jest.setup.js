const mongoose = require("mongoose");

// Setup test database before all tests
beforeAll(async () => {
  // Use a simple test database name
  const mongoUri = "mongodb://127.0.0.1:27017/proctored_test_db";

  try {
    // Connect mongoose to the test database
    await mongoose.connect(mongoUri);
    console.log("Connected to test database");
  } catch (error) {
    console.log("MongoDB not available, using mock database");
    // If MongoDB is not available, we'll use mock implementations
    global.MOCK_DB = true;
  }

  // Set environment variables for testing
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test-jwt-secret-key-for-testing";
}, 30000);

// Cleanup after each test
afterEach(async () => {
  if (!global.MOCK_DB && mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
      const collection = collections[key];
      try {
        await collection.deleteMany({});
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
  }
});

// Cleanup after all tests
afterAll(async () => {
  if (!global.MOCK_DB && mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
}, 30000);
