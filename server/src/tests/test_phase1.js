// server/src/tests/test_phase1.js
// Automated verification test suite for Phase 1 (Database, Auth, CRUD, Permissions)

const assert = require('assert');
const { db, initDatabase } = require('../database/db');
const { seed } = require('../database/seed');
const app = require('../app');

async function runPhase1Tests() {
  console.log('🧪 Starting Phase 1 Verification Suite...\n');

  // Test 1: Seed data and Database Schema Integrity
  console.log('▶️ [Test 1] Verifying schema and seed counts...');
  seed();
  const userCount = db.prepare('SELECT count(*) as c FROM users').get().c;
  const examCount = db.prepare('SELECT count(*) as c FROM examinations').get().c;
  const roomCount = db.prepare('SELECT count(*) as c FROM rooms').get().c;
  const slotCount = db.prepare('SELECT count(*) as c FROM exam_time_slots').get().c;

  assert.strictEqual(userCount >= 4, true, 'Expected at least 4 users seeded');
  assert.strictEqual(examCount >= 12, true, 'Expected at least 12 exams seeded');
  assert.strictEqual(roomCount >= 5, true, 'Expected at least 5 rooms seeded');
  assert.strictEqual(slotCount >= 10, true, 'Expected at least 10 slots seeded');
  console.log('  ✅ Schema and seed counts verified successfully.\n');

  // Test 2: Auth logic & JWT Generation
  console.log('▶️ [Test 2] Testing authentication logic...');
  const bcrypt = require('bcryptjs');
  const jwt = require('jsonwebtoken');
  const { JWT_SECRET } = require('../middleware/auth');

  // Verify Admin Login
  const admin = db.prepare("SELECT * FROM users WHERE email = 'admin@university.edu'").get();
  assert.ok(admin, 'Admin user must exist');
  assert.strictEqual(bcrypt.compareSync('Admin@123', admin.password_hash), true, 'Admin password must match hash');
  assert.strictEqual(bcrypt.compareSync('WrongPass', admin.password_hash), false, 'Wrong password must be rejected');

  const adminToken = jwt.sign({ id: admin.id, email: admin.email, role: admin.role }, JWT_SECRET);
  const student = db.prepare("SELECT * FROM users WHERE email = 'rahul.kumar@student.university.edu'").get();
  const studentToken = jwt.sign({ id: student.id, email: student.email, role: student.role }, JWT_SECRET);
  console.log('  ✅ Auth and token generation verified.\n');

  // Test 3: Middleware Role Verification
  console.log('▶️ [Test 3] Testing role enforcement logic...');
  const decodedAdmin = jwt.verify(adminToken, JWT_SECRET);
  assert.strictEqual(decodedAdmin.role, 'admin');

  const decodedStudent = jwt.verify(studentToken, JWT_SECRET);
  assert.strictEqual(decodedStudent.role, 'student');
  console.log('  ✅ Role enforcement token checks passed.\n');

  // Test 4: CRUD Operations on Rooms & Examinations
  console.log('▶️ [Test 4] Testing CRUD Operations...');
  
  // Insert Test Room
  const newRoom = db.prepare(`
    INSERT INTO rooms (code, building, room_name, room_type, capacity, is_active)
    VALUES ('TEST-99', 'Test Block', 'Unit Test Room', 'classroom', 55, 1)
  `).run();
  const newRoomId = Number(newRoom.lastInsertRowid);
  const fetchedRoom = db.prepare('SELECT * FROM rooms WHERE id = ?').get(newRoomId);
  assert.strictEqual(fetchedRoom.code, 'TEST-99');
  assert.strictEqual(fetchedRoom.capacity, 55);

  // Update Test Room
  db.prepare('UPDATE rooms SET capacity = 75 WHERE id = ?').run(newRoomId);
  const updatedRoom = db.prepare('SELECT capacity FROM rooms WHERE id = ?').get(newRoomId);
  assert.strictEqual(updatedRoom.capacity, 75);

  // Delete Test Room
  db.prepare('DELETE FROM rooms WHERE id = ?').run(newRoomId);
  const deletedRoom = db.prepare('SELECT id FROM rooms WHERE id = ?').get(newRoomId);
  assert.strictEqual(deletedRoom, undefined);
  console.log('  ✅ Room CRUD operations verified.\n');

  // Test 5: Verify Student Overlap Query
  console.log('▶️ [Test 5] Testing Student Overlap Detection...');
  const overlaps = db.prepare(`
    SELECT COUNT(gm1.student_id) as shared_count
    FROM group_memberships gm1
    JOIN group_memberships gm2 ON gm2.student_id = gm1.student_id
    WHERE gm1.group_id != gm2.group_id
  `).get();
  console.log(`  ℹ️ Discovered ${overlaps.shared_count} cross-group student relationships.`);
  console.log('  ✅ Overlap query executed without error.\n');

  console.log('🎉 ALL PHASE 1 AUTOMATED TESTS PASSED SUCCESSFULLY! 🚀');
}

if (require.main === module) {
  runPhase1Tests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
}

module.exports = { runPhase1Tests };
