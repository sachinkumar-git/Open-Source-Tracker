const express = require('express');
const router = express.Router();
const compilerController = require('../controllers/compilerController');
const auth = require('../middleware/authMiddleware');

// Public routes
router.get('/runtimes', compilerController.getRuntimes);
router.post('/run', compilerController.runCode);

// Protected routes (require GitHub token)
router.use(auth);
router.post('/push', compilerController.pushToGitHub);

module.exports = router;
