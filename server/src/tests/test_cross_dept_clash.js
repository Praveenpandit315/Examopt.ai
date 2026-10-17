// server/src/tests/test_cross_dept_clash.js
// Critical Acceptance Test: Cross-Department Student Clash Prevention (Section 15)

const assert = require('assert');
const { db, initDatabase } = require('../database/db');
const { seed } = require('../database/seed');
const { buildSchedulingContext } = require('../controllers/schedules.controller');
const { runSmartScheduler } = require('../services/scheduling/smartScheduler');
const { runFirstFitScheduler } = require('../services/scheduling/firstFitScheduler');
const { validateSchedule } = require('../services/scheduling/validator');

async function runCrossDeptClashTests() {
  console.log('\n=============================================================');
  console.log('🧪 Starting Section 15: Cross-Department Clash Prevention Test');
  console.log('=============================================================\n');

  seed();

  // Retrieve seeded student STU101 (Rahul Kumar)
  const stu101 = db.prepare("SELECT * FROM student_profiles WHERE roll_number = 'STU101'").get();
  assert(stu101, 'Student STU101 must exist');

  // Retrieve Java (BCA) and Mathematics Elective (MATH)
  const javaSub = db.prepare("SELECT * FROM subjects WHERE code = 'CS301'").get();
  const mathSub = db.prepare("SELECT * FROM subjects WHERE code = 'MA305'").get();
  assert(javaSub, 'Java subject CS301 must exist in BCA');
  assert(mathSub, 'Math Elective subject MA305 must exist in MATH');

  // Verify STU101 enrollment in both papers
  const enrollments = db.prepare(`
    SELECT sce.*, s.code as subject_code
    FROM student_course_enrollments sce
    JOIN subjects s ON sce.subject_id = s.id
    WHERE sce.student_profile_id = ?
  `).all(stu101.id);

  const enrolledCodes = enrollments.map(e => e.subject_code);
  assert(enrolledCodes.includes('CS301'), 'STU101 must be enrolled in CS301 (Java, BCA)');
  assert(enrolledCodes.includes('MA305'), 'STU101 must be enrolled in MA305 (Math Elective, MATH)');
  console.log(`👤 Student STU101 verified enrolled across departments in: ${enrolledCodes.join(', ')}`);

  // Step 1: Create existing fixed/published Mathematics Elective examination on Monday 09:00 to 12:00
  console.log('\n▶️ [Step 1] Locking external Mathematics Elective on Monday 2025-04-15 09:00-12:00...');
  
  // Create Math exam (out of scope from BCA)
  const mathExamRes = db.prepare(`
    INSERT INTO examinations (code, subject_id, program, semester, duration_minutes, required_room_type, fixed_date, fixed_start_time, is_active)
    VALUES ('EX_MATH', ?, 'BCA', 3, 180, 'classroom', '2025-04-15', '09:00', 1)
  `).run(mathSub.id);
  const mathExamId = Number(mathExamRes.lastInsertRowid);

  // Create Java BCA exam (target to schedule)
  const javaExamRes = db.prepare(`
    INSERT INTO examinations (code, subject_id, program, semester, duration_minutes, required_room_type, is_active)
    VALUES ('EX_JAVA', ?, 'BCA', 3, 120, 'classroom', 1)
  `).run(javaSub.id);
  const javaExamId = Number(javaExamRes.lastInsertRowid);

  // Link STU101 to EX_JAVA
  db.prepare(`INSERT OR IGNORE INTO exam_enrollments (exam_id, student_id) VALUES (?, ?)`).run(javaExamId, stu101.id);
  db.prepare(`INSERT OR IGNORE INTO exam_enrollments (exam_id, student_id) VALUES (?, ?)`).run(mathExamId, stu101.id);

  // Step 2: Generate BCA Timetable (targeting EX_JAVA while EX_MATH is an external fixed commitment)
  console.log('\n▶️ [Step 2] Generating BCA Timetable for Java (EX_JAVA)...');
  const context = buildSchedulingContext({ examIds: [javaExamId] });

  // Verify external commitments loaded correctly
  assert(context.externalCommitments.length > 0, 'External commitments must be detected');
  const mathCommitment = context.externalCommitments.find(c => c.subject_code === 'MA305');
  assert(mathCommitment, 'MA305 external commitment must be recognized for STU101');
  assert.strictEqual(mathCommitment.date, '2025-04-15');
  assert.strictEqual(mathCommitment.start_time, '09:00');
  console.log(`  🛡️ Recognized external commitment for STU101: ${mathCommitment.subject_code} on ${mathCommitment.date} (${mathCommitment.start_time}-${mathCommitment.end_time})`);

  // Run Smart Scheduler
  const smartResult = runSmartScheduler(context);
  assert.strictEqual(smartResult.scheduledExams, 1, 'Java must be successfully scheduled in an alternative slot');
  assert.strictEqual(smartResult.unscheduledExams, 0);

  const javaAssignment = smartResult.assignments.find(a => a.exam_id === javaExamId);
  assert(javaAssignment, 'Assignment for EX_JAVA must exist');

  // CRITICAL CHECK: EX_JAVA must NOT be scheduled during Monday 09:00–12:00
  const isOverlappingMath = (
    javaAssignment.exam_date === '2025-04-15' &&
    javaAssignment.start_time < '12:00' &&
    '09:00' < javaAssignment.end_time
  );
  assert.strictEqual(isOverlappingMath, false, 'CRITICAL: Java was NOT assigned to Monday 09:00-12:00 clash interval!');
  console.log(`  ✅ Passed: EX_JAVA assigned to ${javaAssignment.exam_date} (${javaAssignment.start_time}-${javaAssignment.end_time}) without student clash!`);

  // Independent Validator Check
  const valResult = validateSchedule(smartResult.assignments, context);
  assert.strictEqual(valResult.hardConflicts, 0, 'Schedule must have 0 hard conflicts');
  assert.strictEqual(valResult.isValid, true, 'Schedule must be completely valid');
  console.log('  ✅ Independent validator confirmed 0 hard conflicts and 100% validity.');

  // Step 3: Test what happens when every alternative slot is unavailable
  console.log('\n▶️ [Step 3] Testing Infeasible Scenario: Blocking all alternative slots...');
  
  // Create an artificial context where the ONLY slot in the entire university is Monday 09:00-11:00
  const restrictedSlots = [
    { id: 999, slot_name: 'Only Available Morning Slot', date: '2025-04-15', start_time: '09:00', end_time: '11:00', is_blocked: 0 }
  ];

  const restrictedContext = {
    ...context,
    slots: restrictedSlots
  };

  const blockedResult = runSmartScheduler(restrictedContext);
  console.log(`  📊 Infeasible run result: ${blockedResult.scheduledExams} scheduled, ${blockedResult.unscheduledExams} unscheduled`);

  // MUST report failure / unscheduled status rather than silently accepting a clash!
  assert.strictEqual(blockedResult.scheduledExams, 0, 'Scheduler MUST NOT schedule exam into a clashing slot');
  assert.strictEqual(blockedResult.unscheduledExams, 1, 'Exam MUST remain unscheduled when no legal slot exists');
  console.log('  ✅ Passed: System reported unscheduled status rather than silently accepting an invalid clash!');

  console.log('\n🎉 SECTION 15 CRITICAL ACCEPTANCE TEST PASSED 100%! 🏆\n');
}

if (require.main === module) {
  runCrossDeptClashTests().catch(err => {
    console.error('Test failure:', err);
    process.exit(1);
  });
}

module.exports = { runCrossDeptClashTests };
