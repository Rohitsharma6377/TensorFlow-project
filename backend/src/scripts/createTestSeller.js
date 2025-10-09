const mongoose = require('mongoose');
const User = require('../models/User');
const Shop = require('../models/Shop');
require('dotenv').config();

async function createTestSeller() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/social_commerce_saas');
    console.log('Connected to MongoDB');

    // Check if test seller already exists
    let testSeller = await User.findOne({ email: 'testseller@example.com' });
    
    if (!testSeller) {
      // Create test seller user
      testSeller = await User.create({
        username: 'testseller',
        email: 'testseller@example.com',
        passwordHash: '$2b$10$dummy.hash.for.testing', // Dummy hash
        role: 'seller',
        profile: {
          fullName: 'Test Seller',
          bio: 'Test seller for wallet management'
        },
        walletBalance: 100.00, // Starting balance
        isVerified: true
      });
      console.log('✅ Created test seller:', testSeller._id);
    } else {
      console.log('✅ Test seller already exists:', testSeller._id);
    }

    // Check if test shop exists
    let testShop = await Shop.findOne({ slug: 'test-shop' });
    
    if (!testShop) {
      // Create test shop
      testShop = await Shop.create({
        name: 'Test Shop',
        slug: 'test-shop',
        description: 'Test shop for wallet management',
        owner: testSeller._id,
        isVerified: true,
        status: 'active'
      });
      console.log('✅ Created test shop:', testShop._id);
    } else {
      console.log('✅ Test shop already exists:', testShop._id);
    }

    // Create another test seller
    let testSeller2 = await User.findOne({ email: 'seller2@example.com' });
    
    if (!testSeller2) {
      testSeller2 = await User.create({
        username: 'seller2',
        email: 'seller2@example.com',
        passwordHash: '$2b$10$dummy.hash.for.testing', // Dummy hash
        role: 'seller',
        profile: {
          fullName: 'Second Test Seller',
          bio: 'Another test seller'
        },
        walletBalance: 250.00,
        isVerified: true
      });
      console.log('✅ Created second test seller:', testSeller2._id);
    } else {
      console.log('✅ Second test seller already exists:', testSeller2._id);
    }

    // Create second test shop
    let testShop2 = await Shop.findOne({ slug: 'fashion-hub' });
    
    if (!testShop2) {
      testShop2 = await Shop.create({
        name: 'Fashion Hub',
        slug: 'fashion-hub',
        description: 'Fashion and clothing store',
        owner: testSeller2._id,
        isVerified: true,
        status: 'active'
      });
      console.log('✅ Created Fashion Hub shop:', testShop2._id);
    } else {
      console.log('✅ Fashion Hub shop already exists:', testShop2._id);
    }

    console.log('\n🎉 Test data created successfully!');
    console.log('You can now use these sellers in the wallet management:');
    console.log(`- ${testSeller.profile.fullName} (${testSeller.email}) - ID: ${testSeller._id}`);
    console.log(`- ${testSeller2.profile.fullName} (${testSeller2.email}) - ID: ${testSeller2._id}`);

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createTestSeller();
