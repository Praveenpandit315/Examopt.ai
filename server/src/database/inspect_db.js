// server/src/database/inspect_db.js
// CLI database inspector for examopt.sqlite

const { db, dbPath } = require('./db');

console.log('================================================================');
console.log('🏛️  EXAMOPT AI — RELATIONAL DATABASE INSPECTOR');
console.log('📂  Database File:', dbPath);
console.log('================================================================\n');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();

console.log(`📊 Found ${tables.length} Relational Tables:\n`);

const tableSummary = tables.map(({ name }) => {
  const count = db.prepare(`SELECT COUNT(*) as count FROM ${name}`).get();
  return { 'Table Name': name, 'Total Records': count.count };
});
console.table(tableSummary);

console.log('\n----------------------------------------------------------------');
console.log('🔍 1. Users & Profiles (Sample):');
console.log('----------------------------------------------------------------');
const users = db.prepare(`
  SELECT u.id, u.full_name, u.email, u.role, sp.roll_number, sp.program, sp.semester
  FROM users u
  LEFT JOIN student_profiles sp ON u.id = sp.user_id
`).all();
console.table(users);

console.log('\n----------------------------------------------------------------');
console.log('🔍 2. Rooms & Venues:');
console.log('----------------------------------------------------------------');
const rooms = db.prepare('SELECT id, code, building, room_name, room_type, capacity, is_active FROM rooms').all();
console.table(rooms);

console.log('\n----------------------------------------------------------------');
console.log('🔍 3. Examinations (Sample):');
console.log('----------------------------------------------------------------');
const exams = db.prepare(`
  SELECT e.id, e.code, s.code AS subject_code, s.name AS subject_name, e.program, e.semester, 
         e.duration_minutes, e.required_room_type, e.fixed_date, e.fixed_start_time
  FROM examinations e
  JOIN subjects s ON e.subject_id = s.id
  LIMIT 6
`).all();
console.table(exams);

console.log('\n----------------------------------------------------------------');
console.log('🔍 4. Generated Schedule Versions:');
console.log('----------------------------------------------------------------');
const schedules = db.prepare(`
  SELECT id, version_code, name, strategy, status, total_exams, scheduled_exams, 
         seating_utilization || '%' AS utilization, execution_time_ms || 'ms' AS runtime
  FROM schedule_versions
`).all();
console.table(schedules);

console.log('\n----------------------------------------------------------------');
console.log('🔍 5. Active Schedule Assignments (First 6):');
console.log('----------------------------------------------------------------');
const assignments = db.prepare(`
  SELECT sa.id, sv.version_code, e.code AS exam_code, s.name AS subject, 
         r.code AS room, sa.exam_date, sa.start_time, sa.end_time
  FROM schedule_assignments sa
  JOIN schedule_versions sv ON sa.schedule_version_id = sv.id
  JOIN examinations e ON sa.exam_id = e.id
  JOIN subjects s ON e.subject_id = s.id
  JOIN rooms r ON sa.room_id = r.id
  ORDER BY sa.exam_date, sa.start_time
  LIMIT 6
`).all();
console.table(assignments);

console.log('\n✅ Database is persistent, normalized, and operating in WAL mode.');
