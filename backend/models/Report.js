const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  type: {
    type: String,
    required: [true, 'Report type is required'],
    enum: {
      values: ['accident', 'hazard', 'construction', 'traffic', 'police'],
      message: 'Report type must be one of: accident, hazard, construction, traffic, police'
    }
  },
  severity: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high'],
      message: 'Severity must be one of: low, medium, high'
    },
    default: 'medium'
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [500, 'Description cannot exceed 500 characters'],
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Coordinates are required'],
      validate: {
        validator: function(coords) {
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && // longitude
                 coords[1] >= -90 && coords[1] <= 90;     // latitude
        },
        message: 'Invalid coordinates format'
      }
    },
    address: {
      type: String,
      maxlength: [200, 'Address cannot exceed 200 characters'],
      trim: true
    }
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: {
      values: ['active', 'resolved', 'expired', 'flagged'],
      message: 'Status must be one of: active, resolved, expired, flagged'
    },
    default: 'active'
  },
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      verifiedAt: {
        type: Date,
        default: Date.now
      }
    }],
    verificationCount: {
      type: Number,
      default: 0
    }
  },
  interactions: {
    views: {
      type: Number,
      default: 0
    },
    helpful: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }],
    helpfulCount: {
      type: Number,
      default: 0
    },
    comments: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      text: {
        type: String,
        required: true,
        maxlength: [200, 'Comment cannot exceed 200 characters'],
        trim: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  metadata: {
    deviceInfo: {
      platform: String,
      version: String,
      model: String
    },
    reportedVia: {
      type: String,
      enum: ['mobile', 'web'],
      default: 'mobile'
    },
    accuracy: Number, // GPS accuracy in meters
    speed: Number // Speed when report was made (km/h)
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Reports expire after 24 hours by default
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for geospatial queries and performance
reportSchema.index({ location: '2dsphere' });
reportSchema.index({ type: 1, status: 1 });
reportSchema.index({ user: 1, createdAt: -1 });
reportSchema.index({ status: 1, expiresAt: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ 'verification.verificationCount': -1 });

// Virtual for getting latitude and longitude separately
reportSchema.virtual('latitude').get(function() {
  return this.location.coordinates[1];
});

reportSchema.virtual('longitude').get(function() {
  return this.location.coordinates[0];
});

// Virtual for time since report was created
reportSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
});

// Virtual for checking if report is still active
reportSchema.virtual('isActive').get(function() {
  return this.status === 'active' && this.expiresAt > new Date();
});

// Pre-save middleware to update verification count
reportSchema.pre('save', function(next) {
  if (this.isModified('verification.verifiedBy')) {
    this.verification.verificationCount = this.verification.verifiedBy.length;
  }
  
  if (this.isModified('interactions.helpful')) {
    this.interactions.helpfulCount = this.interactions.helpful.length;
  }
  
  next();
});

// Static method to find nearby reports
reportSchema.statics.findNearby = function(longitude, latitude, maxDistance = 5000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance // in meters
      }
    },
    status: 'active',
    expiresAt: { $gt: new Date() }
  }).populate('user', 'name profilePicture');
};

// Instance method to add verification
reportSchema.methods.addVerification = function(userId) {
  // Check if user already verified this report
  const alreadyVerified = this.verification.verifiedBy.some(
    v => v.user.toString() === userId.toString()
  );
  
  if (!alreadyVerified) {
    this.verification.verifiedBy.push({ user: userId });
    
    // Auto-verify if enough verifications
    if (this.verification.verificationCount >= 3) {
      this.verification.isVerified = true;
    }
  }
  
  return !alreadyVerified;
};

// Instance method to add helpful vote
reportSchema.methods.addHelpfulVote = function(userId) {
  // Check if user already voted
  const alreadyVoted = this.interactions.helpful.some(
    h => h.user.toString() === userId.toString()
  );
  
  if (!alreadyVoted) {
    this.interactions.helpful.push({ user: userId });
  }
  
  return !alreadyVoted;
};

// Instance method to remove helpful vote
reportSchema.methods.removeHelpfulVote = function(userId) {
  const initialLength = this.interactions.helpful.length;
  this.interactions.helpful = this.interactions.helpful.filter(
    h => h.user.toString() !== userId.toString()
  );
  
  return this.interactions.helpful.length < initialLength;
};

// Instance method to add comment
reportSchema.methods.addComment = function(userId, text) {
  this.interactions.comments.push({
    user: userId,
    text: text.trim()
  });
};

// TTL index to automatically delete expired reports
reportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Report', reportSchema);
