// server/src/tests/test_session_builder.js
// Test Suite: Exam Session Builder Scope, Auto-population, and Scoped Generation (Phase 3)

const assert = require('assert');
const { db } = require('../database/db');
const { seed } = require('../database/seed');
const { 
  previewSessionScope, 
  createSession, 
  getAllSessions, 
  generateSessionTimetable 
} = require('../controllers/sessions.controller');

// Helper to mock express req / res
function mockReqRes(reqData = {}) {
  const adminUser = db.prepare("SELECT * FROM users WHERE role = 'admin' LIMIT 1").get();
  const req = {
    query: reqData.query || {},
    body: reqData.body || {},
    params: reqData.params || {},
    user: reqData.user || (adminUser ? { id: adminUser.id, role: 'admin' } : { id: 1, role: 'admin' })
  };

  let statusCode = 200;
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    }
  };

  return { req, res, getStatus: () => statusCode, getData: () => responseData };
}

async function runSessionBuilderTests() {
  console.log('\n=============================================================');
  console.log('🧪 Starting Phase 3: Exam Session Builder Test Suite');
  console.log('=============================================================\n');

  // Fresh seed
  seed();

  // Test 1: Preview Session Scope
  console.log('▶️ [Step 1] Testing previewSessionScope with BCA 2026-Odd Semester 3...');
  const { req: pReq, res: pRes, getData: getPData } = mockReqRes({
    query: {
      academicTerm: '2026-Odd',
      departments: 'BCA',
      programs: 'BCA',
      semesters: '3'
    }
  });

  previewSessionScope(pReq, pRes);
  const preview = getPData();

  assert(preview, 'Preview data should not be null');
  assert(preview.eligiblePapers && preview.eligiblePapers.length > 0, 'Should find eligible BCA semester 3 papers');
  assert(preview.roomPoolCount > 0, 'Should identify available rooms pool');
  assert(preview.totalAffectedStudents >= 0, 'Should calculate total affected students');

  console.log(`✅ Discovered ${preview.eligiblePapers.length} eligible papers and ${preview.roomPoolCount} rooms in scope.`);
  for (const paper of preview.eligiblePapers) {
    console.log(`   - Paper: [${paper.code}] ${paper.subjectName} (${paper.department}) | Students: ${paper.studentCount}`);
  }

  // Test 2: Create Exam Session
  console.log('\n▶️ [Step 2] Testing createSession with selected papers...');
  const selectedPaperIds = preview.eligiblePapers.map(p => p.id);

  const { req: cReq, res: cRes, getStatus: getCStatus, getData: getCData } = mockReqRes({
    body: {
      name: 'BCA 3rd Sem Midterm Evaluations',
      academicTerm: '2026-Odd',
      startDate: '2026-05-10',
      endDate: '2026-05-20',
      departments: ['BCA'],
      programs: ['BCA'],
      semesters: [3],
      selectedPaperIds
    }
  });

  createSession(cReq, cRes);
  assert.strictEqual(getCStatus(), 201, 'Session should be created with status 201');
  const sessionResult = getCData();
  assert(sessionResult.sessionId, 'Should return created sessionId');
  const sessionId = sessionResult.sessionId;
  console.log(`✅ Session created successfully: ID=${sessionId}, Code=${sessionResult.sessionCode}`);

  // Test 3: List Sessions
  console.log('\n▶️ [Step 3] Testing getAllSessions to verify persistence...');
  const { req: lReq, res: lRes, getData: getLData } = mockReqRes();
  getAllSessions(lReq, lRes);
  const listData = getLData();
  assert(listData.sessions && listData.sessions.length > 0, 'Sessions list should have entries');
  const createdSession = listData.sessions.find(s => s.id === sessionId);
  assert(createdSession, 'Created session should appear in the sessions list');
  console.log(`✅ Session found in list: "${createdSession.name}" with status "${createdSession.status}"`);

  // Test 4: Generate Scoped Session Timetable
  console.log('\n▶️ [Step 4] Testing generateSessionTimetable using smart_backtracking...');
  const { req: gReq, res: gRes, getStatus: getGStatus, getData: getGData } = mockReqRes({
    params: { id: sessionId },
    body: { strategy: 'smart_backtracking' }
  });

  generateSessionTimetable(gReq, gRes);
  if (getGStatus() !== 201) {
    console.error('generateSessionTimetable error response:', getGData());
  }
  assert.strictEqual(getGStatus(), 201, 'Timetable generation should return status 201');
  const genData = getGData();
  assert(genData.scheduleVersionId, 'Should generate a scheduleVersionId');
  assert.strictEqual(genData.conflicts, 0, 'Smart backtracking must have 0 conflicts');
  assert(genData.scheduled > 0, 'Should schedule examinations');
  console.log(`✅ Scoped timetable generated: Version=${genData.versionCode}, Scheduled=${genData.scheduled}/${genData.totalExams}, Conflicts=${genData.conflicts}, Utilization=${genData.utilization}%`);

  // Verify DB state
  const updatedSession = db.prepare('SELECT * FROM exam_sessions WHERE id = ?').get(sessionId);
  assert.strictEqual(updatedSession.status, 'scheduled', 'Session status should update to scheduled');

  const assignments = db.prepare('SELECT * FROM schedule_assignments WHERE schedule_version_id = ?').all(genData.scheduleVersionId);
  assert.strictEqual(assignments.length, genData.scheduled, 'All scheduled exams should be stored in schedule_assignments');
  console.log(`✅ Database verified: ${assignments.length} assignments stored under schedule version #${genData.scheduleVersionId}.`);

  console.log('\n=============================================================');
  console.log('🎉 ALL EXAM SESSION BUILDER TESTS PASSED SUCCESSFULLY!');
  console.log('=============================================================\n');
}

if (require.main === module) {
  runSessionBuilderTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
}

module.exports = { runSessionBuilderTests };
