// server/src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth');

router.post('/login', authController.login);
router.get('/me', verifyToken, authController.getMe);
router.get('/demo-accounts', authController.getDemoAccounts);

module.exports = router;
