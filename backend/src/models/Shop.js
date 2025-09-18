const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true, default: 'India' },
  pincode: { type: String, required: true },
  location: {
    type: { type: String, default: 'Point', enum: ['Point'] },
    coordinates: [Number], // [longitude, latitude]
  },
  isDefault: { type: Boolean, default: false }
});

const contactSchema = new mongoose.Schema({
  email: { type: String, required: true },
  phone: { type: String, required: true },
  website: String,
  social: {
    facebook: String,
    instagram: String,
    twitter: String,
    youtube: String
  }
});

const businessHoursSchema = new mongoose.Schema({
  day: { type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], required: true },
  isOpen: { type: Boolean, default: true },
  openTime: String, // Format: '09:00'
  closeTime: String, // Format: '18:00'
  breakStart: String,
  breakEnd: String
});

const ShopSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, 'Shop name is required'],
      trim: true,
      maxlength: [100, 'Shop name cannot be more than 100 characters']
    },
    owner: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: [true, 'Shop owner is required'],
      index: true 
    },
    slug: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot be more than 1000 characters']
    },
    logo: {
      url: String,
      publicId: String
    },
    banner: {
      url: String,
      publicId: String
    },
    contact: contactSchema,
    address: addressSchema,
    businessHours: [businessHoursSchema],
    categories: [{
      type: String,
      trim: true
    }],
    tags: [{
      type: String,
      trim: true
    }],
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 }
    },
    isActive: {
      type: Boolean,
      default: false // Set to true after admin approval
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended', 'rejected'],
      default: 'pending'
    },
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'basic', 'premium', 'enterprise'],
        default: 'free'
      },
      startDate: Date,
      endDate: Date,
      isActive: {
        type: Boolean,
        default: false
      }
    },
    settings: {
      currency: {
        type: String,
        default: 'INR'
      },
      timezone: {
        type: String,
        default: 'Asia/Kolkata'
      },
      // Add more shop-specific settings as needed
    },
    metadata: mongoose.Schema.Types.Mixed
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
ShopSchema.index({ 'address.location': '2dsphere' });
ShopSchema.index({ name: 'text', description: 'text', 'tags': 'text' });

// Virtual for products
ShopSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'shop',
  justOne: false
});

// Virtual for orders
ShopSchema.virtual('orders', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'shop',
  justOne: false
});

// Pre-save hook to generate slug
ShopSchema.pre('save', async function(next) {
  if (!this.isModified('name')) return next();
  
  // Generate slug from name
  this.slug = this.name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/--+/g, '-')       // Replace multiple - with single -
    .trim()
    .concat('-', Math.random().toString(36).substring(2, 8)); // Add random string for uniqueness
  
  next();
});

// Method to check if shop is open now
ShopSchema.methods.isOpenNow = function() {
  if (!this.businessHours || this.businessHours.length === 0) return true;
  
  const now = new Date();
  const today = now.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
  const currentTime = now.toTimeString().slice(0, 5); // Format: 'HH:MM'
  
  const todayHours = this.businessHours.find(h => h.day.toLowerCase() === today);
  
  if (!todayHours || !todayHours.isOpen) return false;
  if (!todayHours.openTime || !todayHours.closeTime) return true;
  
  return currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
};

// Static method to find shops near a location
ShopSchema.statics.findNearby = function(coordinates, maxDistance = 10000) {
  return this.find({
    'address.location': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: maxDistance // in meters
      }
    },
    isActive: true,
    status: 'active'
  });
};

module.exports = mongoose.model('Shop', ShopSchema);
