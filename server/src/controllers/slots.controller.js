// server/src/controllers/slots.controller.js
const { db } = require('../database/db');

function getAllSlots(req, res) {
  try {
    const slots = db.prepare(`
      SELECT * FROM exam_time_slots 
      ORDER BY date ASC, start_time ASC
    `).all();

    return res.json({ slots, total: slots.length });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch slots: ' + err.message });
  }
}

function createSlot(req, res) {
  try {
    const { slot_name, date, start_time, end_time, is_blocked } = req.body;
    if (!slot_name || !date || !start_time || !end_time) {
      return res.status(400).json({ error: 'Missing required slot fields: slot_name, date, start_time, end_time' });
    }

    const existing = db.prepare('SELECT id FROM exam_time_slots WHERE date = ? AND start_time = ? AND end_time = ?').get(date, start_time, end_time);
    if (existing) {
      return res.status(400).json({ error: 'A time slot for this date and time interval already exists' });
    }

    const result = db.prepare(`
      INSERT INTO exam_time_slots (slot_name, date, start_time, end_time, is_blocked)
      VALUES (?, ?, ?, ?, ?)
    `).run(slot_name.trim(), date, start_time, end_time, is_blocked ? 1 : 0);

    return res.status(201).json({ message: 'Time slot created', id: Number(result.lastInsertRowid) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create slot: ' + err.message });
  }
}

function updateSlot(req, res) {
  try {
    const { id } = req.params;
    const { slot_name, is_blocked } = req.body;

    const existing = db.prepare('SELECT id FROM exam_time_slots WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Time slot not found' });
    }

    db.prepare(`
      UPDATE exam_time_slots SET
        slot_name = COALESCE(?, slot_name),
        is_blocked = COALESCE(?, is_blocked)
      WHERE id = ?
    `).run(slot_name, is_blocked !== undefined ? Number(is_blocked) : null, id);

    return res.json({ message: 'Time slot updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update slot: ' + err.message });
  }
}

function deleteSlot(req, res) {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id FROM exam_time_slots WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Time slot not found' });
    }

    db.prepare('DELETE FROM exam_time_slots WHERE id = ?').run(id);
    return res.json({ message: 'Time slot deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete slot: ' + err.message });
  }
}

function getAllRules(req, res) {
  try {
    const rules = db.prepare('SELECT * FROM institutional_rules ORDER BY id ASC').all();
    return res.json({ rules });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch institutional rules: ' + err.message });
  }
}

function updateRule(req, res) {
  try {
    const { id } = req.params;
    const { rule_value, is_active } = req.body;

    const existing = db.prepare('SELECT id FROM institutional_rules WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    db.prepare(`
      UPDATE institutional_rules SET
        rule_value = COALESCE(?, rule_value),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(rule_value !== undefined ? String(rule_value) : null, is_active !== undefined ? Number(is_active) : null, id);

    return res.json({ message: 'Rule updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update rule: ' + err.message });
  }
}

module.exports = {
  getAllSlots,
  createSlot,
  updateSlot,
  deleteSlot,
  getAllRules,
  updateRule
};
