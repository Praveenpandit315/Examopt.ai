// server/src/routes/history.routes.js
// Schedule History & Audit Logs Routes

const express = require('express');
const router = express.Router();
const historyController = require('../controllers/history.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/versions', verifyToken, requireAdmin, historyController.getAllScheduleVersions);
router.get('/compare', verifyToken, requireAdmin, historyController.getVersionDiff);
router.get('/audit-logs', verifyToken, requireAdmin, historyController.getAuditLogs);

module.exports = router;
