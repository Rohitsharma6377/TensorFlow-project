# Social Commerce SaaS Backend (Node.js + Express + MongoDB)

This repository now includes a runnable backend scaffold for a social commerce marketplace (Instagram-like shops + marketplace + escrow + logistics ready).

## Quick Start

1. Create environment file

Copy `.env.example` to `.env` and adjust values:

```
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/social_commerce_saas
JWT_SECRET=change_this_in_production
JWT_EXPIRES_IN=7d
```

2. Install dependencies

```
npm install
```

3. Run the server (dev)

```
npm run dev
```

API will start at: `http://localhost:4000`

## Healthcheck

- GET `/api/v1/health` → `{ success: true, status: 'ok' }`

## Auth Endpoints

- POST `/api/v1/auth/signup`
  - body: `{ username, email, password, role(optional) }`
- POST `/api/v1/auth/login`
  - body: `{ usernameOrEmail, password }`
- GET `/api/v1/auth/me`
  - header: `Authorization: Bearer <token>`

## Project Structure

```
index.js                 # App entry, Express + Socket.IO
src/
  config/db.js           # MongoDB connection
  middleware/auth.js     # JWT auth middleware
  models/User.js         # User model
  routes/
    auth.js              # Auth routes
    health.js            # Healthcheck route
  utils/jwt.js           # JWT helper
.env.example             # Environment template
```

## Next Steps (planned)

- Shops, products, orders, social (likes/comments/follows), escrow & payouts, delivery partner webhooks.
- Admin and Seller dashboards endpoints.
- WebSocket channels for realtime events.

If you need help wiring specific modules next, open an issue or ask in this chat.