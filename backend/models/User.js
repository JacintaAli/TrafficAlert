const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    index: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  phone: {
    type: String,
    trim: true,
    sparse: true // Allows multiple null values
  },
  profilePicture: {
    type: String, // Cloudinary URL
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  quickDestinations: [{
    name: {
      type: String,
      required: true,
      maxlength: [100, 'Destination name cannot exceed 100 characters']
    },
    address: {
      type: String,
      required: true,
      maxlength: [200, 'Address cannot exceed 200 characters']
    },
    latitude: {
      type: Number,
      required: true,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      required: true,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    }
  }],
  stats: {
    reportsSubmitted: {
      type: Number,
      default: 0
    },
    reportsVerified: {
      type: Number,
      default: 0
    },
    helpfulVotes: {
      type: Number,
      default: 0
    }
  },
  // OTP for email verification and password reset
  otp: {
    code: String,
    expiresAt: Date,
    purpose: {
      type: String,
      enum: ['email_verification', 'password_reset']
    }
  },
  // Push notification tokens
  pushTokens: [{
    token: String,
    platform: {
      type: String,
      enum: ['ios', 'android', 'web']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastLogin: {
    type: Date,
    default: null
  },
  preferences: {
    notifications: {
      push: {
        type: Boolean,
        default: true
      },
      email: {
        type: Boolean,
        default: true
      },
      nearbyReports: {
        type: Boolean,
        default: true
      },
      routeAlerts: {
        type: Boolean,
        default: true
      }
    },
    privacy: {
      showProfile: {
        type: Boolean,
        default: true
      },
      shareLocation: {
        type: Boolean,
        default: true
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
userSchema.index({ 'otp.code': 1, 'otp.expiresAt': 1 });
userSchema.index({ createdAt: -1 });

// Virtual for user's full profile
userSchema.virtual('profile').get(function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    profilePicture: this.profilePicture,
    stats: this.stats,
    quickDestinations: this.quickDestinations,
    preferences: this.preferences,
    createdAt: this.createdAt
  };
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate OTP method
userSchema.methods.generateOTP = function(purpose = 'email_verification') {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  
  this.otp = {
    code: otp,
    expiresAt: expiresAt,
    purpose: purpose
  };
  
  return otp;
};

// Verify OTP method
userSchema.methods.verifyOTP = function(candidateOTP, purpose) {
  if (!this.otp || !this.otp.code) return false;
  if (this.otp.purpose !== purpose) return false;
  if (this.otp.expiresAt < new Date()) return false;
  
  return this.otp.code === candidateOTP;
};

// Clear OTP method
userSchema.methods.clearOTP = function() {
  this.otp = undefined;
};

// Add push token method
userSchema.methods.addPushToken = function(token, platform) {
  // Remove existing token if it exists
  this.pushTokens = this.pushTokens.filter(t => t.token !== token);
  
  // Add new token
  this.pushTokens.push({
    token: token,
    platform: platform
  });
  
  // Keep only the last 5 tokens per user
  if (this.pushTokens.length > 5) {
    this.pushTokens = this.pushTokens.slice(-5);
  }
};

// Remove push token method
userSchema.methods.removePushToken = function(token) {
  this.pushTokens = this.pushTokens.filter(t => t.token !== token);
};

module.exports = mongoose.model('User', userSchema);
