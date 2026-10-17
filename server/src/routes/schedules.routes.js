// server/src/routes/schedules.routes.js
const express = require('express');
const router = express.Router();
const schedulesController = require('../controllers/schedules.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.post('/generate', verifyToken, requireAdmin, schedulesController.generateSchedule);
router.get('/', verifyToken, schedulesController.getAllSchedules);
router.get('/compare', verifyToken, requireAdmin, schedulesController.compareSchedules);
router.get('/:id', verifyToken, schedulesController.getScheduleById);
router.post('/:id/publish', verifyToken, requireAdmin, schedulesController.publishSchedule);

module.exports = router;
