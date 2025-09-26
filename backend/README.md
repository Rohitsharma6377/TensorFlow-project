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
    health.js            # Healthcheck route
  utils/jwt.js           # JWT helper
.env.example             # Environment template

## New: Web3 Blockchain + Wallet + Chat

This backend now includes a minimal blockchain ledger, wallet utilities, and real-time chat.

### Setup

- Install dependencies (added `elliptic` and `crypto-js`):

```
npm install
```

- Optionally set the frontend origin for CORS:

```
# .env
FRONTEND_ORIGIN=http://localhost:3000
```

### Real-time Chat (Socket.IO)

- Socket server is initialized in `index.js`.
- Join a conversation room from the client:

```js
socket.emit('chat:join', conversationId);
socket.on('chat:message', ({ conversationId, message }) => {
  // render message
});
```

- REST endpoints in `src/routes/chat.js`:

- POST `/api/v1/chat/conversations` create or fetch conversation
- GET `/api/v1/chat/conversations` list conversations for current user
- GET `/api/v1/chat/conversations/:id/messages` list messages
- POST `/api/v1/chat/conversations/:id/messages` send message (also emits to room `conv:<id>`)

### Blockchain & Wallet (Demo)

Code lives in `src/web3/`:

- `blockchain.js`: `Transaction`, `Block`, `Blockchain`, and a singleton `chain`
- `wallet.js`: ECDSA keypair (secp256k1), basic signing/verification, address derivation

REST endpoints in `src/routes/web3.js`:

- GET `/api/v1/web3/chain` returns the full chain (demo)
- GET `/api/v1/web3/balance/:address` returns computed balance from chain
- POST `/api/v1/web3/wallet/register` registers a wallet for the current user
  - Body optional: `{ publicKey }` if the client already has a keypair
  - If not provided, server will generate a keypair and return `{ privateKey, publicKey, address }` (do not store private key server-side)
- POST `/api/v1/web3/tx` creates a transaction and mines a block immediately (demo PoW)
  - Body (coinbase): `{ toAddress, amount }`
  - Body (signed): `{ fromAddress, toAddress, amount, publicKey, signature }`

User model additions (`src/models/User.js`):

- `walletAddress`, `walletPublicKey` for linking app users to on-ledger addresses.

Order reward hook (`src/routes/orders.js`):

- After checkout, the user is rewarded with 1% of `totalAmount` as a coinbase transaction credited to their `walletAddress` (if present).

Security notes:

- Store wallet private keys on the client only. Server never persists private keys.
- Endpoints are protected with JWT/session via `src/middleware/auth.js`.