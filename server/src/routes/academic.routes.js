// server/src/routes/academic.routes.js
// Academic Data Management Routes

const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academic.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Summary statistics
router.get('/summary', verifyToken, requireAdmin, academicController.getAcademicSummary);

// Departments
router.get('/departments', verifyToken, requireAdmin, academicController.getDepartments);
router.post('/departments', verifyToken, requireAdmin, academicController.createDepartment);
router.put('/departments/:id', verifyToken, requireAdmin, academicController.updateDepartment);
router.delete('/departments/:id', verifyToken, requireAdmin, academicController.deleteDepartment);

// Programs
router.get('/programs', verifyToken, requireAdmin, academicController.getPrograms);
router.post('/programs', verifyToken, requireAdmin, academicController.createProgram);
router.put('/programs/:id', verifyToken, requireAdmin, academicController.updateProgram);
router.delete('/programs/:id', verifyToken, requireAdmin, academicController.deleteProgram);

// Subjects
router.get('/subjects', verifyToken, requireAdmin, academicController.getSubjects);
router.post('/subjects', verifyToken, requireAdmin, academicController.createSubject);
router.put('/subjects/:id', verifyToken, requireAdmin, academicController.updateSubject);
router.delete('/subjects/:id', verifyToken, requireAdmin, academicController.deleteSubject);

// Faculty
router.get('/faculty', verifyToken, requireAdmin, academicController.getFaculty);
router.post('/faculty', verifyToken, requireAdmin, academicController.createFaculty);
router.put('/faculty/:id', verifyToken, requireAdmin, academicController.updateFaculty);
router.delete('/faculty/:id', verifyToken, requireAdmin, academicController.deleteFaculty);

// Faculty Availability
router.get('/faculty-availability', verifyToken, requireAdmin, academicController.getFacultyAvailability);
router.post('/faculty-availability', verifyToken, requireAdmin, academicController.addFacultyAvailability);
router.delete('/faculty-availability/:id', verifyToken, requireAdmin, academicController.deleteFacultyAvailability);

// University Blocks
router.get('/blocks', verifyToken, requireAdmin, academicController.getBlocks);
router.post('/blocks', verifyToken, requireAdmin, academicController.createBlock);
router.put('/blocks/:id', verifyToken, requireAdmin, academicController.updateBlock);
router.delete('/blocks/:id', verifyToken, requireAdmin, academicController.deleteBlock);

module.exports = router;
