// server/src/services/scheduling/seatingAllocator.js
// Post-Scheduling Deterministic Physical Seat Allocator

const { db } = require('../../database/db');

/**
 * Allocates physical room seats to enrolled students for all assignments in a schedule version.
 * @param {number} scheduleVersionId 
 * @param {object} options { strategy: 'sequential' | 'alternate', reallocate: boolean }
 * @returns {object} Allocation metrics, assignments count, and room breakdown
 */
function allocateSeatsForSchedule(scheduleVersionId, options = {}) {
  const { strategy = 'sequential', reallocate = true } = options;

  const schedule = db.prepare('SELECT * FROM schedule_versions WHERE id = ?').get(scheduleVersionId);
  if (!schedule) {
    throw new Error(`Schedule version #${scheduleVersionId} not found.`);
  }

  // Get all assignments for this schedule version
  const assignments = db.prepare(`
    SELECT sa.id as assignment_id, sa.exam_id, sa.room_id, sa.exam_date, sa.start_time, sa.end_time,
           e.code as exam_code, e.subject_id, sub.code as subject_code, sub.name as subject_name,
           r.code as room_code, r.room_name, r.capacity as room_capacity
    FROM schedule_assignments sa
    JOIN examinations e ON sa.exam_id = e.id
    JOIN subjects sub ON e.subject_id = sub.id
    JOIN rooms r ON sa.room_id = r.id
    WHERE sa.schedule_version_id = ?
    ORDER BY sa.exam_date ASC, sa.start_time ASC, r.code ASC
  `).all(scheduleVersionId);

  if (assignments.length === 0) {
    return {
      success: true,
      scheduleVersionId,
      totalAssignments: 0,
      totalSeatsAllocated: 0,
      warnings: ['No schedule assignments found for this schedule version.']
    };
  }

  let totalAllocated = 0;
  let totalEnrolled = 0;
  const warnings = [];
  const roomReports = [];

  // Begin transaction
  db.exec('BEGIN TRANSACTION;');

  try {
    for (const assignment of assignments) {
      if (reallocate) {
        db.prepare('DELETE FROM student_seat_assignments WHERE schedule_assignment_id = ?')
          .run(assignment.assignment_id);
      }

      // 1. Fetch enrolled students for this exam
      let students = db.prepare(`
        SELECT sp.id as student_profile_id, sp.roll_number, u.full_name, sp.program, sp.section
        FROM exam_enrollments ee
        JOIN student_profiles sp ON ee.student_id = sp.id
        JOIN users u ON sp.user_id = u.id
        WHERE ee.exam_id = ?
        ORDER BY sp.roll_number ASC
      `).all(assignment.exam_id);

      // Fallback: If exam_enrollments is empty, inspect student_course_enrollments via subject_id
      if (students.length === 0 && assignment.subject_id) {
        students = db.prepare(`
          SELECT sp.id as student_profile_id, sp.roll_number, u.full_name, sp.program, sp.section
          FROM student_course_enrollments sce
          JOIN student_profiles sp ON sce.student_profile_id = sp.id
          JOIN users u ON sp.user_id = u.id
          WHERE sce.subject_id = ?
          ORDER BY sp.roll_number ASC
        `).all(assignment.subject_id);
      }

      totalEnrolled += students.length;

      // 2. Fetch functional physical seats in room
      let seats = db.prepare(`
        SELECT id, room_id, seat_number, row_label, column_index
        FROM room_seats
        WHERE room_id = ? AND is_functional = 1
        ORDER BY row_label ASC, column_index ASC
      `).all(assignment.room_id);

      // If no room seats exist in database yet for this room, automatically synthesize physical seats up to room capacity
      if (seats.length === 0 && assignment.room_capacity > 0) {
        const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        const perRow = 10;
        const insertSeat = db.prepare(`
          INSERT OR IGNORE INTO room_seats (room_id, seat_number, row_label, column_index, is_functional)
          VALUES (?, ?, ?, ?, 1)
        `);
        for (let i = 0; i < assignment.room_capacity; i++) {
          const rIdx = Math.floor(i / perRow);
          const rowLabel = rows[rIdx] || `R${rIdx + 1}`;
          const colIdx = (i % perRow) + 1;
          const seatNum = `${assignment.room_code}-${rowLabel}${colIdx < 10 ? '0' + colIdx : colIdx}`;
          insertSeat.run(assignment.room_id, seatNum, rowLabel, colIdx);
        }
        seats = db.prepare(`
          SELECT id, room_id, seat_number, row_label, column_index
          FROM room_seats
          WHERE room_id = ? AND is_functional = 1
          ORDER BY row_label ASC, column_index ASC
        `).all(assignment.room_id);
      }

      // Check capacity warning
      if (students.length > seats.length) {
        warnings.push(
          `Room ${assignment.room_code} has ${seats.length} seats, but ${students.length} students are enrolled for ${assignment.exam_code} (${students.length - seats.length} unseated).`
        );
      }

      // 3. Deterministic assignment
      const insertAssignment = db.prepare(`
        INSERT OR REPLACE INTO student_seat_assignments (
          schedule_assignment_id, student_profile_id, seat_id, seat_label
        ) VALUES (?, ?, ?, ?)
      `);

      let assignedInThisExam = 0;
      const countToAssign = Math.min(students.length, seats.length);

      for (let i = 0; i < countToAssign; i++) {
        const student = students[i];
        let seatIndex = i;

        // Alternate spacing strategy (checkerboard spacing if capacity permits)
        if (strategy === 'alternate' && seats.length >= students.length * 2) {
          seatIndex = i * 2;
        }

        const seat = seats[seatIndex] || seats[i];
        insertAssignment.run(
          assignment.assignment_id,
          student.student_profile_id,
          seat.id,
          seat.seat_number
        );
        assignedInThisExam++;
      }

      totalAllocated += assignedInThisExam;

      roomReports.push({
        assignmentId: assignment.assignment_id,
        examCode: assignment.exam_code,
        subjectName: assignment.subject_name,
        roomCode: assignment.room_code,
        date: assignment.exam_date,
        time: `${assignment.start_time} - ${assignment.end_time}`,
        enrolledCount: students.length,
        availableSeats: seats.length,
        allocatedCount: assignedInThisExam
      });
    }

    // Record audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details_json)
      VALUES (NULL, 'SEAT_ALLOCATION', 'schedule_versions', ?, ?)
    `).run(
      String(scheduleVersionId),
      JSON.stringify({
        totalAllocated,
        totalEnrolled,
        warningsCount: warnings.length,
        strategy
      })
    );

    // Create system notification
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (NULL, ?, ?, 'info')
    `).run(
      `Seat Allocation Complete: ${schedule.version_code}`,
      `Successfully allocated ${totalAllocated} desk seats across ${assignments.length} examination sessions.`
    );

    db.exec('COMMIT;');

    return {
      success: true,
      scheduleVersionId,
      versionCode: schedule.version_code,
      totalAssignments: assignments.length,
      totalEnrolled,
      totalSeatsAllocated: totalAllocated,
      warnings,
      roomReports
    };
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

/**
 * Retrieves seating map for a given schedule assignment or room
 */
function getAssignmentSeating(scheduleAssignmentId) {
  const assignment = db.prepare(`
    SELECT sa.*, e.code as exam_code, sub.name as subject_name, r.code as room_code, r.room_name, r.capacity
    FROM schedule_assignments sa
    JOIN examinations e ON sa.exam_id = e.id
    JOIN subjects sub ON e.subject_id = sub.id
    JOIN rooms r ON sa.room_id = r.id
    WHERE sa.id = ?
  `).get(scheduleAssignmentId);

  if (!assignment) {
    return null;
  }

  // All room seats
  const seats = db.prepare(`
    SELECT * FROM room_seats WHERE room_id = ? ORDER BY row_label ASC, column_index ASC
  `).all(assignment.room_id);

  // Student allocations
  const allocations = db.prepare(`
    SELECT ssa.*, sp.roll_number, u.full_name, sp.program, sp.section
    FROM student_seat_assignments ssa
    JOIN student_profiles sp ON ssa.student_profile_id = sp.id
    JOIN users u ON sp.user_id = u.id
    WHERE ssa.schedule_assignment_id = ?
  `).all(scheduleAssignmentId);

  const seatMap = {};
  allocations.forEach(alloc => {
    seatMap[alloc.seat_id] = alloc;
  });

  const fullGrid = seats.map(s => ({
    ...s,
    allocation: seatMap[s.id] || null,
    isOccupied: Boolean(seatMap[s.id])
  }));

  return {
    assignment,
    totalSeats: seats.length,
    occupiedSeats: allocations.length,
    seats: fullGrid
  };
}

module.exports = {
  allocateSeatsForSchedule,
  getAssignmentSeating
};
