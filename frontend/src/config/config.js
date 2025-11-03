// Configuration for the frontend application
// Uses Vite environment variables

const config = {
  // API Base URL - defaults to localhost for development
  apiBaseUrl: import.meta.env.VITE_API_BASE || 'http://localhost:5000/api',
  
  // Get the full API URL for a given endpoint
  getApiUrl: (endpoint) => {
    const base = config.apiBaseUrl;
    // Remove /api suffix if present since we'll add it in the endpoint
    const cleanBase = base.replace(/\/api$/, '');
    return `${cleanBase}${endpoint}`;
  }
};

export default config;
