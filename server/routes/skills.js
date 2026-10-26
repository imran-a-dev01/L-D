import { Router } from 'express';
import db from '../db/database.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import { recalculateAllCompletion } from './employees.js';

const router = Router();

// GET /api/skills - List all skills in global taxonomy catalog
router.get('/', authenticateToken, (req, res) => {
  try {
    const skills = db.prepare(`
      SELECT id, name, slug, category, description, is_verified, created_at
      FROM skills
      ORDER BY category ASC, name ASC
    `).all();

    return res.json({ skills });
  } catch (err) {
    console.error('Error fetching skills:', err);
    return res.status(500).json({ error: 'Failed to fetch skill catalog' });
  }
});

// POST /api/skills - Add new skill (Protected: skill:manage)
router.post('/', authenticateToken, requirePermission('skill:manage'), (req, res) => {
  const { name, category, description } = req.body;

  if (!name || !category) {
    return res.status(400).json({ error: 'Skill name and category are required' });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const id = 'skill_' + Math.random().toString(36).substring(2, 9);

  try {
    db.prepare(`
      INSERT INTO skills (id, name, slug, category, description, is_verified)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(id, name.trim(), slug, category, description || '');

    const created = db.prepare('SELECT * FROM skills WHERE id = ?').get(id);
    return res.status(201).json({ skill: created, message: 'Skill created successfully' });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: `Skill "${name}" already exists in catalog` });
    }
    console.error('Error creating skill:', err);
    return res.status(500).json({ error: 'Failed to create skill' });
  }
});

// GET /api/skills/:id/usage - Check how many employees use this skill
router.get('/:id/usage', authenticateToken, (req, res) => {
  try {
    const skill = db.prepare('SELECT name FROM skills WHERE id = ?').get(req.params.id);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    const usage = db.prepare('SELECT COUNT(*) as cnt FROM employee_skills WHERE LOWER(TRIM(skill_name)) = LOWER(?)').get(skill.name);
    return res.json({ id: req.params.id, name: skill.name, usageCount: usage?.cnt || 0 });
  } catch (err) {
    console.error('Error checking skill usage:', err);
    return res.status(500).json({ error: 'Failed to check usage' });
  }
});

// PUT /api/skills/:id - Rename/update a skill (Protected: skill:manage)
router.put('/:id', authenticateToken, requirePermission('skill:manage'), (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Skill name is required' });
  }

  try {
    const existing = db.prepare('SELECT id, name FROM skills WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    const oldName = existing.name;
    const trimmed = name.trim();
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    db.prepare('UPDATE skills SET name = ?, slug = ?, description = ? WHERE id = ?')
      .run(trimmed, slug, description ?? '', id);

    if (oldName !== trimmed) {
      db.prepare('UPDATE employee_skills SET skill_name = ? WHERE LOWER(TRIM(skill_name)) = LOWER(?)').run(trimmed, oldName);
    }

    return res.json({ success: true });
  } catch (err) {
    if (err.message?.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: `Skill "${name.trim()}" already exists` });
    }
    console.error('Error updating skill:', err);
    return res.status(500).json({ error: 'Failed to update skill' });
  }
});

// DELETE /api/skills/:id - Remove skill from catalog (Protected: skill:manage)
router.delete('/:id', authenticateToken, requirePermission('skill:manage'), (req, res) => {
  const { id } = req.params;

  try {
    const skill = db.prepare('SELECT name FROM skills WHERE id = ?').get(id);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    const usage = db.prepare('SELECT COUNT(*) as cnt FROM employee_skills WHERE LOWER(TRIM(skill_name)) = LOWER(?)').get(skill.name);
    const usageCount = usage?.cnt || 0;

    if (usageCount > 0) {
      db.prepare('DELETE FROM employee_skills WHERE LOWER(TRIM(skill_name)) = LOWER(?)').run(skill.name);
      recalculateAllCompletion();
    }

    db.prepare('DELETE FROM skills WHERE id = ?').run(id);
    return res.json({ message: 'Skill removed from catalog successfully', cascadedCount: usageCount });
  } catch (err) {
    console.error('Error deleting skill:', err);
    return res.status(500).json({ error: 'Failed to delete skill' });
  }
});

export default router;
