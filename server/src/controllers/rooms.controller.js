// server/src/controllers/rooms.controller.js
const { db } = require('../database/db');

function getAllRooms(req, res) {
  try {
    const { building, room_type, is_active } = req.query;

    let query = `
      SELECT r.*,
        (SELECT COUNT(*) FROM room_unavailability ru WHERE ru.room_id = r.id) as unavail_count
      FROM rooms r
      WHERE 1=1
    `;
    const params = [];

    if (building && building !== 'All Buildings') {
      query += ' AND r.building = ?';
      params.push(building);
    }
    if (room_type && room_type !== 'All Types') {
      query += ' AND r.room_type = ?';
      params.push(room_type);
    }
    if (is_active !== undefined && is_active !== '') {
      query += ' AND r.is_active = ?';
      params.push(Number(is_active));
    }

    query += ' ORDER BY r.code ASC';

    const rooms = db.prepare(query).all(...params);

    // Fetch unavailability blocks for all rooms
    const unavail = db.prepare('SELECT * FROM room_unavailability ORDER BY date ASC, start_time ASC').all();
    const unavailMap = {};
    for (const u of unavail) {
      if (!unavailMap[u.room_id]) unavailMap[u.room_id] = [];
      unavailMap[u.room_id].push(u);
    }

    const formatted = rooms.map(r => ({
      ...r,
      unavailability: unavailMap[r.id] || []
    }));

    return res.json({ rooms: formatted, total: formatted.length });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch rooms: ' + err.message });
  }
}

function createRoom(req, res) {
  try {
    const { code, building, room_name, room_type, capacity, is_active } = req.body;

    if (!code || !building || !room_name || !capacity) {
      return res.status(400).json({ error: 'Missing required room fields: code, building, room_name, capacity' });
    }

    const existing = db.prepare('SELECT id FROM rooms WHERE code = ?').get(code.trim().toUpperCase());
    if (existing) {
      return res.status(400).json({ error: `Room code '${code}' already exists` });
    }

    const result = db.prepare(`
      INSERT INTO rooms (code, building, room_name, room_type, capacity, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      code.trim().toUpperCase(),
      building.trim(),
      room_name.trim(),
      room_type || 'classroom',
      Number(capacity),
      is_active !== undefined ? Number(is_active) : 1
    );

    return res.status(201).json({ message: 'Room created successfully', id: Number(result.lastInsertRowid) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create room: ' + err.message });
  }
}

function updateRoom(req, res) {
  try {
    const { id } = req.params;
    const { code, building, room_name, room_type, capacity, is_active } = req.body;

    const existing = db.prepare('SELECT id FROM rooms WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Room not found' });
    }

    db.prepare(`
      UPDATE rooms SET
        code = COALESCE(?, code),
        building = COALESCE(?, building),
        room_name = COALESCE(?, room_name),
        room_type = COALESCE(?, room_type),
        capacity = COALESCE(?, capacity),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(
      code ? code.trim().toUpperCase() : null,
      building ? building.trim() : null,
      room_name ? room_name.trim() : null,
      room_type,
      capacity ? Number(capacity) : null,
      is_active !== undefined ? Number(is_active) : null,
      id
    );

    return res.json({ message: 'Room updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update room: ' + err.message });
  }
}

function deleteRoom(req, res) {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id FROM rooms WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Room not found' });
    }

    db.prepare('DELETE FROM rooms WHERE id = ?').run(id);
    return res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete room: ' + err.message });
  }
}

function addUnavailability(req, res) {
  try {
    const { room_id, date, start_time, end_time, reason } = req.body;
    if (!room_id || !date || !start_time || !end_time || !reason) {
      return res.status(400).json({ error: 'All unavailability fields are required: room_id, date, start_time, end_time, reason' });
    }

    const room = db.prepare('SELECT id FROM rooms WHERE id = ?').get(room_id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const result = db.prepare(`
      INSERT INTO room_unavailability (room_id, date, start_time, end_time, reason)
      VALUES (?, ?, ?, ?, ?)
    `).run(Number(room_id), date, start_time, end_time, reason);

    return res.status(201).json({ message: 'Room unavailability block added', id: Number(result.lastInsertRowid) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to add unavailability: ' + err.message });
  }
}

function deleteUnavailability(req, res) {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM room_unavailability WHERE id = ?').run(id);
    return res.json({ message: 'Room unavailability block removed' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to remove unavailability: ' + err.message });
  }
}

module.exports = {
  getAllRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  addUnavailability,
  deleteUnavailability
};
