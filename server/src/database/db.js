// server/src/database/db.js
// SQLite Database connection using Node.js v24 native node:sqlite DatabaseSync

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH 
  ? path.resolve(__dirname, '../../', process.env.DB_PATH)
  : path.resolve(__dirname, 'examopt.sqlite');

// Ensure database directory exists
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new DatabaseSync(dbPath);

// Enable foreign key constraints and WAL mode
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

function addColumnIfNotExists(tableName, columnName, columnDef) {
  try {
    const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all();
    const exists = tableInfo.some(col => col.name === columnName);
    if (!exists) {
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef};`);
    }
  } catch (err) {
    // Table might not exist yet; schema.sql will create it
  }
}

function initDatabase() {
  // Safe column migrations for pre-existing tables before full schema execution
  addColumnIfNotExists('users', 'firebase_uid', 'TEXT DEFAULT NULL');
  addColumnIfNotExists('users', 'account_status', "TEXT NOT NULL DEFAULT 'active'");
  addColumnIfNotExists('subjects', 'department_id', 'INTEGER DEFAULT NULL');
  addColumnIfNotExists('subjects', 'required_room_type', "TEXT DEFAULT 'classroom'");
  addColumnIfNotExists('rooms', 'block_id', 'INTEGER DEFAULT NULL');
  addColumnIfNotExists('examinations', 'session_id', 'INTEGER DEFAULT NULL');
  addColumnIfNotExists('examinations', 'block_id', 'INTEGER DEFAULT NULL');
  addColumnIfNotExists('schedule_versions', 'session_id', 'INTEGER DEFAULT NULL');
  addColumnIfNotExists('exam_sessions', 'allowed_blocks_filter', "TEXT DEFAULT '[]'");
  addColumnIfNotExists('exam_sessions', 'daily_start_time', "TEXT DEFAULT '09:00'");
  addColumnIfNotExists('exam_sessions', 'daily_end_time', "TEXT DEFAULT '17:00'");
  addColumnIfNotExists('exam_sessions', 'slot_duration_minutes', 'INTEGER DEFAULT 120');
  addColumnIfNotExists('exam_sessions', 'break_duration_minutes', 'INTEGER DEFAULT 30');
  addColumnIfNotExists('exam_sessions', 'allowed_days', "TEXT DEFAULT '[\"Mon\",\"Tue\",\"Wed\",\"Thu\",\"Fri\",\"Sat\"]'");
  addColumnIfNotExists('exam_sessions', 'is_deadline_mandatory', 'INTEGER NOT NULL DEFAULT 0');
  addColumnIfNotExists('exam_sessions', 'preset_id', 'INTEGER DEFAULT NULL');

  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);

  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_users_firebase ON users(firebase_uid);');
  } catch (err) {}
}

module.exports = {
  db,
  initDatabase,
  dbPath
};
