const User = require('../models/User');
const Report = require('../models/Report');
const { deleteImage } = require('../config/cloudinary');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.profile
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, phone, quickDestinations } = req.body;
    const user = req.user;

    // Update fields if provided
    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone?.trim() || null;
    if (quickDestinations) user.quickDestinations = quickDestinations;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.profile
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
};

// @desc    Upload profile picture
// @route   POST /api/users/profile/picture
// @access  Private
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const user = req.user;

    // Delete old profile picture if exists
    if (user.profilePicture) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = user.profilePicture.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = publicIdWithExtension.split('.')[0];
        await deleteImage(`traffic-alert/${publicId}`);
      } catch (deleteError) {
        console.error('Error deleting old profile picture:', deleteError);
        // Continue with upload even if delete fails
      }
    }

    // Update user with new profile picture URL
    user.profilePicture = req.file.path;
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading profile picture'
    });
  }
};

// @desc    Delete profile picture
// @route   DELETE /api/users/profile/picture
// @access  Private
const deleteProfilePicture = async (req, res) => {
  try {
    const user = req.user;

    if (!user.profilePicture) {
      return res.status(400).json({
        success: false,
        message: 'No profile picture to delete'
      });
    }

    // Delete from Cloudinary
    try {
      const urlParts = user.profilePicture.split('/');
      const publicIdWithExtension = urlParts[urlParts.length - 1];
      const publicId = publicIdWithExtension.split('.')[0];
      await deleteImage(`traffic-alert/${publicId}`);
    } catch (deleteError) {
      console.error('Error deleting profile picture from Cloudinary:', deleteError);
    }

    // Remove from user record
    user.profilePicture = null;
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture deleted successfully'
    });
  } catch (error) {
    console.error('Delete profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting profile picture'
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private
const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get report statistics
    const reportStats = await Report.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          activeReports: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$status', 'active'] }, { $gt: ['$expiresAt', new Date()] }] },
                1,
                0
              ]
            }
          },
          verifiedReports: {
            $sum: {
              $cond: [{ $eq: ['$verification.isVerified', true] }, 1, 0]
            }
          },
          totalHelpfulVotes: { $sum: '$interactions.helpfulCount' }
        }
      }
    ]);

    const stats = reportStats[0] || {
      totalReports: 0,
      activeReports: 0,
      verifiedReports: 0,
      totalHelpfulVotes: 0
    };

    // Add user stats from user model
    stats.reportsSubmitted = req.user.stats.reportsSubmitted;
    stats.helpfulVotes = req.user.stats.helpfulVotes;

    res.json({
      success: true,
      data: {
        stats
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user statistics'
    });
  }
};

// @desc    Get user's reports
// @route   GET /api/users/reports
// @access  Private
const getUserReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status; // active, resolved, expired, flagged
    const skip = (page - 1) * limit;

    // Build query
    const query = { user: req.user._id };
    if (status) {
      query.status = status;
    }

    // Get reports with pagination
    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name profilePicture')
      .lean();

    // Get total count
    const total = await Report.countDocuments(query);

    // Add computed fields
    const reportsWithExtras = reports.map(report => ({
      ...report,
      latitude: report.location.coordinates[1],
      longitude: report.location.coordinates[0],
      timeAgo: getTimeAgo(report.createdAt),
      isActive: report.status === 'active' && report.expiresAt > new Date()
    }));

    res.json({
      success: true,
      data: {
        reports: reportsWithExtras,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user reports'
    });
  }
};

// @desc    Update user preferences
// @route   PUT /api/users/preferences
// @access  Private
const updatePreferences = async (req, res) => {
  try {
    const { notifications, privacy } = req.body;
    const user = req.user;

    if (notifications) {
      user.preferences.notifications = {
        ...user.preferences.notifications,
        ...notifications
      };
    }

    if (privacy) {
      user.preferences.privacy = {
        ...user.preferences.privacy,
        ...privacy
      };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating preferences'
    });
  }
};

// @desc    Add quick destination
// @route   POST /api/users/quick-destinations
// @access  Private
const addQuickDestination = async (req, res) => {
  try {
    const { name, address, latitude, longitude } = req.body;
    const user = req.user;

    if (user.quickDestinations.length >= 5) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 5 quick destinations allowed'
      });
    }

    const newDestination = {
      name: name.trim(),
      address: address.trim(),
      latitude,
      longitude
    };

    user.quickDestinations.push(newDestination);
    await user.save();

    res.json({
      success: true,
      message: 'Quick destination added successfully',
      data: {
        destination: user.quickDestinations[user.quickDestinations.length - 1]
      }
    });
  } catch (error) {
    console.error('Add quick destination error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding quick destination'
    });
  }
};

// @desc    Update quick destination
// @route   PUT /api/users/quick-destinations/:destinationId
// @access  Private
const updateQuickDestination = async (req, res) => {
  try {
    const { destinationId } = req.params;
    const { name, address, latitude, longitude } = req.body;
    const user = req.user;

    const destination = user.quickDestinations.id(destinationId);
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Quick destination not found'
      });
    }

    if (name) destination.name = name.trim();
    if (address) destination.address = address.trim();
    if (latitude !== undefined) destination.latitude = latitude;
    if (longitude !== undefined) destination.longitude = longitude;

    await user.save();

    res.json({
      success: true,
      message: 'Quick destination updated successfully',
      data: {
        destination
      }
    });
  } catch (error) {
    console.error('Update quick destination error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating quick destination'
    });
  }
};

// @desc    Delete quick destination
// @route   DELETE /api/users/quick-destinations/:destinationId
// @access  Private
const deleteQuickDestination = async (req, res) => {
  try {
    const { destinationId } = req.params;
    const user = req.user;

    const destination = user.quickDestinations.id(destinationId);
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Quick destination not found'
      });
    }

    user.quickDestinations.pull(destinationId);
    await user.save();

    res.json({
      success: true,
      message: 'Quick destination deleted successfully'
    });
  } catch (error) {
    console.error('Delete quick destination error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting quick destination'
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    // Delete user's profile picture from Cloudinary
    if (req.user.profilePicture) {
      try {
        const urlParts = req.user.profilePicture.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = publicIdWithExtension.split('.')[0];
        await deleteImage(`traffic-alert/${publicId}`);
      } catch (deleteError) {
        console.error('Error deleting profile picture:', deleteError);
      }
    }

    // Delete user's reports and their images
    const userReports = await Report.find({ user: userId });
    for (const report of userReports) {
      // Delete report images from Cloudinary
      for (const image of report.images) {
        try {
          await deleteImage(image.publicId);
        } catch (deleteError) {
          console.error('Error deleting report image:', deleteError);
        }
      }
    }

    // Delete all user's reports
    await Report.deleteMany({ user: userId });

    // Delete user account
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting account'
    });
  }
};

// Helper function to calculate time ago
const getTimeAgo = (date) => {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  deleteProfilePicture,
  getUserStats,
  getUserReports,
  updatePreferences,
  addQuickDestination,
  updateQuickDestination,
  deleteQuickDestination,
  deleteAccount
};
