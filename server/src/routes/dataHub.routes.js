// server/src/routes/dataHub.routes.js
// University Data Hub Routes for Master Data Ingestion

const express = require('express');
const multer = require('multer');
const router = express.Router();
const dataHubController = require('../controllers/dataHub.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// In-memory upload buffer with 10MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Staging and Processing
router.post('/upload', verifyToken, requireAdmin, upload.single('file'), dataHubController.handleUpload);
router.post('/commit', verifyToken, requireAdmin, dataHubController.handleCommit);

// Import History and Details
router.get('/batches', verifyToken, requireAdmin, dataHubController.getBatches);
router.get('/batches/:id', verifyToken, requireAdmin, dataHubController.getBatchDetails);

// Templates & Column Mappings
router.get('/templates/:entity', verifyToken, requireAdmin, dataHubController.downloadTemplate);
router.get('/column-mappings/:entity', verifyToken, requireAdmin, dataHubController.getColumnMappings);

module.exports = router;
