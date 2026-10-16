import { Router } from 'express';
import db from '../db/database.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

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

// DELETE /api/skills/:id - Remove skill from catalog (Protected: skill:manage)
router.delete('/:id', authenticateToken, requirePermission('skill:manage'), (req, res) => {
  const { id } = req.params;

  try {
    const result = db.prepare('DELETE FROM skills WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    return res.json({ message: 'Skill removed from catalog successfully' });
  } catch (err) {
    console.error('Error deleting skill:', err);
    return res.status(500).json({ error: 'Failed to delete skill' });
  }
});

export default router;
