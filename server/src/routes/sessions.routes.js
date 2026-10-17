// server/src/routes/sessions.routes.js
// Exam Session Builder Routes

const express = require('express');
const router = express.Router();
const sessionsController = require('../controllers/sessions.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Scope preview before session creation
router.get('/scope-preview', verifyToken, requireAdmin, sessionsController.previewSessionScope);

// Session CRUD and generation
router.get('/', verifyToken, requireAdmin, sessionsController.getAllSessions);
router.post('/', verifyToken, requireAdmin, sessionsController.createSession);
router.post('/:id/generate', verifyToken, requireAdmin, sessionsController.generateSessionTimetable);

module.exports = router;
