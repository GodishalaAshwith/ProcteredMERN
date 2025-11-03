# Environment Configuration Guide

## Overview
This application uses environment variables to configure the API base URL, making it easy to switch between local development and production deployment.

## Local Development Setup

### Frontend Environment Variables
1. Navigate to the `frontend` directory
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. The default configuration should work for local development:
   ```
   VITE_API_BASE=http://localhost:5000/api
   ```

### Backend Environment Variables
1. Navigate to the `backend` directory
2. Create a `.env` file with the following variables:
   ```
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   ```

## Production Deployment

### Frontend Deployment (e.g., Vercel, Netlify, Render)

1. **Set the environment variable** in your deployment platform:
   - Variable name: `VITE_API_BASE`
   - Variable value: `https://your-backend-url.com/api`
   
   Example for different platforms:
   
   **Vercel:**
   - Go to Project Settings → Environment Variables
   - Add: `VITE_API_BASE` = `https://your-backend.onrender.com/api`
   
   **Netlify:**
   - Go to Site Settings → Build & deploy → Environment
   - Add: `VITE_API_BASE` = `https://your-backend.onrender.com/api`
   
   **Render:**
   - In your Web Service settings
   - Add Environment Variable: `VITE_API_BASE` = `https://your-backend.onrender.com/api`

2. **Build command**: `npm run build`
3. **Publish directory**: `dist`

### Backend Deployment (e.g., Render, Heroku)

1. **Set environment variables**:
   - `MONGO_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A secure random string for JWT signing
   - `PORT`: Usually auto-set by the platform (e.g., Render sets this automatically)
   - `NODE_ENV`: `production`

2. **Build command**: Not required for Node.js backend
3. **Start command**: `node server.js`

## How It Works

### Frontend API Configuration

The frontend uses a centralized configuration file (`src/config/config.js`) that reads from Vite environment variables:

```javascript
const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE || 'http://localhost:5000/api',
  getApiUrl: (endpoint) => {
    // Handles URL construction
  }
};
```

### API Utility Functions

Most API calls use the centralized utility (`src/utils/api.js`):

```javascript
import axios from "axios";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000/api";
const API = axios.create({ baseURL: API_BASE });
```

### Direct Fetch Calls

Some pages (Login, Register) use direct fetch calls with the config:

```javascript
import config from "../config/config";

const response = await fetch(config.getApiUrl("/api/auth/login"), {
  method: "POST",
  // ...
});
```

## Environment Variable Naming Convention

- **Vite** requires environment variables to be prefixed with `VITE_` to be exposed to the client
- Example: `VITE_API_BASE` (correct) vs `API_BASE` (won't work)

## Testing Your Configuration

### Local Testing
1. Start the backend: `cd backend && npm start`
2. Start the frontend: `cd frontend && npm run dev`
3. Check browser console for API calls to verify the correct URL

### Production Testing
1. Check the Network tab in browser DevTools
2. Verify API calls are going to your production backend URL
3. Look for CORS errors (ensure backend allows your frontend domain)

## Common Issues

### CORS Errors
If you see CORS errors in production:
- Update your backend to allow requests from your frontend domain
- In `backend/server.js`, configure CORS properly:
  ```javascript
  const cors = require('cors');
  app.use(cors({
    origin: ['https://your-frontend.vercel.app', 'http://localhost:5173'],
    credentials: true
  }));
  ```

### Environment Variables Not Working
- Ensure variable name starts with `VITE_`
- Restart the Vite dev server after changing `.env`
- Rebuild your app for production after updating environment variables

### API Calls Failing
- Check that `VITE_API_BASE` includes `/api` at the end
- Verify your backend is running and accessible
- Check backend logs for errors

## Security Notes

1. **Never commit `.env` files** to version control
2. The `.env.example` file provides a template without sensitive data
3. Use different JWT secrets for development and production
4. Use strong, unique secrets for production deployments

## Quick Reference

| Environment | Frontend ENV | Backend ENV |
|------------|--------------|-------------|
| Local Dev | `http://localhost:5000/api` | `PORT=5000` |
| Production | `https://your-backend.com/api` | Platform auto-sets PORT |
