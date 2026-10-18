// server/src/controllers/history.controller.js
// Schedule Version History, Diff Comparisons, and System Audit Logs

const { db } = require('../database/db');

function getAllScheduleVersions(req, res) {
  try {
    const versions = db.prepare(`
      SELECT sv.*, u.full_name as created_by_name, u.email as created_by_email,
             es.name as session_name, es.session_code,
             (SELECT COUNT(*) FROM schedule_assignments WHERE schedule_version_id = sv.id) as assignments_count,
             (SELECT COUNT(*) FROM student_seat_assignments ssa 
              JOIN schedule_assignments sa ON ssa.schedule_assignment_id = sa.id 
              WHERE sa.schedule_version_id = sv.id) as total_seats_allocated
      FROM schedule_versions sv
      LEFT JOIN users u ON sv.created_by = u.id
      LEFT JOIN exam_sessions es ON sv.session_id = es.id
      ORDER BY sv.id DESC
    `).all();

    return res.json({ versions });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch schedule versions: ' + err.message });
  }
}

function getVersionDiff(req, res) {
  try {
    const { v1, v2 } = req.query;
    if (!v1 || !v2) {
      return res.status(400).json({ error: 'Two schedule version IDs (v1 and v2) are required for comparison' });
    }

    const version1 = db.prepare('SELECT * FROM schedule_versions WHERE id = ?').get(v1);
    const version2 = db.prepare('SELECT * FROM schedule_versions WHERE id = ?').get(v2);

    if (!version1 || !version2) {
      return res.status(404).json({ error: 'One or both schedule versions not found' });
    }

    const assignmentsV1 = db.prepare(`
      SELECT sa.*, e.code as exam_code, sub.name as subject_name, r.code as room_code
      FROM schedule_assignments sa
      JOIN examinations e ON sa.exam_id = e.id
      JOIN subjects sub ON e.subject_id = sub.id
      JOIN rooms r ON sa.room_id = r.id
      WHERE sa.schedule_version_id = ?
    `).all(v1);

    const assignmentsV2 = db.prepare(`
      SELECT sa.*, e.code as exam_code, sub.name as subject_name, r.code as room_code
      FROM schedule_assignments sa
      JOIN examinations e ON sa.exam_id = e.id
      JOIN subjects sub ON e.subject_id = sub.id
      JOIN rooms r ON sa.room_id = r.id
      WHERE sa.schedule_version_id = ?
    `).all(v2);

    const map1 = {};
    assignmentsV1.forEach(a => { map1[a.exam_id] = a; });

    const diffs = [];
    const allExamIds = new Set([...assignmentsV1.map(a => a.exam_id), ...assignmentsV2.map(a => a.exam_id)]);

    allExamIds.forEach(examId => {
      const a1 = map1[examId];
      const a2 = assignmentsV2.find(a => a.exam_id === examId);

      if (a1 && !a2) {
        diffs.push({
          examId,
          examCode: a1.exam_code,
          subjectName: a1.subject_name,
          status: 'removed_in_v2',
          v1: { date: a1.exam_date, time: `${a1.start_time}-${a1.end_time}`, room: a1.room_code },
          v2: null
        });
      } else if (!a1 && a2) {
        diffs.push({
          examId,
          examCode: a2.exam_code,
          subjectName: a2.subject_name,
          status: 'added_in_v2',
          v1: null,
          v2: { date: a2.exam_date, time: `${a2.start_time}-${a2.end_time}`, room: a2.room_code }
        });
      } else if (a1 && a2) {
        const dateChanged = a1.exam_date !== a2.exam_date;
        const timeChanged = a1.start_time !== a2.start_time || a1.end_time !== a2.end_time;
        const roomChanged = a1.room_id !== a2.room_id;

        if (dateChanged || timeChanged || roomChanged) {
          diffs.push({
            examId,
            examCode: a1.exam_code,
            subjectName: a1.subject_name,
            status: 'modified',
            dateChanged,
            timeChanged,
            roomChanged,
            v1: { date: a1.exam_date, time: `${a1.start_time}-${a1.end_time}`, room: a1.room_code },
            v2: { date: a2.exam_date, time: `${a2.start_time}-${a2.end_time}`, room: a2.room_code }
          });
        }
      }
    });

    return res.json({
      v1: version1,
      v2: version2,
      metricsDelta: {
        utilizationDelta: (version2.seating_utilization - version1.seating_utilization).toFixed(1),
        conflictsDelta: version2.hard_conflicts - version1.hard_conflicts,
        scheduledDelta: version2.scheduled_exams - version1.scheduled_exams,
        executionTimeDeltaMs: (version2.execution_time_ms - version1.execution_time_ms).toFixed(1)
      },
      totalChanges: diffs.length,
      diffs
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to compute version comparison: ' + err.message });
  }
}

function getAuditLogs(req, res) {
  try {
    const { action, entityType, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT al.*, u.full_name as user_name, u.email as user_email, u.role as user_role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
    `;
    const params = [];
    const conditions = [];

    if (action) {
      conditions.push('al.action = ?');
      params.push(action);
    }
    if (entityType) {
      conditions.push('al.entity_type = ?');
      params.push(entityType);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY al.id DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const logs = db.prepare(query).all(...params);

    const countQuery = `
      SELECT COUNT(*) as c FROM audit_logs
      ${conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''}
    `;
    const totalCount = db.prepare(countQuery).get(...(conditions.length > 0 ? params.slice(0, -2) : [])).c;

    return res.json({
      total: totalCount,
      limit: Number(limit),
      offset: Number(offset),
      logs
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch audit logs: ' + err.message });
  }
}

module.exports = {
  getAllScheduleVersions,
  getVersionDiff,
  getAuditLogs
};
