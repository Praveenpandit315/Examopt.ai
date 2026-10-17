// server/src/tests/test_phase2_3.js
// Automated verification test suite for Phase 2 & 3 (Schedulers, Validator, Optimization, Rescue)

const assert = require('assert');
const { db } = require('../database/db');
const { seed } = require('../database/seed');
const { buildSchedulingContext } = require('../controllers/schedules.controller');
const { runFirstFitScheduler } = require('../services/scheduling/firstFitScheduler');
const { runSmartScheduler } = require('../services/scheduling/smartScheduler');
const { runExamRescue } = require('../services/scheduling/rescueEngine');
const { validateSchedule } = require('../services/scheduling/validator');

async function runPhase2And3Tests() {
  console.log('🧪 Starting Phase 2 & 3 Verification Suite...\n');

  // Seed clean dataset
  seed();
  const context = buildSchedulingContext();

  // Test 1: First-Fit Scheduler Run & Validation
  console.log('▶️ [Test 1] Running First-Fit Baseline Scheduler...');
  const firstFitResult = runFirstFitScheduler(context);
  console.log(`  📊 First-Fit: ${firstFitResult.scheduledExams}/${firstFitResult.totalExams} scheduled in ${firstFitResult.executionTimeMs}ms`);
  assert.strictEqual(firstFitResult.scheduledExams > 0, true, 'First-Fit should schedule exams');
  assert.strictEqual(firstFitResult.hardConflicts, 0, 'First-Fit assignments must not violate hard constraints');
  console.log('  ✅ First-Fit baseline verified.\n');

  // Test 2: Smart Heuristic Backtracking Scheduler
  console.log('▶️ [Test 2] Running Smart Constraint Backtracking Scheduler...');
  const smartResult = runSmartScheduler(context);
  console.log(`  📊 Smart Scheduler: ${smartResult.scheduledExams}/${smartResult.totalExams} scheduled in ${smartResult.executionTimeMs}ms`);
  console.log(`  📊 Seating Utilization: ${smartResult.seatingUtilization}%, Fairness Score: ${smartResult.fairnessScore}`);

  // Must schedule 100% of exams in normal baseline
  assert.strictEqual(smartResult.scheduledExams, context.exams.length, 'Smart scheduler must achieve 100% coverage on normal baseline');
  assert.strictEqual(smartResult.hardConflicts, 0, 'Smart scheduler must have 0 hard conflicts');

  // Check Fixed Exam Constraint for CS101
  const cs101Exam = context.exams.find(e => e.code === 'EX001');
  const cs101Assignment = smartResult.assignments.find(a => a.exam_id === cs101Exam.id);
  assert.ok(cs101Assignment, 'CS101 must be scheduled');
  assert.strictEqual(cs101Assignment.exam_date, '2025-04-15', 'CS101 fixed date must be respected');
  assert.strictEqual(cs101Assignment.start_time, '09:00', 'CS101 fixed start time must be respected');
  assert.strictEqual(cs101Assignment.room_id, cs101Exam.fixed_room_id, 'CS101 fixed room must be respected');
  console.log('  ✅ Smart Scheduler 100% feasible schedule & fixed exam constraints verified.\n');

  // Test 3: Specialized Lab Constraint Verification
  console.log('▶️ [Test 3] Verifying specialized computer lab constraint...');
  const labExam = context.exams.find(e => e.required_room_type === 'computer_lab');
  const labAssignment = smartResult.assignments.find(a => a.exam_id === labExam.id);
  const assignedRoom = context.rooms.find(r => r.id === labAssignment.room_id);
  assert.strictEqual(assignedRoom.room_type, 'computer_lab', 'Lab exam must be allocated strictly to a computer_lab');
  console.log(`  ✅ Exam ${labExam.code} assigned to ${assignedRoom.code} (${assignedRoom.room_type}) verified.\n`);

  // Test 4: Room Unavailability Blackout Respect
  console.log('▶️ [Test 4] Verifying room maintenance blackout respect...');
  const r203 = context.rooms.find(r => r.code === 'R203');
  const unavailAssignment = smartResult.assignments.find(a => 
    a.room_id === r203.id && 
    a.exam_date === '2025-04-18' && 
    a.start_time === '12:00'
  );
  assert.strictEqual(unavailAssignment, undefined, 'Room R203 must NOT be booked on 18 Apr 12:00 during maintenance');
  console.log('  ✅ Room unavailability blackout verified.\n');

  // Test 5: Exam Rescue Mode Engine
  console.log('▶️ [Test 5] Running Exam Rescue Mode Simulation...');
  // Find a non-fixed exam assignment to simulate disruption
  const targetAssignment = smartResult.assignments.find(a => a.exam_id !== cs101Exam.id);
  assert.ok(targetAssignment, 'Should have a non-fixed exam assignment in baseline');

  const disruption = {
    type: 'room_outage',
    room_id: targetAssignment.room_id,
    date: targetAssignment.exam_date,
    start_time: targetAssignment.start_time,
    end_time: targetAssignment.end_time,
    reason: 'Emergency HVAC Fan Burst'
  };

  const rescueResult = runExamRescue(context, smartResult.assignments, disruption);
  console.log(`  📊 Rescue Stability: ${rescueResult.stabilityPercentage}% (${rescueResult.unchangedCount}/${rescueResult.totalExams} unchanged)`);
  console.log(`  📊 Affected Exams: ${rescueResult.affectedCount}`);
  assert.strictEqual(rescueResult.success, true, 'Rescue engine must find valid revised schedule');
  assert.strictEqual(rescueResult.validation.isValid, true, 'Rescued schedule must pass independent validator');
  assert.strictEqual(rescueResult.stabilityPercentage >= 90, true, 'Rescue stability must be >= 90%');
  console.log('  ✅ Exam Rescue Mode minimum-disruption verified.\n');

  console.log('🎉 ALL PHASE 2 & 3 AUTOMATED TESTS PASSED SUCCESSFULLY! 🚀');
}

if (require.main === module) {
  runPhase2And3Tests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
}

module.exports = { runPhase2And3Tests };
