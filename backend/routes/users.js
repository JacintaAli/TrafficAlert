const express = require('express');
const router = express.Router();
const { authenticateToken, requireOwnershipOrAdmin } = require('../middleware/auth');
const { validate, updateProfileSchema } = require('../middleware/validation');
const { upload } = require('../config/cloudinary');

// Import controllers
const userController = require('../controllers/userController');

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticateToken, userController.getProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, validate(updateProfileSchema), userController.updateProfile);

// @route   POST /api/users/profile/picture
// @desc    Upload profile picture
// @access  Private
router.post('/profile/picture', authenticateToken, upload.single('profilePicture'), userController.uploadProfilePicture);

// @route   DELETE /api/users/profile/picture
// @desc    Delete profile picture
// @access  Private
router.delete('/profile/picture', authenticateToken, userController.deleteProfilePicture);

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', authenticateToken, userController.getUserStats);

// @route   GET /api/users/reports
// @desc    Get user's reports
// @access  Private
router.get('/reports', authenticateToken, userController.getUserReports);

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', authenticateToken, userController.updatePreferences);

// @route   POST /api/users/quick-destinations
// @desc    Add quick destination
// @access  Private
router.post('/quick-destinations', authenticateToken, userController.addQuickDestination);

// @route   PUT /api/users/quick-destinations/:destinationId
// @desc    Update quick destination
// @access  Private
router.put('/quick-destinations/:destinationId', authenticateToken, userController.updateQuickDestination);

// @route   DELETE /api/users/quick-destinations/:destinationId
// @desc    Delete quick destination
// @access  Private
router.delete('/quick-destinations/:destinationId', authenticateToken, userController.deleteQuickDestination);

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', authenticateToken, userController.deleteAccount);

module.exports = router;
