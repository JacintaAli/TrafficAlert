const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Import controllers
const notificationController = require('../controllers/notificationController');

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', authenticateToken, notificationController.getNotifications);

// @route   POST /api/notifications/mark-read
// @desc    Mark notifications as read
// @access  Private
router.post('/mark-read', authenticateToken, notificationController.markAsRead);

// @route   POST /api/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Private
router.post('/mark-all-read', authenticateToken, notificationController.markAllAsRead);

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', authenticateToken, notificationController.deleteNotification);

// @route   POST /api/notifications/test
// @desc    Send test notification (development only)
// @access  Private
router.post('/test', authenticateToken, notificationController.sendTestNotification);

module.exports = router;
