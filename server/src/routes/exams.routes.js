// server/src/routes/exams.routes.js
const express = require('express');
const router = express.Router();
const examsController = require('../controllers/exams.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/', verifyToken, examsController.getAllExams);
router.get('/subjects', verifyToken, examsController.getAllSubjects);
router.get('/:id', verifyToken, examsController.getExamById);
router.post('/', verifyToken, requireAdmin, examsController.createExam);
router.put('/:id', verifyToken, requireAdmin, examsController.updateExam);
router.delete('/:id', verifyToken, requireAdmin, examsController.deleteExam);

module.exports = router;
