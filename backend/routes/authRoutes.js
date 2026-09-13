const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', authController.registerUser);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', authController.loginUser);
router.post('/request-otp', authController.requestOtp);
router.post('/login-otp', authController.loginWithOtp);


// @route   GET api/auth/me
// @desc    Get logged in user
// @access  Private
router.get('/me', auth, authController.getUser);

const githubAuthController = require('../controllers/githubAuthController');

// @route   GET api/auth/github
// @desc    Redirect to GitHub OAuth
// @access  Public
router.get('/github', githubAuthController.githubLogin);

// @route   GET api/auth/github/callback
// @desc    GitHub OAuth callback handler
// @access  Public
router.get('/github/callback', githubAuthController.githubCallback);

module.exports = router;
