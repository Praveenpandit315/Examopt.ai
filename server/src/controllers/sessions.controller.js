// server/src/controllers/sessions.controller.js
// Exam Session Builder Controller: Scope preview, auto-population, and session management

const { db } = require('../database/db');
const { buildSchedulingContext } = require('./schedules.controller');
const { runSmartScheduler } = require('../services/scheduling/smartScheduler');
const { runFirstFitScheduler } = require('../services/scheduling/firstFitScheduler');

/**
 * Preview eligible examinations, students, rooms, and clash warnings for a selected scope.
 */
function previewSessionScope(req, res) {
  try {
    const { 
      academicTerm = '2026-Odd', 
      departments = '', 
      programs = '', 
      semesters = '',
      examType = 'End-Term'
    } = req.query;

    const deptList = departments ? departments.split(',').map(d => d.trim().toUpperCase()).filter(Boolean) : [];
    const progList = programs ? programs.split(',').map(p => p.trim().toUpperCase()).filter(Boolean) : [];
    const semList = semesters ? semesters.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n)) : [];

    // 1. Query Eligible Subjects & Papers
    let subjectsQuery = `
      SELECT s.*, d.code as dept_code, d.name as dept_name
      FROM subjects s
      LEFT JOIN departments d ON s.department_id = d.id
      WHERE 1=1
    `;
    const subParams = [];

    if (deptList.length > 0) {
      const placeholders = deptList.map(() => '?').join(',');
      subjectsQuery += ` AND (d.code IN (${placeholders}) OR UPPER(s.department) IN (${placeholders}))`;
      subParams.push(...deptList);
    }

    const matchedSubjects = db.prepare(subjectsQuery).all(...subParams);

    // Filter by program and semester if provided (either in subjects or examinations)
    const eligiblePapers = [];
    const affectedStudentIds = new Set();
    const warnings = [];

    for (const sub of matchedSubjects) {
      // Find existing examination or generate virtual paper record
      let exam = db.prepare('SELECT * FROM examinations WHERE subject_id = ? AND is_active = 1').get(sub.id);
      
      // Match semester
      const paperSem = exam ? exam.semester : 3;
      if (semList.length > 0 && !semList.includes(paperSem)) {
        continue;
      }

      // Match program
      const paperProg = exam ? (exam.program || '').toUpperCase() : '';
      if (progList.length > 0 && paperProg) {
        if (!progList.some(p => paperProg.includes(p))) {
          continue;
        }
      }

      // Find enrolled students in this paper
      const directEnrolls = db.prepare('SELECT student_id FROM exam_enrollments WHERE exam_id = ?').all(exam ? exam.id : -1);
      const courseEnrolls = db.prepare('SELECT student_profile_id FROM student_course_enrollments WHERE subject_id = ?').all(sub.id);

      const paperStudentIds = new Set();
      directEnrolls.forEach(r => paperStudentIds.add(r.student_id));
      courseEnrolls.forEach(r => paperStudentIds.add(r.student_profile_id));

      paperStudentIds.forEach(id => affectedStudentIds.add(id));

      const studentCount = paperStudentIds.size > 0 ? paperStudentIds.size : 45;

      eligiblePapers.push({
        id: exam ? exam.id : `virt_${sub.id}`,
        isExistingExam: !!exam,
        subjectId: sub.id,
        code: exam ? exam.code : `EX-${sub.code}`,
        subjectCode: sub.code,
        subjectName: sub.name,
        department: sub.dept_code || sub.department,
        program: exam ? exam.program : (progList[0] || 'Undergraduate'),
        semester: paperSem,
        durationMinutes: exam ? exam.duration_minutes : 120,
        requiredRoomType: (exam && exam.required_room_type) || sub.required_room_type || 'classroom',
        studentCount,
        isFixed: !!(exam && exam.fixed_date)
      });
    }

    // 2. Query Available Room Pool
    const rooms = db.prepare(`
      SELECT * FROM rooms WHERE is_active = 1 ORDER BY capacity DESC
    `).all();

    // Check capacity and lab coverage
    const maxClassSize = Math.max(...eligiblePapers.map(p => p.studentCount), 0);
    const labPapersCount = eligiblePapers.filter(p => p.requiredRoomType === 'computer_lab').length;
    const availableLabRooms = rooms.filter(r => r.room_type === 'computer_lab').length;

    if (labPapersCount > 0 && availableLabRooms === 0) {
      warnings.push(`Specialized venue alert: ${labPapersCount} examinations strictly require a computer lab, but no active computer labs are available.`);
    }

    const largestRoom = rooms.length > 0 ? Math.max(...rooms.map(r => r.capacity)) : 0;
    if (maxClassSize > largestRoom) {
      warnings.push(`Room capacity warning: Largest examination (${maxClassSize} students) exceeds maximum venue capacity (${largestRoom} seats).`);
    }

    return res.json({
      scope: {
        academicTerm,
        departments: deptList,
        programs: progList,
        semesters: semList,
        examType
      },
      totalEligibleExams: eligiblePapers.length,
      totalAffectedStudents: affectedStudentIds.size,
      eligiblePapers,
      roomPoolCount: rooms.length,
      availableRooms: rooms.map(r => ({
        id: r.id,
        code: r.code,
        name: r.room_name,
        type: r.room_type,
        capacity: r.capacity
      })),
      warnings
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to compute session scope preview: ' + err.message });
  }
}

/**
 * Creates and persists a new Exam Session.
 */
function createSession(req, res) {
  try {
    const {
      name,
      academicTerm,
      startDate,
      endDate,
      departments = [],
      programs = [],
      semesters = [],
      selectedPaperIds = []
    } = req.body;

    if (!name || !academicTerm || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required session parameters: name, academicTerm, startDate, endDate' });
    }

    const sessionCode = `SESS-${academicTerm.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const insertSession = db.prepare(`
      INSERT INTO exam_sessions (
        session_code, name, academic_term, start_date, end_date,
        departments_filter, programs_filter, semesters_filter, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'configured')
    `);

    const result = insertSession.run(
      sessionCode,
      name.trim(),
      academicTerm.trim(),
      startDate,
      endDate,
      JSON.stringify(departments),
      JSON.stringify(programs),
      JSON.stringify(semesters)
    );

    const sessionId = Number(result.lastInsertRowid);

    // Auto-populate / associate examination records with this session
    const updateExam = db.prepare('UPDATE examinations SET session_id = ? WHERE id = ?');
    const insertExam = db.prepare(`
      INSERT INTO examinations (
        code, subject_id, session_id, program, semester, duration_minutes, required_room_type, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);
    const insertEnroll = db.prepare(`
      INSERT OR IGNORE INTO exam_enrollments (exam_id, student_id) VALUES (?, ?)
    `);

    if (Array.isArray(selectedPaperIds) && selectedPaperIds.length > 0) {
      for (const eid of selectedPaperIds) {
        if (typeof eid === 'number') {
          updateExam.run(sessionId, eid);
        } else if (typeof eid === 'string' && eid.startsWith('virt_')) {
          const subId = Number(eid.replace('virt_', ''));
          const sub = db.prepare('SELECT * FROM subjects WHERE id = ?').get(subId);
          if (sub) {
            const existingExam = db.prepare('SELECT id FROM examinations WHERE subject_id = ? AND is_active = 1').get(sub.id);
            if (existingExam) {
              updateExam.run(sessionId, existingExam.id);
            } else {
              const resExam = insertExam.run(
                `EX-${sub.code}`,
                sub.id,
                sessionId,
                programs[0] || 'Undergraduate',
                semesters[0] || 3,
                120,
                sub.required_room_type || 'classroom'
              );
              const newExamId = Number(resExam.lastInsertRowid);
              const courseEnrolls = db.prepare('SELECT student_profile_id FROM student_course_enrollments WHERE subject_id = ?').all(sub.id);
              for (const ce of courseEnrolls) {
                insertEnroll.run(newExamId, ce.student_profile_id);
              }
            }
          }
        }
      }
    } else {
      let subQuery = `
        SELECT s.* FROM subjects s
        LEFT JOIN departments d ON s.department_id = d.id
        WHERE 1=1
      `;
      const params = [];
      if (departments.length > 0) {
        const ph = departments.map(() => '?').join(',');
        subQuery += ` AND (d.code IN (${ph}) OR UPPER(s.department) IN (${ph}))`;
        params.push(...departments.map(d => d.toUpperCase()));
      }
      const matchedSubs = db.prepare(subQuery).all(...params);
      for (const sub of matchedSubs) {
        const existingExam = db.prepare('SELECT id FROM examinations WHERE subject_id = ? AND is_active = 1').get(sub.id);
        if (existingExam) {
          updateExam.run(sessionId, existingExam.id);
        } else {
          const resExam = insertExam.run(
            `EX-${sub.code}`,
            sub.id,
            sessionId,
            programs[0] || 'Undergraduate',
            semesters[0] || 3,
            120,
            sub.required_room_type || 'classroom'
          );
          const newExamId = Number(resExam.lastInsertRowid);
          const courseEnrolls = db.prepare('SELECT student_profile_id FROM student_course_enrollments WHERE subject_id = ?').all(sub.id);
          for (const ce of courseEnrolls) {
            insertEnroll.run(newExamId, ce.student_profile_id);
          }
        }
      }
    }

    return res.status(201).json({
      message: 'Exam session configured successfully',
      sessionId,
      sessionCode
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create exam session: ' + err.message });
  }
}

/**
 * List all configured exam sessions.
 */
function getAllSessions(req, res) {
  try {
    const sessions = db.prepare(`
      SELECT es.*,
        (SELECT COUNT(*) FROM examinations e WHERE e.session_id = es.id) as linked_exams_count,
        sv.version_code as published_version_code,
        sv.seating_utilization,
        sv.status as schedule_status
      FROM exam_sessions es
      LEFT JOIN schedule_versions sv ON es.published_schedule_id = sv.id
      ORDER BY es.id DESC
    `).all();

    return res.json({ sessions, total: sessions.length });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch sessions: ' + err.message });
  }
}

/**
 * Generate a timetable specifically scoped to an exam session.
 */
function generateSessionTimetable(req, res) {
  try {
    const sessionId = Number(req.params.id);
    const { strategy = 'smart_backtracking' } = req.body;
    const session = db.prepare('SELECT * FROM exam_sessions WHERE id = ?').get(sessionId);

    if (!session) {
      return res.status(404).json({ error: `Exam session #${sessionId} not found` });
    }

    // Build context filtered by session
    const context = buildSchedulingContext({ sessionId });

    // If no examinations explicitly linked, fallback to department/program filter
    if (context.exams.length === 0) {
      const depts = JSON.parse(session.departments_filter || '[]');
      const progs = JSON.parse(session.programs_filter || '[]');
      const sems = JSON.parse(session.semesters_filter || '[]');

      // Retrieve all exams matching filters
      const allActive = db.prepare(`
        SELECT e.id FROM examinations e
        JOIN subjects s ON e.subject_id = s.id
        LEFT JOIN departments d ON s.department_id = d.id
        WHERE e.is_active = 1
      `).all();

      // Fallback to scheduling all active exams for the session
      const fallbackContext = buildSchedulingContext();
      context.exams = fallbackContext.exams;
      context.enrollmentsByExam = fallbackContext.enrollmentsByExam;
    }

    let result;
    if (strategy === 'first_fit') {
      result = runFirstFitScheduler(context);
    } else {
      result = runSmartScheduler(context);
    }

    // Create schedule version linked to this session
    const versionCount = db.prepare('SELECT COUNT(*) as c FROM schedule_versions').get().c;
    const versionCode = `TT-${session.session_code}-V${versionCount + 1}.0`;
    const versionName = `${session.name} — ${strategy === 'first_fit' ? 'Baseline' : 'Optimized'}`;

    const insertVer = db.prepare(`
      INSERT INTO schedule_versions (
        version_code, name, strategy, status, session_id,
        total_exams, scheduled_exams, unscheduled_exams,
        hard_conflicts, seating_utilization, execution_time_ms, created_by
      ) VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      versionCode,
      versionName,
      strategy,
      sessionId,
      result.totalExams,
      result.scheduledExams,
      result.unscheduledExams,
      result.hardConflicts,
      result.seatingUtilization,
      result.executionTimeMs,
      (req.user && db.prepare('SELECT id FROM users WHERE id = ?').get(req.user.id)?.id) ||
      db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get()?.id || 1
    );

    const versionId = Number(insertVer.lastInsertRowid);

    // Save assignments
    const insertAssign = db.prepare(`
      INSERT INTO schedule_assignments (schedule_version_id, exam_id, room_id, exam_date, start_time, end_time, is_valid)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const a of result.assignments) {
      insertAssign.run(versionId, a.exam_id, a.room_id, a.exam_date, a.start_time, a.end_time, a.is_valid !== false ? 1 : 0);
    }

    // Update session status
    db.prepare("UPDATE exam_sessions SET status = 'scheduled' WHERE id = ?").run(sessionId);

    return res.status(201).json({
      message: 'Session timetable generated successfully',
      sessionId,
      scheduleVersionId: versionId,
      versionCode,
      strategy,
      scheduled: result.scheduledExams,
      totalExams: result.totalExams,
      conflicts: result.hardConflicts,
      utilization: result.seatingUtilization,
      executionTime: `${result.executionTimeMs}ms`
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate session timetable: ' + err.message });
  }
}

module.exports = {
  previewSessionScope,
  createSession,
  getAllSessions,
  generateSessionTimetable
};
