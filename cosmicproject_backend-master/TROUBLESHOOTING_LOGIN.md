# Troubleshooting "Invalid Login" Error

## ✅ Port Configuration (CORRECT)
- **Frontend**: Port **3000** (Vite default) ✅
- **Backend**: Port **5000** ✅
- **Frontend connects to**: `http://localhost:5000/api` ✅

## 🔍 Step-by-Step Troubleshooting

### 1. **Verify Backend is Running**

Open a new terminal and check if backend is running:

```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000
# OR on Mac/Linux:
lsof -i :5000
```

If nothing shows up, **start the backend**:
```bash
cd cosmicproject_backend-master
npm start
```

You should see:
```
✅ MongoDB Connected: cosmic.lytki9t.mongodb.net
🚀 Server running on port 5000 in development mode
```

### 2. **Test Backend Connection**

Open browser and go to:
```
http://localhost:5000/api/health
```

You should see:
```json
{
  "status": "success",
  "message": "Server is running successfully",
  "timestamp": "..."
}
```

If this doesn't work → **Backend is not running!**

### 3. **Check Frontend Console**

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Try to login
4. Look for errors like:
   - `Failed to fetch`
   - `Network error`
   - `CORS error`
   - `Connection refused`

### 4. **Check Network Tab**

1. Open DevTools → **Network** tab
2. Try to login
3. Look for `/api/auth/login` request
4. Check:
   - **Status**: Should be 200 (not 404, 500, or failed)
   - **Request URL**: Should be `http://localhost:5000/api/auth/login`
   - **Response**: Check what error message backend returns

### 5. **Common Issues & Solutions**

#### Issue: "Failed to fetch" or "Network error"
**Cause**: Backend not running or not accessible

**Solution**:
```bash
# Start backend
cd cosmicproject_backend-master
npm start
```

#### Issue: "CORS error"
**Cause**: CORS misconfiguration (but we already allow all origins)

**Solution**: Backend already configured correctly, but restart backend:
```bash
cd cosmicproject_backend-master
npm start
```

#### Issue: "Invalid email or password"
**Cause**: Wrong credentials OR user doesn't exist in database

**Solution**: Check if users exist:
```bash
cd cosmicproject_backend-master
node seed.js
# This will create default users
```

Default credentials:
- SuperAdmin: `admin@cosmicsolutions.com` / `Admin@123`
- Manager: `manager@cosmicsolutions.com` / `Manager@123`
- Technician: `technician@cosmicsolutions.com` / `Tech@123`

#### Issue: "User model not available"
**Cause**: MongoDB not connected

**Solution**: Check MongoDB connection in `.env`:
```env
MONGODB_URI=mongodb+srv://Admin:ReFLyChSRbBb!W3@cosmic.lytki9t.mongodb.net/cosmic-solutions?retryWrites=true&w=majority&appName=COSMIC
```

#### Issue: "JWT_SECRET is not defined"
**Cause**: Missing JWT secret in `.env`

**Solution**: Check `.env` has:
```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 6. **Quick Fix Checklist**

- [ ] Backend is running (`npm start` in backend folder)
- [ ] Backend accessible at `http://localhost:5000/api/health`
- [ ] MongoDB connected (check backend logs)
- [ ] `.env` file has correct `MONGODB_URI`
- [ ] `.env` file has `JWT_SECRET` set
- [ ] Users exist in database (run `node seed.js` if needed)
- [ ] Frontend `.env` points to `http://localhost:5000/api`
- [ ] Browser console shows no connection errors

### 7. **Verify Complete Setup**

Run these commands in order:

```bash
# Terminal 1: Start Backend
cd cosmicproject_backend-master
npm start

# Terminal 2: Start Frontend (in new terminal)
cd cosmicprojectfrontend-master
npm run dev

# Terminal 3: Seed Database (if needed)
cd cosmicproject_backend-master
node seed.js
```

### 8. **Test Login**

1. Open browser: `http://localhost:3000` or `http://192.168.31.169:3000`
2. Try login with:
   - Email: `admin@cosmicsolutions.com`
   - Password: `Admin@123`
3. Check browser console for errors
4. Check backend terminal for login logs

## 🐛 Still Not Working?

1. **Check backend logs** - Look for error messages
2. **Check browser console** - Look for specific error messages
3. **Check Network tab** - See what response backend returns
4. **Verify MongoDB connection** - Backend should show "MongoDB Connected"
5. **Restart both servers** - Sometimes helps clear connection issues

## 📝 Expected Behavior

When login works correctly:
- Backend logs: `Login attempt for email: admin@cosmicsolutions.com`
- Backend logs: `Login successful for user: admin@cosmicsolutions.com`
- Browser: Redirects to dashboard
- Browser console: No errors
