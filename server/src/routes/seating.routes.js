// server/src/routes/seating.routes.js
// Seating Allocation API Routes

const express = require('express');
const router = express.Router();
const seatingController = require('../controllers/seating.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Admin endpoints
router.post('/allocate/:scheduleId', verifyToken, requireAdmin, seatingController.allocateScheduleSeats);
router.get('/schedule/:scheduleId', verifyToken, requireAdmin, seatingController.getScheduleSeatSummary);
router.get('/assignment/:assignmentId', verifyToken, requireAdmin, seatingController.getAssignmentDetails);
router.put('/reassign', verifyToken, requireAdmin, seatingController.reassignSeat);

// Student / Authenticated endpoint (can be called by student or admin)
router.get('/hall-ticket/:studentProfileId', verifyToken, seatingController.getStudentHallTicket);

module.exports = router;
