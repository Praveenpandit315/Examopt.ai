// server/src/tests/test_ai_copilot.js
// Automated verification for AI Scheduling Copilot (Phase 5)

const assert = require('assert');
const app = require('../app');
const { seed } = require('../database/seed');

async function testAICopilot() {
  console.log('🤖 Starting AI Scheduling Copilot Verification...\n');
  seed();

  const server = app.listen(5096);
  const BASE_URL = 'http://localhost:5096/api';

  try {
    // 1. Authenticate as Admin
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@university.edu', password: 'Admin@123', role: 'admin' })
    });
    const { token } = await loginRes.json();

    // 2. Query 1: Why could CS101 not be scheduled on Monday?
    console.log('▶️ [Query 1] Asking: "Why could CS101 not be scheduled on Monday?"...');
    const q1Res = await fetch(`${BASE_URL}/ai/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ query: 'Why could CS101 not be scheduled on Monday?' })
    });
    const q1Data = await q1Res.json();
    assert.strictEqual(q1Res.status, 200);
    assert.ok(q1Data.answer.length > 20, 'Copilot must provide substantive answer');
    assert.strictEqual(q1Data.intent, 'EXPLAIN_WHY_CANNOT_SCHEDULE');
    console.log(`  🤖 Copilot Response Preview:\n  ${q1Data.answer.split('\n')[0]}\n`);

    // 3. Query 2: What happens if Computer Lab L1 becomes unavailable?
    console.log('▶️ [Query 2] Asking: "What happens if Computer Lab L1 becomes unavailable?"...');
    const q2Res = await fetch(`${BASE_URL}/ai/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ query: 'What happens if Computer Lab L1 becomes unavailable?' })
    });
    const q2Data = await q2Res.json();
    assert.strictEqual(q2Res.status, 200);
    assert.ok(q2Data.answer.includes('Exam Rescue'), 'Must invoke Exam Rescue analysis');
    assert.strictEqual(q2Data.intent, 'SIMULATE_ROOM_OUTAGE');
    console.log(`  🤖 Copilot Response Preview:\n  ${q2Data.answer.split('\n')[0]}\n`);

    // 4. Query 3: Which timetable has better room utilization?
    console.log('▶️ [Query 3] Asking: "Which timetable has better room utilization?"...');
    const q3Res = await fetch(`${BASE_URL}/ai/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ query: 'Which timetable has better room utilization?' })
    });
    const q3Data = await q3Res.json();
    assert.strictEqual(q3Res.status, 200);
    assert.ok(q3Data.answer.includes('Smart Constraint Backtracking'), 'Must compare Smart vs Baseline');
    assert.strictEqual(q3Data.intent, 'COMPARE_UTILIZATION');
    console.log(`  🤖 Copilot Response Preview:\n  ${q3Data.answer.split('\n')[0]}\n`);

    console.log('🎉 ALL AI COPILOT VERIFICATION TESTS PASSED SUCCESSFULLY! 🚀');
  } finally {
    server.close();
  }
}

if (require.main === module) {
  testAICopilot().catch(err => {
    console.error('❌ AI Copilot test failed:', err);
    process.exit(1);
  });
}

module.exports = { testAICopilot };
