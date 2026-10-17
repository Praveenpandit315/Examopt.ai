// server/src/index.js
require('dotenv').config();
const app = require('./app');
const { initDatabase } = require('./database/db');

const PORT = process.env.PORT || 5000;

// Initialize database schema on startup
initDatabase();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 ExamOpt AI Server running on http://127.0.0.1:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🏛️ GLA HackVision 2.0 - Team Commit2Win`);
  console.log(`====================================================`);
});
