import { Router } from 'express';
import db from '../db/database.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import { recalculateAllCompletion } from './employees.js';

const router = Router();

const ALLOWED_TYPES = {
  designation: { table: 'designations', column: 'name', insertSql: 'INSERT OR IGNORE INTO designations (name) VALUES (?)', usageSql: "SELECT COUNT(*) as cnt FROM employees WHERE LOWER(TRIM(designation)) = LOWER(?)" },
  business_unit: { table: 'business_units', column: 'name', insertSql: 'INSERT OR IGNORE INTO business_units (name) VALUES (?)', usageSql: "SELECT COUNT(*) as cnt FROM employees WHERE LOWER(TRIM(business_unit)) = LOWER(?)" },
  practice: { table: 'business_units', column: 'name', insertSql: 'INSERT OR IGNORE INTO business_units (name) VALUES (?)', usageSql: "SELECT COUNT(*) as cnt FROM employees WHERE LOWER(TRIM(business_unit)) = LOWER(?)" },
  location: { table: 'locations', column: 'name', insertSql: 'INSERT OR IGNORE INTO locations (name) VALUES (?)', usageSql: "SELECT COUNT(*) as cnt FROM employees WHERE LOWER(TRIM(location)) = LOWER(?)" },
  current_role: { table: 'current_roles', column: 'name', insertSql: 'INSERT OR IGNORE INTO current_roles (name) VALUES (?)', usageSql: "SELECT COUNT(*) as cnt FROM employees WHERE LOWER(TRIM(current_role)) = LOWER(?)" },
  deployable_role: { table: 'deployable_roles', column: 'name', insertSql: 'INSERT OR IGNORE INTO deployable_roles (name) VALUES (?)', usageSql: "SELECT COUNT(*) as cnt FROM employee_deployable_roles WHERE LOWER(TRIM(role_name)) = LOWER(?)" },
  project: { table: 'projects', column: 'name', insertSql: 'INSERT OR IGNORE INTO projects (name) VALUES (?)', usageSql: "SELECT COUNT(*) as cnt FROM employees WHERE LOWER(TRIM(current_project)) = LOWER(?)" },
  customer: { table: 'customers', column: 'name', insertSql: 'INSERT OR IGNORE INTO customers (name) VALUES (?)', usageSql: "SELECT COUNT(*) as cnt FROM employees WHERE LOWER(TRIM(current_customer)) = LOWER(?)" },
  domain: { table: 'domains', column: 'name', insertSql: 'INSERT OR IGNORE INTO domains (name, is_standard) VALUES (?, 1)', usageSql: "SELECT COUNT(*) as cnt FROM employee_domain_expertise WHERE LOWER(TRIM(domain)) = LOWER(?)" },
  skill_category: { table: 'skill_categories', column: 'name', insertSql: 'INSERT OR IGNORE INTO skill_categories (name) VALUES (?)', usageSql: "SELECT COUNT(*) as cnt FROM employee_skills WHERE LOWER(TRIM(category)) = LOWER(?)" },
  manager: { table: 'managers', column: 'name', insertSql: null, usageSql: "SELECT COUNT(*) as cnt FROM employees WHERE LOWER(TRIM(reporting_manager)) = LOWER(?)" },
  proficiency_level: { table: 'proficiency_levels', column: 'name', insertSql: 'INSERT OR IGNORE INTO proficiency_levels (name, sort_order) VALUES (?, 0)', usageSql: "SELECT ((SELECT COUNT(*) FROM employee_skills WHERE LOWER(TRIM(proficiency)) = LOWER(?)) + (SELECT COUNT(*) FROM employee_domain_expertise WHERE LOWER(TRIM(proficiency)) = LOWER(?))) as cnt" },
  profile_status: { table: 'profile_statuses', column: 'name', insertSql: 'INSERT OR IGNORE INTO profile_statuses (name, sort_order) VALUES (?, 0)', usageSql: "SELECT COUNT(*) as cnt FROM employees WHERE LOWER(TRIM(status)) = LOWER(?)" },
};

const RENAME_CASCADE = {
  designation: [{ table: 'employees', column: 'designation' }],
  business_unit: [{ table: 'employees', column: 'business_unit' }],
  practice: [{ table: 'employees', column: 'business_unit' }],
  location: [{ table: 'employees', column: 'location' }],
  current_role: [{ table: 'employees', column: 'current_role' }],
  deployable_role: [{ table: 'employee_deployable_roles', column: 'role_name' }],
  project: [{ table: 'employees', column: 'current_project' }],
  customer: [{ table: 'employees', column: 'current_customer' }],
  domain: [{ table: 'employee_domain_expertise', column: 'domain' }],
  skill_category: [
    { table: 'employee_skills', column: 'category' },
    { table: 'skills', column: 'category' },
  ],
  proficiency_level: [
    { table: 'employee_skills', column: 'proficiency' },
    { table: 'employee_domain_expertise', column: 'proficiency' },
  ],
  profile_status: [{ table: 'employees', column: 'status' }],
};

// For DELETE cascade: clear employee values when a dropdown option is removed.
// "clear" means SET column = '' for main employee table, DELETE row for junction tables.
function cascadeDelete(type, valueName) {
  const cascades = RENAME_CASCADE[type];
  if (!cascades) return;
  for (const { table, column } of cascades) {
    if (table === 'employees') {
      db.prepare(`UPDATE ${table} SET ${column} = '' WHERE LOWER(TRIM(${column})) = LOWER(?)`).run(valueName);
    } else if (table === 'skills') {
      // Don't delete from skills catalog, only employee junction tables
      continue;
    } else {
      db.prepare(`DELETE FROM ${table} WHERE LOWER(TRIM(${column})) = LOWER(?)`).run(valueName);
    }
  }
}

function cascadeRename(type, oldValue, newValue) {
  const cascades = RENAME_CASCADE[type];
  if (!cascades) return;
  for (const { table, column } of cascades) {
    db.prepare(`UPDATE ${table} SET ${column} = ? WHERE LOWER(TRIM(${column})) = LOWER(?)`).run(newValue, oldValue);
  }
}

function getUsageCount(type, valueName) {
  const config = ALLOWED_TYPES[type];
  if (!config || !config.usageSql) return 0;
  const paramCount = (config.usageSql.match(/\?/g) || []).length;
  const params = Array(paramCount).fill(valueName);
  const usage = db.prepare(config.usageSql).get(...params);
  return usage?.cnt || 0;
}

// GET /api/dropdowns - Return all master reference lookup data for forms & filters
router.get('/', authenticateToken, (req, res) => {
  try {
    const businessUnits = db.prepare('SELECT DISTINCT TRIM(name) as name FROM business_units WHERE TRIM(name) != \'\' ORDER BY name COLLATE NOCASE ASC').all().map(r => r.name);
    const locations = db.prepare('SELECT DISTINCT TRIM(name) as name FROM locations WHERE TRIM(name) != \'\' ORDER BY name COLLATE NOCASE ASC').all().map(r => r.name);
    const designations = db.prepare('SELECT DISTINCT TRIM(name) as name FROM designations WHERE TRIM(name) != \'\' ORDER BY grade_level ASC, name COLLATE NOCASE ASC').all().map(r => r.name);
    const currentRoles = db.prepare('SELECT DISTINCT TRIM(name) as name FROM current_roles WHERE TRIM(name) != \'\' ORDER BY name COLLATE NOCASE ASC').all().map(r => r.name);
    const deployableRoles = db.prepare('SELECT DISTINCT TRIM(name) as name FROM deployable_roles WHERE TRIM(name) != \'\' ORDER BY name COLLATE NOCASE ASC').all().map(r => r.name);
    const projects = db.prepare('SELECT DISTINCT TRIM(name) as name FROM projects WHERE TRIM(name) != \'\' ORDER BY name COLLATE NOCASE ASC').all().map(r => r.name);
    const customers = db.prepare('SELECT DISTINCT TRIM(name) as name FROM customers WHERE TRIM(name) != \'\' ORDER BY name COLLATE NOCASE ASC').all().map(r => r.name);
    const managers = db.prepare('SELECT TRIM(name) as name, TRIM(email) as email FROM managers WHERE TRIM(name) != \'\' ORDER BY name COLLATE NOCASE ASC, email COLLATE NOCASE ASC').all().map(r => r.email ? `${r.name} (${r.email})` : r.name);
    const skillCategories = db.prepare('SELECT DISTINCT TRIM(name) as name FROM skill_categories WHERE TRIM(name) != \'\' ORDER BY id ASC').all().map(r => r.name);
    const domains = db.prepare('SELECT DISTINCT TRIM(name) as name FROM domains WHERE TRIM(name) != \'\' ORDER BY name COLLATE NOCASE ASC').all().map(r => r.name);
    const proficiencies = db.prepare('SELECT DISTINCT TRIM(name) as name FROM proficiency_levels WHERE TRIM(name) != \'\' ORDER BY sort_order ASC').all().map(r => r.name);
    const profileStatuses = db.prepare('SELECT DISTINCT TRIM(name) as name FROM profile_statuses WHERE TRIM(name) != \'\' ORDER BY sort_order ASC').all().map(r => r.name);

    return res.json({
      practices: businessUnits,
      businessUnits,
      locations,
      designations,
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

    const trimmed = value.trim().replace(/\s+/g, ' ');
    const config = ALLOWED_TYPES[type];
    if (!config) {
      return res.status(400).json({ error: `Invalid dropdown type: ${type}. Allowed: ${Object.keys(ALLOWED_TYPES).join(', ')}` });
    }

    if (type === 'manager') {
      const mgrMatch = trimmed.match(/^(.+?)\s*\((.+?@.+?)\)$/);
      let name = trimmed;
      let mgrEmail = email && typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : '';

      if (mgrMatch) {
        name = mgrMatch[1].trim();
        mgrEmail = mgrMatch[2].trim().toLowerCase();
      }

      if (!name) {
        return res.status(400).json({ error: 'Manager name is required' });
      }

      const existing = db.prepare(
        'SELECT id FROM managers WHERE LOWER(TRIM(name)) = LOWER(?) AND LOWER(TRIM(email)) = LOWER(?)'
      ).get(name, mgrEmail);

      if (!existing) {
        db.prepare('INSERT INTO managers (name, email) VALUES (?, ?)').run(name, mgrEmail);
      }
    } else {
      const existing = db.prepare(
        `SELECT id FROM ${config.table} WHERE LOWER(TRIM(${config.column})) = LOWER(?)`
      ).get(trimmed);

      if (!existing) {
        db.prepare(config.insertSql).run(trimmed);
      }
    }

    return res.status(201).json({ success: true, type, value: trimmed });
  } catch (err) {
    console.error('Error adding dropdown option:', err);
    return res.status(500).json({ error: 'Failed to save custom option' });
  }
});

// GET /api/dropdowns/:type - List all options with IDs for a specific master data type
router.get('/:type', authenticateToken, (req, res) => {
  try {
    const { type } = req.params;
    const config = ALLOWED_TYPES[type];
    if (!config) {
      return res.status(400).json({ error: `Invalid dropdown type: ${type}` });
    }

    let rows;
    if (type === 'manager') {
      rows = db.prepare('SELECT id, TRIM(name) as name, TRIM(email) as email FROM managers WHERE TRIM(name) != \'\' ORDER BY name COLLATE NOCASE ASC').all();
    } else if (type === 'proficiency_level') {
      rows = db.prepare('SELECT id, TRIM(name) as name, sort_order FROM proficiency_levels WHERE TRIM(name) != \'\' ORDER BY sort_order ASC').all();
    } else if (type === 'profile_status') {
      rows = db.prepare('SELECT id, TRIM(name) as name, sort_order FROM profile_statuses WHERE TRIM(name) != \'\' ORDER BY sort_order ASC').all();
    } else if (type === 'designation') {
      rows = db.prepare('SELECT id, TRIM(name) as name, grade_level FROM designations WHERE TRIM(name) != \'\' ORDER BY grade_level ASC, name COLLATE NOCASE ASC').all();
    } else {
      rows = db.prepare(`SELECT id, TRIM(${config.column}) as name FROM ${config.table} WHERE TRIM(${config.column}) != '' ORDER BY ${config.column} COLLATE NOCASE ASC`).all();
    }

    return res.json({ type, items: rows });
  } catch (err) {
    console.error('Error fetching dropdown type:', err);
    return res.status(500).json({ error: 'Failed to load master data items' });
  }
});

// GET /api/dropdowns/:type/:id/usage - Check how many employees use this value
router.get('/:type/:id/usage', authenticateToken, (req, res) => {
  try {
    const { type, id } = req.params;
    const config = ALLOWED_TYPES[type];
    if (!config) {
      return res.status(400).json({ error: `Invalid dropdown type: ${type}` });
    }

    let row;
    if (type === 'manager') {
      row = db.prepare('SELECT name, email FROM managers WHERE id = ?').get(id);
    } else {
      row = db.prepare(`SELECT ${config.column} as name FROM ${config.table} WHERE id = ?`).get(id);
    }
    if (!row) {
      return res.status(404).json({ error: 'Option not found' });
    }

    const count = getUsageCount(type, row.name);
    return res.json({ type, id: Number(id), name: row.name, usageCount: count });
  } catch (err) {
    console.error('Error checking usage:', err);
    return res.status(500).json({ error: 'Failed to check usage' });
  }
});

// PUT /api/dropdowns/:type/:id - Update (rename) a master data option
router.put('/:type/:id', authenticateToken, (req, res) => {
  try {
    const { type, id } = req.params;
    const { value, email } = req.body;
    const config = ALLOWED_TYPES[type];

    if (!config) {
      return res.status(400).json({ error: `Invalid dropdown type: ${type}` });
    }
    if (!value || typeof value !== 'string' || !value.trim()) {
      return res.status(400).json({ error: 'Non-empty value is required' });
    }

    const trimmed = value.trim().replace(/\s+/g, ' ');

    if (type === 'manager') {
      const mgrEmail = email && typeof email === 'string' ? email.trim().toLowerCase() : '';
      const existing = db.prepare('SELECT id FROM managers WHERE LOWER(TRIM(name)) = LOWER(?) AND LOWER(TRIM(email)) = LOWER(?) AND id != ?').get(trimmed, mgrEmail, id);
      if (existing) {
        return res.status(409).json({ error: 'A manager with this name and email already exists' });
      }

      const oldMgr = db.prepare('SELECT name, email FROM managers WHERE id = ?').get(id);
      db.prepare('UPDATE managers SET name = ?, email = ? WHERE id = ?').run(trimmed, mgrEmail, id);

      if (oldMgr) {
        if (oldMgr.name.trim().toLowerCase() !== trimmed.toLowerCase()) {
          db.prepare('UPDATE employees SET reporting_manager = ? WHERE LOWER(TRIM(reporting_manager)) = LOWER(?)').run(trimmed, oldMgr.name);
        }
        if (oldMgr.email !== mgrEmail) {
          db.prepare('UPDATE employees SET reporting_manager_email = ? WHERE LOWER(TRIM(reporting_manager)) = LOWER(?)').run(mgrEmail, trimmed);
        }
      }
    } else {
      const existing = db.prepare(`SELECT id FROM ${config.table} WHERE LOWER(TRIM(${config.column})) = LOWER(?) AND id != ?`).get(trimmed, id);
      if (existing) {
        return res.status(409).json({ error: `"${trimmed}" already exists in ${type}` });
      }

      const oldRow = db.prepare(`SELECT ${config.column} as name FROM ${config.table} WHERE id = ?`).get(id);
      db.prepare(`UPDATE ${config.table} SET ${config.column} = ? WHERE id = ?`).run(trimmed, id);

      if (oldRow && oldRow.name !== trimmed) {
        cascadeRename(type, oldRow.name, trimmed);
      }
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Error updating dropdown option:', err);
    return res.status(500).json({ error: 'Failed to update master data option' });
  }
});

// DELETE /api/dropdowns/:type/:id - Delete a master data option
router.delete('/:type/:id', authenticateToken, (req, res) => {
  try {
    const { type, id } = req.params;
    const config = ALLOWED_TYPES[type];

    if (!config) {
      return res.status(400).json({ error: `Invalid dropdown type: ${type}` });
    }

    let row;
    if (type === 'manager') {
      row = db.prepare('SELECT name, email FROM managers WHERE id = ?').get(id);
    } else {
      row = db.prepare(`SELECT ${config.column} as name FROM ${config.table} WHERE id = ?`).get(id);
    }
    if (!row) {
      return res.status(404).json({ error: 'Option not found' });
    }

    const usageCount = getUsageCount(type, row.name);

    // Cascade: clear value from employee records, then delete the master option
    if (usageCount > 0) {
      cascadeDelete(type, row.name);
    }

    db.prepare(`DELETE FROM ${config.table} WHERE id = ?`).run(id);

    if (usageCount > 0) {
      recalculateAllCompletion();
    }

    return res.json({ success: true, cascadedCount: usageCount });
  } catch (err) {
    console.error('Error deleting dropdown option:', err);
    return res.status(500).json({ error: 'Failed to delete master data option' });
  }
});

export default router;
