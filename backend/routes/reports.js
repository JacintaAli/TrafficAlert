const express = require('express');
const router = express.Router();
const { authenticateToken, requireOwnershipOrAdmin } = require('../middleware/auth');
const { validate, createReportSchema } = require('../middleware/validation');
const { upload } = require('../config/cloudinary');

// Import controllers
const reportController = require('../controllers/reportController');

// @route   POST /api/reports
// @desc    Create a new traffic report
// @access  Private
router.post('/', authenticateToken, upload.array('images', 5), validate(createReportSchema), reportController.createReport);

// @route   GET /api/reports
// @desc    Get all reports with pagination and filters
// @access  Public
router.get('/', reportController.getReports);

// @route   GET /api/reports/nearby
// @desc    Get nearby reports based on location
// @access  Public
router.get('/nearby', reportController.getNearbyReports);

// @route   GET /api/reports/:id
// @desc    Get single report by ID
// @access  Public
router.get('/:id', reportController.getReportById);

// @route   PUT /api/reports/:id
// @desc    Update report (only by owner or admin)
// @access  Private
router.put('/:id', authenticateToken, reportController.updateReport);

// @route   DELETE /api/reports/:id
// @desc    Delete report (only by owner or admin)
// @access  Private
router.delete('/:id', authenticateToken, reportController.deleteReport);

// @route   POST /api/reports/:id/verify
// @desc    Verify a report
// @access  Private
router.post('/:id/verify', authenticateToken, reportController.verifyReport);

// @route   POST /api/reports/:id/helpful
// @desc    Mark report as helpful
// @access  Private
router.post('/:id/helpful', authenticateToken, reportController.markHelpful);

// @route   DELETE /api/reports/:id/helpful
// @desc    Remove helpful vote
// @access  Private
router.delete('/:id/helpful', authenticateToken, reportController.removeHelpful);

// @route   POST /api/reports/:id/comments
// @desc    Add comment to report
// @access  Private
router.post('/:id/comments', authenticateToken, reportController.addComment);

// @route   GET /api/reports/:id/comments
// @desc    Get comments for a report
// @access  Public
router.get('/:id/comments', reportController.getComments);

// @route   DELETE /api/reports/:id/comments/:commentId
// @desc    Delete comment (only by comment author or admin)
// @access  Private
router.delete('/:id/comments/:commentId', authenticateToken, reportController.deleteComment);

// @route   POST /api/reports/:id/flag
// @desc    Flag report as inappropriate
// @access  Private
router.post('/:id/flag', authenticateToken, reportController.flagReport);

// @route   GET /api/reports/stats/summary
// @desc    Get reports statistics summary
// @access  Public
router.get('/stats/summary', reportController.getReportsStats);

module.exports = router;
