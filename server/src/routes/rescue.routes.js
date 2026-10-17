// server/src/routes/rescue.routes.js
const express = require('express');
const router = express.Router();
const rescueController = require('../controllers/rescue.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.post('/simulate', verifyToken, requireAdmin, rescueController.simulateRescue);
router.post('/approve', verifyToken, requireAdmin, rescueController.approveRescue);

module.exports = router;
