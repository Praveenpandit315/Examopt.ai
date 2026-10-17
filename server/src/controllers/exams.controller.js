// server/src/controllers/exams.controller.js
const { db } = require('../database/db');

function getAllExams(req, res) {
  try {
    const { program, semester, roomType, search } = req.query;

    let query = `
      SELECT 
        e.*,
        s.code as subject_code,
        s.name as subject_name,
        s.department as subject_department,
        r.code as fixed_room_code,
        r.room_name as fixed_room_name,
        (
          SELECT COALESCE(SUM(sg.student_count), 0)
          FROM exam_group_relations egr
          JOIN student_groups sg ON sg.id = egr.group_id
          WHERE egr.exam_id = e.id
        ) as total_students,
        (
          SELECT GROUP_CONCAT(sg.name, ', ')
          FROM exam_group_relations egr
          JOIN student_groups sg ON sg.id = egr.group_id
          WHERE egr.exam_id = e.id
        ) as group_names,
        (
          SELECT GROUP_CONCAT(sg.id, ',')
          FROM exam_group_relations egr
          JOIN student_groups sg ON sg.id = egr.group_id
          WHERE egr.exam_id = e.id
        ) as group_ids_str
      FROM examinations e
      JOIN subjects s ON s.id = e.subject_id
      LEFT JOIN rooms r ON r.id = e.fixed_room_id
      WHERE 1=1
    `;

    const params = [];

    if (program && program !== 'All Programs') {
      query += ` AND e.program = ?`;
      params.push(program);
    }
    if (semester && semester !== 'All Semesters') {
      query += ` AND e.semester = ?`;
      params.push(Number(semester));
    }
    if (roomType && roomType !== 'All Types') {
      query += ` AND e.required_room_type = ?`;
      params.push(roomType);
    }
    if (search && search.trim()) {
      query += ` AND (e.code LIKE ? OR s.code LIKE ? OR s.name LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY e.id ASC`;

    const exams = db.prepare(query).all(...params);

    const formatted = exams.map(e => ({
      ...e,
      group_ids: e.group_ids_str ? e.group_ids_str.split(',').map(Number) : []
    }));

    return res.json({ exams: formatted, total: formatted.length });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch examinations: ' + err.message });
  }
}

function getExamById(req, res) {
  try {
    const { id } = req.params;
    const exam = db.prepare(`
      SELECT e.*, s.code as subject_code, s.name as subject_name, r.code as fixed_room_code
      FROM examinations e
      JOIN subjects s ON s.id = e.subject_id
      LEFT JOIN rooms r ON r.id = e.fixed_room_id
      WHERE e.id = ?
    `).get(id);

    if (!exam) {
      return res.status(404).json({ error: 'Examination not found' });
    }

    const groups = db.prepare(`
      SELECT sg.* 
      FROM exam_group_relations egr
      JOIN student_groups sg ON sg.id = egr.group_id
      WHERE egr.exam_id = ?
    `).all(id);

    const enrollments = db.prepare(`
      SELECT sp.*, u.full_name, u.email
      FROM exam_enrollments ee
      JOIN student_profiles sp ON sp.id = ee.student_id
      JOIN users u ON u.id = sp.user_id
      WHERE ee.exam_id = ?
    `).all(id);

    return res.json({ exam: { ...exam, groups, enrollments } });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch examination: ' + err.message });
  }
}

function createExam(req, res) {
  try {
    const { 
      code, subject_id, program, semester, duration_minutes, 
      required_room_type, fixed_date, fixed_start_time, fixed_room_id, group_ids 
    } = req.body;

    if (!code || !subject_id || !program || !semester || !duration_minutes) {
      return res.status(400).json({ error: 'Missing required exam fields: code, subject_id, program, semester, duration_minutes' });
    }

    // Verify code uniqueness
    const existing = db.prepare('SELECT id FROM examinations WHERE code = ?').get(code.trim());
    if (existing) {
      return res.status(400).json({ error: `Examination code '${code}' already exists` });
    }

    // Verify subject exists
    const subject = db.prepare('SELECT id FROM subjects WHERE id = ?').get(subject_id);
    if (!subject) {
      return res.status(400).json({ error: 'Subject does not exist' });
    }

    const insertStmt = db.prepare(`
      INSERT INTO examinations (
        code, subject_id, program, semester, duration_minutes,
        required_room_type, fixed_date, fixed_start_time, fixed_room_id, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const result = insertStmt.run(
      code.trim().toUpperCase(),
      Number(subject_id),
      program,
      Number(semester),
      Number(duration_minutes),
      required_room_type || 'classroom',
      fixed_date || null,
      fixed_start_time || null,
      fixed_room_id ? Number(fixed_room_id) : null
    );

    const examId = Number(result.lastInsertRowid);

    // Link groups
    if (Array.isArray(group_ids) && group_ids.length > 0) {
      const linkStmt = db.prepare('INSERT OR IGNORE INTO exam_group_relations (exam_id, group_id) VALUES (?, ?)');
      for (const gid of group_ids) {
        linkStmt.run(examId, Number(gid));
      }
    }

    return res.status(201).json({ message: 'Examination created successfully', id: examId });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create examination: ' + err.message });
  }
}

function updateExam(req, res) {
  try {
    const { id } = req.params;
    const { 
      code, subject_id, program, semester, duration_minutes, 
      required_room_type, fixed_date, fixed_start_time, fixed_room_id, group_ids, is_active 
    } = req.body;

    const existing = db.prepare('SELECT id FROM examinations WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Examination not found' });
    }

    db.prepare(`
      UPDATE examinations SET
        code = COALESCE(?, code),
        subject_id = COALESCE(?, subject_id),
        program = COALESCE(?, program),
        semester = COALESCE(?, semester),
        duration_minutes = COALESCE(?, duration_minutes),
        required_room_type = COALESCE(?, required_room_type),
        fixed_date = ?,
        fixed_start_time = ?,
        fixed_room_id = ?,
        is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(
      code ? code.trim().toUpperCase() : null,
      subject_id ? Number(subject_id) : null,
      program,
      semester ? Number(semester) : null,
      duration_minutes ? Number(duration_minutes) : null,
      required_room_type,
      fixed_date || null,
      fixed_start_time || null,
      fixed_room_id ? Number(fixed_room_id) : null,
      is_active !== undefined ? Number(is_active) : null,
      id
    );

    if (Array.isArray(group_ids)) {
      db.prepare('DELETE FROM exam_group_relations WHERE exam_id = ?').run(id);
      const linkStmt = db.prepare('INSERT INTO exam_group_relations (exam_id, group_id) VALUES (?, ?)');
      for (const gid of group_ids) {
        linkStmt.run(id, Number(gid));
      }
    }

    return res.json({ message: 'Examination updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update examination: ' + err.message });
  }
}

function deleteExam(req, res) {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id FROM examinations WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Examination not found' });
    }

    db.prepare('DELETE FROM examinations WHERE id = ?').run(id);
    return res.json({ message: 'Examination deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete examination: ' + err.message });
  }
}

function getAllSubjects(req, res) {
  try {
    const subjects = db.prepare('SELECT * FROM subjects ORDER BY code ASC').all();
    return res.json({ subjects });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch subjects: ' + err.message });
  }
}

module.exports = {
  getAllExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  getAllSubjects
};
