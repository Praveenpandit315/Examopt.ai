// server/src/controllers/presets.controller.js
// Session Presets Controller for Reusable Exam Configurations

const { db } = require('../database/db');

function getAllPresets(req, res) {
  try {
    const presets = db.prepare(`
      SELECT id, preset_name, preset_type, description, config_json, created_at
      FROM session_presets
      ORDER BY id ASC
    `).all();

    const formatted = presets.map(p => {
      let config = {};
      try {
        config = JSON.parse(p.config_json);
      } catch (e) {
        config = {};
      }
      return {
        ...p,
        config
      };
    });

    return res.json({ presets: formatted });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch session presets: ' + err.message });
  }
}

function getPresetById(req, res) {
  try {
    const { id } = req.params;
    const preset = db.prepare('SELECT * FROM session_presets WHERE id = ?').get(id);
    if (!preset) {
      return res.status(404).json({ error: 'Preset not found' });
    }

    let config = {};
    try {
      config = JSON.parse(preset.config_json);
    } catch (e) {
      config = {};
    }

    return res.json({ preset: { ...preset, config } });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch preset: ' + err.message });
  }
}

function createPreset(req, res) {
  try {
    const { preset_name, preset_type = 'custom', description = '', config } = req.body;
    if (!preset_name) {
      return res.status(400).json({ error: 'Preset name is required' });
    }

    const configJson = typeof config === 'string' ? config : JSON.stringify(config || {});

    const stmt = db.prepare(`
      INSERT INTO session_presets (preset_name, preset_type, description, config_json)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(preset_name.trim(), preset_type, description.trim(), configJson);

    return res.status(201).json({
      message: 'Preset saved successfully',
      presetId: Number(result.lastInsertRowid)
    });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'A preset with this name already exists' });
    }
    return res.status(500).json({ error: 'Failed to create preset: ' + err.message });
  }
}

function updatePreset(req, res) {
  try {
    const { id } = req.params;
    const { preset_name, description, config } = req.body;

    const configJson = config ? (typeof config === 'string' ? config : JSON.stringify(config)) : null;

    db.prepare(`
      UPDATE session_presets
      SET preset_name = COALESCE(?, preset_name),
          description = COALESCE(?, description),
          config_json = COALESCE(?, config_json)
      WHERE id = ?
    `).run(preset_name, description, configJson, id);

    return res.json({ message: 'Preset updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update preset: ' + err.message });
  }
}

function deletePreset(req, res) {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM session_presets WHERE id = ?').run(id);
    return res.json({ message: 'Preset deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete preset: ' + err.message });
  }
}

module.exports = {
  getAllPresets,
  getPresetById,
  createPreset,
  updatePreset,
  deletePreset
};
