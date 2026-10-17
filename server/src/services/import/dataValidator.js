// server/src/services/import/dataValidator.js
// Domain Data Validator for University Master Data Ingestion

const { db } = require('../../database/db');

// Built-in standard aliases for smart auto-column mapping
const DEFAULT_COLUMN_ALIASES = {
  departments: {
    code: ['code', 'dept_code', 'department_code', 'id', 'dept_id'],
    name: ['name', 'department_name', 'dept_name', 'title'],
    building: ['building', 'block', 'location'],
    head_name: ['head_name', 'hod', 'head', 'chairperson']
  },
  programs: {
    code: ['code', 'program_code', 'prog_code', 'degree_code'],
    name: ['name', 'program_name', 'degree_name', 'title'],
    department_code: ['department_code', 'dept_code', 'department', 'dept'],
    degree_level: ['degree_level', 'level', 'type'],
    total_semesters: ['total_semesters', 'semesters', 'duration_semesters']
  },
  subjects: {
    code: ['code', 'subject_code', 'course_code', 'paper_code', 'subject_id'],
    name: ['name', 'subject_name', 'course_name', 'paper_name', 'title'],
    department_code: ['department_code', 'dept_code', 'department', 'dept'],
    program_code: ['program_code', 'prog_code', 'program'],
    semester: ['semester', 'sem'],
    credits: ['credits', 'credit_hours', 'credit'],
    required_room_type: ['required_room_type', 'room_type', 'venue_type', 'type']
  },
  students: {
    student_id: ['student_id', 'roll_number', 'roll_no', 'student_code', 'id', 'enrollment_no'],
    full_name: ['full_name', 'name', 'student_name'],
    email: ['email', 'student_email', 'mail'],
    program_code: ['program_code', 'program', 'course', 'branch'],
    semester: ['semester', 'sem', 'current_semester'],
    section: ['section', 'sec', 'group']
  },
  enrollments: {
    student_id: ['student_id', 'roll_number', 'roll_no', 'student_code'],
    subject_id: ['subject_id', 'subject_code', 'course_code', 'paper_code'],
    academic_term: ['academic_term', 'term', 'session', 'semester_term']
  },
  rooms: {
    code: ['code', 'room_code', 'room_id', 'venue_code', 'room_number', 'room_no'],
    name: ['name', 'room_name', 'venue_name', 'title'],
    building: ['building', 'block', 'wing', 'location'],
    room_type: ['room_type', 'type', 'venue_type', 'category'],
    capacity: ['capacity', 'seating_capacity', 'exam_capacity', 'seats']
  },
  faculty: {
    code: ['code', 'faculty_code', 'faculty_id', 'teacher_code', 'emp_id'],
    name: ['name', 'faculty_name', 'teacher_name', 'full_name'],
    email: ['email', 'faculty_email', 'mail'],
    department_code: ['department_code', 'dept_code', 'department', 'dept'],
    designation: ['designation', 'role', 'post', 'title']
  },
  faculty_availability: {
    faculty_code: ['faculty_code', 'faculty_id', 'code', 'emp_id'],
    date: ['date', 'exam_date', 'day'],
    start_time: ['start_time', 'start', 'from_time'],
    end_time: ['end_time', 'end', 'to_time'],
    is_available: ['is_available', 'available', 'status']
  }
};

/**
 * Normalizes raw row keys using column mapping or default aliases
 */
function normalizeRow(row, entityType, customMapping = {}) {
  const normalized = {};
  const aliases = DEFAULT_COLUMN_ALIASES[entityType] || {};

  // Build reverse lookup: lowercase input key -> target canonical field
  const lookup = {};

  // 1. Check custom user mapping first
  for (const [canonicalField, sourceCol] of Object.entries(customMapping)) {
    if (sourceCol) lookup[sourceCol.toLowerCase().trim()] = canonicalField;
  }

  // 2. Fall back to standard aliases
  for (const [canonicalField, aliasList] of Object.entries(aliases)) {
    if (!lookup[canonicalField]) {
      for (const a of aliasList) {
        lookup[a.toLowerCase().trim()] = canonicalField;
      }
    }
  }

  // Map row fields
  for (const [key, val] of Object.entries(row)) {
    const cleanKey = key.toLowerCase().trim().replace(/[\s_-]+/g, '_');
    const targetField = lookup[cleanKey] || lookup[key.toLowerCase().trim()] || cleanKey;
    normalized[targetField] = typeof val === 'string' ? val.trim() : val;
  }

  return normalized;
}

/**
 * Validates a batch of normalized records for a specific entity type
 * 
 * @param {string} entityType - Entity type (e.g. 'enrollments', 'students', 'rooms')
 * @param {Array<Object>} records - Raw or mapped records
 * @param {Object} customMapping - Optional user-configured column mapping
 * @param {Object} batchContext - In-memory records from sibling files in the same multi-file import
 * @returns {{ validRecords: Array, invalidRecords: Array, summary: Object }}
 */
function validateEntityRecords(entityType, records, customMapping = {}, batchContext = {}) {
  const validRecords = [];
  const invalidRecords = [];
  const seenKeys = new Set();

  // Pre-load reference dictionaries from SQLite DB
  const dbDepts = new Set(db.prepare('SELECT code FROM departments').all().map(d => d.code.toUpperCase()));
  const dbSubjects = new Set(db.prepare('SELECT code FROM subjects').all().map(s => s.code.toUpperCase()));
  const dbStudents = new Set(db.prepare('SELECT roll_number FROM student_profiles').all().map(s => s.roll_number.toUpperCase()));
  const dbRooms = new Set(db.prepare('SELECT code FROM rooms').all().map(r => r.code.toUpperCase()));
  const dbFaculty = new Set(db.prepare('SELECT code FROM faculty').all().map(f => f.code.toUpperCase()));

  // In-memory additions from sibling sheets in the same import session
  if (batchContext.departments) {
    batchContext.departments.forEach(d => d.code && dbDepts.add(d.code.toUpperCase()));
  }
  if (batchContext.subjects) {
    batchContext.subjects.forEach(s => s.code && dbSubjects.add(s.code.toUpperCase()));
  }
  if (batchContext.students) {
    batchContext.students.forEach(s => s.student_id && dbStudents.add(s.student_id.toUpperCase()));
  }
  if (batchContext.rooms) {
    batchContext.rooms.forEach(r => r.code && dbRooms.add(r.code.toUpperCase()));
  }
  if (batchContext.faculty) {
    batchContext.faculty.forEach(f => f.code && dbFaculty.add(f.code.toUpperCase()));
  }

  records.forEach((rawRow, idx) => {
    const row = normalizeRow(rawRow, entityType, customMapping);
    const rowNum = idx + 2; // 1-indexed accounting for CSV header
    const errors = [];

    switch (entityType) {
      case 'departments': {
        if (!row.code) errors.push('Missing mandatory department code');
        if (!row.name) errors.push('Missing mandatory department name');
        const key = (row.code || '').toUpperCase();
        if (seenKeys.has(key)) errors.push(`Duplicate department code '${row.code}' in dataset`);
        seenKeys.add(key);
        break;
      }

      case 'programs': {
        if (!row.code) errors.push('Missing mandatory program code');
        if (!row.name) errors.push('Missing mandatory program name');
        if (row.department_code && !dbDepts.has(row.department_code.toUpperCase())) {
          errors.push(`Referenced department '${row.department_code}' does not exist`);
        }
        const key = (row.code || '').toUpperCase();
        if (seenKeys.has(key)) errors.push(`Duplicate program code '${row.code}' in dataset`);
        seenKeys.add(key);
        break;
      }

      case 'subjects': {
        if (!row.code) errors.push('Missing mandatory subject code');
        if (!row.name) errors.push('Missing mandatory subject name');
        if (row.required_room_type) {
          const type = row.required_room_type.toLowerCase();
          if (!['classroom', 'computer_lab', 'specialized'].includes(type)) {
            errors.push(`Invalid room type '${row.required_room_type}'. Must be 'classroom', 'computer_lab', or 'specialized'`);
          }
        }
        if (row.credits && (isNaN(Number(row.credits)) || Number(row.credits) < 0)) {
          errors.push('Credits must be a positive number');
        }
        const key = (row.code || '').toUpperCase();
        if (seenKeys.has(key)) errors.push(`Duplicate subject code '${row.code}' in dataset`);
        seenKeys.add(key);
        break;
      }

      case 'students': {
        if (!row.student_id) errors.push('Missing mandatory student identifier (student_id / roll_number)');
        if (!row.full_name) errors.push('Missing student full name');
        if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
          errors.push(`Invalid or missing email address '${row.email || ''}'`);
        }
        const key = (row.student_id || '').toUpperCase();
        if (seenKeys.has(key)) errors.push(`Duplicate student ID '${row.student_id}' in dataset`);
        seenKeys.add(key);
        break;
      }

      case 'enrollments': {
        if (!row.student_id) errors.push('Missing mandatory student_id');
        if (!row.subject_id) errors.push('Missing mandatory subject_id / course_code');
        if (!row.academic_term) errors.push('Missing mandatory academic_term (e.g. 2026-Odd)');

        const stuKey = (row.student_id || '').toUpperCase();
        const subKey = (row.subject_id || '').toUpperCase();

        if (row.student_id && !dbStudents.has(stuKey)) {
          errors.push(`Unknown student ID '${row.student_id}' (not found in student records)`);
        }
        if (row.subject_id && !dbSubjects.has(subKey)) {
          errors.push(`Unknown subject ID '${row.subject_id}' (not found in subjects catalogue)`);
        }

        const enrollKey = `${stuKey}|${subKey}|${(row.academic_term || '').toUpperCase()}`;
        if (seenKeys.has(enrollKey)) {
          errors.push(`Duplicate enrollment: Student '${row.student_id}' is already enrolled in '${row.subject_id}' for term '${row.academic_term}'`);
        }
        seenKeys.add(enrollKey);
        break;
      }

      case 'rooms': {
        if (!row.code) errors.push('Missing mandatory room code');
        const cap = Number(row.capacity);
        if (!row.capacity || isNaN(cap) || cap <= 0 || !Number.isInteger(cap)) {
          errors.push(`Invalid examination room capacity '${row.capacity || ''}'. Must be a positive integer > 0`);
        }
        if (row.room_type) {
          const type = row.room_type.toLowerCase();
          if (!['classroom', 'computer_lab', 'specialized'].includes(type)) {
            errors.push(`Invalid room type '${row.room_type}'. Must be 'classroom', 'computer_lab', or 'specialized'`);
          }
        }
        const key = (row.code || '').toUpperCase();
        if (seenKeys.has(key)) errors.push(`Duplicate room identifier '${row.code}' in dataset`);
        seenKeys.add(key);
        break;
      }

      case 'faculty': {
        if (!row.code) errors.push('Missing mandatory faculty code');
        if (!row.name) errors.push('Missing faculty name');
        if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
          errors.push(`Invalid or missing faculty email '${row.email || ''}'`);
        }
        const key = (row.code || '').toUpperCase();
        if (seenKeys.has(key)) errors.push(`Duplicate faculty code '${row.code}' in dataset`);
        seenKeys.add(key);
        break;
      }

      case 'faculty_availability': {
        if (!row.faculty_code) errors.push('Missing mandatory faculty_code');
        if (row.faculty_code && !dbFaculty.has(row.faculty_code.toUpperCase())) {
          errors.push(`Unknown faculty code '${row.faculty_code}' (not found in faculty catalogue)`);
        }
        if (!row.date || !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
          errors.push(`Invalid date format '${row.date || ''}'. Expected YYYY-MM-DD`);
        }
        if (!row.start_time || !/^\d{2}:\d{2}$/.test(row.start_time)) {
          errors.push(`Invalid start time '${row.start_time || ''}'. Expected HH:MM`);
        }
        if (!row.end_time || !/^\d{2}:\d{2}$/.test(row.end_time)) {
          errors.push(`Invalid end time '${row.end_time || ''}'. Expected HH:MM`);
        }
        if (row.start_time && row.end_time && row.start_time >= row.end_time) {
          errors.push(`Invalid time interval: start_time (${row.start_time}) must be earlier than end_time (${row.end_time})`);
        }
        break;
      }

      default:
        errors.push(`Unsupported or unknown entity type '${entityType}'`);
    }

    if (errors.length === 0) {
      validRecords.push({
        rowIndex: rowNum,
        data: row
      });
    } else {
      invalidRecords.push({
        rowIndex: rowNum,
        data: row,
        errors
      });
    }
  });

  return {
    entityType,
    totalCount: records.length,
    validCount: validRecords.length,
    invalidCount: invalidRecords.length,
    validRecords,
    invalidRecords
  };
}

module.exports = {
  DEFAULT_COLUMN_ALIASES,
  normalizeRow,
  validateEntityRecords
};
