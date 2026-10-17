// server/src/services/import/importService.js
// University Data Hub Import Service: Staging, Validation, and Controlled Upsert

const path = require('path');
const AdmZip = require('adm-zip');
const bcrypt = require('bcryptjs');
const { db } = require('../../database/db');
const { parseCSV } = require('./csvParser');
const { parseXLSX } = require('./xlsxParser');
const { extractSafeZip, inferEntityType } = require('./zipExtractor');
const { validateEntityRecords } = require('./dataValidator');

// Standard university sample templates
const TEMPLATES = {
  departments: {
    headers: 'code,name,building,head_name',
    sample: [
      'CSE,Computer Science and Engineering,Block C,Dr. R. K. Gupta',
      'BCA,Department of Computer Applications,Block B,Dr. S. Sharma',
      'MATH,Department of Applied Mathematics,Block A,Dr. V. Verma',
      'ECE,Electronics and Communication,Block D,Dr. M. Singh'
    ]
  },
  programs: {
    headers: 'code,name,department_code,degree_level,total_semesters',
    sample: [
      'BCA,Bachelor of Computer Applications,BCA,Undergraduate,6',
      'BTECH-CSE,B.Tech Computer Science and Engineering,CSE,Undergraduate,8',
      'BTECH-ECE,B.Tech Electronics and Communication,ECE,Undergraduate,8'
    ]
  },
  subjects: {
    headers: 'code,name,department_code,program_code,semester,credits,required_room_type',
    sample: [
      'CS301,Java Programming,BCA,BCA,3,4,classroom',
      'MA305,Mathematics Elective,MATH,BCA,3,3,classroom',
      'CS101,Data Structures,CSE,BTECH-CSE,3,4,classroom',
      'CS102,Operating Systems,CSE,BTECH-CSE,3,4,classroom',
      'CS103,Computer Networks Lab,CSE,BTECH-CSE,5,3,computer_lab'
    ]
  },
  students: {
    headers: 'student_id,full_name,email,program_code,semester,section',
    sample: [
      'STU101,Rahul Kumar,rahul.kumar@student.university.edu,BCA,3,A',
      'STU102,Priya Sharma,priya.sharma@student.university.edu,BCA,3,A',
      'STU103,Amit Verma,amit.verma@student.university.edu,BTECH-CSE,3,B'
    ]
  },
  enrollments: {
    headers: 'student_id,subject_id,academic_term',
    sample: [
      'STU101,CS301,2026-Odd',
      'STU101,MA305,2026-Odd',
      'STU102,CS301,2026-Odd'
    ]
  },
  rooms: {
    headers: 'code,name,building,room_type,capacity',
    sample: [
      'R101,Lecture Hall 101,Block A,classroom,100',
      'R102,Lecture Hall 102,Block A,classroom,80',
      'L1,Computing Lab 1 (High Performance),Block C,computer_lab,50',
      'L2,Computing Lab 2 (Data Science),Block C,computer_lab,45',
      'AUD-1,Central Auditorium Hall,Main Admin,specialized,180'
    ]
  },
  faculty: {
    headers: 'code,name,email,department_code,designation',
    sample: [
      'FAC101,Dr. Rajesh Mehta,rajesh.mehta@university.edu,BCA,Professor',
      'FAC102,Dr. Neha Agarwal,neha.agarwal@university.edu,MATH,Associate Professor',
      'FAC103,Dr. K. P. Yadav,kp.yadav@university.edu,CSE,Professor'
    ]
  },
  faculty_availability: {
    headers: 'faculty_code,date,start_time,end_time,is_available',
    sample: [
      'FAC101,2026-04-15,09:00,17:00,1',
      'FAC102,2026-04-15,09:00,12:00,1',
      'FAC103,2026-04-15,13:00,17:00,1'
    ]
  }
};

/**
 * Returns formatted CSV string for an entity
 */
function getTemplateCSV(entityType) {
  const tpl = TEMPLATES[entityType];
  if (!tpl) throw new Error(`Unknown entity type '${entityType}'`);
  return `${tpl.headers}\n${tpl.sample.join('\n')}\n`;
}

/**
 * Generates an all-in-one ZIP bundle containing all 8 CSV templates
 */
function getMasterZipBundle() {
  const zip = new AdmZip();
  for (const [entity, tpl] of Object.entries(TEMPLATES)) {
    const csvContent = `${tpl.headers}\n${tpl.sample.join('\n')}\n`;
    zip.addFile(`${entity}.csv`, Buffer.from(csvContent, 'utf8'));
  }
  return zip.toBuffer();
}

/**
 * Processes an uploaded file (CSV, XLSX, or ZIP), validates records,
 * and stages them into data_import_batches and data_import_staging.
 */
async function stageUpload(file, options = {}) {
  const { originalname, buffer, size } = file;
  const requestedEntity = options.entityType || null;
  const customMapping = options.columnMapping || {};
  const userId = options.userId || null;

  if (size > 10 * 1024 * 1024) {
    throw new Error('File exceeds maximum upload limit of 10MB');
  }

  const ext = path.extname(originalname).toLowerCase();
  const baseName = path.basename(originalname, ext);

  let rawFileSets = [];

  if (ext === '.csv') {
    const inferred = requestedEntity || inferEntityType(baseName);
    const records = parseCSV(buffer);
    rawFileSets.push({
      filename: originalname,
      entityType: inferred,
      records
    });
  } else if (ext === '.xlsx') {
    const xlsxResult = parseXLSX(buffer);
    if (requestedEntity && requestedEntity !== 'auto') {
      rawFileSets.push({
        filename: originalname,
        entityType: requestedEntity,
        records: xlsxResult.defaultRecords
      });
    } else {
      // Check multi-sheet matching
      let foundMatchingSheet = false;
      for (const [sheetName, sheetRows] of Object.entries(xlsxResult.sheets)) {
        const inferred = inferEntityType(sheetName.toLowerCase());
        if (inferred !== 'unknown' && sheetRows.length > 0) {
          rawFileSets.push({
            filename: `${originalname}#${sheetName}`,
            entityType: inferred,
            records: sheetRows
          });
          foundMatchingSheet = true;
        }
      }
      if (!foundMatchingSheet) {
        rawFileSets.push({
          filename: originalname,
          entityType: inferEntityType(baseName),
          records: xlsxResult.defaultRecords
        });
      }
    }
  } else if (ext === '.zip') {
    rawFileSets = extractSafeZip(buffer);
  } else {
    throw new Error(`Unsupported file type '${ext}'. Please upload CSV, XLSX, or ZIP.`);
  }

  // Multi-file dependency sorting order:
  // 1. departments -> 2. programs -> 3. subjects -> 4. students -> 5. rooms -> 6. faculty -> 7. enrollments -> 8. availability
  const order = ['departments', 'programs', 'subjects', 'students', 'rooms', 'faculty', 'enrollments', 'faculty_availability', 'unknown'];
  rawFileSets.sort((a, b) => order.indexOf(a.entityType) - order.indexOf(b.entityType));

  // In-memory cross-file reference context
  const batchContext = {};
  for (const set of rawFileSets) {
    if (set.entityType !== 'unknown') {
      batchContext[set.entityType] = set.records;
    }
  }

  // Create Master Import Batch
  const batchCode = `BATCH-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
  const insertBatch = db.prepare(`
    INSERT INTO data_import_batches (batch_code, filename, file_type, entity_type, total_records, valid_records, error_records, status, summary_json, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'staged', ?, ?)
  `);

  let totalAllRecords = 0;
  let totalValidRecords = 0;
  let totalErrorRecords = 0;
  const validationSets = [];

  for (const set of rawFileSets) {
    const valResult = validateEntityRecords(set.entityType, set.records, customMapping, batchContext);
    totalAllRecords += valResult.totalCount;
    totalValidRecords += valResult.validCount;
    totalErrorRecords += valResult.invalidCount;

    validationSets.push({
      filename: set.filename,
      entityType: set.entityType,
      valResult
    });
  }

  const primaryEntity = rawFileSets.length === 1 ? rawFileSets[0].entityType : 'multi_bundle';
  const summaryJson = JSON.stringify({
    fileCount: rawFileSets.length,
    entities: validationSets.map(s => ({
      entityType: s.entityType,
      filename: s.filename,
      total: s.valResult.totalCount,
      valid: s.valResult.validCount,
      errors: s.valResult.invalidCount
    }))
  });

  const batchRes = insertBatch.run(
    batchCode,
    originalname,
    ext.replace('.', ''),
    primaryEntity,
    totalAllRecords,
    totalValidRecords,
    totalErrorRecords,
    summaryJson,
    userId
  );
  const batchId = Number(batchRes.lastInsertRowid);

  // Stage Individual Rows in data_import_staging
  const insertStaging = db.prepare(`
    INSERT INTO data_import_staging (batch_id, row_index, entity_type, raw_data_json, is_valid, error_message)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const set of validationSets) {
    for (const v of set.valResult.validRecords) {
      insertStaging.run(batchId, v.rowIndex, set.entityType, JSON.stringify(v.data), 1, null);
    }
    for (const inv of set.valResult.invalidRecords) {
      insertStaging.run(batchId, inv.rowIndex, set.entityType, JSON.stringify(inv.data), 0, inv.errors.join('; '));
    }
  }

  return {
    batchId,
    batchCode,
    filename: originalname,
    fileType: ext.replace('.', ''),
    primaryEntity,
    totalRecords: totalAllRecords,
    validRecords: totalValidRecords,
    errorRecords: totalErrorRecords,
    validationSets: validationSets.map(s => ({
      filename: s.filename,
      entityType: s.entityType,
      total: s.valResult.totalCount,
      validCount: s.valResult.validCount,
      errorCount: s.valResult.invalidCount,
      sampleValid: s.valResult.validRecords.slice(0, 10).map(r => r.data),
      errors: s.valResult.invalidRecords.slice(0, 50).map(r => ({
        rowIndex: r.rowIndex,
        data: r.data,
        errors: r.errors
      }))
    }))
  };
}

/**
 * Commits a staged batch into persistent database tables using controlled atomic upsert.
 */
function commitBatch(batchId, userId = null) {
  const batch = db.prepare('SELECT * FROM data_import_batches WHERE id = ?').get(batchId);
  if (!batch) throw new Error(`Import batch #${batchId} not found`);
  if (batch.status === 'committed') throw new Error(`Batch #${batchId} has already been committed`);

  const stagedRows = db.prepare(`
    SELECT * FROM data_import_staging 
    WHERE batch_id = ? AND is_valid = 1 
    ORDER BY id ASC
  `).all(batchId);

  if (stagedRows.length === 0) {
    throw new Error('No valid staged records to commit for this batch');
  }

  const results = {
    departments: 0,
    academic_programs: 0,
    subjects: 0,
    students: 0,
    rooms: 0,
    faculty: 0,
    faculty_availability: 0,
    student_course_enrollments: 0
  };

  const defaultPasswordHash = bcrypt.hashSync('Student@123', 10);

  // Group by entity type and process sequentially
  db.exec('BEGIN TRANSACTION;');
  try {
    for (const row of stagedRows) {
      const data = JSON.parse(row.raw_data_json);

      switch (row.entity_type) {
        case 'departments': {
          db.prepare(`
            INSERT INTO departments (code, name, building, head_name)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(code) DO UPDATE SET 
              name = excluded.name,
              building = excluded.building,
              head_name = excluded.head_name
          `).run(data.code, data.name, data.building || '', data.head_name || '');
          results.departments++;
          break;
        }

        case 'programs': {
          const dept = db.prepare('SELECT id FROM departments WHERE code = ?').get(data.department_code || '');
          const deptId = dept ? dept.id : null;
          db.prepare(`
            INSERT INTO academic_programs (code, name, department_id, degree_level, total_semesters)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(code) DO UPDATE SET 
              name = excluded.name,
              department_id = COALESCE(excluded.department_id, academic_programs.department_id),
              degree_level = excluded.degree_level,
              total_semesters = excluded.total_semesters
          `).run(data.code, data.name, deptId, data.degree_level || 'Undergraduate', Number(data.total_semesters) || 6);
          results.academic_programs++;
          break;
        }

        case 'subjects': {
          const dept = db.prepare('SELECT id FROM departments WHERE code = ?').get(data.department_code || '');
          const deptId = dept ? dept.id : null;
          const deptName = data.department_code || 'General';
          db.prepare(`
            INSERT INTO subjects (code, name, department, department_id, credits, required_room_type)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(code) DO UPDATE SET 
              name = excluded.name,
              department = excluded.department,
              department_id = COALESCE(excluded.department_id, subjects.department_id),
              credits = excluded.credits,
              required_room_type = excluded.required_room_type
          `).run(
            data.code, 
            data.name, 
            deptName, 
            deptId, 
            Number(data.credits) || 3, 
            data.required_room_type || 'classroom'
          );
          results.subjects++;
          break;
        }

        case 'students': {
          // 1. Ensure user login exists
          let user = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email);
          let studentUserId;
          if (!user) {
            const uRes = db.prepare(`
              INSERT INTO users (email, password_hash, role, full_name)
              VALUES (?, ?, 'student', ?)
            `).run(data.email, defaultPasswordHash, data.full_name);
            studentUserId = Number(uRes.lastInsertRowid);
          } else {
            studentUserId = user.id;
          }

          // 2. Upsert student_profiles
          db.prepare(`
            INSERT INTO student_profiles (user_id, roll_number, program, semester, section)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(roll_number) DO UPDATE SET 
              program = excluded.program,
              semester = excluded.semester,
              section = excluded.section
          `).run(
            studentUserId,
            data.student_id,
            data.program_code || 'B.Tech',
            Number(data.semester) || 1,
            data.section || 'A'
          );
          results.students++;
          break;
        }

        case 'enrollments': {
          const stu = db.prepare('SELECT id FROM student_profiles WHERE roll_number = ?').get(data.student_id);
          const sub = db.prepare('SELECT id FROM subjects WHERE code = ?').get(data.subject_id);

          if (stu && sub) {
            db.prepare(`
              INSERT INTO student_course_enrollments (student_profile_id, subject_id, academic_term, status)
              VALUES (?, ?, ?, 'enrolled')
              ON CONFLICT(student_profile_id, subject_id, academic_term) DO UPDATE SET 
                status = 'enrolled'
            `).run(stu.id, sub.id, data.academic_term || '2026-Odd');
            results.student_course_enrollments++;
          }
          break;
        }

        case 'rooms': {
          db.prepare(`
            INSERT INTO rooms (code, building, room_name, room_type, capacity, is_active)
            VALUES (?, ?, ?, ?, ?, 1)
            ON CONFLICT(code) DO UPDATE SET 
              building = excluded.building,
              room_name = excluded.room_name,
              room_type = excluded.room_type,
              capacity = excluded.capacity,
              is_active = 1
          `).run(
            data.code,
            data.building || 'Main Campus',
            data.name || `Venue ${data.code}`,
            data.room_type || 'classroom',
            Number(data.capacity) || 50
          );
          results.rooms++;
          break;
        }

        case 'faculty': {
          const dept = db.prepare('SELECT id FROM departments WHERE code = ?').get(data.department_code || '');
          const deptId = dept ? dept.id : null;
          db.prepare(`
            INSERT INTO faculty (code, name, email, department_id, designation)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(code) DO UPDATE SET 
              name = excluded.name,
              email = excluded.email,
              department_id = COALESCE(excluded.department_id, faculty.department_id),
              designation = excluded.designation
          `).run(data.code, data.name, data.email, deptId, data.designation || 'Assistant Professor');
          results.faculty++;
          break;
        }

        case 'faculty_availability': {
          const fac = db.prepare('SELECT id FROM faculty WHERE code = ?').get(data.faculty_code);
          if (fac) {
            db.prepare(`
              INSERT INTO faculty_availability (faculty_id, date, start_time, end_time, is_available)
              VALUES (?, ?, ?, ?, ?)
            `).run(fac.id, data.date, data.start_time, data.end_time, Number(data.is_available) !== 0 ? 1 : 0);
            results.faculty_availability++;
          }
          break;
        }
      }
    }

    // Update batch status
    db.prepare(`
      UPDATE data_import_batches 
      SET status = 'committed', committed_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(batchId);

    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw new Error('Failed to commit staged batch: ' + err.message);
  }

  return {
    success: true,
    batchId,
    committedRecords: results
  };
}

/**
 * Returns import history batches
 */
function getImportBatches(limit = 20) {
  return db.prepare(`
    SELECT b.id, b.batch_code, b.filename, b.file_type, b.entity_type, 
           b.total_records, b.valid_records, b.error_records, b.status, 
           b.summary_json, b.committed_at, b.created_at, u.full_name AS created_by_name
    FROM data_import_batches b
    LEFT JOIN users u ON b.created_by = u.id
    ORDER BY b.id DESC
    LIMIT ?
  `).all(limit);
}

module.exports = {
  TEMPLATES,
  getTemplateCSV,
  getMasterZipBundle,
  stageUpload,
  commitBatch,
  getImportBatches
};
