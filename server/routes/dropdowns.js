import { Router } from 'express';
import db from '../db/database.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = Router();

const ALLOWED_TYPES = {
  designation: { table: 'designations', column: 'name', insertSql: 'INSERT OR IGNORE INTO designations (name) VALUES (?)' },
  business_unit: { table: 'business_units', column: 'name', insertSql: 'INSERT OR IGNORE INTO business_units (name) VALUES (?)' },
  practice: { table: 'business_units', column: 'name', insertSql: 'INSERT OR IGNORE INTO business_units (name) VALUES (?)' },
  location: { table: 'locations', column: 'name', insertSql: 'INSERT OR IGNORE INTO locations (name) VALUES (?)' },
  current_role: { table: 'current_roles', column: 'name', insertSql: 'INSERT OR IGNORE INTO current_roles (name) VALUES (?)' },
  owlsure_designation: { table: 'owlsure_designations', column: 'name', insertSql: 'INSERT OR IGNORE INTO owlsure_designations (name) VALUES (?)' },
  deployable_role: { table: 'deployable_roles', column: 'name', insertSql: 'INSERT OR IGNORE INTO deployable_roles (name) VALUES (?)' },
  project: { table: 'projects', column: 'name', insertSql: 'INSERT OR IGNORE INTO projects (name) VALUES (?)' },
  customer: { table: 'customers', column: 'name', insertSql: 'INSERT OR IGNORE INTO customers (name) VALUES (?)' },
  domain: { table: 'domains', column: 'name', insertSql: 'INSERT OR IGNORE INTO domains (name, is_standard) VALUES (?, 1)' },
  skill_category: { table: 'skill_categories', column: 'name', insertSql: 'INSERT OR IGNORE INTO skill_categories (name) VALUES (?)' },
  manager: { table: 'managers', column: 'name', insertSql: null },
};

// GET /api/dropdowns - Return all master reference lookup data for forms & filters
router.get('/', authenticateToken, (req, res) => {
  try {
    const businessUnits = db.prepare('SELECT name FROM business_units ORDER BY id ASC').all().map(r => r.name);
    const locations = db.prepare('SELECT name FROM locations ORDER BY id ASC').all().map(r => r.name);
    const designations = db.prepare('SELECT name FROM designations ORDER BY grade_level ASC, id ASC').all().map(r => r.name);
    const owlsureDesignations = db.prepare('SELECT name FROM owlsure_designations ORDER BY id ASC').all().map(r => r.name);
    const currentRoles = db.prepare('SELECT name FROM current_roles ORDER BY id ASC').all().map(r => r.name);
    const deployableRoles = db.prepare('SELECT name FROM deployable_roles ORDER BY id ASC').all().map(r => r.name);
    const projects = db.prepare('SELECT name FROM projects ORDER BY id ASC').all().map(r => r.name);
    const customers = db.prepare('SELECT name FROM customers ORDER BY id ASC').all().map(r => r.name);
    const managers = db.prepare('SELECT name, email FROM managers ORDER BY id ASC').all().map(r => r.email ? `${r.name} (${r.email})` : r.name);
    const skillCategories = db.prepare('SELECT name FROM skill_categories ORDER BY id ASC').all().map(r => r.name);
    const domains = db.prepare('SELECT name FROM domains ORDER BY id ASC').all().map(r => r.name);
    const proficiencies = db.prepare('SELECT name FROM proficiency_levels ORDER BY sort_order ASC').all().map(r => r.name);
    const profileStatuses = db.prepare('SELECT name FROM profile_statuses ORDER BY sort_order ASC').all().map(r => r.name);

    return res.json({
      practices: businessUnits,
      businessUnits,
      locations,
      designations,
      owlsureDesignations,
      currentRoles,
      deployableRoles,
      projects,
      customers,
      managers,
      skillCategories,
      domains,
      proficiencies,
      profileStatuses,
    });
  } catch (err) {
    console.error('Error fetching dropdowns:', err);
    return res.status(500).json({ error: 'Failed to load master lookup options' });
  }
});

// POST /api/dropdowns - Add a custom option to a lookup table
router.post('/', authenticateToken, (req, res) => {
  try {
    const { type, value, email } = req.body;

    if (!type || !value || typeof value !== 'string' || !value.trim()) {
      return res.status(400).json({ error: 'type and non-empty value are required' });
    }

    const trimmed = value.trim();
    const config = ALLOWED_TYPES[type];
    if (!config) {
      return res.status(400).json({ error: `Invalid dropdown type: ${type}. Allowed: ${Object.keys(ALLOWED_TYPES).join(', ')}` });
    }

    if (type === 'manager') {
      const mgrMatch = trimmed.match(/^(.+?)\s*\((.+?@.+?)\)$/);
      let name = trimmed;
      let mgrEmail = email && typeof email === 'string' && email.trim() ? email.trim() : '';

      if (mgrMatch) {
        name = mgrMatch[1].trim();
        mgrEmail = mgrMatch[2].trim();
      }

      db.prepare('INSERT OR IGNORE INTO managers (name, email) VALUES (?, ?)').run(name, mgrEmail);
    } else {
      db.prepare(config.insertSql).run(trimmed);
    }

    return res.status(201).json({ success: true, type, value: trimmed });
  } catch (err) {
    console.error('Error adding dropdown option:', err);
    return res.status(500).json({ error: 'Failed to save custom option' });
  }
});

export default router;
