# Quick Deployment Guide

## Frontend Deployment

### Vercel (Recommended for Frontend)

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Select the `frontend` folder as root directory

2. **Configure Build Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Add Environment Variable**
   - Go to Project Settings → Environment Variables
   - Add: 
     - Key: `VITE_API_BASE`
     - Value: `https://your-backend.onrender.com/api`
   - Apply to: Production, Preview, Development

4. **Deploy**
   - Click "Deploy"
   - Your frontend will be live at `https://your-project.vercel.app`

### Netlify

1. **Connect Repository**
   - Go to [netlify.com](https://netlify.com)
   - New site from Git → Choose your repository
   - Base directory: `frontend`

2. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`

3. **Environment Variables**
   - Site settings → Build & deploy → Environment
   - Add: `VITE_API_BASE` = `https://your-backend.onrender.com/api`

4. **Deploy**

### Render (Static Site)

1. **Create New Static Site**
   - Dashboard → New → Static Site
   - Connect your repository

2. **Configure**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Publish Directory: `frontend/dist`

3. **Environment Variables**
   - Add: `VITE_API_BASE` = `https://your-backend.onrender.com/api`

## Backend Deployment

### Render (Recommended for Backend)

1. **Create New Web Service**
   - Dashboard → New → Web Service
   - Connect your repository

2. **Configure**
   - Name: `proctesting-backend` (or your choice)
   - Root Directory: `backend`
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `node server.js`

3. **Environment Variables** (Critical!)
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/proctesting
   JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
   NODE_ENV=production
   CLIENT_URL=https://your-frontend.vercel.app
   ```

4. **Deploy**
   - Render will auto-assign a URL like `https://proctesting-backend.onrender.com`
   - Use this URL (with `/api`) for your frontend's `VITE_API_BASE`

### Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Login and Create App**
   ```bash
   heroku login
   cd backend
   heroku create your-app-name
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set MONGO_URI="your-mongodb-uri"
   heroku config:set JWT_SECRET="your-jwt-secret"
   heroku config:set CLIENT_URL="https://your-frontend.vercel.app"
   ```

4. **Deploy**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

## Database Setup (MongoDB Atlas)

1. **Create Free Cluster**
   - Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Create free account
   - Create a new cluster (M0 free tier)

2. **Configure Access**
   - Database Access → Add New Database User
     - Username: `proctesting-user` (or your choice)
     - Password: Generate secure password
     - Roles: Read and write to any database
   - Network Access → Add IP Address
     - For development: Add your current IP
     - For production: Add `0.0.0.0/0` (allow from anywhere)

3. **Get Connection String**
   - Clusters → Connect → Connect your application
   - Copy connection string
   - Replace `<password>` with your actual password
   - Replace `myFirstDatabase` with `proctesting` (or your DB name)
   - Example: `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/proctesting?retryWrites=true&w=majority`

## Full Deployment Checklist

### Before Deployment

- [ ] MongoDB Atlas cluster created
- [ ] Database user and password created
- [ ] Network access configured (allow 0.0.0.0/0 for production)
- [ ] Backend environment variables prepared
- [ ] Frontend environment variable ready (backend URL)

### Deploy Backend First

- [ ] Deploy backend to Render/Heroku
- [ ] Add all environment variables (MONGO_URI, JWT_SECRET, etc.)
- [ ] Verify backend is running (check logs)
- [ ] Note the backend URL (e.g., `https://your-app.onrender.com`)

### Then Deploy Frontend

- [ ] Set `VITE_API_BASE` to backend URL + `/api`
- [ ] Deploy frontend to Vercel/Netlify
- [ ] Verify frontend can reach backend
- [ ] Test login/register functionality

### Update Backend CORS

- [ ] Update `CLIENT_URL` in backend to match frontend URL
- [ ] Restart backend service
- [ ] Test again to ensure no CORS errors

## Testing Your Deployment

1. **Open Frontend URL** in browser
2. **Open DevTools** (F12) → Network tab
3. **Try to register** a new account
4. **Check Network tab**: 
   - Should see POST to `https://your-backend.com/api/auth/register`
   - Should return 200/201 status
5. **Try to login** with the account
6. **Verify** you can access the dashboard

## Common Deployment Issues

### Issue: "Network Error" on Login/Register
**Solution**: 
- Check `VITE_API_BASE` is set correctly with `/api` suffix
- Verify backend is running (visit backend URL in browser)
- Check backend logs for errors

### Issue: CORS Error
**Solution**:
- Update backend `CLIENT_URL` environment variable
- Make sure it matches your frontend domain exactly
- Restart backend service after changing env vars

### Issue: MongoDB Connection Failed
**Solution**:
- Verify `MONGO_URI` is correct (check for special characters in password)
- Ensure IP whitelist in MongoDB Atlas includes 0.0.0.0/0
- Check MongoDB Atlas cluster is running

### Issue: 401 Unauthorized
**Solution**:
- Make sure `JWT_SECRET` is set on backend
- Clear browser localStorage and try again
- Check token is being sent in Authorization header

## Environment Variables Reference

### Frontend (.env)
```env
VITE_API_BASE=https://your-backend.onrender.com/api
```

### Backend (.env)
```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/proctesting
JWT_SECRET=your-very-long-secret-key-at-least-32-characters
PORT=5000
NODE_ENV=production
CLIENT_URL=https://your-frontend.vercel.app
```

## Need Help?

See [DEPLOYMENT.md](./DEPLOYMENT.md) for more detailed explanations and troubleshooting.
