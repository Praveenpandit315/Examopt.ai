// server/src/routes/rooms.routes.js
const express = require('express');
const router = express.Router();
const roomsController = require('../controllers/rooms.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/', verifyToken, roomsController.getAllRooms);
router.post('/', verifyToken, requireAdmin, roomsController.createRoom);
router.put('/:id', verifyToken, requireAdmin, roomsController.updateRoom);
router.delete('/:id', verifyToken, requireAdmin, roomsController.deleteRoom);

// Room unavailability routes
router.post('/unavailability', verifyToken, requireAdmin, roomsController.addUnavailability);
router.delete('/unavailability/:id', verifyToken, requireAdmin, roomsController.deleteUnavailability);

module.exports = router;
