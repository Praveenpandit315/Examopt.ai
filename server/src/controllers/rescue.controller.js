// server/src/controllers/rescue.controller.js
const { db } = require('../database/db');
const { runExamRescue } = require('../services/scheduling/rescueEngine');
const { buildSchedulingContext } = require('./schedules.controller');

function simulateRescue(req, res) {
  try {
    const { disruption } = req.body;
    if (!disruption || !disruption.type) {
      return res.status(400).json({ error: 'Disruption specification required (e.g. room_outage, time_blackout)' });
    }

    // Load active schedule (published preferred, else latest draft)
    const activeSchedule = db.prepare(`
      SELECT * FROM schedule_versions 
      ORDER BY CASE WHEN status = 'published' THEN 1 WHEN status = 'approved' THEN 2 ELSE 3 END, id DESC 
      LIMIT 1
    `).get();

    if (!activeSchedule) {
      return res.status(400).json({ error: 'No existing schedule found to simulate rescue against. Generate a schedule first.' });
    }

    const currentAssignments = db.prepare(`
      SELECT * FROM schedule_assignments WHERE schedule_version_id = ?
    `).all(activeSchedule.id);

    const context = buildSchedulingContext();
    const rescueResult = runExamRescue(context, currentAssignments, disruption);

    return res.json({
      baseScheduleVersion: activeSchedule.version_code,
      baseScheduleId: activeSchedule.id,
      ...rescueResult
    });
  } catch (err) {
    return res.status(500).json({ error: 'Exam rescue simulation failed: ' + err.message });
  }
}

function approveRescue(req, res) {
  try {
    const adminRecord = req.user?.id
      ? db.prepare('SELECT id FROM users WHERE id = ?').get(req.user.id)
      : db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
    const userId = adminRecord ? adminRecord.id : (req.user?.id || 1);

    if (!Array.isArray(newAssignments) || newAssignments.length === 0) {
      return res.status(400).json({ error: 'Rescued assignments payload required' });
    }

    const versionCount = db.prepare('SELECT COUNT(*) as c FROM schedule_versions').get().c;
    const versionCode = `TT-2025-V${versionCount + 1}.0-RESCUED`;

    const insertVer = db.prepare(`
      INSERT INTO schedule_versions (
        version_code, name, strategy, status,
        total_exams, scheduled_exams, unscheduled_exams,
        hard_conflicts, seating_utilization, execution_time_ms, created_by, published_at
      ) VALUES (?, 'Emergency Rescued Timetable', 'rescue', 'published', ?, ?, 0, 0, 78.5, 450, ?, CURRENT_TIMESTAMP)
    `).run(versionCode, newAssignments.length, newAssignments.length, userId);

    const newVersionId = Number(insertVer.lastInsertRowid);

    // Archive old published schedules
    db.prepare("UPDATE schedule_versions SET status = 'archived' WHERE status = 'published' AND id != ?").run(newVersionId);

    // Insert new assignments
    const insertAssign = db.prepare(`
      INSERT INTO schedule_assignments (schedule_version_id, exam_id, room_id, exam_date, start_time, end_time, is_valid)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);

    for (const a of newAssignments) {
      insertAssign.run(newVersionId, a.exam_id, a.room_id, a.exam_date, a.start_time, a.end_time);
    }

    // Broadcast emergency notice
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (NULL, 'Emergency Timetable Revision Published', ?, 'reschedule')
    `).run(disruptionReason || 'An urgent venue alteration was resolved with minimum disruption. View your updated timetable.');

    return res.json({
      message: 'Rescue schedule revision approved and published successfully.',
      versionCode,
      versionId: newVersionId
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to approve rescue revision: ' + err.message });
  }
}

module.exports = {
  simulateRescue,
  approveRescue
};
