const express = require('express');
const router = express.Router();
const repoController = require('../controllers/repoController');
const repoVerifyController = require('../controllers/repoVerifyController');
const auth = require('../middleware/authMiddleware');

// All repo routes are protected
router.use(auth);

// Verify repo (AI check)
router.post('/verify', repoVerifyController.verifyRepo);

// CRUD routes
router.get('/', repoController.getRepos);
router.post('/', repoController.addRepo);
router.put('/:id', repoController.updateRepo);
router.delete('/:id', repoController.deleteRepo);

module.exports = router;
