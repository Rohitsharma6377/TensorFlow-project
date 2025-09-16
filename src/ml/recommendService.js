const fs = require('fs');
const path = require('path');
const tf = require('@tensorflow/tfjs-node');

const Product = require('../models/Product');
const Post = require('../models/Post');
const Follow = require('../models/Follow');

const EMB_DIR = path.join(__dirname, 'embeddings');
const USER_EMB_FILE = path.join(EMB_DIR, 'userEmbeddings.json');
const PRODUCT_EMB_FILE = path.join(EMB_DIR, 'productEmbeddings.json');

function ensureEmbStore() {
  if (!fs.existsSync(EMB_DIR)) fs.mkdirSync(EMB_DIR, { recursive: true });
  if (!fs.existsSync(USER_EMB_FILE)) fs.writeFileSync(USER_EMB_FILE, JSON.stringify({}), 'utf8');
  if (!fs.existsSync(PRODUCT_EMB_FILE)) fs.writeFileSync(PRODUCT_EMB_FILE, JSON.stringify({}), 'utf8');
}

function loadEmbeddings(file) {
  ensureEmbStore();
  const raw = fs.readFileSync(file, 'utf8');
  return JSON.parse(raw || '{}');
}

function saveEmbeddings(file, data) {
  ensureEmbStore();
  fs.writeFileSync(file, JSON.stringify(data), 'utf8');
}

function cosineSim(a, b) {
  const va = tf.tensor1d(a);
  const vb = tf.tensor1d(b);
  const sim = tf.sum(tf.mul(va, vb)).arraySync() / (tf.norm(va).arraySync() * tf.norm(vb).arraySync() || 1);
  va.dispose();
  vb.dispose();
  return sim;
}

function randVec(dim = 32) {
  return Array.from({ length: dim }, () => Math.random());
}

async function getUserEmbedding(userId) {
  const users = loadEmbeddings(USER_EMB_FILE);
  if (!users[userId]) {
    users[userId] = randVec();
    saveEmbeddings(USER_EMB_FILE, users);
  }
  return users[userId];
}

async function getProductEmbedding(productId) {
  const prods = loadEmbeddings(PRODUCT_EMB_FILE);
  if (!prods[productId]) {
    prods[productId] = randVec();
    saveEmbeddings(PRODUCT_EMB_FILE, prods);
  }
  return prods[productId];
}

async function recommendProductsForUser(userId, limit = 20) {
  const userVec = await getUserEmbedding(String(userId));
  const products = await Product.find({ status: 'active' }).select('_id title price images').limit(200);
  const scored = [];
  for (const p of products) {
    const v = await getProductEmbedding(String(p._id));
    const s = cosineSim(userVec, v);
    scored.push({ product: p, score: s });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.product);
}

async function similarProducts(productId, limit = 12) {
  const base = await getProductEmbedding(String(productId));
  const products = await Product.find({ status: 'active', _id: { $ne: productId } }).select('_id title price images').limit(200);
  const scored = [];
  for (const p of products) {
    const v = await getProductEmbedding(String(p._id));
    const s = cosineSim(base, v);
    scored.push({ product: p, score: s });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.product);
}

async function recommendShopsForUser(userId, limit = 10) {
  // Simple heuristic: shops with posts trending and not already followed
  const follows = await Follow.find({ follower: userId }).select('shop');
  const followed = new Set(follows.map(f => String(f.shop)));
  const trendingPosts = await Post.find({}).sort({ likesCount: -1, createdAt: -1 }).limit(200).select('shop');
  const counts = new Map();
  trendingPosts.forEach(p => {
    const id = String(p.shop);
    if (followed.has(id)) return;
    counts.set(id, (counts.get(id) || 0) + 1);
  });
  const ranked = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([shopId]) => shopId);
  return ranked; // consumer can fetch shop details
}

module.exports = {
  getUserEmbedding,
  getProductEmbedding,
  recommendProductsForUser,
  similarProducts,
  recommendShopsForUser,
};
