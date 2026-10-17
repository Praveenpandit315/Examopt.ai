// server/src/routes/student.routes.js
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { verifyToken, requireStudent } = require('../middleware/auth');

router.get('/timetable', verifyToken, requireStudent, studentController.getStudentTimetable);
router.get('/dashboard', verifyToken, requireStudent, studentController.getStudentDashboard);
router.get('/notifications', verifyToken, requireStudent, studentController.getStudentNotifications);

module.exports = router;
