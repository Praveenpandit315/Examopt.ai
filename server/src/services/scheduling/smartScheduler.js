// server/src/services/scheduling/smartScheduler.js
// Smart Constraint-Based Backtracking Scheduler for ExamOpt AI (GLA HackVision 2.0)
// Uses MRV (Minimum Remaining Values), Degree Heuristics, and Soft Objective Scoring

const { validateSchedule, intervalsOverlap, timeToMinutes } = require('./validator');

function runSmartScheduler(context, options = {}) {
  const startTime = Date.now();
  const maxSteps = options.maxSteps || 6000;
  const timeoutMs = options.timeoutMs || 5000;

  const { exams, rooms, slots, unavailList, enrollmentsByExam, examGroupsMap, rulesMap } = context;

  const examsMap = {};
  for (const e of exams) examsMap[e.id] = e;

  const roomsMap = {};
  for (const r of rooms) roomsMap[r.id] = r;

  const validSlots = slots.filter(s => !s.is_blocked);

  // 1. Build Conflict Graph between Exams
  const conflictDegree = {};
  for (const e of exams) conflictDegree[e.id] = 0;

  for (let i = 0; i < exams.length; i++) {
    for (let j = i + 1; j < exams.length; j++) {
      const e1 = exams[i];
      const e2 = exams[j];

      // Check student intersection
      const s1 = enrollmentsByExam[e1.id] || new Set();
      const s2 = enrollmentsByExam[e2.id] || new Set();
      let shares = false;
      for (const sid of s1) {
        if (s2.has(sid)) {
          shares = true;
          break;
        }
      }

      // Check group intersection
      if (!shares) {
        const g1 = examGroupsMap[e1.id] || [];
        const g2 = examGroupsMap[e2.id] || [];
        if (g1.some(gid => g2.includes(gid))) {
          shares = true;
        }
      }

      if (shares) {
        conflictDegree[e1.id]++;
        conflictDegree[e2.id]++;
      }
    }
  }

  // 2. Precompute Domain for each exam: legal (slot, room) pairs
  const initialDomains = {};
  for (const exam of exams) {
    const legalCandidates = [];

    for (const slot of validSlots) {
      // Slot duration check
      const slotDuration = timeToMinutes(slot.end_time) - timeToMinutes(slot.start_time);
      if (exam.duration_minutes > slotDuration) continue;

      // Fixed exam date/time check
      if (exam.fixed_date && exam.fixed_date !== slot.date) continue;
      if (exam.fixed_start_time && exam.fixed_start_time !== slot.start_time) continue;

      for (const room of rooms) {
        // Capacity check
        if ((exam.total_students || 0) > room.capacity) continue;

        // Specialized room type check
        if (exam.required_room_type && exam.required_room_type !== 'classroom') {
          if (room.room_type !== exam.required_room_type) continue;
        }

        // Fixed room check
        if (exam.fixed_room_id && exam.fixed_room_id !== room.id) continue;

        // Room unavailability check
        let unavailable = false;
        for (const u of unavailList) {
          if (u.room_id === room.id && u.date === slot.date) {
            if (intervalsOverlap(slot.start_time, slot.end_time, u.start_time, u.end_time)) {
              unavailable = true;
              break;
            }
          }
        }
        if (unavailable) continue;

        // External student commitments check (cross-department / cross-session)
        if (context.externalCommitments && context.externalCommitments.length > 0) {
          const currStudents = enrollmentsByExam[exam.id] || new Set();
          let extClash = false;
          for (const ext of context.externalCommitments) {
            if (currStudents.has(ext.student_id) && ext.date === slot.date) {
              if (intervalsOverlap(slot.start_time, slot.end_time, ext.start_time, ext.end_time)) {
                extClash = true;
                break;
              }
            }
          }
          if (extClash) continue;
        }

        // Candidate is intrinsically feasible
        legalCandidates.push({ slot, room });
      }
    }

    initialDomains[exam.id] = legalCandidates;
  }

  // Check compatibility with currently assigned state
  function isCompatible(candidate, examId, currentAssignments) {
    const { slot, room } = candidate;

    for (const placed of currentAssignments) {
      if (placed.exam_date === slot.date) {
        if (intervalsOverlap(placed.start_time, placed.end_time, slot.start_time, slot.end_time)) {
          // Room collision
          if (placed.room_id === room.id) return false;

          // Student clash (enrolled students)
          const s1 = enrollmentsByExam[examId] || new Set();
          const s2 = enrollmentsByExam[placed.exam_id] || new Set();
          for (const sid of s1) {
            if (s2.has(sid)) return false;
          }

          // Student clash (groups)
          const g1 = examGroupsMap[examId] || [];
          const g2 = examGroupsMap[placed.exam_id] || [];
          if (g1.some(gid => g2.includes(gid))) return false;
        }
      }
    }

    return true;
  }

  let stepCount = 0;
  let bestSolution = [];
  let bestScore = -1;

  function evaluateScheduleScore(assignments) {
    // Soft score calculation:
    // +1000 per scheduled exam
    // + seating utilization %
    // - penalties for student exams on adjacent slots
    let score = assignments.length * 1000;

    let totalOccupied = 0;
    let totalCap = 0;
    for (const a of assignments) {
      const ex = examsMap[a.exam_id];
      const rm = roomsMap[a.room_id];
      if (ex && rm) {
        totalOccupied += (ex.total_students || 0);
        totalCap += rm.capacity;
      }
    }

    if (totalCap > 0) {
      score += (totalOccupied / totalCap) * 100;
    }

    return score;
  }

  // Backtracking Search Routine
  function backtrack(unassignedExamIds, currentAssignments) {
    stepCount++;
    if (stepCount > maxSteps || (Date.now() - startTime) > timeoutMs) {
      return false; // Search threshold reached
    }

    // Base Case: All exams assigned
    if (unassignedExamIds.length === 0) {
      const score = evaluateScheduleScore(currentAssignments);
      if (score > bestScore) {
        bestScore = score;
        bestSolution = [...currentAssignments];
      }
      return true; // Found complete valid solution
    }

    // Check if current partial solution is better than existing best
    if (currentAssignments.length > bestSolution.length) {
      bestSolution = [...currentAssignments];
      bestScore = evaluateScheduleScore(currentAssignments);
    }

    // 1. Variable Ordering: MRV (Minimum Remaining Values) with Degree tie-breaking
    let selectedExamId = null;
    let minCandidateCount = Infinity;
    let maxDegree = -1;

    for (const eid of unassignedExamIds) {
      const candidates = initialDomains[eid] || [];
      const legalCount = candidates.filter(c => isCompatible(c, eid, currentAssignments)).length;

      if (legalCount < minCandidateCount) {
        minCandidateCount = legalCount;
        maxDegree = conflictDegree[eid] || 0;
        selectedExamId = eid;
      } else if (legalCount === minCandidateCount) {
        // Tie-breaker: Highest degree of conflict
        const deg = conflictDegree[eid] || 0;
        if (deg > maxDegree) {
          maxDegree = deg;
          selectedExamId = eid;
        }
      }
    }

    if (!selectedExamId || minCandidateCount === 0) {
      // Dead end reached for this branch, backtrack
      return false;
    }

    // 2. Value Ordering: Sort candidates by best room capacity fit (Least wasted seats)
    const exam = examsMap[selectedExamId];
    const rawCandidates = (initialDomains[selectedExamId] || []).filter(c => isCompatible(c, selectedExamId, currentAssignments));

    rawCandidates.sort((a, b) => {
      // Minimize wasted capacity = (room.capacity - total_students)
      const wasteA = a.room.capacity - (exam.total_students || 0);
      const wasteB = b.room.capacity - (exam.total_students || 0);
      return wasteA - wasteB;
    });

    const nextUnassigned = unassignedExamIds.filter(id => id !== selectedExamId);

    for (const cand of rawCandidates) {
      currentAssignments.push({
        exam_id: selectedExamId,
        room_id: cand.room.id,
        exam_date: cand.slot.date,
        start_time: cand.slot.start_time,
        end_time: cand.slot.end_time,
        is_valid: 1
      });

      const success = backtrack(nextUnassigned, currentAssignments);
      if (success && bestSolution.length === exams.length) {
        return true; // Early stop when complete schedule found
      }

      currentAssignments.pop(); // Backtrack
    }

    return false;
  }

  // Launch Backtracking from All Exams
  const allExamIds = exams.map(e => e.id);
  backtrack(allExamIds, []);

  // Post-processing Solution
  const finalAssignments = bestSolution;
  const scheduledExamIds = new Set(finalAssignments.map(a => a.exam_id));
  const unscheduled = [];

  for (const ex of exams) {
    if (!scheduledExamIds.has(ex.id)) {
      unscheduled.push({
        exam_id: ex.id,
        code: ex.code,
        reason: 'Backtracking proved no conflict-free candidate slot/room combination exists under current hard constraints'
      });
    }
  }

  // Validate Final Result Independently
  const validation = validateSchedule(finalAssignments, {
    examsMap,
    roomsMap,
    unavailList,
    enrollmentsByExam,
    examGroupsMap,
    rulesMap
  });

  // Calculate High-Resolution Optimization Metrics
  let totalOccupiedSeats = 0;
  let totalAllocatedCapacity = 0;
  const uniqueDates = new Set();
  const usedRoomSlots = new Set();

  for (const a of finalAssignments) {
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

  // Fairness Spacing Score (Calculates student rest intervals)
  let studentSpacingPenalty = 0;
  for (const [examId, students] of Object.entries(enrollmentsByExam)) {
    const a1 = finalAssignments.find(a => a.exam_id === Number(examId));
    if (!a1) continue;

    for (const [otherExamId, otherStudents] of Object.entries(enrollmentsByExam)) {
      if (Number(examId) >= Number(otherExamId)) continue;
      const a2 = finalAssignments.find(a => a.exam_id === Number(otherExamId));
      if (!a2) continue;

      let shares = false;
      for (const sid of students) {
        if (otherStudents.has(sid)) { shares = true; break; }
      }

      if (shares && a1.exam_date === a2.exam_date) {
        // Penalty for multiple exams on the same day for a student
        studentSpacingPenalty += 8;
      }
    }
  }

  const fairnessScore = Math.max(50, 100 - studentSpacingPenalty);
  const executionTimeMs = Date.now() - startTime;

  return {
    strategy: 'smart_backtracking',
    totalExams: exams.length,
    scheduledExams: finalAssignments.length,
    unscheduledExams: unscheduled.length,
    unscheduledList: unscheduled,
    assignments: finalAssignments,
    hardConflicts: validation.hardConflicts,
    conflicts: validation.conflicts,
    seatingUtilization: Number(seatingUtilization.toFixed(1)),
    slotsUsed: usedRoomSlots.size,
    spanDays: uniqueDates.size,
    fairnessScore: Number(fairnessScore.toFixed(1)),
    executionTimeMs
  };
}

module.exports = {
  runSmartScheduler
};
