// server/src/services/import/zipExtractor.js
// Safe ZIP archive parser with Zip Slip (path traversal) and Zip Bomb protections

const AdmZip = require('adm-zip');
const path = require('path');
const { parseCSV } = require('./csvParser');
const { parseXLSX } = require('./xlsxParser');

const MAX_UNCOMPRESSED_SIZE_BYTES = 50 * 1024 * 1024; // 50MB decompression limit
const MAX_ENTRY_COUNT = 100;
const ALLOWED_EXTENSIONS = ['.csv', '.xlsx'];

/**
 * Safely inspects and extracts supported CSV and XLSX files from an in-memory ZIP buffer.
 * 
 * @param {Buffer} zipBuffer - Raw ZIP file buffer
 * @returns {Array<{ filename: string, entityType: string, records: Array<Object> }>}
 */
function extractSafeZip(zipBuffer) {
  let zip;
  try {
    zip = new AdmZip(zipBuffer);
  } catch (err) {
    throw new Error('Invalid or corrupted ZIP archive: ' + err.message);
  }

  const entries = zip.getEntries();
  if (entries.length > MAX_ENTRY_COUNT) {
    throw new Error(`ZIP archive exceeds maximum entry limit (${MAX_ENTRY_COUNT} files)`);
  }

  let totalDecompressedBytes = 0;
  const extractedFiles = [];

  for (const entry of entries) {
    if (entry.isDirectory) continue;

    const entryName = entry.entryName;
    // 1. Path Traversal & Zip Slip Prevention
    if (entryName.includes('..') || path.isAbsolute(entryName) || entryName.startsWith('/') || entryName.startsWith('\\')) {
      throw new Error(`Security Exception: Path traversal detected in ZIP entry '${entryName}'`);
    }

    // 2. Uncompressed Size Decompression Bomb Protection
    totalDecompressedBytes += entry.header.size;
    if (totalDecompressedBytes > MAX_UNCOMPRESSED_SIZE_BYTES) {
      throw new Error(`Security Exception: Total decompressed ZIP size exceeds safe limit of 50MB`);
    }

    // 3. Allowed Extensions Check
    const ext = path.extname(entryName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      continue; // Skip unsupported or non-tabular files (like .DS_Store, thumbs.db)
    }

    const baseName = path.basename(entryName, ext).toLowerCase();
    const entryData = entry.getData();

    let records = [];
    if (ext === '.csv') {
      records = parseCSV(entryData);
    } else if (ext === '.xlsx') {
      const xlsxResult = parseXLSX(entryData);
      records = xlsxResult.defaultRecords;
    }

    // Infer entity type from filename (e.g. "students.csv" -> "students")
    const inferredEntity = inferEntityType(baseName);

    extractedFiles.push({
      filename: path.basename(entryName),
      rawEntryName: entryName,
      entityType: inferredEntity,
      records
    });
  }

  if (extractedFiles.length === 0) {
    throw new Error('No valid .csv or .xlsx university datasets found inside the ZIP archive');
  }

  return extractedFiles;
}

/**
 * Matches filename to supported university entity catalogue
 */
function inferEntityType(cleanName) {
  if (cleanName.includes('dept') || cleanName.includes('department')) return 'departments';
  if (cleanName.includes('prog') || cleanName.includes('degree')) return 'programs';
  if (cleanName.includes('sub') || cleanName.includes('course')) return 'subjects';
  if (cleanName.includes('enroll') || cleanName.includes('registration')) return 'enrollments';
  if (cleanName.includes('stud')) return 'students';
  if (cleanName.includes('room') || cleanName.includes('venue')) return 'rooms';
  if (cleanName.includes('avail')) return 'faculty_availability';
  if (cleanName.includes('fac') || cleanName.includes('teach')) return 'faculty';
  return 'unknown';
}

module.exports = {
  extractSafeZip,
  inferEntityType
};
