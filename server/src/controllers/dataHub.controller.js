// server/src/controllers/dataHub.controller.js
// University Data Hub Controller for File Uploads, Staging, and Templates

const { 
  stageUpload, 
  commitBatch, 
  getImportBatches, 
  getTemplateCSV, 
  getMasterZipBundle,
  TEMPLATES 
} = require('../services/import/importService');
const { DEFAULT_COLUMN_ALIASES } = require('../services/import/dataValidator');
const { db } = require('../database/db');

async function handleUpload(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please select a CSV, XLSX, or ZIP file.' });
    }

    let columnMapping = {};
    if (req.body.columnMapping) {
      try {
        columnMapping = typeof req.body.columnMapping === 'string' 
          ? JSON.parse(req.body.columnMapping) 
          : req.body.columnMapping;
      } catch (e) {
        columnMapping = {};
      }
    }

    const result = await stageUpload(req.file, {
      entityType: req.body.entityType || null,
      columnMapping,
      userId: req.user ? req.user.id : null
    });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message || 'File upload and staging failed' });
  }
}

function handleCommit(req, res) {
  try {
    const { batchId } = req.body;
    if (!batchId) {
      return res.status(400).json({ error: 'batchId is required to commit staged import' });
    }

    const userId = req.user ? req.user.id : null;
    const result = commitBatch(Number(batchId), userId);

    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Commit failed' });
  }
}

function getBatches(req, res) {
  try {
    const limit = Number(req.query.limit) || 20;
    const batches = getImportBatches(limit);
    return res.json({ batches });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve import batches: ' + err.message });
  }
}

function getBatchDetails(req, res) {
  try {
    const batchId = Number(req.params.id);
    const batch = db.prepare('SELECT * FROM data_import_batches WHERE id = ?').get(batchId);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const staging = db.prepare(`
      SELECT * FROM data_import_staging 
      WHERE batch_id = ? 
      ORDER BY id ASC 
      LIMIT 100
    `).all(batchId);

    return res.json({
      batch,
      staging
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve batch details: ' + err.message });
  }
}

function downloadTemplate(req, res) {
  try {
    const entity = req.params.entity.toLowerCase();

    if (entity === 'bundle' || entity === 'all' || entity === 'zip') {
      const zipBuffer = getMasterZipBundle();
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="university_master_templates.zip"');
      return res.send(zipBuffer);
    }

    if (!TEMPLATES[entity]) {
      return res.status(400).json({ 
        error: `Unknown template entity '${entity}'. Available: ${Object.keys(TEMPLATES).join(', ')}, bundle` 
      });
    }

    const csvContent = getTemplateCSV(entity);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${entity}_template.csv"`);
    return res.send(csvContent);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate template: ' + err.message });
  }
}

function getColumnMappings(req, res) {
  try {
    const entity = req.params.entity.toLowerCase();
    const defaultAliases = DEFAULT_COLUMN_ALIASES[entity] || {};
    
    // Check saved database custom mappings
    const saved = db.prepare('SELECT source_column, target_field FROM import_column_mappings WHERE entity_type = ?').all(entity);
    const customMappings = {};
    for (const s of saved) {
      customMappings[s.source_column] = s.target_field;
    }

    return res.json({
      entity,
      defaultAliases,
      customMappings
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to get column mappings: ' + err.message });
  }
}

module.exports = {
  handleUpload,
  handleCommit,
  getBatches,
  getBatchDetails,
  downloadTemplate,
  getColumnMappings
};
