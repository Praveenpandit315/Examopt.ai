// server/src/services/scheduling/firstFitScheduler.js
// Deterministic First-Fit Baseline Scheduler for ExamOpt AI (GLA HackVision 2.0)

const { validateSchedule, intervalsOverlap, timeToMinutes } = require('./validator');

function runFirstFitScheduler(context) {
  const startTime = Date.now();
  const { exams, rooms, slots, unavailList, enrollmentsByExam, examGroupsMap, rulesMap } = context;

  // Prepare lookups
  const examsMap = {};
  for (const e of exams) examsMap[e.id] = e;

  const roomsMap = {};
  for (const r of rooms) roomsMap[r.id] = r;

  // Order exams deterministically by code
  const sortedExams = [...exams].sort((a, b) => a.code.localeCompare(b.code));

  // Filter available slots
  const validSlots = slots.filter(s => !s.is_blocked);

  const assignments = [];
  const unscheduled = [];

  // Helper to test if a candidate assignment is feasible against currently placed assignments
  function isCandidateFeasible(exam, slot, room) {
    // 1. Duration check
    const slotDuration = timeToMinutes(slot.end_time) - timeToMinutes(slot.start_time);
    if (exam.duration_minutes > slotDuration) return false;

    // 2. Capacity check
    if ((exam.total_students || 0) > room.capacity) return false;

    // 3. Room type check
    if (exam.required_room_type && exam.required_room_type !== 'classroom') {
      if (room.room_type !== exam.required_room_type) return false;
    }

    // 4. Fixed exam constraint check
    if (exam.fixed_date && exam.fixed_date !== slot.date) return false;
    if (exam.fixed_start_time && exam.fixed_start_time !== slot.start_time) return false;
    if (exam.fixed_room_id && exam.fixed_room_id !== room.id) return false;

    // 5. Room unavailability check
    for (const u of unavailList) {
      if (u.room_id === room.id && u.date === slot.date) {
        if (intervalsOverlap(slot.start_time, slot.end_time, u.start_time, u.end_time)) {
          return false;
        }
      }
    }

    // 6. Overlap against already placed assignments
    for (const placed of assignments) {
      if (placed.exam_date === slot.date) {
        if (intervalsOverlap(placed.start_time, placed.end_time, slot.start_time, slot.end_time)) {
          // Room collision
          if (placed.room_id === room.id) return false;

          // Student clash check (enrolled students)
          const currStudents = enrollmentsByExam[exam.id] || new Set();
          const placedStudents = enrollmentsByExam[placed.exam_id] || new Set();
          for (const sid of currStudents) {
            if (placedStudents.has(sid)) return false;
          }

          // Student clash check (groups)
          const currGroups = examGroupsMap[exam.id] || [];
          const placedGroups = examGroupsMap[placed.exam_id] || [];
          for (const gid of currGroups) {
            if (placedGroups.includes(gid)) return false;
          }
        }
      }
    }

    // 7. Check external student commitments (cross-department / cross-session)
    if (context.externalCommitments && context.externalCommitments.length > 0) {
      const currStudents = enrollmentsByExam[exam.id] || new Set();
      for (const ext of context.externalCommitments) {
        if (currStudents.has(ext.student_id) && ext.date === slot.date) {
          if (intervalsOverlap(slot.start_time, slot.end_time, ext.start_time, ext.end_time)) {
            return false;
          }
        }
      }
    }

    return true;
  }

  // First-Fit placement loop
  for (const exam of sortedExams) {
    let placed = false;

    // If exam is fixed, try its exact fixed slot and room first
    if (exam.fixed_date && exam.fixed_start_time) {
      const fixedSlot = validSlots.find(s => s.date === exam.fixed_date && s.start_time === exam.fixed_start_time);
      const fixedRoom = exam.fixed_room_id ? roomsMap[exam.fixed_room_id] : null;

      if (fixedSlot && fixedRoom) {
        if (isCandidateFeasible(exam, fixedSlot, fixedRoom)) {
          assignments.push({
            exam_id: exam.id,
            room_id: fixedRoom.id,
            exam_date: fixedSlot.date,
            start_time: fixedSlot.start_time,
            end_time: fixedSlot.end_time,
            is_valid: 1
          });
          placed = true;
          continue;
        }
      }
    }

    // Try all candidate slots and rooms in order
    for (const slot of validSlots) {
      if (placed) break;
      for (const room of rooms) {
        if (isCandidateFeasible(exam, slot, room)) {
          assignments.push({
            exam_id: exam.id,
            room_id: room.id,
            exam_date: slot.date,
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_valid: 1
          });
          placed = true;
          break;
        }
      }
    }

    if (!placed) {
      unscheduled.push({
        exam_id: exam.id,
        code: exam.code,
        reason: 'No feasible candidate room and slot without violating constraints in First-Fit traversal'
      });
    }
  }

  // Run independent validation
  const validation = validateSchedule(assignments, {
    examsMap,
    roomsMap,
    unavailList,
    enrollmentsByExam,
    examGroupsMap,
    rulesMap
  });

  // Calculate metrics
  let totalOccupiedSeats = 0;
  let totalAllocatedCapacity = 0;
  const uniqueDates = new Set();
  const usedRoomSlots = new Set();

  for (const a of assignments) {
    const ex = examsMap[a.exam_id];
    const rm = roomsMap[a.room_id];
    if (ex && rm) {
      totalOccupiedSeats += (ex.total_students || 0);
      totalAllocatedCapacity += rm.capacity;
      uniqueDates.add(a.exam_date);
      usedRoomSlots.add(`${a.exam_date}_${a.start_time}_${a.room_id}`);
    }
  }

  const seatingUtilization = totalAllocatedCapacity > 0
    ? (totalOccupiedSeats / totalAllocatedCapacity) * 100
    : 0;

  const executionTimeMs = Date.now() - startTime;

  return {
    strategy: 'first_fit',
    totalExams: exams.length,
    scheduledExams: assignments.length,
    unscheduledExams: unscheduled.length,
    unscheduledList: unscheduled,
    assignments,
    hardConflicts: validation.hardConflicts,
    conflicts: validation.conflicts,
    seatingUtilization: Number(seatingUtilization.toFixed(1)),
    slotsUsed: usedRoomSlots.size,
    spanDays: uniqueDates.size,
    executionTimeMs
  };
}

module.exports = {
  runFirstFitScheduler
};
