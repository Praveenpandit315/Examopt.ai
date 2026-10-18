// server/src/controllers/academic.controller.js
// Academic Data Management Controller for University Entities

const { db } = require('../database/db');

// Summary statistics across academic entities
function getAcademicSummary(req, res) {
  try {
    const departmentsCount = db.prepare('SELECT COUNT(*) as c FROM departments').get().c;
    const programsCount = db.prepare('SELECT COUNT(*) as c FROM academic_programs').get().c;
    const subjectsCount = db.prepare('SELECT COUNT(*) as c FROM subjects').get().c;
    const facultyCount = db.prepare('SELECT COUNT(*) as c FROM faculty').get().c;
    const blocksCount = db.prepare('SELECT COUNT(*) as c FROM university_blocks WHERE is_active = 1').get().c;
    const roomsCount = db.prepare('SELECT COUNT(*) as c FROM rooms WHERE is_active = 1').get().c;
    const studentsCount = db.prepare('SELECT COUNT(*) as c FROM student_profiles').get().c;
    const enrollmentsCount = db.prepare('SELECT COUNT(*) as c FROM student_course_enrollments').get().c;

    return res.json({
      summary: {
        departments: departmentsCount,
        programs: programsCount,
        subjects: subjectsCount,
        faculty: facultyCount,
        blocks: blocksCount,
        rooms: roomsCount,
        students: studentsCount,
        enrollments: enrollmentsCount
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch academic summary: ' + err.message });
  }
}

// ==================== DEPARTMENTS ====================
function getDepartments(req, res) {
  try {
    const departments = db.prepare(`
      SELECT d.*, 
        (SELECT COUNT(*) FROM academic_programs WHERE department_id = d.id) as programs_count,
        (SELECT COUNT(*) FROM faculty WHERE department_id = d.id) as faculty_count,
        (SELECT COUNT(*) FROM subjects WHERE department_id = d.id OR department = d.code) as subjects_count
      FROM departments d
      ORDER BY d.code ASC
    `).all();
    return res.json({ departments });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch departments: ' + err.message });
  }
}

function createDepartment(req, res) {
  try {
    const { code, name, building, head_name } = req.body;
    if (!code || !name) {
      return res.status(400).json({ error: 'Department code and name are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO departments (code, name, building, head_name)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(code.trim().toUpperCase(), name.trim(), building || '', head_name || '');

    return res.status(201).json({
      message: 'Department created successfully',
      departmentId: Number(result.lastInsertRowid)
    });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Department code already exists' });
    }
    return res.status(500).json({ error: 'Failed to create department: ' + err.message });
  }
}

function updateDepartment(req, res) {
  try {
    const { id } = req.params;
    const { name, building, head_name } = req.body;

    db.prepare(`
      UPDATE departments 
      SET name = COALESCE(?, name),
          building = COALESCE(?, building),
          head_name = COALESCE(?, head_name)
      WHERE id = ?
    `).run(name, building, head_name, id);

    return res.json({ message: 'Department updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update department: ' + err.message });
  }
}

function deleteDepartment(req, res) {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM departments WHERE id = ?').run(id);
    return res.json({ message: 'Department deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete department: ' + err.message });
  }
}

// ==================== ACADEMIC PROGRAMS ====================
function getPrograms(req, res) {
  try {
    const programs = db.prepare(`
      SELECT p.*, d.code as department_code, d.name as department_name,
        (SELECT COUNT(*) FROM student_profiles WHERE program = p.code) as enrolled_students
      FROM academic_programs p
      LEFT JOIN departments d ON p.department_id = d.id
      ORDER BY p.code ASC
    `).all();
    return res.json({ programs });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch academic programs: ' + err.message });
  }
}

function createProgram(req, res) {
  try {
    const { code, name, department_id, degree_level, total_semesters } = req.body;
    if (!code || !name) {
      return res.status(400).json({ error: 'Program code and name are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO academic_programs (code, name, department_id, degree_level, total_semesters)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      code.trim().toUpperCase(),
      name.trim(),
      department_id || null,
      degree_level || 'Undergraduate',
      total_semesters || 6
    );

    return res.status(201).json({
      message: 'Program created successfully',
      programId: Number(result.lastInsertRowid)
    });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Program code already exists' });
    }
    return res.status(500).json({ error: 'Failed to create program: ' + err.message });
  }
}

function updateProgram(req, res) {
  try {
    const { id } = req.params;
    const { name, department_id, degree_level, total_semesters } = req.body;

    db.prepare(`
      UPDATE academic_programs
      SET name = COALESCE(?, name),
          department_id = COALESCE(?, department_id),
          degree_level = COALESCE(?, degree_level),
          total_semesters = COALESCE(?, total_semesters)
      WHERE id = ?
    `).run(name, department_id, degree_level, total_semesters, id);

    return res.json({ message: 'Program updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update program: ' + err.message });
  }
}

function deleteProgram(req, res) {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM academic_programs WHERE id = ?').run(id);
    return res.json({ message: 'Program deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete program: ' + err.message });
  }
}

// ==================== SUBJECTS ====================
function getSubjects(req, res) {
  try {
    const subjects = db.prepare(`
      SELECT s.*, d.name as department_name,
        (SELECT COUNT(*) FROM student_course_enrollments WHERE subject_id = s.id) as enrolled_students,
        (SELECT COUNT(*) FROM examinations WHERE subject_id = s.id) as examinations_count
      FROM subjects s
      LEFT JOIN departments d ON s.department_id = d.id
      ORDER BY s.code ASC
    `).all();
    return res.json({ subjects });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch subjects: ' + err.message });
  }
}

function createSubject(req, res) {
  try {
    const { code, name, department, department_id, credits, required_room_type } = req.body;
    if (!code || !name) {
      return res.status(400).json({ error: 'Subject code and name are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO subjects (code, name, department, department_id, credits, required_room_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      code.trim().toUpperCase(),
      name.trim(),
      department || 'GEN',
      department_id || null,
      credits || 3,
      required_room_type || 'classroom'
    );

    return res.status(201).json({
      message: 'Subject created successfully',
      subjectId: Number(result.lastInsertRowid)
    });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Subject code already exists' });
    }
    return res.status(500).json({ error: 'Failed to create subject: ' + err.message });
  }
}

function updateSubject(req, res) {
  try {
    const { id } = req.params;
    const { name, department, department_id, credits, required_room_type } = req.body;

    db.prepare(`
      UPDATE subjects
      SET name = COALESCE(?, name),
          department = COALESCE(?, department),
          department_id = COALESCE(?, department_id),
          credits = COALESCE(?, credits),
          required_room_type = COALESCE(?, required_room_type)
      WHERE id = ?
    `).run(name, department, department_id, credits, required_room_type, id);

    return res.json({ message: 'Subject updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update subject: ' + err.message });
  }
}

function deleteSubject(req, res) {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM subjects WHERE id = ?').run(id);
    return res.json({ message: 'Subject deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete subject: ' + err.message });
  }
}

// ==================== FACULTY & AVAILABILITY ====================
function getFaculty(req, res) {
  try {
    const facultyList = db.prepare(`
      SELECT f.*, d.code as department_code, d.name as department_name,
        (SELECT COUNT(*) FROM faculty_availability WHERE faculty_id = f.id AND is_available = 0) as blackout_windows
      FROM faculty f
      LEFT JOIN departments d ON f.department_id = d.id
      ORDER BY f.code ASC
    `).all();
    return res.json({ faculty: facultyList });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch faculty: ' + err.message });
  }
}

function createFaculty(req, res) {
  try {
    const { code, name, email, department_id, designation } = req.body;
    if (!code || !name || !email) {
      return res.status(400).json({ error: 'Faculty code, name, and email are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO faculty (code, name, email, department_id, designation)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      code.trim().toUpperCase(),
      name.trim(),
      email.trim().toLowerCase(),
      department_id || null,
      designation || 'Assistant Professor'
    );

    return res.status(201).json({
      message: 'Faculty member created successfully',
      facultyId: Number(result.lastInsertRowid)
    });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Faculty code or email already exists' });
    }
    return res.status(500).json({ error: 'Failed to create faculty: ' + err.message });
  }
}

function updateFaculty(req, res) {
  try {
    const { id } = req.params;
    const { name, email, department_id, designation } = req.body;

    db.prepare(`
      UPDATE faculty
      SET name = COALESCE(?, name),
          email = COALESCE(?, email),
          department_id = COALESCE(?, department_id),
          designation = COALESCE(?, designation)
      WHERE id = ?
    `).run(name, email, department_id, designation, id);

    return res.json({ message: 'Faculty updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update faculty: ' + err.message });
  }
}

function deleteFaculty(req, res) {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM faculty WHERE id = ?').run(id);
    return res.json({ message: 'Faculty member deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete faculty: ' + err.message });
  }
}

function getFacultyAvailability(req, res) {
  try {
    const { facultyId } = req.query;
    let query = `
      SELECT fa.*, f.name as faculty_name, f.code as faculty_code
      FROM faculty_availability fa
      JOIN faculty f ON fa.faculty_id = f.id
    `;
    const params = [];
    if (facultyId) {
      query += ` WHERE fa.faculty_id = ?`;
      params.push(facultyId);
    }
    query += ` ORDER BY fa.date ASC, fa.start_time ASC`;

    const records = db.prepare(query).all(...params);
    return res.json({ availability: records });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch faculty availability: ' + err.message });
  }
}

function addFacultyAvailability(req, res) {
  try {
    const { faculty_id, date, start_time, end_time, is_available = 0 } = req.body;
    if (!faculty_id || !date || !start_time || !end_time) {
      return res.status(400).json({ error: 'Faculty ID, date, start time, and end time are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO faculty_availability (faculty_id, date, start_time, end_time, is_available)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(faculty_id, date, start_time, end_time, is_available ? 1 : 0);

    return res.status(201).json({
      message: 'Faculty availability window recorded',
      id: Number(result.lastInsertRowid)
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to record faculty availability: ' + err.message });
  }
}

function deleteFacultyAvailability(req, res) {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM faculty_availability WHERE id = ?').run(id);
    return res.json({ message: 'Faculty availability entry removed' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to remove faculty availability: ' + err.message });
  }
}

// ==================== UNIVERSITY BLOCKS ====================
function getBlocks(req, res) {
  try {
    const blocks = db.prepare(`
      SELECT b.*,
        (SELECT COUNT(*) FROM rooms WHERE block_id = b.id AND is_active = 1) as room_count,
        (SELECT COALESCE(SUM(capacity), 0) FROM rooms WHERE block_id = b.id AND is_active = 1) as total_capacity
      FROM university_blocks b
      ORDER BY b.code ASC
    `).all();
    return res.json({ blocks });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch university blocks: ' + err.message });
  }
}

function createBlock(req, res) {
  try {
    const { code, name, campus_zone, total_floors } = req.body;
    if (!code || !name) {
      return res.status(400).json({ error: 'Block code and name are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO university_blocks (code, name, campus_zone, total_floors, is_active)
      VALUES (?, ?, ?, ?, 1)
    `);
    const result = stmt.run(
      code.trim().toUpperCase(),
      name.trim(),
      campus_zone || 'Main Campus',
      total_floors || 4
    );

    return res.status(201).json({
      message: 'University block created successfully',
      blockId: Number(result.lastInsertRowid)
    });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Block code already exists' });
    }
    return res.status(500).json({ error: 'Failed to create block: ' + err.message });
  }
}

function updateBlock(req, res) {
  try {
    const { id } = req.params;
    const { name, campus_zone, total_floors, is_active } = req.body;

    db.prepare(`
      UPDATE university_blocks
      SET name = COALESCE(?, name),
          campus_zone = COALESCE(?, campus_zone),
          total_floors = COALESCE(?, total_floors),
          is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(name, campus_zone, total_floors, is_active !== undefined ? (is_active ? 1 : 0) : null, id);

    return res.json({ message: 'University block updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update block: ' + err.message });
  }
}

function deleteBlock(req, res) {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM university_blocks WHERE id = ?').run(id);
    return res.json({ message: 'University block deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete block: ' + err.message });
  }
}

module.exports = {
  getAcademicSummary,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getFaculty,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  getFacultyAvailability,
  addFacultyAvailability,
  deleteFacultyAvailability,
  getBlocks,
  createBlock,
  updateBlock,
  deleteBlock
};
