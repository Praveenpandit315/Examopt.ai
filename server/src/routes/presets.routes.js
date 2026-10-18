// server/src/routes/presets.routes.js
// Presets API Routes

const express = require('express');
const router = express.Router();
const presetsController = require('../controllers/presets.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/', verifyToken, requireAdmin, presetsController.getAllPresets);
router.get('/:id', verifyToken, requireAdmin, presetsController.getPresetById);
router.post('/', verifyToken, requireAdmin, presetsController.createPreset);
router.put('/:id', verifyToken, requireAdmin, presetsController.updatePreset);
router.delete('/:id', verifyToken, requireAdmin, presetsController.deletePreset);

module.exports = router;
