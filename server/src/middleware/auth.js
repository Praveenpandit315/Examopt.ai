// server/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { db } = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'examopt_super_secret_jwt_key_2026_commit2win';

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token missing or invalid format' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch fresh user record
    const user = db.prepare('SELECT id, email, role, full_name FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User associated with token no longer exists' });
    }

    req.user = user;

    // If student, attach student profile
    if (user.role === 'student') {
      const profile = db.prepare(`
        SELECT sp.*, sg.code as group_code, sg.name as group_name
        FROM student_profiles sp
        LEFT JOIN group_memberships gm ON gm.student_id = sp.id
        LEFT JOIN student_groups sg ON sg.id = gm.group_id
        WHERE sp.user_id = ?
      `).get(user.id);
      req.user.profile = profile || null;
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token expired or invalid: ' + err.message });
  }
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Requires role: ${allowedRoles.join(', ')}. Current role: ${req.user.role}` 
      });
    }
    next();
  };
}

const requireAdmin = requireRole(['admin']);
const requireStudent = requireRole(['student']);

module.exports = {
  verifyToken,
  requireRole,
  requireAdmin,
  requireStudent,
  JWT_SECRET
};
