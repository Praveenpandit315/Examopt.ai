// server/src/controllers/groups.controller.js
const { db } = require('../database/db');

function getAllGroups(req, res) {
  try {
    const groups = db.prepare(`
      SELECT sg.*,
        (SELECT COUNT(*) FROM group_memberships gm WHERE gm.group_id = sg.id) as explicit_student_count,
        (SELECT COUNT(*) FROM exam_group_relations egr WHERE egr.group_id = sg.id) as linked_exams_count
      FROM student_groups sg
      ORDER BY sg.semester ASC, sg.section ASC
    `).all();

    return res.json({ groups, total: groups.length });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch student groups: ' + err.message });
  }
}

function createGroup(req, res) {
  try {
    const { code, name, program, semester, section, student_count } = req.body;
    if (!code || !name || !program || !semester || !section) {
      return res.status(400).json({ error: 'Missing required group fields: code, name, program, semester, section' });
    }

    const existing = db.prepare('SELECT id FROM student_groups WHERE code = ?').get(code.trim().toUpperCase());
    if (existing) {
      return res.status(400).json({ error: `Group code '${code}' already exists` });
    }

    const result = db.prepare(`
      INSERT INTO student_groups (code, name, program, semester, section, student_count)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      code.trim().toUpperCase(),
      name.trim(),
      program.trim(),
      Number(semester),
      section.trim().toUpperCase(),
      Number(student_count) || 40
    );

    return res.status(201).json({ message: 'Student group created', id: Number(result.lastInsertRowid) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create student group: ' + err.message });
  }
}

function updateGroup(req, res) {
  try {
    const { id } = req.params;
    const { code, name, program, semester, section, student_count } = req.body;

    const existing = db.prepare('SELECT id FROM student_groups WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Student group not found' });
    }

    db.prepare(`
      UPDATE student_groups SET
        code = COALESCE(?, code),
        name = COALESCE(?, name),
        program = COALESCE(?, program),
        semester = COALESCE(?, semester),
        section = COALESCE(?, section),
        student_count = COALESCE(?, student_count)
      WHERE id = ?
    `).run(
      code ? code.trim().toUpperCase() : null,
      name ? name.trim() : null,
      program ? program.trim() : null,
      semester ? Number(semester) : null,
      section ? section.trim().toUpperCase() : null,
      student_count !== undefined ? Number(student_count) : null,
      id
    );

    return res.json({ message: 'Student group updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update student group: ' + err.message });
  }
}

function deleteGroup(req, res) {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id FROM student_groups WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Student group not found' });
    }

    db.prepare('DELETE FROM student_groups WHERE id = ?').run(id);
    return res.json({ message: 'Student group deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete student group: ' + err.message });
  }
}

// Group overlap matrix to detect groups sharing common students
function getGroupOverlaps(req, res) {
  try {
    const groups = db.prepare('SELECT id, code, name FROM student_groups ORDER BY id ASC').all();
    const overlaps = [];

    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        const g1 = groups[i];
        const g2 = groups[j];

        // Check if individual students are in both groups
        const shared = db.prepare(`
          SELECT COUNT(gm1.student_id) as shared_count
          FROM group_memberships gm1
          JOIN group_memberships gm2 ON gm2.student_id = gm1.student_id
          WHERE gm1.group_id = ? AND gm2.group_id = ?
        `).get(g1.id, g2.id);

        if (shared && shared.shared_count > 0) {
          overlaps.push({
            group_1_id: g1.id,
            group_1_code: g1.code,
            group_2_id: g2.id,
            group_2_code: g2.code,
            shared_students: shared.shared_count
          });
        }
      }
    }

    return res.json({ groups, overlaps });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to compute group overlaps: ' + err.message });
  }
}

module.exports = {
  getAllGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupOverlaps
};
