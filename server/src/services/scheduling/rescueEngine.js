// server/src/services/scheduling/rescueEngine.js
// Exam Rescue Engine for ExamOpt AI (GLA HackVision 2.0)
// Minimum-Disruption Rescheduling under live campus disruptions

const { validateSchedule, intervalsOverlap, timeToMinutes } = require('./validator');

function runExamRescue(context, currentAssignments, disruption) {
  const { exams, rooms, slots, unavailList, enrollmentsByExam, examGroupsMap, rulesMap } = context;

  const examsMap = {};
  for (const e of exams) examsMap[e.id] = e;

  const roomsMap = {};
  for (const r of rooms) roomsMap[r.id] = r;

  const validSlots = slots.filter(s => !s.is_blocked);

  // 1. Identify which existing assignments are impacted by the disruption
  const affectedAssignments = [];
  const frozenAssignments = [];

  for (const a of currentAssignments) {
    let isImpacted = false;

    if (disruption.type === 'room_outage') {
      const targetRoomId = Number(disruption.room_id);
      if (a.room_id === targetRoomId && a.exam_date === disruption.date) {
        if (!disruption.start_time || intervalsOverlap(a.start_time, a.end_time, disruption.start_time, disruption.end_time)) {
          isImpacted = true;
        }
      }
    } else if (disruption.type === 'time_blackout') {
      if (a.exam_date === disruption.date) {
        if (intervalsOverlap(a.start_time, a.end_time, disruption.start_time, disruption.end_time)) {
          isImpacted = true;
        }
      }
    }

    if (isImpacted) {
      affectedAssignments.push(a);
    } else {
      frozenAssignments.push({ ...a });
    }
  }

  // 2. Updated unavail list including the new disruption
  const activeUnavail = [...unavailList];
  if (disruption.type === 'room_outage') {
    activeUnavail.push({
      room_id: Number(disruption.room_id),
      date: disruption.date,
      start_time: disruption.start_time || '00:00',
      end_time: disruption.end_time || '23:59',
      reason: disruption.reason || 'Emergency Outage'
    });
  }

  // 3. Reschedule ONLY the affected exams without altering frozen assignments
  const newAssignments = [...frozenAssignments];
  const changes = [];
  const unresolvedExams = [];

  function isFeasibleForRescue(exam, slot, room, placedAssignments) {
    // Duration check
    const slotDuration = timeToMinutes(slot.end_time) - timeToMinutes(slot.start_time);
    if (exam.duration_minutes > slotDuration) return false;

    // Capacity check
    if ((exam.total_students || 0) > room.capacity) return false;

    // Room type check
    if (exam.required_room_type && exam.required_room_type !== 'classroom') {
      if (room.room_type !== exam.required_room_type) return false;
    }

    // Room unavailability check
    for (const u of activeUnavail) {
      if (u.room_id === room.id && u.date === slot.date) {
        if (intervalsOverlap(slot.start_time, slot.end_time, u.start_time, u.end_time)) {
          return false;
        }
      }
    }

    // Check collision with ALL placed assignments (frozen + previously rescued)
    for (const placed of placedAssignments) {
      if (placed.exam_date === slot.date) {
        if (intervalsOverlap(placed.start_time, placed.end_time, slot.start_time, slot.end_time)) {
          // Room collision
          if (placed.room_id === room.id) return false;

          // Student clash (enrolled students)
          const s1 = enrollmentsByExam[exam.id] || new Set();
          const s2 = enrollmentsByExam[placed.exam_id] || new Set();
          for (const sid of s1) {
            if (s2.has(sid)) return false;
          }

          // Student clash (groups)
          const g1 = examGroupsMap[exam.id] || [];
          const g2 = examGroupsMap[placed.exam_id] || [];
          if (g1.some(gid => g2.includes(gid))) return false;
        }
      }
    }

    return true;
  }

  for (const oldA of affectedAssignments) {
    const exam = examsMap[oldA.exam_id];
    let rescued = false;

    // Priority 1: Try same date and same time slot in a different compatible room (zero time change for students!)
    for (const room of rooms) {
      if (room.id === oldA.room_id) continue; // Outage room
      const sameSlot = validSlots.find(s => s.date === oldA.exam_date && s.start_time === oldA.start_time);
      if (sameSlot && isFeasibleForRescue(exam, sameSlot, room, newAssignments)) {
        newAssignments.push({
          exam_id: exam.id,
          room_id: room.id,
          exam_date: sameSlot.date,
          start_time: sameSlot.start_time,
          end_time: sameSlot.end_time,
          is_valid: 1
        });

        changes.push({
          examCode: exam.code,
          examName: exam.subject_name || exam.code,
          oldAssignment: `Room ${roomsMap[oldA.room_id]?.code || oldA.room_id} • ${oldA.exam_date} ${oldA.start_time} - ${oldA.end_time}`,
          newAssignment: `Room ${room.code} • ${sameSlot.date} ${sameSlot.start_time} - ${sameSlot.end_time}`,
          changeType: 'room_reassigned_same_time',
          reason: `Relocated to compatible ${room.code} at the same date and time. Student schedule timing remained unaffected.`
        });

        rescued = true;
        break;
      }
    }

    // Priority 2: Try another slot on the same date
    if (!rescued) {
      for (const slot of validSlots.filter(s => s.date === oldA.exam_date)) {
        if (rescued) break;
        for (const room of rooms) {
          if (isFeasibleForRescue(exam, slot, room, newAssignments)) {
            newAssignments.push({
              exam_id: exam.id,
              room_id: room.id,
              exam_date: slot.date,
              start_time: slot.start_time,
              end_time: slot.end_time,
              is_valid: 1
            });

            changes.push({
              examCode: exam.code,
              examName: exam.subject_name || exam.code,
              oldAssignment: `Room ${roomsMap[oldA.room_id]?.code || oldA.room_id} • ${oldA.exam_date} ${oldA.start_time} - ${oldA.end_time}`,
              newAssignment: `Room ${room.code} • ${slot.date} ${slot.start_time} - ${slot.end_time}`,
              changeType: 'time_and_room_reassigned',
              reason: `Shifted to slot ${slot.start_time} - ${slot.end_time} in Room ${room.code} to bypass outage.`
            });

            rescued = true;
            break;
          }
        }
      }
    }

    // Priority 3: Try any available slot and room across the entire period
    if (!rescued) {
      for (const slot of validSlots) {
        if (rescued) break;
        for (const room of rooms) {
          if (isFeasibleForRescue(exam, slot, room, newAssignments)) {
            newAssignments.push({
              exam_id: exam.id,
              room_id: room.id,
              exam_date: slot.date,
              start_time: slot.start_time,
              end_time: slot.end_time,
              is_valid: 1
            });

            changes.push({
              examCode: exam.code,
              examName: exam.subject_name || exam.code,
              oldAssignment: `Room ${roomsMap[oldA.room_id]?.code || oldA.room_id} • ${oldA.exam_date} ${oldA.start_time} - ${oldA.end_time}`,
              newAssignment: `Room ${room.code} • ${slot.date} ${slot.start_time} - ${slot.end_time}`,
              changeType: 'rescheduled_alternative_date',
              reason: `Rescheduled to ${slot.date} ${slot.start_time} in Room ${room.code}.`
            });

            rescued = true;
            break;
          }
        }
      }
    }

    if (!rescued) {
      unresolvedExams.push(exam);
    }
  }

  // Validate the resulting schedule
  const validation = validateSchedule(newAssignments, {
    examsMap,
    roomsMap,
    unavailList: activeUnavail,
    enrollmentsByExam,
    examGroupsMap,
    rulesMap
  });

  const totalExams = currentAssignments.length;
  const unchangedCount = frozenAssignments.length;
  const stabilityPercentage = totalExams > 0 ? (unchangedCount / totalExams) * 100 : 100;

  return {
    success: unresolvedExams.length === 0 && validation.isValid,
    totalExams,
    affectedCount: affectedAssignments.length,
    unchangedCount,
    stabilityPercentage: Number(stabilityPercentage.toFixed(1)),
    changes,
    unresolvedExams: unresolvedExams.map(e => ({ id: e.id, code: e.code })),
    unchangedExams: frozenAssignments.map(a => examsMap[a.exam_id]?.code || `#${a.exam_id}`),
    newAssignments,
    validation
  };
}

module.exports = {
  runExamRescue
};
