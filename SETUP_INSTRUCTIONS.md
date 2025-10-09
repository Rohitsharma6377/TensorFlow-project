# Setup Instructions for Total Income Management

## Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup environment variables:**
   - Copy `.env.example` to `.env`
   - Update the following variables in `.env`:
   ```
   PORT=4000
   MONGODB_URI=mongodb://127.0.0.1:27017/social_commerce_saas
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRES_IN=7d
   ```

4. **Start MongoDB:**
   - Make sure MongoDB is running on your system
   - Default connection: `mongodb://127.0.0.1:27017/social_commerce_saas`

5. **Start the backend server:**
   ```bash
   npm run dev
   ```
   - Backend will run on `http://localhost:4000`

## Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup environment variables:**
   - Create `.env.local` file with:
   ```
   NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
   ```

4. **Start the frontend:**
   ```bash
   npm run dev
   ```
   - Frontend will run on `http://localhost:3000`

## New API Endpoints

The following API endpoints have been added to the backend:

### Wallet Management
- **POST** `/api/v1/admin/wallet` - Add/deduct money from seller wallet
- **GET** `/api/v1/admin/wallet?sellerId=xxx` - Get wallet details

### Plan Management  
- **POST** `/api/v1/admin/plan` - Set seller plan limits
- **GET** `/api/v1/admin/plan?sellerId=xxx` - Get plan details

## Authentication

All admin endpoints require:
- Valid JWT token in Authorization header: `Bearer <token>`
- User role must be 'admin' or 'superadmin'

## Testing the Features

1. Start both backend and frontend servers
2. Login as admin/superadmin user
3. Navigate to `/superadmin/total-income`
4. Use the seller management features:
   - Select a seller from dropdown
   - Click "Manage Money" to add/deduct funds
   - Click "Set Plan Limit" to configure limits

## Database Models

The implementation uses existing User model with:
- `walletBalance` field for storing wallet balance
- `profile.planLimits` object for storing plan limits
- Notifications model for audit trail

## Notes

- All API routes have been moved from Next.js frontend to Node.js backend
- Frontend now calls backend APIs directly
- Proper authentication and validation implemented
- Audit trail maintained through notifications
