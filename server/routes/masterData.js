import { Router } from 'express';
import db from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { recalculateAllCompletion } from './employees.js';

const router = Router();

// ── Master Data Overrides (rename/hide system sections & fields) ───────────

// GET /api/master-data/overrides
router.get('/overrides', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare('SELECT item_key, custom_label, is_hidden FROM master_data_overrides').all();
    const map = {};
    for (const r of rows) map[r.item_key] = { label: r.custom_label, hidden: !!r.is_hidden };
    return res.json({ overrides: map });
  } catch (err) {
    console.error('Error fetching overrides:', err);
    return res.status(500).json({ error: 'Failed to load overrides' });
  }
});

// PUT /api/master-data/overrides/:key
router.put('/overrides/:key', authenticateToken, (req, res) => {
  try {
    const { key } = req.params;
    const { label, hidden } = req.body;
    const existing = db.prepare('SELECT * FROM master_data_overrides WHERE item_key = ?').get(key);
    if (existing) {
      const newLabel = label !== undefined ? label : existing.custom_label;
      const newHidden = hidden !== undefined ? (hidden ? 1 : 0) : existing.is_hidden;
      db.prepare('UPDATE master_data_overrides SET custom_label = ?, is_hidden = ? WHERE item_key = ?')
        .run(newLabel, newHidden, key);
    } else {
      db.prepare('INSERT INTO master_data_overrides (item_key, custom_label, is_hidden) VALUES (?, ?, ?)')
        .run(key, label || null, hidden ? 1 : 0);
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('Error updating override:', err);
    return res.status(500).json({ error: 'Failed to update override' });
  }
});

// DELETE /api/master-data/overrides/:key (reset to default)
router.delete('/overrides/:key', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM master_data_overrides WHERE item_key = ?').run(req.params.key);
    return res.json({ success: true });
  } catch (err) {
    console.error('Error deleting override:', err);
    return res.status(500).json({ error: 'Failed to reset override' });
  }
});

// ── Custom Sections CRUD ────────────────────────────────────────────────────

// GET /api/master-data/sections
router.get('/sections', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT id, label, after_key, created_at FROM custom_sections ORDER BY id ASC'
    ).all();
    return res.json({ sections: rows });
  } catch (err) {
    console.error('Error fetching custom sections:', err);
    return res.status(500).json({ error: 'Failed to load sections' });
  }
});

// POST /api/master-data/sections
router.post('/sections', authenticateToken, (req, res) => {
  try {
    const { label, after_key } = req.body;
    if (!label || typeof label !== 'string' || !label.trim()) {
      return res.status(400).json({ error: 'Section label is required' });
    }
    const trimmed = label.trim().replace(/\s+/g, ' ');
    const afterKey = after_key || 'review';

    const existing = db.prepare(
      'SELECT id FROM custom_sections WHERE LOWER(TRIM(label)) = LOWER(?)'
    ).get(trimmed);
    if (existing) {
      return res.status(409).json({ error: `"${trimmed}" section already exists` });
    }

    const result = db.prepare(
      'INSERT INTO custom_sections (label, after_key) VALUES (?, ?)'
    ).run(trimmed, afterKey);

    const created = db.prepare('SELECT * FROM custom_sections WHERE id = ?').get(result.lastInsertRowid);
    recalculateAllCompletion();
    return res.status(201).json({ section: created });
  } catch (err) {
    console.error('Error creating section:', err);
    return res.status(500).json({ error: 'Failed to create section' });
  }
});

// PUT /api/master-data/sections/:id
router.put('/sections/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { label } = req.body;
    if (!label || typeof label !== 'string' || !label.trim()) {
      return res.status(400).json({ error: 'Label is required' });
    }
    const trimmed = label.trim().replace(/\s+/g, ' ');

    const dup = db.prepare(
      'SELECT id FROM custom_sections WHERE LOWER(TRIM(label)) = LOWER(?) AND id != ?'
    ).get(trimmed, id);
    if (dup) return res.status(409).json({ error: `"${trimmed}" already exists` });

    const result = db.prepare('UPDATE custom_sections SET label = ? WHERE id = ?').run(trimmed, id);
    if (result.changes === 0) return res.status(404).json({ error: 'Section not found' });
    return res.json({ success: true });
  } catch (err) {
    console.error('Error updating section:', err);
    return res.status(500).json({ error: 'Failed to update section' });
  }
});

// DELETE /api/master-data/sections/:id (cascades: deletes fields & options)
router.delete('/sections/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const section = db.prepare('SELECT * FROM custom_sections WHERE id = ?').get(id);
    if (!section) return res.status(404).json({ error: 'Section not found' });

    const sectionKey = `custom_section_${id}`;
    const fields = db.prepare('SELECT id FROM custom_fields WHERE section = ?').all(sectionKey);
    for (const f of fields) {
      db.prepare('DELETE FROM custom_field_options WHERE field_id = ?').run(f.id);
    }
    db.prepare('DELETE FROM custom_fields WHERE section = ?').run(sectionKey);

    // Update any sections that reference this one to point to its after_key
    db.prepare('UPDATE custom_sections SET after_key = ? WHERE after_key = ?')
      .run(section.after_key, `custom_section_${id}`);

    db.prepare('DELETE FROM custom_sections WHERE id = ?').run(id);
    recalculateAllCompletion();
    return res.json({ success: true });
  } catch (err) {
    console.error('Error deleting section:', err);
    return res.status(500).json({ error: 'Failed to delete section' });
  }
});

// ── Custom Fields CRUD ──────────────────────────────────────────────────────

// GET /api/master-data/fields?section=employee_info
router.get('/fields', authenticateToken, (req, res) => {
  try {
    const { section } = req.query;
    let rows;
    if (section) {
      rows = db.prepare(
        'SELECT id, section, label, field_type, is_required, sort_order, created_at FROM custom_fields WHERE section = ? ORDER BY sort_order ASC, label COLLATE NOCASE ASC'
      ).all(section);
    } else {
      rows = db.prepare(
        'SELECT id, section, label, field_type, is_required, sort_order, created_at FROM custom_fields ORDER BY section ASC, sort_order ASC, label COLLATE NOCASE ASC'
      ).all();
    }
    return res.json({ fields: rows });
  } catch (err) {
    console.error('Error fetching custom fields:', err);
    return res.status(500).json({ error: 'Failed to load custom fields' });
  }
});

// POST /api/master-data/fields
router.post('/fields', authenticateToken, (req, res) => {
  try {
    const { section, label, field_type, is_required } = req.body;
    if (!section || !label || typeof label !== 'string' || !label.trim()) {
      return res.status(400).json({ error: 'Section and label are required' });
    }
    const trimmedLabel = label.trim().replace(/\s+/g, ' ');
    const type = field_type === 'text' ? 'text' : 'dropdown';
    const required = is_required ? 1 : 0;

    const existing = db.prepare(
      'SELECT id FROM custom_fields WHERE section = ? AND LOWER(TRIM(label)) = LOWER(?)'
    ).get(section, trimmedLabel);
    if (existing) {
      return res.status(409).json({ error: `"${trimmedLabel}" already exists in this section` });
    }

    const result = db.prepare(
      'INSERT INTO custom_fields (section, label, field_type, is_required) VALUES (?, ?, ?, ?)'
    ).run(section, trimmedLabel, type, required);

    const created = db.prepare('SELECT * FROM custom_fields WHERE id = ?').get(result.lastInsertRowid);

    recalculateAllCompletion();

    return res.status(201).json({ field: created });
  } catch (err) {
    console.error('Error creating custom field:', err);
    return res.status(500).json({ error: 'Failed to create field' });
  }
});

// PUT /api/master-data/fields/:id
router.put('/fields/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { label, is_required } = req.body;
    if (!label || typeof label !== 'string' || !label.trim()) {
      return res.status(400).json({ error: 'Label is required' });
    }
    const trimmedLabel = label.trim().replace(/\s+/g, ' ');

    const field = db.prepare('SELECT * FROM custom_fields WHERE id = ?').get(id);
    if (!field) return res.status(404).json({ error: 'Field not found' });

    const dup = db.prepare(
      'SELECT id FROM custom_fields WHERE section = ? AND LOWER(TRIM(label)) = LOWER(?) AND id != ?'
    ).get(field.section, trimmedLabel, id);
    if (dup) return res.status(409).json({ error: `"${trimmedLabel}" already exists in this section` });

    const required = is_required !== undefined ? (is_required ? 1 : 0) : field.is_required;
    db.prepare('UPDATE custom_fields SET label = ?, is_required = ? WHERE id = ?').run(trimmedLabel, required, id);

    recalculateAllCompletion();

    return res.json({ success: true });
  } catch (err) {
    console.error('Error updating custom field:', err);
    return res.status(500).json({ error: 'Failed to update field' });
  }
});

// DELETE /api/master-data/fields/:id — cascades to options + employee values, recalculates completion
router.delete('/fields/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const field = db.prepare('SELECT * FROM custom_fields WHERE id = ?').get(id);
    if (!field) return res.status(404).json({ error: 'Field not found' });

    db.prepare('DELETE FROM employee_custom_field_values WHERE field_id = ?').run(id);
    db.prepare('DELETE FROM custom_field_options WHERE field_id = ?').run(id);
    db.prepare('DELETE FROM custom_fields WHERE id = ?').run(id);

    recalculateAllCompletion();
    return res.json({ success: true });
  } catch (err) {
    console.error('Error deleting custom field:', err);
    return res.status(500).json({ error: 'Failed to delete field' });
  }
});

// ── Custom Field Options CRUD ───────────────────────────────────────────────

// GET /api/master-data/fields/:fieldId/options
router.get('/fields/:fieldId/options', authenticateToken, (req, res) => {
  try {
    const { fieldId } = req.params;
    const field = db.prepare('SELECT * FROM custom_fields WHERE id = ?').get(fieldId);
    if (!field) return res.status(404).json({ error: 'Field not found' });

    const options = db.prepare(
      'SELECT id, value, sort_order FROM custom_field_options WHERE field_id = ? ORDER BY sort_order ASC, value COLLATE NOCASE ASC'
    ).all(fieldId);

    return res.json({ field, options });
  } catch (err) {
    console.error('Error fetching field options:', err);
    return res.status(500).json({ error: 'Failed to load options' });
  }
});

// POST /api/master-data/fields/:fieldId/options
router.post('/fields/:fieldId/options', authenticateToken, (req, res) => {
  try {
    const { fieldId } = req.params;
    const { value } = req.body;
    if (!value || typeof value !== 'string' || !value.trim()) {
      return res.status(400).json({ error: 'Value is required' });
    }
    const trimmed = value.trim().replace(/\s+/g, ' ');

    const field = db.prepare('SELECT * FROM custom_fields WHERE id = ?').get(fieldId);
    if (!field) return res.status(404).json({ error: 'Field not found' });

    const existing = db.prepare(
      'SELECT id FROM custom_field_options WHERE field_id = ? AND LOWER(TRIM(value)) = LOWER(?)'
    ).get(fieldId, trimmed);
    if (existing) return res.status(409).json({ error: `"${trimmed}" already exists` });

    db.prepare('INSERT INTO custom_field_options (field_id, value) VALUES (?, ?)').run(fieldId, trimmed);
    return res.status(201).json({ success: true });
  } catch (err) {
    console.error('Error adding option:', err);
    return res.status(500).json({ error: 'Failed to add option' });
  }
});

// GET /api/master-data/fields/:fieldId/options/:optionId/usage - Check employee usage
router.get('/fields/:fieldId/options/:optionId/usage', authenticateToken, (req, res) => {
  try {
    const { fieldId, optionId } = req.params;
    const option = db.prepare('SELECT value FROM custom_field_options WHERE id = ? AND field_id = ?').get(optionId, fieldId);
    if (!option) return res.status(404).json({ error: 'Option not found' });

    const usage = db.prepare(
      'SELECT COUNT(*) as cnt FROM employee_custom_field_values WHERE field_id = ? AND LOWER(TRIM(value)) = LOWER(?)'
    ).get(fieldId, option.value);

    return res.json({ fieldId: Number(fieldId), optionId: Number(optionId), name: option.value, usageCount: usage?.cnt || 0 });
  } catch (err) {
    console.error('Error checking option usage:', err);
    return res.status(500).json({ error: 'Failed to check usage' });
  }
});

// PUT /api/master-data/fields/:fieldId/options/:optionId
router.put('/fields/:fieldId/options/:optionId', authenticateToken, (req, res) => {
  try {
    const { fieldId, optionId } = req.params;
    const { value } = req.body;
    if (!value || typeof value !== 'string' || !value.trim()) {
      return res.status(400).json({ error: 'Value is required' });
    }
    const trimmed = value.trim().replace(/\s+/g, ' ');

    const dup = db.prepare(
      'SELECT id FROM custom_field_options WHERE field_id = ? AND LOWER(TRIM(value)) = LOWER(?) AND id != ?'
    ).get(fieldId, trimmed, optionId);
    if (dup) return res.status(409).json({ error: `"${trimmed}" already exists` });

    const oldOption = db.prepare('SELECT value FROM custom_field_options WHERE id = ? AND field_id = ?').get(optionId, fieldId);

    const result = db.prepare('UPDATE custom_field_options SET value = ? WHERE id = ? AND field_id = ?').run(trimmed, optionId, fieldId);
    if (result.changes === 0) return res.status(404).json({ error: 'Option not found' });

    if (oldOption && oldOption.value !== trimmed) {
      db.prepare('UPDATE employee_custom_field_values SET value = ? WHERE field_id = ? AND LOWER(TRIM(value)) = LOWER(?)')
        .run(trimmed, fieldId, oldOption.value);
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Error updating option:', err);
    return res.status(500).json({ error: 'Failed to update option' });
  }
});

// DELETE /api/master-data/fields/:fieldId/options/:optionId — cascades to employee values
router.delete('/fields/:fieldId/options/:optionId', authenticateToken, (req, res) => {
  try {
    const { fieldId, optionId } = req.params;

    const option = db.prepare('SELECT value FROM custom_field_options WHERE id = ? AND field_id = ?').get(optionId, fieldId);
    if (!option) return res.status(404).json({ error: 'Option not found' });

    const usage = db.prepare(
      'SELECT COUNT(*) as cnt FROM employee_custom_field_values WHERE field_id = ? AND LOWER(TRIM(value)) = LOWER(?)'
    ).get(fieldId, option.value);
    const usageCount = usage?.cnt || 0;

    if (usageCount > 0) {
      db.prepare('DELETE FROM employee_custom_field_values WHERE field_id = ? AND LOWER(TRIM(value)) = LOWER(?)').run(fieldId, option.value);
    }

    db.prepare('DELETE FROM custom_field_options WHERE id = ? AND field_id = ?').run(optionId, fieldId);

    if (usageCount > 0) recalculateAllCompletion();

    return res.json({ success: true, cascadedCount: usageCount });
  } catch (err) {
    console.error('Error deleting option:', err);
    return res.status(500).json({ error: 'Failed to delete option' });
  }
});

export default router;
