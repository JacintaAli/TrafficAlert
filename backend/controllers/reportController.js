const Report = require('../models/Report');
const User = require('../models/User');
const { deleteImage } = require('../config/cloudinary');

// @desc    Create a new traffic report
// @route   POST /api/reports
// @access  Private
const createReport = async (req, res) => {
  try {
    const { type, severity, description, location, metadata } = req.body;
    const userId = req.user._id;

    // Parse location if it's a string
    let parsedLocation;
    if (typeof location === 'string') {
      parsedLocation = JSON.parse(location);
    } else {
      parsedLocation = location;
    }

    // Validate location
    if (!parsedLocation || !parsedLocation.latitude || !parsedLocation.longitude) {
      return res.status(400).json({
        success: false,
        message: 'Valid location coordinates are required'
      });
    }

    // Process uploaded images
    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        images.push({
          url: file.path,
          publicId: file.filename
        });
      }
    }

    // Create report
    const report = new Report({
      user: userId,
      type,
      severity: severity || 'medium',
      description: description.trim(),
      location: {
        type: 'Point',
        coordinates: [parsedLocation.longitude, parsedLocation.latitude],
        address: parsedLocation.address
      },
      images,
      metadata: metadata ? JSON.parse(metadata) : {}
    });

    await report.save();

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: { 'stats.reportsSubmitted': 1 }
    });

    // Populate user info for response
    await report.populate('user', 'name profilePicture');

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: {
        report: {
          ...report.toObject(),
          latitude: report.latitude,
          longitude: report.longitude,
          timeAgo: report.timeAgo,
          isActive: report.isActive
        }
      }
    });
  } catch (error) {
    console.error('Create report error:', error);
    
    // Clean up uploaded images if report creation fails
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          await deleteImage(file.filename);
        } catch (deleteError) {
          console.error('Error cleaning up uploaded image:', deleteError);
        }
      }
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all reports with pagination and filters
// @route   GET /api/reports
// @access  Public
const getReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type;
    const severity = req.query.severity;
    const status = req.query.status || 'active';
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (type) query.type = type;
    if (severity) query.severity = severity;
    if (status) query.status = status;

    // Only show active reports that haven't expired by default
    if (status === 'active') {
      query.expiresAt = { $gt: new Date() };
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
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reports'
    });
  }
};

// @desc    Get nearby reports based on location
// @route   GET /api/reports/nearby
// @access  Public
const getNearbyReports = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const maxDistance = parseInt(radius);

    // Validate coordinates
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates'
      });
    }

    // Find nearby reports using geospatial query
    const reports = await Report.findNearby(lng, lat, maxDistance)
      .populate('user', 'name profilePicture')
      .lean();

    // Add computed fields and calculate distance
    const reportsWithExtras = reports.map(report => {
      const distance = calculateDistance(lat, lng, report.location.coordinates[1], report.location.coordinates[0]);
      
      return {
        ...report,
        latitude: report.location.coordinates[1],
        longitude: report.location.coordinates[0],
        distance: Math.round(distance),
        timeAgo: getTimeAgo(report.createdAt),
        isActive: report.status === 'active' && report.expiresAt > new Date()
      };
    });

    // Sort by distance
    reportsWithExtras.sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      data: {
        reports: reportsWithExtras,
        center: { latitude: lat, longitude: lng },
        radius: maxDistance
      }
    });
  } catch (error) {
    console.error('Get nearby reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching nearby reports'
    });
  }
};

// @desc    Get single report by ID
// @route   GET /api/reports/:id
// @access  Public
const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id)
      .populate('user', 'name profilePicture')
      .populate('interactions.comments.user', 'name profilePicture')
      .lean();

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Increment view count
    await Report.findByIdAndUpdate(id, { $inc: { 'interactions.views': 1 } });

    // Add computed fields
    const reportWithExtras = {
      ...report,
      latitude: report.location.coordinates[1],
      longitude: report.location.coordinates[0],
      timeAgo: getTimeAgo(report.createdAt),
      isActive: report.status === 'active' && report.expiresAt > new Date()
    };

    res.json({
      success: true,
      data: {
        report: reportWithExtras
      }
    });
  } catch (error) {
    console.error('Get report by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching report'
    });
  }
};

// @desc    Update report (only by owner or admin)
// @route   PUT /api/reports/:id
// @access  Private
const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, severity, status } = req.body;
    const userId = req.user._id;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check ownership or admin role
    if (report.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this report'
      });
    }

    // Update allowed fields
    if (description) report.description = description.trim();
    if (severity) report.severity = severity;
    if (status && req.user.role === 'admin') report.status = status;

    await report.save();
    await report.populate('user', 'name profilePicture');

    res.json({
      success: true,
      message: 'Report updated successfully',
      data: {
        report: {
          ...report.toObject(),
          latitude: report.latitude,
          longitude: report.longitude,
          timeAgo: report.timeAgo,
          isActive: report.isActive
        }
      }
    });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating report'
    });
  }
};

// @desc    Delete report (only by owner or admin)
// @route   DELETE /api/reports/:id
// @access  Private
const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check ownership or admin role
    if (report.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this report'
      });
    }

    // Delete images from Cloudinary
    for (const image of report.images) {
      try {
        await deleteImage(image.publicId);
      } catch (deleteError) {
        console.error('Error deleting report image:', deleteError);
      }
    }

    // Delete report
    await Report.findByIdAndDelete(id);

    // Update user stats
    await User.findByIdAndUpdate(report.user, {
      $inc: { 'stats.reportsSubmitted': -1 }
    });

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting report'
    });
  }
};

// @desc    Verify a report
// @route   POST /api/reports/:id/verify
// @access  Private
const verifyReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Can't verify own report
    if (report.user.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot verify your own report'
      });
    }

    const wasAdded = report.addVerification(userId);
    if (!wasAdded) {
      return res.status(400).json({
        success: false,
        message: 'You have already verified this report'
      });
    }

    await report.save();

    // Update user stats if report becomes verified
    if (report.verification.isVerified) {
      await User.findByIdAndUpdate(report.user, {
        $inc: { 'stats.reportsVerified': 1 }
      });
    }

    res.json({
      success: true,
      message: 'Report verified successfully',
      data: {
        verificationCount: report.verification.verificationCount,
        isVerified: report.verification.isVerified
      }
    });
  } catch (error) {
    console.error('Verify report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while verifying report'
    });
  }
};

// @desc    Mark report as helpful
// @route   POST /api/reports/:id/helpful
// @access  Private
const markHelpful = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const wasAdded = report.addHelpfulVote(userId);
    if (!wasAdded) {
      return res.status(400).json({
        success: false,
        message: 'You have already marked this report as helpful'
      });
    }

    await report.save();

    // Update report owner's helpful votes count
    await User.findByIdAndUpdate(report.user, {
      $inc: { 'stats.helpfulVotes': 1 }
    });

    res.json({
      success: true,
      message: 'Report marked as helpful',
      data: {
        helpfulCount: report.interactions.helpfulCount
      }
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking report as helpful'
    });
  }
};

// @desc    Remove helpful vote
// @route   DELETE /api/reports/:id/helpful
// @access  Private
const removeHelpful = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const wasRemoved = report.removeHelpfulVote(userId);
    if (!wasRemoved) {
      return res.status(400).json({
        success: false,
        message: 'You have not marked this report as helpful'
      });
    }

    await report.save();

    // Update report owner's helpful votes count
    await User.findByIdAndUpdate(report.user, {
      $inc: { 'stats.helpfulVotes': -1 }
    });

    res.json({
      success: true,
      message: 'Helpful vote removed',
      data: {
        helpfulCount: report.interactions.helpfulCount
      }
    });
  } catch (error) {
    console.error('Remove helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing helpful vote'
    });
  }
};

// @desc    Add comment to report
// @route   POST /api/reports/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    if (text.trim().length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 200 characters'
      });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    report.addComment(userId, text);
    await report.save();

    // Populate the new comment
    await report.populate('interactions.comments.user', 'name profilePicture');
    const newComment = report.interactions.comments[report.interactions.comments.length - 1];

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: {
        comment: newComment
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding comment'
    });
  }
};

// @desc    Get comments for a report
// @route   GET /api/reports/:id/comments
// @access  Public
const getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const report = await Report.findById(id)
      .populate('interactions.comments.user', 'name profilePicture')
      .lean();

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Paginate comments
    const comments = report.interactions.comments || [];
    const total = comments.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedComments = comments.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        comments: paginatedComments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching comments'
    });
  }
};

// @desc    Delete comment (only by comment author or admin)
// @route   DELETE /api/reports/:id/comments/:commentId
// @access  Private
const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const userId = req.user._id;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const comment = report.interactions.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is comment author or admin
    if (comment.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    report.interactions.comments.pull(commentId);
    await report.save();

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting comment'
    });
  }
};

// @desc    Flag report as inappropriate
// @route   POST /api/reports/:id/flag
// @access  Private
const flagReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // For now, just log the flag - in production you'd want to store flags
    console.log(`Report ${id} flagged by user ${req.user._id} for reason: ${reason}`);

    res.json({
      success: true,
      message: 'Report flagged successfully. Thank you for helping keep the community safe.'
    });
  } catch (error) {
    console.error('Flag report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while flagging report'
    });
  }
};

// @desc    Get reports statistics summary
// @route   GET /api/reports/stats/summary
// @access  Public
const getReportsStats = async (req, res) => {
  try {
    const stats = await Report.aggregate([
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
          reportsByType: {
            $push: '$type'
          }
        }
      }
    ]);

    // Count reports by type
    const typeStats = {};
    if (stats[0] && stats[0].reportsByType) {
      stats[0].reportsByType.forEach(type => {
        typeStats[type] = (typeStats[type] || 0) + 1;
      });
    }

    const summary = stats[0] || {
      totalReports: 0,
      activeReports: 0,
      verifiedReports: 0
    };

    summary.reportsByType = typeStats;

    res.json({
      success: true,
      data: {
        stats: summary
      }
    });
  } catch (error) {
    console.error('Get reports stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reports statistics'
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

// Helper function to calculate distance between two points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

module.exports = {
  createReport,
  getReports,
  getNearbyReports,
  getReportById,
  updateReport,
  deleteReport,
  verifyReport,
  markHelpful,
  removeHelpful,
  addComment,
  getComments,
  deleteComment,
  flagReport,
  getReportsStats
};
