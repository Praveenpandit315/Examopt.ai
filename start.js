// start.js - Spawns both backend server and frontend client concurrently with a single command!
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting ExamOpt AI (Full Stack)...');

// 1. Start Server on port 5000
const serverProcess = spawn('node', ['src/index.js'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true
});

// 2. Start Client on port 3000
const clientProcess = spawn('npm.cmd', ['run', 'dev'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit',
  shell: true
});

// Handle graceful termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down ExamOpt AI...');
  serverProcess.kill();
  clientProcess.kill();
  process.exit();
});

serverProcess.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`Backend server exited with code ${code}`);
  }
});

clientProcess.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`Frontend client exited with code ${code}`);
  }
});
