// server/src/controllers/student.controller.js
const { db } = require('../database/db');

function getStudentTimetable(req, res) {
  try {
    const studentProfile = req.user.profile;
    if (!studentProfile) {
      return res.status(404).json({ error: 'Student profile not linked to this account' });
    }

    // 1. Fetch the active published schedule
    const publishedSchedule = db.prepare(`
      SELECT * FROM schedule_versions WHERE status = 'published' ORDER BY id DESC LIMIT 1
    `).get();

    if (!publishedSchedule) {
      return res.json({
        isPublished: false,
        message: 'Examination timetable is currently being prepared and has not yet been published by the administration.',
        timetable: []
      });
    }

    // 2. Fetch all exams the student is enrolled in (either via exam_enrollments or via student_groups)
    const exams = db.prepare(`
      SELECT DISTINCT e.id as exam_id, e.code as exam_code, e.duration_minutes,
             s.code as subject_code, s.name as subject_name,
             sa.exam_date, sa.start_time, sa.end_time,
             r.code as room_code, r.room_name, r.building, r.capacity as room_capacity
      FROM examinations e
      JOIN subjects s ON s.id = e.subject_id
      LEFT JOIN schedule_assignments sa ON sa.exam_id = e.id AND sa.schedule_version_id = ?
      LEFT JOIN rooms r ON r.id = sa.room_id
      WHERE e.id IN (
        SELECT exam_id FROM exam_enrollments WHERE student_id = ?
        UNION
        SELECT egr.exam_id FROM exam_group_relations egr
        JOIN group_memberships gm ON gm.group_id = egr.group_id
        WHERE gm.student_id = ?
        UNION
        SELECT e.id FROM examinations e
        JOIN student_course_enrollments sce ON sce.subject_id = e.subject_id
        WHERE sce.student_profile_id = ?
      )
      ORDER BY sa.exam_date ASC, sa.start_time ASC
    `).all(publishedSchedule.id, studentProfile.id, studentProfile.id, studentProfile.id);

    const formattedTimetable = exams.map(e => ({
      code: e.subject_code || e.exam_code,
      exam_code: e.exam_code,
      subject: e.subject_name,
      date: e.exam_date || 'Unassigned',
      time: e.start_time ? `${e.start_time} - ${e.end_time}` : 'Pending',
      duration: `${e.duration_minutes} min`,
      room: e.room_code || 'TBD',
      room_name: e.room_name || 'To Be Announced',
      building: e.building ? `${e.building} - ${e.room_name}` : 'Main Campus',
      status: e.exam_date ? 'Confirmed' : 'Drafting'
    }));

    return res.json({
      isPublished: true,
      scheduleVersion: publishedSchedule.version_code,
      publishedAt: publishedSchedule.published_at,
      student: {
        name: req.user.full_name,
        roll_number: studentProfile.roll_number,
        program: studentProfile.program,
        semester: studentProfile.semester,
        section: studentProfile.section
      },
      timetable: formattedTimetable,
      totalExams: formattedTimetable.length
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch student timetable: ' + err.message });
  }
}

function getStudentDashboard(req, res) {
  try {
    const studentProfile = req.user.profile;
    if (!studentProfile) {
      return res.status(404).json({ error: 'Student profile not linked to this account' });
    }

    // Get published schedule
    const publishedSchedule = db.prepare(`
      SELECT * FROM schedule_versions WHERE status = 'published' ORDER BY id DESC LIMIT 1
    `).get();

    let enrolledExamsCount = 0;
    let nextExam = null;
    let upcomingExams = [];

    if (publishedSchedule) {
      const exams = db.prepare(`
        SELECT DISTINCT e.id as exam_id, e.code as exam_code, e.duration_minutes,
               s.code as subject_code, s.name as subject_name,
               sa.exam_date, sa.start_time, sa.end_time,
               r.code as room_code, r.room_name, r.building
        FROM examinations e
        JOIN subjects s ON s.id = e.subject_id
        JOIN schedule_assignments sa ON sa.exam_id = e.id AND sa.schedule_version_id = ?
        JOIN rooms r ON r.id = sa.room_id
        WHERE e.id IN (
          SELECT exam_id FROM exam_enrollments WHERE student_id = ?
          UNION
          SELECT egr.exam_id FROM exam_group_relations egr
          JOIN group_memberships gm ON gm.group_id = egr.group_id
          WHERE gm.student_id = ?
          UNION
          SELECT e.id FROM examinations e
          JOIN student_course_enrollments sce ON sce.subject_id = e.subject_id
          WHERE sce.student_profile_id = ?
        )
        ORDER BY sa.exam_date ASC, sa.start_time ASC
      `).all(publishedSchedule.id, studentProfile.id, studentProfile.id, studentProfile.id);

      enrolledExamsCount = exams.length;
      if (exams.length > 0) {
        nextExam = {
          code: exams[0].subject_code,
          name: exams[0].subject_name,
          date: exams[0].exam_date,
          time: exams[0].start_time,
          venue: `Room ${exams[0].room_code} (${exams[0].building})`
        };
        upcomingExams = exams.slice(1, 4).map(e => ({
          code: e.subject_code,
          name: e.subject_name,
          date: e.exam_date,
          time: e.start_time
        }));
      }
    }

    // Student notifications
    const notifications = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? OR user_id IS NULL 
      ORDER BY id DESC LIMIT 5
    `).all(req.user.id);

    return res.json({
      student: {
        name: req.user.full_name,
        roll_number: studentProfile.roll_number,
        program: studentProfile.program,
        semester: studentProfile.semester,
        section: studentProfile.section
      },
      enrolledExamsCount,
      nextExam,
      upcomingExams,
      recentUpdates: notifications
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch student dashboard: ' + err.message });
  }
}

function getStudentNotifications(req, res) {
  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? OR user_id IS NULL 
      ORDER BY id DESC
    `).all(req.user.id);

    return res.json({ notifications });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch notifications: ' + err.message });
  }
}

module.exports = {
  getStudentTimetable,
  getStudentDashboard,
  getStudentNotifications
};
