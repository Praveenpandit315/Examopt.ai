// server/src/services/scheduling/validator.js
// Independent Constraint Validator for ExamOpt AI (GLA HackVision 2.0)
// Validates all hard constraints and institutional rules on any candidate schedule

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function intervalsOverlap(startA, endA, startB, endB) {
  return timeToMinutes(startA) < timeToMinutes(endB) && timeToMinutes(startB) < timeToMinutes(endA);
}

/**
 * Validates a complete or partial list of schedule assignments against problem context.
 * 
 * @param {Array} assignments - Array of { exam_id, room_id, exam_date, start_time, end_time }
 * @param {Object} context - { examsMap, roomsMap, slotsList, unavailList, enrollmentsByExam, groupOverlaps, rulesMap }
 * @returns {Object} { isValid, hardConflicts, conflicts: Array }
 */
function validateSchedule(assignments, context) {
  const {
    unavailList = [],
    enrollmentsByExam = {},
    examGroupsMap = {},
    rulesMap = {}
  } = context;

  const examsMap = context.examsMap || {};
  if (!context.examsMap && Array.isArray(context.exams)) {
    for (const e of context.exams) examsMap[e.id] = e;
  }

  const roomsMap = context.roomsMap || {};
  if (!context.roomsMap && Array.isArray(context.rooms)) {
    for (const r of context.rooms) roomsMap[r.id] = r;
  }

  const conflicts = [];
  let conflictCounter = 1;

  const addConflict = (type, severity, affectedExamIds, roomId, groupId, reason, evidence, possibleSteps) => {
    const code = `C${String(conflictCounter++).padStart(2, '0')}`;
    conflicts.push({
      conflict_code: code,
      conflict_type: type,
      severity,
      affected_exam_ids: affectedExamIds,
      affected_room_id: roomId || null,
      affected_group_id: groupId || null,
      reason,
      evidence,
      possible_steps: possibleSteps
    });
  };

  // 1. Room Double-Booking & Overlapping Interval Constraint
  for (let i = 0; i < assignments.length; i++) {
    for (let j = i + 1; j < assignments.length; j++) {
      const a1 = assignments[i];
      const a2 = assignments[j];

      if (a1.room_id === a2.room_id && a1.exam_date === a2.exam_date) {
        if (intervalsOverlap(a1.start_time, a1.end_time, a2.start_time, a2.end_time)) {
          const ex1 = examsMap[a1.exam_id] || { code: `EX#${a1.exam_id}` };
          const ex2 = examsMap[a2.exam_id] || { code: `EX#${a2.exam_id}` };
          const rm = roomsMap[a1.room_id] || { code: `R#${a1.room_id}` };

          addConflict(
            'room_double_booked',
            'high',
            [a1.exam_id, a2.exam_id],
            a1.room_id,
            null,
            `Room collision: Room ${rm.code} assigned to multiple examinations simultaneously`,
            `Exams ${ex1.code} (${a1.start_time}-${a1.end_time}) and ${ex2.code} (${a2.start_time}-${a2.end_time}) are both assigned to Room ${rm.code} on ${a1.exam_date}.`,
            `Relocate one of the examinations to another compatible room or assign to a non-overlapping time slot.`
          );
        }
      }
    }
  }

  // 2. Student Clashes (Overlapping exams for shared students)
  for (let i = 0; i < assignments.length; i++) {
    for (let j = i + 1; j < assignments.length; j++) {
      const a1 = assignments[i];
      const a2 = assignments[j];

      if (a1.exam_date === a2.exam_date && intervalsOverlap(a1.start_time, a1.end_time, a2.start_time, a2.end_time)) {
        const ex1 = examsMap[a1.exam_id] || { code: `EX#${a1.exam_id}` };
        const ex2 = examsMap[a2.exam_id] || { code: `EX#${a2.exam_id}` };

        // Check explicit student enrollments
        const students1 = enrollmentsByExam[a1.exam_id] || new Set();
        const students2 = enrollmentsByExam[a2.exam_id] || new Set();

        const sharedStudents = [];
        for (const sid of students1) {
          if (students2.has(sid)) {
            sharedStudents.push(sid);
          }
        }

        // Check group overlaps
        const groups1 = examGroupsMap[a1.exam_id] || [];
        const groups2 = examGroupsMap[a2.exam_id] || [];
        const commonGroups = groups1.filter(g => groups2.includes(g));

        if (sharedStudents.length > 0 || commonGroups.length > 0) {
          addConflict(
            'shared_student',
            'high',
            [a1.exam_id, a2.exam_id],
            null,
            commonGroups[0] || null,
            `Student overlap: Students have simultaneous examinations`,
            `Exams ${ex1.code} and ${ex2.code} are scheduled simultaneously on ${a1.exam_date} (${a1.start_time}-${a1.end_time}). Shared cohorts: ${commonGroups.join(', ') || `${sharedStudents.length} enrolled students`}.`,
            `Move one examination to a disjoint time slot or another date to ensure clash-free student schedules.`
          );
        }
      }
    }
  }

  // 2B. External Student Commitments Clash Check (Cross-Department / Fixed Out-of-Scope)
  if (context.externalCommitments && context.externalCommitments.length > 0) {
    const extByStudent = {};
    for (const ext of context.externalCommitments) {
      if (!extByStudent[ext.student_id]) extByStudent[ext.student_id] = [];
      extByStudent[ext.student_id].push(ext);
    }

    for (const a of assignments) {
      const exam = examsMap[a.exam_id] || { code: `EX#${a.exam_id}` };
      const enrolledStudents = enrollmentsByExam[a.exam_id] || new Set();

      for (const sid of enrolledStudents) {
        const studentExts = extByStudent[sid] || [];
        for (const ext of studentExts) {
          if (a.exam_date === ext.date && intervalsOverlap(a.start_time, a.end_time, ext.start_time, ext.end_time)) {
            const studentInfo = (context.studentsMap && context.studentsMap[sid]) || { roll_number: `STU#${sid}`, full_name: 'Enrolled Student' };
            addConflict(
              'shared_student_external',
              'high',
              [a.exam_id],
              null,
              null,
              `Cross-department student clash: Student ${studentInfo.roll_number} has an existing commitment`,
              `Student ${studentInfo.roll_number} (${studentInfo.full_name}) is enrolled in ${exam.code} (${exam.subject_name || exam.subject_code}), scheduled on ${a.exam_date} (${a.start_time}-${a.end_time}). However, the student already has an existing exam commitment for ${ext.subject_code} (${ext.start_time}-${ext.end_time}) in another department or published schedule.`,
              `Reschedule ${exam.code} to a disjoint time slot or another date to eliminate this cross-department clash.`
            );
          }
        }
      }
    }
  }

  // 3. Individual Assignment Checks
  for (const a of assignments) {
    const exam = examsMap[a.exam_id];
    const room = roomsMap[a.room_id];

    if (!exam || !room) continue;

    // Check 3A: Room Capacity Exceeded
    const enrolledCount = exam.total_students || 0;
    if (enrolledCount > room.capacity) {
      addConflict(
        'capacity_exceeded',
        'high',
        [a.exam_id],
        a.room_id,
        null,
        `Seating capacity exceeded: Room ${room.code} is too small for ${exam.code}`,
        `Exam ${exam.code} has ${enrolledCount} enrolled students, but Room ${room.code} (${room.room_name}) has only ${room.capacity} effective seats.`,
        `Reallocate exam ${exam.code} to a larger venue such as Lecture Hall R101 (100 seats) or AUD-1 (180 seats).`
      );
    }

    // Check 3B: Room Type Compatibility (e.g. Lab Requirement)
    if (exam.required_room_type && exam.required_room_type !== 'classroom') {
      if (room.room_type !== exam.required_room_type) {
        addConflict(
          'wrong_room_type',
          'high',
          [a.exam_id],
          a.room_id,
          null,
          `Facility mismatch: ${exam.code} requires specialized facility '${exam.required_room_type}'`,
          `Exam ${exam.code} requires facility type '${exam.required_room_type}', but room ${room.code} is a standard '${room.room_type}'.`,
          `Assign to a valid ${exam.required_room_type} such as Lab L1 or L2.`
        );
      }
    }

    // Check 3C: Room Unavailability Blackout
    for (const unavail of unavailList) {
      if (unavail.room_id === a.room_id && unavail.date === a.exam_date) {
        if (intervalsOverlap(a.start_time, a.end_time, unavail.start_time, unavail.end_time)) {
          addConflict(
            'room_unavailable',
            'high',
            [a.exam_id],
            a.room_id,
            null,
            `Room unavailable: Room ${room.code} is under blackout on ${a.exam_date}`,
            `Room ${room.code} is blocked between ${unavail.start_time} and ${unavail.end_time} due to: '${unavail.reason}'.`,
            `Assign ${exam.code} to another room or move to a slot outside the blackout window.`
          );
        }
      }
    }

    // Check 3D: Fixed Exam Constraint Violation
    if (exam.fixed_date && exam.fixed_date !== a.exam_date) {
      addConflict(
        'fixed_exam_violation',
        'high',
        [a.exam_id],
        null,
        null,
        `Fixed date violated: Exam ${exam.code} must be on ${exam.fixed_date}`,
        `Exam is locked to date ${exam.fixed_date}, but was assigned to ${a.exam_date}.`,
        `Restore the required fixed examination date.`
      );
    }
    if (exam.fixed_start_time && exam.fixed_start_time !== a.start_time) {
      addConflict(
        'fixed_exam_violation',
        'high',
        [a.exam_id],
        null,
        null,
        `Fixed start time violated: Exam ${exam.code} must start at ${exam.fixed_start_time}`,
        `Exam is locked to start time ${exam.fixed_start_time}, but was assigned to ${a.start_time}.`,
        `Restore the required fixed examination time.`
      );
    }
    if (exam.fixed_room_id && exam.fixed_room_id !== a.room_id) {
      const fixedRoom = roomsMap[exam.fixed_room_id] || { code: `#${exam.fixed_room_id}` };
      addConflict(
        'fixed_exam_violation',
        'high',
        [a.exam_id],
        a.room_id,
        null,
        `Fixed room violated: Exam ${exam.code} must be in Room ${fixedRoom.code}`,
        `Exam is locked to Room ${fixedRoom.code}, but was assigned to Room ${room.code}.`,
        `Restore the locked room assignment.`
      );
    }

    // Check 3E: Exam Duration Exceeds Assigned Interval Window
    const assignedDuration = timeToMinutes(a.end_time) - timeToMinutes(a.start_time);
    if (exam.duration_minutes > assignedDuration) {
      addConflict(
        'duration_exceeded',
        'high',
        [a.exam_id],
        a.room_id,
        null,
        `Duration exceeds slot: ${exam.code} requires ${exam.duration_minutes}m, slot only allows ${assignedDuration}m`,
        `Exam ${exam.code} duration (${exam.duration_minutes} min) exceeds the allocated time window (${a.start_time} - ${a.end_time} = ${assignedDuration} min).`,
        `Allocate to a longer time slot.`
      );
    }
  }

  // 4. Institutional Policy: Max Exams per Student per Day (if active)
  const maxExamsRule = rulesMap['max_exams_per_day'];
  if (maxExamsRule && maxExamsRule.is_active && Number(maxExamsRule.rule_value) === 1) {
    const studentDayExams = {}; // studentId -> { date -> count }

    for (const a of assignments) {
      const students = enrollmentsByExam[a.exam_id] || new Set();
      for (const sid of students) {
        if (!studentDayExams[sid]) studentDayExams[sid] = {};
        if (!studentDayExams[sid][a.exam_date]) studentDayExams[sid][a.exam_date] = [];
        studentDayExams[sid][a.exam_date].push(a.exam_id);
      }
    }

    for (const [sid, dateMap] of Object.entries(studentDayExams)) {
      for (const [date, examIds] of Object.entries(dateMap)) {
        if (examIds.length > 1) {
          const exCodes = examIds.map(id => (examsMap[id] ? examsMap[id].code : id));
          addConflict(
            'max_exams_per_day',
            'medium',
            examIds,
            null,
            null,
            `Institutional policy breach: Student has ${examIds.length} exams on ${date}`,
            `Student #${sid} is scheduled for multiple exams (${exCodes.join(', ')}) on ${date}, violating the 1 exam/day institutional policy.`,
            `Shift one of the exams to another calendar day.`
          );
        }
      }
    }
  }

  const hardConflicts = conflicts.filter(c => c.severity === 'high').length;

  return {
    isValid: hardConflicts === 0,
    hardConflicts,
    totalConflicts: conflicts.length,
    conflicts
  };
}

module.exports = {
  validateSchedule,
  intervalsOverlap,
  timeToMinutes
};
