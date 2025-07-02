const express = require('express');
const router = express.Router();
const { validate, registerSchema, loginSchema, resetPasswordSchema, verifyOTPSchema } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// Import controllers (we'll create these next)
const authController = require('../controllers/authController');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validate(registerSchema), authController.register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validate(loginSchema), authController.login);

// @route   POST /api/auth/logout
// @desc    Logout user (remove push token)
// @access  Private
router.post('/logout', authenticateToken, authController.logout);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset OTP
// @access  Public
router.post('/forgot-password', validate(resetPasswordSchema), authController.forgotPassword);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for email verification or password reset
// @access  Public
router.post('/verify-otp', validate(verifyOTPSchema), authController.verifyOTP);

// @route   POST /api/auth/reset-password
// @desc    Reset password after OTP verification
// @access  Public
router.post('/reset-password', authController.resetPassword);

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP for email verification
// @access  Public
router.post('/resend-otp', authController.resendOTP);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticateToken, authController.getMe);

// @route   POST /api/auth/refresh-token
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh-token', authenticateToken, authController.refreshToken);

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', authenticateToken, authController.changePassword);

// @route   POST /api/auth/add-push-token
// @desc    Add push notification token
// @access  Private
router.post('/add-push-token', authenticateToken, authController.addPushToken);

// @route   DELETE /api/auth/remove-push-token
// @desc    Remove push notification token
// @access  Private
router.delete('/remove-push-token', authenticateToken, authController.removePushToken);

module.exports = router;
