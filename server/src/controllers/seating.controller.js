// server/src/controllers/seating.controller.js
// Seating Allocation Controller

const { db } = require('../database/db');
const { allocateSeatsForSchedule, getAssignmentSeating } = require('../services/scheduling/seatingAllocator');

function allocateScheduleSeats(req, res) {
  try {
    const { scheduleId } = req.params;
    const { strategy = 'sequential', reallocate = true } = req.body;

    const result = allocateSeatsForSchedule(Number(scheduleId), { strategy, reallocate });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to allocate seats: ' + err.message });
  }
}

function getScheduleSeatSummary(req, res) {
  try {
    const { scheduleId } = req.params;

    const schedule = db.prepare('SELECT id, version_code, name, status FROM schedule_versions WHERE id = ?').get(scheduleId);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule version not found' });
    }

    const assignments = db.prepare(`
      SELECT sa.id as assignment_id, sa.exam_id, sa.room_id, sa.exam_date, sa.start_time, sa.end_time,
             e.code as exam_code, sub.name as subject_name,
             r.code as room_code, r.room_name, r.capacity as room_capacity,
             (SELECT COUNT(*) FROM student_seat_assignments WHERE schedule_assignment_id = sa.id) as allocated_seats,
             (SELECT COUNT(*) FROM exam_enrollments WHERE exam_id = sa.exam_id) as enrolled_students
      FROM schedule_assignments sa
      JOIN examinations e ON sa.exam_id = e.id
      JOIN subjects sub ON e.subject_id = sub.id
      JOIN rooms r ON sa.room_id = r.id
      WHERE sa.schedule_version_id = ?
      ORDER BY sa.exam_date ASC, sa.start_time ASC, r.code ASC
    `).all(scheduleId);

    const totalSeatsAllocated = assignments.reduce((acc, a) => acc + a.allocated_seats, 0);

    return res.json({
      schedule,
      totalAssignments: assignments.length,
      totalSeatsAllocated,
      assignments
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch seating summary: ' + err.message });
  }
}

function getAssignmentDetails(req, res) {
  try {
    const { assignmentId } = req.params;
    const data = getAssignmentSeating(Number(assignmentId));
    if (!data) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch assignment seating: ' + err.message });
  }
}

function reassignSeat(req, res) {
  try {
    const { assignmentId, studentProfileId, newSeatId } = req.body;
    if (!assignmentId || !studentProfileId || !newSeatId) {
      return res.status(400).json({ error: 'assignmentId, studentProfileId, and newSeatId are required' });
    }

    const newSeat = db.prepare('SELECT * FROM room_seats WHERE id = ?').get(newSeatId);
    if (!newSeat) {
      return res.status(404).json({ error: 'Seat not found' });
    }

    // Check if new seat is already occupied in this assignment
    const existing = db.prepare(`
      SELECT * FROM student_seat_assignments 
      WHERE schedule_assignment_id = ? AND seat_id = ?
    `).get(assignmentId, newSeatId);

    if (existing && existing.student_profile_id !== studentProfileId) {
      return res.status(409).json({ error: 'Seat is already assigned to another student' });
    }

    db.prepare(`
      UPDATE student_seat_assignments
      SET seat_id = ?, seat_label = ?
      WHERE schedule_assignment_id = ? AND student_profile_id = ?
    `).run(newSeat.id, newSeat.seat_number, assignmentId, studentProfileId);

    return res.json({ message: `Seat reassigned to ${newSeat.seat_number} successfully` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to reassign seat: ' + err.message });
  }
}

function getStudentHallTicket(req, res) {
  try {
    const { studentProfileId } = req.params;
    
    // Get student info
    const student = db.prepare(`
      SELECT sp.*, u.full_name, u.email
      FROM student_profiles sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.id = ?
    `).get(studentProfileId);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get published schedule
    const publishedSchedule = db.prepare(`
      SELECT * FROM schedule_versions WHERE status = 'published' ORDER BY id DESC LIMIT 1
    `).get();

    if (!publishedSchedule) {
      return res.json({ student, tickets: [], message: 'No published schedule available yet' });
    }

    // Get all exam seat allocations for this student under the published schedule
    const tickets = db.prepare(`
      SELECT sa.id as assignment_id, sa.exam_date, sa.start_time, sa.end_time,
             e.code as exam_code, sub.code as subject_code, sub.name as subject_name,
             r.code as room_code, r.room_name, r.building,
             b.name as block_name, b.campus_zone,
             ssa.seat_label, ssa.assigned_at
      FROM schedule_assignments sa
      JOIN examinations e ON sa.exam_id = e.id
      JOIN subjects sub ON e.subject_id = sub.id
      JOIN rooms r ON sa.room_id = r.id
      LEFT JOIN university_blocks b ON r.block_id = b.id
      LEFT JOIN student_seat_assignments ssa ON (ssa.schedule_assignment_id = sa.id AND ssa.student_profile_id = ?)
      WHERE sa.schedule_version_id = ?
        AND (
          sa.exam_id IN (SELECT exam_id FROM exam_enrollments WHERE student_id = ?)
          OR sub.id IN (SELECT subject_id FROM student_course_enrollments WHERE student_profile_id = ?)
        )
      ORDER BY sa.exam_date ASC, sa.start_time ASC
    `).all(student.id, publishedSchedule.id, student.id, student.id);

    return res.json({
      student,
      schedule: publishedSchedule,
      tickets
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate student hall ticket: ' + err.message });
  }
}

module.exports = {
  allocateScheduleSeats,
  getScheduleSeatSummary,
  getAssignmentDetails,
  reassignSeat,
  getStudentHallTicket
};
