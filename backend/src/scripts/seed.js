/*
  Seed script to create test users, shops, products (with variants), posts, and follows.
  Run: npm run seed
*/

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');

const User = require('../models/User');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Post = require('../models/Post');
const Follow = require('../models/Follow');
const Story = require('../models/Story');

async function main() {
  await connectDB();

  console.log('Clearing old seed data...');
  await Promise.all([
    User.deleteMany({ email: { $in: ['admin@example.com','seller@example.com','customer@example.com'] } }),
    Shop.deleteMany({ slug: { $in: ['seed-shop'] } }),
    Product.deleteMany({ title: { $in: ['Seed Running Shoe', 'Seed T-Shirt'] } }),
    Post.deleteMany({ caption: /Seed/i }),
    Follow.deleteMany({}),
    Story.deleteMany({ caption: /Seed/i }),
  ]);

  console.log('Creating users...');
  const [admin, seller, customer] = await Promise.all([
    User.create({
      username: 'admin', email: 'admin@example.com', passwordHash: await bcrypt.hash('Admin@123', 10), role: 'superadmin',
      profile: { fullName: 'Admin User' }, isVerified: true
    }),
    User.create({
      username: 'seller', email: 'seller@example.com', passwordHash: await bcrypt.hash('Seller@123', 10), role: 'seller',
      planType: 'gold', kycStatus: 'approved', profile: { fullName: 'Seed Seller' }, isVerified: true
    }),
    User.create({
      username: 'customer', email: 'customer@example.com', passwordHash: await bcrypt.hash('Customer@123', 10), role: 'customer',
      profile: { fullName: 'Seed Customer' }, isVerified: true
    }),
  ]);

  console.log('Creating shop...');
  const shop = await Shop.create({
    ownerId: seller._id,
    shopName: 'Seed Shop',
    slug: 'seed-shop',
    bio: 'A demo shop for seeds',
    location: 'Bengaluru',
    categories: ['Footwear','Apparel'],
    planType: 'gold',
    verified: true,
    trustScore: 80,
  });

  console.log('Creating products (with variants)...');
  const shoe = await Product.create({
    shopId: shop._id,
    title: 'Seed Running Shoe',
    sku: 'SEED-SHOE-BASE',
    description: 'Lightweight running shoe for daily jogs',
    brand: 'FleetRun',
    category: 'Footwear',
    tags: ['running','mens','mesh'],
    currency: 'INR',
    price: 1999,
    mrp: 2499,
    taxRate: 0.18,
    stock: 40,
    images: [],
    options: { color: ['Red','Blue'], size: ['8','9','10'] },
    variants: [
      { sku: 'SEED-SHOE-RED-8', attributes: { color: 'Red', size: '8' }, price: 1999, mrp: 2499, stock: 10, images: [] },
      { sku: 'SEED-SHOE-BLUE-9', attributes: { color: 'Blue', size: '9' }, price: 2099, mrp: 2599, stock: 10, images: [] },
      { sku: 'SEED-SHOE-BLACK-10', attributes: { color: 'Black', size: '10' }, price: 2199, mrp: 2699, stock: 20, images: [] },
    ],
    status: 'active',
  });

  const tshirt = await Product.create({
    shopId: shop._id,
    title: 'Seed T-Shirt',
    sku: 'SEED-TSHIRT-BASE',
    description: 'Soft cotton crew neck',
    brand: 'CottonWorld',
    category: 'Apparel',
    tags: ['tshirt','mens','cotton'],
    currency: 'INR',
    price: 499,
    mrp: 799,
    taxRate: 0.05,
    stock: 100,
    images: [],
    options: { color: ['White','Black'], size: ['M','L','XL'] },
    variants: [
      { sku: 'SEED-TSHIRT-WHT-M', attributes: { color: 'White', size: 'M' }, price: 499, mrp: 799, stock: 30, images: [] },
      { sku: 'SEED-TSHIRT-BLK-L', attributes: { color: 'Black', size: 'L' }, price: 549, mrp: 849, stock: 30, images: [] },
    ],
    status: 'active',
  });

  console.log('Creating posts and stories...');
  const post1 = await Post.create({ shop: shop._id, product: shoe._id, caption: 'Seed Post: New Running Shoe!', media: [], type: 'product' });
  const post2 = await Post.create({ shop: shop._id, product: tshirt._id, caption: 'Seed Post: Summer Tees are here', media: [], type: 'product' });
  const story1 = await Story.create({ shop: shop._id, media: 'https://example.com/story.jpg', cta: 'Shop Now', expiresAt: new Date(Date.now() + 24*3600*1000) });

  console.log('Creating follow relationships...');
  await Follow.create({ follower: customer._id, shop: shop._id });

  console.log('Seed complete. Accounts:');
  console.log('- Admin:    admin@example.com / Admin@123');
  console.log('- Seller:   seller@example.com / Seller@123');
  console.log('- Customer: customer@example.com / Customer@123');

  await mongoose.connection.close();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
