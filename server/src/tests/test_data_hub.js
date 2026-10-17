// server/src/tests/test_data_hub.js
// Verification suite for University Data Hub (CSV/XLSX/ZIP, Staging, Validation, and Controlled Commit)

const assert = require('assert');
const AdmZip = require('adm-zip');
const { parseCSV, sanitizeCell } = require('../services/import/csvParser');
const { extractSafeZip } = require('../services/import/zipExtractor');
const { validateEntityRecords } = require('../services/import/dataValidator');
const { stageUpload, commitBatch, getTemplateCSV, getMasterZipBundle } = require('../services/import/importService');
const { db, initDatabase } = require('../database/db');
const { seed } = require('../database/seed');

async function runDataHubTests() {
  console.log('\n🏛️ Starting University Data Hub Verification Suite...\n');
  seed();

  // Test 1: CSV Formula Injection Protection
  console.log('▶️ [Test 1] CSV Formula Injection & Sanitization...');
  assert.strictEqual(sanitizeCell('=SUM(A1:B2)'), 'SUM(A1:B2)', 'Leading = must be stripped');
  assert.strictEqual(sanitizeCell('+cmd|/C calc'), 'cmd|/C calc', 'Leading + must be stripped');
  assert.strictEqual(sanitizeCell('@alert()'), 'alert()', 'Leading @ must be stripped');
  assert.strictEqual(sanitizeCell('Normal Value'), 'Normal Value', 'Safe strings must remain intact');
  
  const testCsv = `code,name,building\nCSE,"Computer Science & Eng",Block C\n"=EVIL",Dangerous Room,Block D`;
  const parsedCsv = parseCSV(testCsv);
  assert.strictEqual(parsedCsv.length, 2);
  assert.strictEqual(parsedCsv[1].code, 'EVIL', 'Formula injection stripped from CSV cell');
  console.log('  ✅ Formula injection protection verified.');

  // Test 2: Safe ZIP Extraction & Zip Slip Traversal Security
  console.log('\n▶️ [Test 2] Safe ZIP Ingestion & Path Traversal Prevention...');
  const zip = new AdmZip();
  zip.addFile('departments.csv', Buffer.from('code,name\nLAW,School of Law', 'utf8'));
  zip.addFile('rooms.csv', Buffer.from('code,capacity\nLAW101,60', 'utf8'));
  const zipBuffer = zip.toBuffer();

  const extracted = extractSafeZip(zipBuffer);
  assert.strictEqual(extracted.length, 2);
  assert.strictEqual(extracted[0].entityType, 'departments');
  assert.strictEqual(extracted[1].entityType, 'rooms');

  // Verify Zip Slip attack is blocked
  const maliciousZip = new AdmZip();
  maliciousZip.addFile('exploit.csv', Buffer.from('evil', 'utf8'));
  maliciousZip.getEntries()[0].entryName = '../../etc/passwd.csv';
  let caughtZipSlip = false;
  try {
    extractSafeZip(maliciousZip.toBuffer());
  } catch (err) {
    caughtZipSlip = true;
    assert(err.message.includes('Path traversal'), 'Must throw Path traversal security exception');
  }
  assert.strictEqual(caughtZipSlip, true, 'Malicious Zip Slip path traversal must be rejected');
  console.log('  ✅ ZIP decompression & Zip Slip security guard verified.');

  // Test 3: Domain Data Validation (Unknown Student, Duplicate Enrollments, Invalid Capacities)
  console.log('\n▶️ [Test 3] Domain Constraint Validation & Error Diagnostics...');
  
  // A. Room with invalid capacity
  const badRooms = [
    { code: 'R_OK', capacity: '75', room_type: 'classroom' },
    { code: 'R_BAD_1', capacity: '-10', room_type: 'classroom' },
    { code: 'R_BAD_2', capacity: 'abc', room_type: 'classroom' },
    { code: 'R_BAD_3', capacity: '0', room_type: 'classroom' }
  ];
  const roomVal = validateEntityRecords('rooms', badRooms);
  assert.strictEqual(roomVal.validCount, 1);
  assert.strictEqual(roomVal.invalidCount, 3);
  assert(roomVal.invalidRecords[0].errors[0].includes('capacity'));

  // B. Enrollments with unknown student and duplicate registration
  const testEnrollments = [
    { student_id: 'STU101', subject_id: 'CS101', academic_term: '2026-Odd' },
    { student_id: 'STU999_UNKNOWN', subject_id: 'CS101', academic_term: '2026-Odd' },
    { student_id: 'STU101', subject_id: 'SUB_UNKNOWN', academic_term: '2026-Odd' },
    { student_id: 'STU101', subject_id: 'CS101', academic_term: '2026-Odd' } // Duplicate
  ];
  const enrollVal = validateEntityRecords('enrollments', testEnrollments);
  assert.strictEqual(enrollVal.validCount, 1);
  assert.strictEqual(enrollVal.invalidCount, 3);
  assert(enrollVal.invalidRecords[0].errors.some(e => e.includes('Unknown student ID')));
  assert(enrollVal.invalidRecords[1].errors.some(e => e.includes('Unknown subject ID')));
  assert(enrollVal.invalidRecords[2].errors.some(e => e.includes('Duplicate enrollment')));
  console.log('  ✅ Validation caught unknown student IDs, missing subjects, duplicate enrollments & invalid capacities.');

  // Test 4: Staging and Controlled Upsert Commit
  console.log('\n▶️ [Test 4] Staging and Controlled Database Upsert...');
  const newDeptsCsv = `code,name,building,head_name\nMGMT,School of Management,Block M,Dr. Kapoor\nBIO,Department of Biotechnology,Block T,Dr. Sen`;
  const fileMock = {
    originalname: 'departments.csv',
    buffer: Buffer.from(newDeptsCsv, 'utf8'),
    size: Buffer.byteLength(newDeptsCsv)
  };

  const stageResult = await stageUpload(fileMock, { entityType: 'departments' });
  assert(stageResult.batchId > 0);
  assert.strictEqual(stageResult.validRecords, 2);
  assert.strictEqual(stageResult.errorRecords, 0);

  // Commit staged batch
  const commitResult = commitBatch(stageResult.batchId);
  assert.strictEqual(commitResult.success, true);
  assert.strictEqual(commitResult.committedRecords.departments, 2);

  // Verify records exist in database
  const mgmt = db.prepare("SELECT * FROM departments WHERE code = 'MGMT'").get();
  assert.strictEqual(mgmt.name, 'School of Management');

  // Verify non-destructive guarantee (previous departments like CSE and BCA are still intact!)
  const cse = db.prepare("SELECT * FROM departments WHERE code = 'CSE'").get();
  assert(cse !== undefined, 'Previous records must not be deleted by an import');
  console.log('  ✅ Staging, controlled upsert commit, and non-destructive retention verified.');

  // Test 5: Templates & Master ZIP Bundle
  console.log('\n▶️ [Test 5] Template Generation & Multi-Entity ZIP Bundle...');
  const deptTpl = getTemplateCSV('departments');
  assert(deptTpl.includes('code,name,building,head_name'));
  
  const zipBundle = getMasterZipBundle();
  const zipInspect = new AdmZip(zipBundle);
  assert.strictEqual(zipInspect.getEntries().length, 8, 'Master ZIP bundle must contain all 8 entity CSV templates');
  console.log('  ✅ All 8 CSV templates and Master ZIP bundle verified.');

  console.log('\n🎉 ALL UNIVERSITY DATA HUB VERIFICATION TESTS PASSED SUCCESSFULLY! 🏆\n');
}

if (require.main === module) {
  runDataHubTests().catch(err => {
    console.error('Test failure:', err);
    process.exit(1);
  });
}

module.exports = { runDataHubTests };
