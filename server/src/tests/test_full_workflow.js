// server/src/tests/test_full_workflow.js
// Complete End-to-End Workflow Verification for ExamOpt AI
// Workflow: Admin login → enter exams & room data → generate timetable → validate → compare → rescue → publish → student login → view updated timetable

const assert = require('assert');
const app = require('../app');
const { seed } = require('../database/seed');

async function testFullWorkflow() {
  console.log('🚀 Starting ExamOpt AI Full End-to-End Workflow Test...\n');

  // Fresh seed
  seed();

  // Start temporary server instance
  const server = app.listen(5095);
  const BASE_URL = 'http://localhost:5095/api';

  try {
    // Step 1: Admin Login
    console.log('▶️ [Step 1] Admin Login...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@university.edu', password: 'Admin@123', role: 'admin' })
    });
    const loginData = await loginRes.json();
    assert.strictEqual(loginRes.status, 200);
    assert.ok(loginData.token, 'Must return JWT token');
    const adminToken = loginData.token;
    console.log(`  ✅ Admin authenticated successfully: ${loginData.user.full_name}\n`);

    // Step 2: Create a Room & Create an Examination
    console.log('▶️ [Step 2] Admin creates examination venue & exam record...');
    const createRoomRes = await fetch(`${BASE_URL}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        code: 'R999',
        building: 'Block D - Innovation Wing',
        room_name: 'Examination Hall 999',
        room_type: 'classroom',
        capacity: 120
      })
    });
    assert.strictEqual(createRoomRes.status, 201);
    console.log('  ✅ Room R999 created successfully.');

    // Step 3: Generate Timetable with Smart Heuristic Backtracking
    console.log('▶️ [Step 3] Admin triggers Smart Constraint Timetable Generation...');
    const genRes = await fetch(`${BASE_URL}/schedules/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ strategy: 'smart_backtracking' })
    });
    const genData = await genRes.json();
    assert.strictEqual(genRes.status, 201);
    assert.strictEqual(genData.conflicts, 0, 'Must have 0 hard conflicts');
    assert.strictEqual(genData.scheduled, genData.totalExams, 'Must schedule all exams');
    const scheduleVersionId = genData.scheduleVersionId;
    console.log(`  ✅ Generated schedule ${genData.versionCode}: ${genData.scheduled}/${genData.totalExams} scheduled in ${genData.executionTime}\n`);

    // Step 4: Compare First-Fit vs Smart Scheduler
    console.log('▶️ [Step 4] Optimization Lab: Comparing First-Fit vs Smart Scheduler...');
    const compRes = await fetch(`${BASE_URL}/schedules/compare`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const compData = await compRes.json();
    assert.strictEqual(compRes.status, 200);
    assert.ok(compData.baseline && compData.smart, 'Comparison metrics must be computed');
    console.log(`  📊 Baseline First-Fit: ${compData.baseline.scheduled} exams, ${compData.baseline.executionTimeMs}ms`);
    console.log(`  📊 Smart Backtracking: ${compData.smart.scheduled} exams, ${compData.smart.executionTimeMs}ms, Utilization: ${compData.smart.seatingUtilization}%`);
    console.log('  ✅ Scientific comparison verified.\n');

    // Step 5: Simulate Emergency Disruption & Run Exam Rescue Mode
    console.log('▶️ [Step 5] Exam Rescue Mode: Simulating unexpected room breakdown...');
    const rescueRes = await fetch(`${BASE_URL}/rescue/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        disruption: {
          type: 'room_outage',
          room_id: 3, // R203
          date: '2025-04-17',
          start_time: '12:00',
          end_time: '14:00',
          reason: 'Emergency Water Pipe Burst'
        }
      })
    });
    const rescueData = await rescueRes.json();
    assert.strictEqual(rescueRes.status, 200);
    assert.strictEqual(rescueData.success, true, 'Rescue must resolve disruption');
    console.log(`  📊 Rescue Stability: ${rescueData.stabilityPercentage}% (${rescueData.unchangedCount} exams kept unchanged)`);
    console.log('  ✅ Emergency Rescue simulation verified.\n');

    // Step 6: Approve & Publish Timetable
    console.log('▶️ [Step 6] Admin Approves & Publishes Timetable...');
    const pubRes = await fetch(`${BASE_URL}/schedules/${scheduleVersionId}/publish`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const pubData = await pubRes.json();
    assert.strictEqual(pubRes.status, 200);
    console.log(`  ✅ Timetable published: ${pubData.message}\n`);

    // Step 7: Student Login
    console.log('▶️ [Step 7] Student Login (Rahul Kumar)...');
    const stuLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'rahul.kumar@student.university.edu',
        password: 'Student@123',
        role: 'student'
      })
    });
    const stuLoginData = await stuLoginRes.json();
    assert.strictEqual(stuLoginRes.status, 200);
    const studentToken = stuLoginData.token;
    console.log(`  ✅ Student authenticated: ${stuLoginData.user.full_name} (Roll: ${stuLoginData.user.profile.roll_number})\n`);

    // Step 8: Student Views Personalized Published Timetable
    console.log('▶️ [Step 8] Student views personalized timetable...');
    const stuTimetableRes = await fetch(`${BASE_URL}/student/timetable`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const stuTimetableData = await stuTimetableRes.json();
    assert.strictEqual(stuTimetableRes.status, 200);
    assert.strictEqual(stuTimetableData.isPublished, true, 'Schedule must be marked as published for student');
    assert.strictEqual(stuTimetableData.timetable.length > 0, true, 'Student must receive their enrolled exams');
    console.log(`  📅 Enrolled Papers: ${stuTimetableData.timetable.map(t => t.code).join(', ')}`);
    console.log(`  ✅ Student personalized timetable verified!\n`);

    // Step 9: Verify Role Security Guard
    console.log('▶️ [Step 9] Security Check: Student attempting to access admin generate route...');
    const illegalAdminAccessRes = await fetch(`${BASE_URL}/schedules/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
      body: JSON.stringify({ strategy: 'smart_backtracking' })
    });
    assert.strictEqual(illegalAdminAccessRes.status, 403, 'Student access to admin API must be strictly blocked with 403');
    console.log('  🔒 Security Guard Verified: Student denied administrative API access (403 Forbidden).\n');

    console.log('🎉 COMPLETE END-TO-END WORKFLOW VERIFIED SUCCESSFULLY! 🏆');
  } finally {
    server.close();
  }
}

if (require.main === module) {
  testFullWorkflow().catch(err => {
    console.error('❌ Workflow failed:', err);
    process.exit(1);
  });
}

module.exports = { testFullWorkflow };
