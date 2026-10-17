// server/src/routes/slots.routes.js
const express = require('express');
const router = express.Router();
const slotsController = require('../controllers/slots.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/', verifyToken, slotsController.getAllSlots);
router.post('/', verifyToken, requireAdmin, slotsController.createSlot);
router.put('/:id', verifyToken, requireAdmin, slotsController.updateSlot);
router.delete('/:id', verifyToken, requireAdmin, slotsController.deleteSlot);

// Institutional rules
router.get('/rules', verifyToken, slotsController.getAllRules);
router.put('/rules/:id', verifyToken, requireAdmin, slotsController.updateRule);

module.exports = router;
