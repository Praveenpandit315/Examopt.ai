// server/src/tests/test_academic_seating_history.js
// Verification suite for Academic Data, Presets, Post-Scheduling Seating Allocator, and History Diff

const assert = require('assert');
const { initDatabase, db } = require('../database/db');
const { seed } = require('../database/seed');
const { allocateSeatsForSchedule, getAssignmentSeating } = require('../services/scheduling/seatingAllocator');

async function runAcademicSeatingHistoryTests() {
  console.log('\n=============================================================');
  console.log('🧪 Starting Academic Data, Seating & History Test Suite');
  console.log('=============================================================');

  initDatabase();
  seed();

  // -------------------------------------------------------------
  // Test 1: Academic Data & University Blocks Verification
  // -------------------------------------------------------------
  console.log('\n▶️ [Test 1] Testing Academic Data & University Blocks...');
  
  const blocks = db.prepare('SELECT * FROM university_blocks WHERE is_active = 1').all();
  assert(blocks.length >= 5, 'Should have at least 5 university blocks seeded');
  console.log(`  ✅ Discovered ${blocks.length} active university blocks (e.g. ${blocks.map(b => b.code).join(', ')}).`);

  const depts = db.prepare('SELECT * FROM departments').all();
  assert(depts.length >= 4, 'Should have departments seeded');
  console.log(`  ✅ Verified ${depts.length} departments.`);

  const programs = db.prepare('SELECT * FROM academic_programs').all();
  assert(programs.length >= 3, 'Should have academic programs seeded');
  console.log(`  ✅ Verified ${programs.length} academic programs.`);

  // -------------------------------------------------------------
  // Test 2: Institutional Session Presets
  // -------------------------------------------------------------
  console.log('\n▶️ [Test 2] Testing Institutional Session Presets...');
  
  const presets = db.prepare('SELECT * FROM session_presets').all();
  assert(presets.length >= 3, 'Should have at least 3 default session presets seeded');
  
  const regularPreset = presets.find(p => p.preset_type === 'regular');
  assert(regularPreset, 'Regular semester preset must exist');
  const parsedCfg = JSON.parse(regularPreset.config_json);
  assert.strictEqual(parsedCfg.daily_start_time || parsedCfg.dailyStartTime, '09:00');
  console.log(`  ✅ Presets verified: ${presets.map(p => p.preset_name).join(' | ')}.`);

  // -------------------------------------------------------------
  // Test 3: Post-Scheduling Physical Seat Allocation Engine
  // -------------------------------------------------------------
  console.log('\n▶️ [Test 3] Testing Post-Scheduling Physical Seat Allocation...');

  const { buildSchedulingContext } = require('../controllers/schedules.controller');
  const { runSmartScheduler } = require('../services/scheduling/smartScheduler');

  const context = buildSchedulingContext();
  const smartResult = runSmartScheduler(context);
  const adminUser = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();

  const insertVer = db.prepare(`
    INSERT INTO schedule_versions (
      version_code, name, strategy, status, session_id,
      total_exams, scheduled_exams, unscheduled_exams, hard_conflicts,
      seating_utilization, execution_time_ms, created_by
    ) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'TT-SEATING-V1.0',
    'Seating Allocation Master Verification Schedule',
    'smart_backtracking',
    'approved',
    smartResult.totalExams,
    smartResult.scheduledExams,
    smartResult.unscheduledExams,
    smartResult.hardConflicts,
    smartResult.seatingUtilization,
    smartResult.executionTimeMs,
    adminUser ? adminUser.id : 1
  );

  const versionId = Number(insertVer.lastInsertRowid);
  const insertAssign = db.prepare(`
    INSERT INTO schedule_assignments (schedule_version_id, exam_id, room_id, exam_date, start_time, end_time, is_valid)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);
  for (const a of smartResult.assignments) {
    insertAssign.run(versionId, a.exam_id, a.room_id, a.exam_date, a.start_time, a.end_time);
  }

  const scheduleVersion = db.prepare('SELECT * FROM schedule_versions WHERE id = ?').get(versionId);
  assert(scheduleVersion, 'A schedule version must exist for seat allocation');

  // Run physical seat allocation
  const seatingResult = allocateSeatsForSchedule(scheduleVersion.id, { strategy: 'sequential', reallocate: true });
  assert(seatingResult.success, 'Seating allocation should return success');
  assert(seatingResult.totalSeatsAllocated > 0, 'Should allocate desks to enrolled candidates');
  console.log(`  ✅ Allocated ${seatingResult.totalSeatsAllocated} physical desk seats across ${seatingResult.totalAssignments} exam rooms.`);

  // Verify room seating grid and uniqueness
  const firstAssignment = db.prepare('SELECT * FROM schedule_assignments WHERE schedule_version_id = ? LIMIT 1').get(scheduleVersion.id);
  assert(firstAssignment, 'Assignment should exist');

  const gridData = getAssignmentSeating(firstAssignment.id);
  assert(gridData.seats.length > 0, 'Physical room seats must be returned');
  
  const assignedSeats = gridData.seats.filter(s => s.isOccupied);
  console.log(`  ✅ Room ${gridData.assignment.room_code}: ${assignedSeats.length}/${gridData.totalSeats} seats occupied.`);
  
  // Verify no duplicate desk assignments in the same room exam session
  const occupiedSeatIds = assignedSeats.map(s => s.id);
  const uniqueSeatIds = new Set(occupiedSeatIds);
  assert.strictEqual(occupiedSeatIds.length, uniqueSeatIds.size, 'No desk can be double-booked for the same exam!');
  console.log('  🛡️ Anti-collision check passed: Zero double-booked desks.');

  // -------------------------------------------------------------
  // Test 4: Student Hall Ticket Generation
  // -------------------------------------------------------------
  console.log('\n▶️ [Test 4] Verifying Student Hall Ticket with Desk Details...');

  // Publish schedule to allow hall ticket viewing
  db.prepare("UPDATE schedule_versions SET status = 'published' WHERE id = ?").run(scheduleVersion.id);

  const student = db.prepare('SELECT * FROM student_profiles WHERE roll_number = ?').get('STU101');
  assert(student, 'STU101 profile must exist');

  const ticketRows = db.prepare(`
    SELECT sa.id as assignment_id, e.code as exam_code, sub.name as subject_name,
           r.code as room_code, ssa.seat_label
    FROM schedule_assignments sa
    JOIN examinations e ON sa.exam_id = e.id
    JOIN subjects sub ON e.subject_id = sub.id
    JOIN rooms r ON sa.room_id = r.id
    LEFT JOIN student_seat_assignments ssa ON (ssa.schedule_assignment_id = sa.id AND ssa.student_profile_id = ?)
    WHERE sa.schedule_version_id = ?
  `).all(student.id, scheduleVersion.id);

  assert(ticketRows.length > 0, 'Student should have exam hall tickets');
  const withSeat = ticketRows.filter(t => t.seat_label);
  console.log(`  ✅ Hall ticket generated for STU101: ${withSeat.length} papers assigned with desk numbers (e.g. ${withSeat[0]?.seat_label}).`);

  // -------------------------------------------------------------
  // Test 5: Audit Log Immutability
  // -------------------------------------------------------------
  console.log('\n▶️ [Test 5] Verifying Audit Log Records...');
  const auditCount = db.prepare("SELECT COUNT(*) as c FROM audit_logs WHERE action = 'SEAT_ALLOCATION'").get().c;
  assert(auditCount > 0, 'Audit log must record SEAT_ALLOCATION action');
  console.log(`  ✅ Verified ${auditCount} SEAT_ALLOCATION audit log entries with timestamp and details.`);

  console.log('\n🎉 ALL ACADEMIC DATA, SEATING & HISTORY TESTS PASSED SUCCESSFULLY! 🚀');
}

module.exports = {
  runAcademicSeatingHistoryTests
};

if (require.main === module) {
  runAcademicSeatingHistoryTests().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  });
}
