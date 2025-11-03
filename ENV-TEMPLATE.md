# Environment Variables Template

## Frontend Environment Variables

### Local Development (.env)

```env
# API Base URL - Points to local backend
VITE_API_BASE=http://localhost:5000/api
```

### Production (Vercel/Netlify/Render)

```env
# API Base URL - Points to deployed backend
VITE_API_BASE=https://your-backend-app.onrender.com/api
```

**Note**: Replace `your-backend-app.onrender.com` with your actual backend URL

---

## Backend Environment Variables

### Local Development (.env)

```env
# MongoDB Connection String (Local)
MONGO_URI=mongodb://localhost:27017/proctesting

# OR MongoDB Atlas (Cloud)
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/proctesting?retryWrites=true&w=majority

# JWT Secret for token signing (use a strong random string)
JWT_SECRET=your-local-development-secret-key-at-least-32-chars

# Server Port
PORT=5000

# Frontend URL for CORS
# Either set a single URL:
CLIENT_URL=http://localhost:5173
# Or set multiple, comma-separated URLs (takes precedence over CLIENT_URL):
# CLIENT_URLS=http://localhost:5173,https://your-frontend.vercel.app

# Node Environment
NODE_ENV=development
```

### Production (Render/Heroku/Railway)

```env
# MongoDB Connection String (MongoDB Atlas)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/proctesting?retryWrites=true&w=majority

# JWT Secret (IMPORTANT: Use a different, strong secret for production)
JWT_SECRET=production-secret-key-must-be-very-long-and-random-at-least-64-characters-recommended

# Server Port (usually auto-assigned by hosting platform)
PORT=5000

# Frontend URL for CORS (your deployed frontend domain)
CLIENT_URL=https://your-frontend-app.vercel.app
# Or multiple allowed origins:
# CLIENT_URLS=https://your-frontend-app.vercel.app,https://preview-<id>--your-frontend.netlify.app

# Node Environment
NODE_ENV=production
```

---

## How to Generate Secure Secrets

### Option 1: Using Node.js

```javascript
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Option 2: Using OpenSSL

```bash
openssl rand -base64 32
```

### Option 3: Using Online Tool

- Visit: https://www.random.org/strings/
- Generate a random alphanumeric string (min 32 characters)

---

## Platform-Specific Instructions

### Vercel (Frontend)

1. Project Settings → Environment Variables
2. Add variable name: `VITE_API_BASE`
3. Add variable value: `https://your-backend.onrender.com/api`
4. Select environments: Production, Preview, Development

### Netlify (Frontend)

1. Site settings → Build & deploy → Environment
2. Click "Add variable"
3. Key: `VITE_API_BASE`
4. Value: `https://your-backend.onrender.com/api`

### Render (Backend)

1. Dashboard → Your Web Service → Environment
2. Add Environment Variables:
   - `MONGO_URI` = `mongodb+srv://...`
   - `JWT_SECRET` = `your-secret-key`
   - `CLIENT_URL` = `https://your-frontend.vercel.app`
   - `NODE_ENV` = `production`

### Heroku (Backend)

```bash
heroku config:set MONGO_URI="mongodb+srv://..."
heroku config:set JWT_SECRET="your-secret-key"
heroku config:set CLIENT_URL="https://your-frontend.vercel.app"
heroku config:set NODE_ENV="production"
```

---

## Validation Checklist

### Before Deploying Frontend

- [ ] `VITE_API_BASE` includes `/api` at the end
- [ ] Backend URL is HTTPS (not HTTP) for production
- [ ] Backend is already deployed and running

### Before Deploying Backend

- [ ] `MONGO_URI` connection string is valid
- [ ] MongoDB Atlas IP whitelist includes 0.0.0.0/0 (or your host's IPs)
- [ ] `JWT_SECRET` is strong and unique (min 32 characters)
- [ ] `CLIENT_URL` matches your frontend domain exactly
- [ ] All special characters in passwords are URL-encoded if needed

### After Deployment

- [ ] Frontend can reach backend (check Network tab in browser)
- [ ] No CORS errors in browser console
- [ ] Can successfully register and login
- [ ] MongoDB shows new documents being created

---

## Security Best Practices

1. **Never commit .env files** to version control
2. **Use different secrets** for development and production
3. **Rotate JWT secrets periodically** in production
4. **Use strong passwords** for MongoDB users (min 16 characters)
5. **Enable 2FA** on MongoDB Atlas and hosting platforms
6. **Monitor access logs** regularly
7. **Keep dependencies updated** (`npm audit fix`)

---

## Troubleshooting

### MongoDB URI Special Characters

If your password contains special characters, URL-encode them:

- `@` → `%40`
- `:` → `%3A`
- `/` → `%2F`
- `?` → `%3F`
- `#` → `%23`
- `%` → `%25`

Example:

```
Password: p@ss:word/123
Encoded: p%40ss%3Aword%2F123
```

### Verifying Environment Variables

**Frontend (Browser Console):**

```javascript
console.log(import.meta.env.VITE_API_BASE);
```

**Backend (Node.js):**

```javascript
console.log("MONGO_URI:", process.env.MONGO_URI ? "Set" : "Not Set");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "Set" : "Not Set");
```

---

## Quick Reference

| Variable        | Location | Required | Example                       |
| --------------- | -------- | -------- | ----------------------------- |
| `VITE_API_BASE` | Frontend | Yes      | `https://backend.com/api`     |
| `MONGO_URI`     | Backend  | Yes      | `mongodb+srv://...`           |
| `JWT_SECRET`    | Backend  | Yes      | `random-64-char-string`       |
| `CLIENT_URL`    | Backend  | Yes      | `https://frontend.com`        |
| `CLIENT_URLS`   | Backend  | No       | `https://a.com,https://b.com` |
| `PORT`          | Backend  | No\*     | `5000`                        |
| `NODE_ENV`      | Backend  | Yes      | `production`                  |

\*Usually auto-set by hosting platform
