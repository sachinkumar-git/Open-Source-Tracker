const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/authMiddleware');

// @route   GET api/dashboard
// @desc    Get complete dashboard stats
// @access  Private
router.get('/', auth, dashboardController.getDashboardData);

// @route   POST api/dashboard/sync
// @desc    Force Sync GitHub data globally
// @access  Private
router.post('/sync', auth, dashboardController.syncData);

module.exports = router;
