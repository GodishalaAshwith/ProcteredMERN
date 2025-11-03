# Environment Configuration Changes - Summary

## 2025-11-03: Student upcoming exams & countdown

- Backend `/api/exams/available` now returns both active and upcoming exams (not yet started but scheduled in the future) for the logged-in student, sorted by `window.start`.
- Frontend `frontend/src/pages/StudentExams.jsx` now:
  - Shows upcoming exams with an "Upcoming" badge.
  - Displays a live countdown (e.g., "Starts in 1h 23m 45s").
  - Disables the Start button until the exam window opens.
  - Keeps existing status badges (in-progress/submitted/invalid) for active or completed attempts.

No changes required to exam creation; start/submit rules are still enforced server-side.

## Changes Made

### 1. Created Environment Configuration Files

#### `frontend/.env`

- Contains local development configuration
- Sets `VITE_API_BASE=http://localhost:5000/api`
- **Important**: This file is gitignored and should not be committed

#### `frontend/.env.example`

- Template file for environment variables
- Committed to git for other developers
- Contains instructions for both local and production setup

### 2. Created Configuration Module

#### `frontend/src/config/config.js`

- Centralized configuration file
- Reads from `import.meta.env.VITE_API_BASE`
- Provides `getApiUrl()` helper function for constructing API URLs
- Falls back to `http://localhost:5000/api` if env var not set

### 3. Updated API Calls

#### `frontend/src/pages/Login.jsx`

- ✅ Added import: `import config from "../config/config"`
- ✅ Changed hardcoded URL to: `config.getApiUrl("/api/auth/login")`

#### `frontend/src/pages/Register.jsx`

- ✅ Added import: `import config from "../config/config"`
- ✅ Changed hardcoded URL to: `config.getApiUrl("/api/auth/register")`

### 4. Updated Git Configuration

#### `.gitignore`

- ✅ Added `frontend/.env` to prevent committing sensitive config

### 5. Created Documentation

#### `DEPLOYMENT.md`

- Comprehensive deployment guide
- Instructions for Vercel, Netlify, Render
- Environment variable configuration examples
- Troubleshooting guide
- Security best practices

#### Updated `Readme.md`

- Added frontend environment setup instructions
- Reference to DEPLOYMENT.md for production deployment

## Already Configured (No Changes Needed)

The following files were already using environment variables correctly:

- ✅ `frontend/src/utils/api.js` - Uses `import.meta.env.VITE_API_BASE`
- ✅ All other pages (AdminFaculty, ExamEditor, FacultyExams, etc.) - Use api.js utility

## How to Use

### For Local Development

1. Copy `frontend/.env.example` to `frontend/.env`
2. The default values should work for local development
3. Run `npm run dev` in the frontend folder

### For Production Deployment

**Frontend (Vercel/Netlify/Render):**

1. Set environment variable: `VITE_API_BASE` = `https://your-backend.onrender.com/api`
2. Build command: `npm run build`
3. Publish directory: `dist`

**Backend (Render/Heroku):**

1. Set environment variables (MONGO_URI, JWT_SECRET, etc.)
2. The platform will auto-set PORT
3. Start command: `node server.js`

## Testing

To verify the configuration works:

1. **Local Testing:**

   ```bash
   cd frontend
   npm run dev
   ```

   - Open browser DevTools → Network tab
   - Try to login/register
   - Verify API calls go to `http://localhost:5000/api`

2. **Production Testing:**
   - Deploy both frontend and backend
   - Check Network tab in browser
   - Verify API calls go to your production backend URL

## Benefits

✅ **No more hardcoded URLs** - Easy to switch between environments
✅ **Environment-aware** - Automatically uses correct API URL
✅ **Secure** - Sensitive config not committed to git
✅ **Well-documented** - Clear deployment instructions
✅ **Maintainable** - Single source of truth for API configuration
✅ **Production-ready** - Works seamlessly with popular hosting platforms

## Files Modified

- ✅ `frontend/.env` (created)
- ✅ `frontend/.env.example` (created)
- ✅ `frontend/src/config/config.js` (created)
- ✅ `frontend/src/pages/Login.jsx` (modified)
- ✅ `frontend/src/pages/Register.jsx` (modified)
- ✅ `.gitignore` (updated)
- ✅ `DEPLOYMENT.md` (created)
- ✅ `Readme.md` (updated)

## No Changes Needed For

- ✅ `frontend/src/utils/api.js` (already dynamic)
- ✅ All other page components (already use api.js)
- ✅ Backend configuration (already uses env vars)
