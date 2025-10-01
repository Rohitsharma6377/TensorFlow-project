/*
  Entry point for the Social Commerce Marketplace backend (Express + MongoDB)
*/

const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const cron = require('node-cron');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const client = require('prom-client');
require('dotenv').config();

const connectDB = require('./src/config/db');
// Routes
const healthRouter = require('./src/routes/health');
const authRouter = require('./src/routes/auth');
const shopsRouter = require('./src/routes/shops');
const productsRouter = require('./src/routes/products');
const postsRouter = require('./src/routes/posts');
const brandsRouter = require('./src/routes/brands');
const categoriesRouter = require('./src/routes/categories');
const tagsRouter = require('./src/routes/tags');
const taxesRouter = require('./src/routes/taxes');
const couponsRouter = require('./src/routes/coupons');
const storiesRouter = require('./src/routes/stories');
const reelsRouter = require('./src/routes/reels');
const socialRouter = require('./src/routes/social');
const ordersRouter = require('./src/routes/orders');
const shipmentsRouter = require('./src/routes/shipments');
const deliveryRouter = require('./src/routes/delivery');
const chatRouter = require('./src/routes/chat');
const uploadsRouter = require('./src/routes/uploads');
const cartRouter = require('./src/routes/cart');
const paymentsRouter = require('./src/routes/payments');
const feedRouter = require('./src/routes/feed');
const recommendationsRouter = require('./src/routes/recommendations');
const adminRouter = require('./src/routes/admin');
const usersRouter = require('./src/routes/users');
const searchRouter = require('./src/routes/search');
const escrowRouter = require('./src/routes/escrow');
const mlRouter = require('./src/routes/ml');
const wishlistRouter = require('./src/routes/wishlist');
const wishlistCollectionsRouter = require('./src/routes/wishlistCollections');
const web3Router = require('./src/routes/web3');
const notificationsRouter = require('./src/routes/notifications');
const devRouter = require('./src/routes/dev');
const domainsRouter = require('./src/routes/domains');

// Models for cron job
const Escrow = require('./src/models/Escrow');
const Shop = require('./src/models/Shop');
const User = require('./src/models/User');
const Payout = require('./src/models/Payout');
const app = express();

// Core middleware
// CORS: when credentials are used, origin cannot be '*'.
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
console.log('[CORS] Frontend origin set to:', FRONTEND_ORIGIN);
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
// Ensure preflight responses are handled
app.options('*', cors({ origin: FRONTEND_ORIGIN, credentials: true }));
// Stripe webhook requires raw body; register before JSON body parser
app.use('/api/v1/payments/stripe/webhook', express.raw({ type: 'application/json' }));
// Razorpay webhook also should use raw body for signature verification
app.use('/api/v1/payments/razorpay/webhook', express.raw({ type: 'application/json' }));
// Security & parsing
app.use(helmet());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Basic rate limiting on API
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 });
app.use('/api/', limiter);

// Prometheus metrics
client.collectDefaultMetrics();
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

// API routes
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/shops', shopsRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/posts', postsRouter);
app.use('/api/v1/stories', storiesRouter);
app.use('/api/v1/social', socialRouter);
app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/shipments', shipmentsRouter);
app.use('/api/v1/delivery', deliveryRouter);
app.use('/api/v1/chat', chatRouter);
app.use('/api/v1/uploads', uploadsRouter);
app.use('/api/v1/payments', paymentsRouter);
app.use('/api/v1/feed', feedRouter);
app.use('/api/v1/recommendations', recommendationsRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/escrow', escrowRouter);
app.use('/api/v1/ml', mlRouter);
app.use('/api/v1', wishlistRouter);
app.use('/api/v1/wishlist/collections', wishlistCollectionsRouter);
app.use('/api/v1/brands', brandsRouter);
app.use('/api/v1/categories', categoriesRouter);
app.use('/api/v1/tags', tagsRouter);
app.use('/api/v1/taxes', taxesRouter);
app.use('/api/v1/coupons', couponsRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/dev', devRouter);
app.use('/api/v1/domains', domainsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});
// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: FRONTEND_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    socket.on('chat:join', (conversationId) => {
      if (!conversationId) return;
      socket.join(`conv:${conversationId}`);
      socket.emit('chat:joined', conversationId);
    });

    socket.on('chat:leave', (conversationId) => {
      if (!conversationId) return;
      socket.leave(`conv:${conversationId}`);
      socket.emit('chat:left', conversationId);
    });
    socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
  });

  app.set('io', io); // make io available via req.app.get('io') if needed

  server.listen(PORT, () => {
    console.log(`API running at http://localhost:${PORT}`);
  });

  // Scheduled payouts processing at 03:00 daily (server local time)
  const commissionPct = Number(process.env.PAYOUT_COMMISSION_PCT ?? 0.05);
  const deliveryChargePerOrder = Number(process.env.DELIVERY_CHARGE_PER_ORDER ?? 0);
  cron.schedule('0 3 * * *', async () => {
    try {
      console.log('[cron] Processing payouts...');
      const escrows = await Escrow.find({ status: 'released' }).limit(200);
      for (const e of escrows) {
        for (const alloc of e.allocations || []) {
          const shop = await Shop.findById(alloc.shop);
          if (!shop) continue;
          const seller = await User.findById(shop.ownerId);
          if (!seller) continue;
          const commission = alloc.amount * commissionPct;
          const net = Math.max(0, alloc.amount - commission - deliveryChargePerOrder);
          const exists = await Payout.findOne({ order: e.order, shop: shop._id });
          if (exists) continue;
          await Payout.create({
            seller: seller._id,
            shop: shop._id,
            order: e.order,
            amount: net,
            commission,
            deliveryCharges: deliveryChargePerOrder,
            status: 'pending',
            scheduledAt: new Date(),
          });
        }
      }
      console.log('[cron] Payouts processed');
    } catch (err) {
      console.error('[cron] Payouts processing failed', err);
    }
  });
}

start().catch((e) => {
  console.error('Failed to start server:', e);
  process.exit(1);
});
