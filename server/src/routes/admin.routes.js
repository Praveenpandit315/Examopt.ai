// server/src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/dashboard-stats', verifyToken, requireAdmin, adminController.getDashboardStats);
router.get('/db-inspector', verifyToken, requireAdmin, adminController.getDatabaseInspector);

module.exports = router;
