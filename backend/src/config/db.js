const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/social_commerce_saas';
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      autoIndex: true,
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    throw err;
  }
}

module.exports = connectDB;
