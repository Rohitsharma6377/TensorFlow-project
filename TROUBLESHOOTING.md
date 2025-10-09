# Troubleshooting Guide - Total Income Management

## Quick Fix Steps

### 1. Start Both Servers

**Option A: Use the batch file**
```bash
# Double-click this file:
start-servers.bat
```

**Option B: Manual start**
```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm install
npm run dev
```

### 2. Verify Environment Variables

**Backend (.env file):**
```
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/social_commerce_saas
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
```

**Frontend (.env.local file):**
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

### 3. Test Backend Connection

1. Go to Total Income page: `http://localhost:3000/superadmin/total-income`
2. Click "Test Backend Connection" button
3. Check the result:
   - ✅ Success: Backend is working
   - ❌ Error: Follow steps below

## Common Issues & Solutions

### Issue 1: "Failed to add money: Unknown error"

**Cause:** Frontend can't reach backend

**Solutions:**
1. **Check if backend is running:**
   ```bash
   # Should show: API running at http://localhost:4000
   cd backend && npm run dev
   ```

2. **Test backend directly:**
   ```bash
   curl http://localhost:4000/api/v1/admin/test
   ```

3. **Check environment variable:**
   - Restart frontend after creating `.env.local`
   - Verify: `console.log(process.env.NEXT_PUBLIC_API_BASE_URL)`

### Issue 2: "403 Forbidden" or "Admin only"

**Cause:** Authentication issue

**Solutions:**
1. **Login as admin/superadmin user**
2. **Check JWT token:**
   ```javascript
   // In browser console:
   localStorage.getItem('token')
   ```
3. **Verify user role in database**

### Issue 3: "Route not found"

**Cause:** Backend routes not registered

**Solutions:**
1. **Verify admin routes are loaded:**
   ```javascript
   // Check backend/index.js line 118:
   app.use('/api/v1/admin', adminRouter);
   ```

2. **Check route exists:**
   ```bash
   # Should return test response:
   curl http://localhost:4000/api/v1/admin/test
   ```

### Issue 4: CORS Errors

**Cause:** Cross-origin request blocked

**Solutions:**
1. **Check CORS configuration in backend/index.js:**
   ```javascript
   const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
   ```

2. **Set environment variable:**
   ```bash
   # In backend/.env:
   FRONTEND_ORIGIN=http://localhost:3000
   ```

### Issue 5: Database Connection

**Cause:** MongoDB not running or wrong URI

**Solutions:**
1. **Start MongoDB:**
   ```bash
   # Windows:
   net start MongoDB
   
   # Mac/Linux:
   sudo systemctl start mongod
   ```

2. **Check connection:**
   ```bash
   # Should connect without error:
   mongo mongodb://127.0.0.1:27017/social_commerce_saas
   ```

## Debug Information

### Check Browser Console

Look for these logs when testing wallet management:
```
[WALLET] API_BASE: http://localhost:4000
[WALLET] Request: {sellerId: "...", type: "add", amount: 100, reason: "..."}
[WALLET] Token exists: true
[WALLET] Response status: 200
[WALLET] Response ok: true
[WALLET] Success response: {...}
```

### Check Backend Console

Look for these logs:
```
[WALLET API] add $100 to seller 123. Reason: Test
API running at http://localhost:4000
```

### Network Tab

1. Open browser DevTools → Network tab
2. Try wallet operation
3. Look for request to `localhost:4000/api/v1/admin/wallet`
4. Check status code and response

## API Endpoints Reference

### Wallet Management
- **POST** `/api/v1/admin/wallet`
  ```json
  {
    "sellerId": "user_id_here",
    "type": "add", // or "deduct"
    "amount": 100.50,
    "reason": "Admin adjustment"
  }
  ```

- **GET** `/api/v1/admin/wallet?sellerId=user_id`

### Plan Management
- **POST** `/api/v1/admin/plan`
  ```json
  {
    "sellerId": "user_id_here", 
    "type": "order_limit",
    "limit": 100
  }
  ```

- **GET** `/api/v1/admin/plan?sellerId=user_id`

## Still Having Issues?

1. **Check all servers are running:**
   - Backend: http://localhost:4000
   - Frontend: http://localhost:3000
   - MongoDB: mongodb://127.0.0.1:27017

2. **Clear browser cache and localStorage**

3. **Restart both servers**

4. **Check firewall/antivirus blocking ports 3000 or 4000**

5. **Try different browser or incognito mode**

## Success Indicators

✅ Backend test shows: "Backend Connected!"
✅ Console shows wallet request logs
✅ No CORS errors in browser console
✅ MongoDB connection successful
✅ JWT token present in localStorage
✅ User has admin/superadmin role
