// server/src/controllers/admin.controller.js
const { db } = require('../database/db');

function getDashboardStats(req, res) {
  try {
    const totalExams = db.prepare('SELECT COUNT(*) as c FROM examinations WHERE is_active = 1').get().c;
    const totalSubjects = db.prepare('SELECT COUNT(*) as c FROM subjects').get().c;
    const totalGroups = db.prepare('SELECT COUNT(*) as c FROM student_groups').get().c;
    const totalRooms = db.prepare('SELECT COUNT(*) as c FROM rooms WHERE is_active = 1').get().c;
    
    const capacityRow = db.prepare('SELECT COALESCE(SUM(capacity), 0) as total_cap FROM rooms WHERE is_active = 1').get();
    const totalCapacity = capacityRow.total_cap;

    const totalSlots = db.prepare('SELECT COUNT(*) as c FROM exam_time_slots WHERE is_blocked = 0').get().c;

    // Get latest active schedule (published preferred, else draft)
    const latestSchedule = db.prepare(`
      SELECT * FROM schedule_versions 
      ORDER BY CASE WHEN status = 'published' THEN 1 WHEN status = 'approved' THEN 2 ELSE 3 END, id DESC 
      LIMIT 1
    `).get();

    let scheduledCount = 0;
    let unscheduledCount = totalExams;
    let hardConflictsCount = 0;
    let roomUtilization = 0;
    let usedCapacity = 0;

    if (latestSchedule) {
      scheduledCount = latestSchedule.scheduled_exams;
      unscheduledCount = latestSchedule.unscheduled_exams;
      hardConflictsCount = latestSchedule.hard_conflicts;
      roomUtilization = Math.round(latestSchedule.seating_utilization);
      usedCapacity = Math.round((roomUtilization / 100) * totalCapacity);
    }

    const draftSchedulesCount = db.prepare("SELECT COUNT(*) as c FROM schedule_versions WHERE status = 'draft'").get().c;
    const publishedSchedulesCount = db.prepare("SELECT COUNT(*) as c FROM schedule_versions WHERE status = 'published'").get().c;

    // Recent activity notifications
    const recentActivities = db.prepare(`
      SELECT id, title, message, type, created_at 
      FROM notifications 
      ORDER BY id DESC 
      LIMIT 6
    `).all();

    return res.json({
      stats: {
        totalExams,
        totalSubjects,
        totalGroups,
        totalRooms,
        totalCapacity,
        totalSlots,
        scheduledExams: scheduledCount,
        unscheduledExams: unscheduledCount,
        hardConflicts: hardConflictsCount,
        roomUtilization,
        usedCapacity,
        availableCapacity: Math.max(0, totalCapacity - usedCapacity),
        draftSchedulesCount,
        publishedSchedulesCount,
        latestSchedule: latestSchedule || null
      },
      recentActivities
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch dashboard stats: ' + err.message });
  }
}

function getDatabaseInspector(req, res) {
  try {
    const { dbPath } = require('../database/db');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
    
    const tableStats = tables.map(({ name }) => {
      const count = db.prepare(`SELECT COUNT(*) as c FROM ${name}`).get().c;
      return { name, count };
    });

    return res.json({
      dbPath,
      engine: 'Node.js v24 native node:sqlite (DatabaseSync)',
      journalMode: 'WAL',
      foreignKeys: 'ON',
      totalTables: tables.length,
      tables: tableStats
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to inspect database: ' + err.message });
  }
}

module.exports = {
  getDashboardStats,
  getDatabaseInspector
};
