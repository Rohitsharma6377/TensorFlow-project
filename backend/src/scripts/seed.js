/*
  Seed script to create demo users, shops, products, posts, and follows.
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

async function main() {
  await connectDB();

  // Clear only seed-specific data to avoid nuking real DB
  console.log('Clearing old seed data...');
  await Promise.all([
    User.deleteMany({ email: { $in: ['admin@example.com','seller1@example.com','seller2@example.com','customer@example.com'] } }),
    Shop.deleteMany({ slug: { $in: ['fashion-hub-seed','tech-store-seed','home-decor-seed'] } }),
    Product.deleteMany({ title: { $in: ['Seed Running Shoe', 'Seed T-Shirt', 'Seed Phone', 'Seed Sofa'] } }),
    Post.deleteMany({ caption: /Seed Post:/i }),
    Follow.deleteMany({}),
  ]);

  console.log('Creating users...');
  const [admin, seller1, seller2, customer] = await Promise.all([
    User.create({ username: 'admin', email: 'admin@example.com', passwordHash: await bcrypt.hash('Admin@123', 10), role: 'superadmin', isVerified: true, profile: { fullName: 'Admin User' } }),
    User.create({ username: 'seller1', email: 'seller1@example.com', passwordHash: await bcrypt.hash('Seller@123', 10), role: 'seller', kycStatus: 'approved', isVerified: true, profile: { fullName: 'Fashion Seller' } }),
    User.create({ username: 'seller2', email: 'seller2@example.com', passwordHash: await bcrypt.hash('Seller@123', 10), role: 'seller', kycStatus: 'approved', isVerified: true, profile: { fullName: 'Tech Seller' } }),
    User.create({ username: 'customer', email: 'customer@example.com', passwordHash: await bcrypt.hash('Customer@123', 10), role: 'customer', isVerified: true, profile: { fullName: 'Seed Customer' } }),
  ]);

  console.log('Creating shops...');
  const [fashionHub, techStore, homeDecor] = await Promise.all([
    Shop.create({
      name: 'Fashion Hub',
      owner: seller1._id,
      slug: 'fashion-hub-seed',
      description: 'Trendy apparel and accessories',
      logo: { url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=128&h=128&fit=crop&crop=center' },
      categories: ['Apparel','Accessories'],
      isActive: true,
      status: 'active',
      isVerified: true,
      isFeatured: true,
    }),
    Shop.create({
      name: 'Tech Store',
      owner: seller2._id,
      slug: 'tech-store-seed',
      description: 'Latest gadgets and devices',
      logo: { url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=128&h=128&fit=crop&crop=center' },
      categories: ['Electronics'],
      isActive: true,
      status: 'active',
      isVerified: true,
      isFeatured: true,
    }),
    Shop.create({
      name: 'Home Decor',
      owner: seller1._id,
      slug: 'home-decor-seed',
      description: 'Beautiful items for your home',
      logo: { url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=128&h=128&fit=crop&crop=center' },
      categories: ['Home','Decor'],
      isActive: true,
      status: 'active',
      isVerified: false,
      isFeatured: true,
    }),
  ]);

  console.log('Creating products...');
  const [shoe, tshirt, phone, sofa] = await Promise.all([
    Product.create({ shopId: fashionHub._id, title: 'Seed Running Shoe', sku: 'SEED-SHOE-BASE', description: 'Lightweight running shoe for daily jogs', brand: 'FleetRun', category: 'Footwear', tags: ['running'], currency: 'INR', price: 1999, mrp: 2499, taxRate: 0.18, stock: 40, mainImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=640&h=640&fit=crop', status: 'active' }),
    Product.create({ shopId: fashionHub._id, title: 'Seed T-Shirt', sku: 'SEED-TSHIRT-BASE', description: 'Soft cotton crew neck', brand: 'CottonWorld', category: 'Apparel', tags: ['tshirt'], currency: 'INR', price: 499, mrp: 799, taxRate: 0.05, stock: 100, mainImage: 'https://images.unsplash.com/photo-1520975922323-9d06aee5d0df?w=640&h=640&fit=crop', status: 'active' }),
    Product.create({ shopId: techStore._id, title: 'Seed Phone', sku: 'SEED-PHONE-1', description: 'Great camera and performance', brand: 'Gizmo', category: 'Mobiles', tags: ['phone'], currency: 'INR', price: 45999, mrp: 49999, taxRate: 0.18, stock: 20, mainImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=640&h=640&fit=crop', status: 'active' }),
    Product.create({ shopId: homeDecor._id, title: 'Seed Sofa', sku: 'SEED-SOFA-1', description: 'Comfy 3-seater', brand: 'HomeLux', category: 'Furniture', tags: ['sofa'], currency: 'INR', price: 12999, mrp: 14999, taxRate: 0.12, stock: 10, mainImage: 'https://images.unsplash.com/photo-1555041559-3d2c5e4c8129?w=640&h=640&fit=crop', status: 'active' }),
  ]);

  console.log('Creating posts...');
  await Promise.all([
    Post.create({ shop: fashionHub._id, product: shoe._id, caption: 'Seed Post: New Running Shoe!', media: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=1200&fit=crop'], type: 'product' }),
    Post.create({ shop: fashionHub._id, product: tshirt._id, caption: 'Seed Post: Summer Tees are here', media: ['https://images.unsplash.com/photo-1520975922323-9d06aee5d0df?w=1200&h=1200&fit=crop'], type: 'product' }),
    Post.create({ shop: techStore._id, product: phone._id, caption: 'Seed Post: Unboxing our latest phone', media: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&h=1200&fit=crop'], type: 'product' }),
    Post.create({ shop: homeDecor._id, product: sofa._id, caption: 'Seed Post: Cozy living room vibes', media: ['https://images.unsplash.com/photo-1555041559-3d2c5e4c8129?w=1200&h=1200&fit=crop'], type: 'lifestyle' }),
  ]);

  console.log('Creating follow relationships...');
  await Promise.all([
    Follow.create({ follower: customer._id, shop: fashionHub._id }),
    Follow.create({ follower: customer._id, shop: techStore._id }),
  ]);

  console.log('Seed complete. Accounts:');
  console.log('- Admin:    admin@example.com / Admin@123');
  console.log('- Seller1:  seller1@example.com / Seller@123');
  console.log('- Seller2:  seller2@example.com / Seller@123');
  console.log('- Customer: customer@example.com / Customer@123');
  console.log('Demo shops: /shops/fashion-hub-seed, /shops/tech-store-seed, /shops/home-decor-seed');

  await mongoose.connection.close();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
