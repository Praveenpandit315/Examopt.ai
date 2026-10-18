// server/src/app.js
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const examsRoutes = require('./routes/exams.routes');
const roomsRoutes = require('./routes/rooms.routes');
const groupsRoutes = require('./routes/groups.routes');
const slotsRoutes = require('./routes/slots.routes');
const adminRoutes = require('./routes/admin.routes');
const schedulesRoutes = require('./routes/schedules.routes');
const rescueRoutes = require('./routes/rescue.routes');
const studentRoutes = require('./routes/student.routes');
const aiRoutes = require('./routes/ai.routes');
const dataHubRoutes = require('./routes/dataHub.routes');
const sessionsRoutes = require('./routes/sessions.routes');
const academicRoutes = require('./routes/academic.routes');
const presetsRoutes = require('./routes/presets.routes');
const seatingRoutes = require('./routes/seating.routes');
const historyRoutes = require('./routes/history.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Request logger for debugging
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    product: 'ExamOpt AI',
    team: 'Commit2Win',
    time: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examsRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/slots', slotsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/rescue', rescueRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/data-hub', dataHubRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/presets', presetsRoutes);
app.use('/api/seating', seatingRoutes);
app.use('/api/history', historyRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

module.exports = app;
