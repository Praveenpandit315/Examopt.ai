// server/src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database/db');
const { JWT_SECRET } = require('../middleware/auth');

function login(req, res) {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (role && user.role !== role) {
    return res.status(403).json({ 
      error: `Account role mismatch: '${user.role}' cannot log in through '${role}' portal` 
    });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  let profile = null;
  if (user.role === 'student') {
    profile = db.prepare(`
      SELECT sp.*, sg.code as group_code, sg.name as group_name
      FROM student_profiles sp
      LEFT JOIN group_memberships gm ON gm.student_id = sp.id
      LEFT JOIN student_groups sg ON sg.id = gm.group_id
      WHERE sp.user_id = ?
    `).get(user.id);
  }

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      profile
    }
  });
}

function getMe(req, res) {
  return res.json({ user: req.user });
}

function getDemoAccounts(req, res) {
  const users = db.prepare(`
    SELECT u.id, u.email, u.role, u.full_name, sp.roll_number, sp.program, sp.semester, sp.section
    FROM users u
    LEFT JOIN student_profiles sp ON sp.user_id = u.id
    ORDER BY u.role, u.id
  `).all();

  return res.json({
    accounts: users.map(u => ({
      email: u.email,
      role: u.role,
      name: u.full_name,
      roll_number: u.roll_number || null,
      program: u.program || null,
      defaultPassword: u.role === 'admin' ? 'Admin@123' : 'Student@123'
    }))
  });
}

module.exports = {
  login,
  getMe,
  getDemoAccounts
};
