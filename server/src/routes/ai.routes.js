// server/src/routes/ai.routes.js
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.post('/ask', verifyToken, requireAdmin, aiController.askCopilot);

module.exports = router;
