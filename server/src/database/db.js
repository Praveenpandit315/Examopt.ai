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
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);

  // Safe non-destructive column migrations for existing databases
  addColumnIfNotExists('subjects', 'department_id', 'INTEGER DEFAULT NULL');
  addColumnIfNotExists('subjects', 'required_room_type', "TEXT DEFAULT 'classroom'");
  addColumnIfNotExists('examinations', 'session_id', 'INTEGER DEFAULT NULL');
  addColumnIfNotExists('schedule_versions', 'session_id', 'INTEGER DEFAULT NULL');
}

module.exports = {
  db,
  initDatabase,
  dbPath
};
