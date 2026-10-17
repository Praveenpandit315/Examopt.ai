// server/src/routes/groups.routes.js
const express = require('express');
const router = express.Router();
const groupsController = require('../controllers/groups.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/', verifyToken, groupsController.getAllGroups);
router.get('/overlaps', verifyToken, groupsController.getGroupOverlaps);
router.post('/', verifyToken, requireAdmin, groupsController.createGroup);
router.put('/:id', verifyToken, requireAdmin, groupsController.updateGroup);
router.delete('/:id', verifyToken, requireAdmin, groupsController.deleteGroup);

module.exports = router;
