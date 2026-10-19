import { Router } from 'express';
import db from '../db/database.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import { resetDatabase } from '../db/seed.js';

const router = Router();

// Helper to assemble full employee object from SQLite tables
function hydrateEmployee(empRow) {
  if (!empRow) return null;

  // Fetch deployable roles
  const deployableRoles = db.prepare(`
    SELECT role_name FROM employee_deployable_roles WHERE employee_id = ?
  `).all(empRow.id).map(r => r.role_name);

  // Fetch technical skills
  const technicalSkills = db.prepare(`
    SELECT id, skill_name as name, category, proficiency, experience_years as experienceYears, 
           last_used as lastUsed, last_project as lastProject, specialization
    FROM employee_skills
    WHERE employee_id = ?
    ORDER BY category ASC, skill_name ASC
  `).all(empRow.id);

  // Fetch immediate technologies
  const immediateTechnologies = db.prepare(`
    SELECT technology_name FROM employee_immediate_technologies WHERE employee_id = ?
  `).all(empRow.id).map(r => r.technology_name);

  // Fetch learning technologies
  const learningTechnologies = db.prepare(`
    SELECT technology_name FROM employee_learning_technologies WHERE employee_id = ?
  `).all(empRow.id).map(r => r.technology_name);

  // Fetch domain expertise
  const domainExpertise = db.prepare(`
    SELECT id, domain, custom_domain as customDomain, experience_years as experienceYears,
           proficiency, last_used as lastUsed, last_project as lastProject, specialization
    FROM employee_domain_expertise
    WHERE employee_id = ?
  `).all(empRow.id);

  return {
    id: empRow.id,
    name: empRow.name || '',
    email: empRow.email || '',
    designation: empRow.designation || '',
    businessUnit: empRow.business_unit || '',
    reportingManager: empRow.reporting_manager || '',
    reportingManagerEmail: empRow.reporting_manager_email || '',
    currentProject: empRow.current_project || '',
    currentCustomer: empRow.current_customer || '',
    location: empRow.location || '',
    totalExperience: Number(empRow.total_experience) || 0,
    currentRole: empRow.current_role || '',
    owlSureDesignation: empRow.owlsure_designation || '',
    profileCompletion: Number(empRow.profile_completion) || 0,
    status: empRow.status || '',
    avatarColor: empRow.avatar_color || 'bg-blue-100 text-[#1265FF]',
    updatedAt: empRow.updated_at || '',
    deployableRoles: deployableRoles || [],
    technicalSkills: (technicalSkills || []).map(s => ({
      id: s.id,
      name: s.name || '',
      category: s.category || '',
      proficiency: s.proficiency || '',
      experienceYears: Number(s.experienceYears) || 0,
      lastUsed: s.lastUsed || '',
      lastProject: s.lastProject || '',
      specialization: s.specialization || ''
    })),
    immediateTechnologies: immediateTechnologies || [],
    learningTechnologies: learningTechnologies || [],
    domainExpertise: (domainExpertise || []).map(d => ({
      id: d.id,
      domain: d.domain || '',
      customDomain: d.customDomain || '',
      experienceYears: Number(d.experienceYears) || 0,
      proficiency: d.proficiency || '',
      lastUsed: d.lastUsed || '',
      lastProject: d.lastProject || '',
      specialization: d.specialization || ''
    })),
  };
}

// Calculate profile completion percentage accurately
function calculateCompletion(emp) {
  let score = 0;
  const max = 10;
  if (emp.id && emp.name) score += 2;
  if (emp.email) score += 1;
  if (emp.designation) score += 1;
  if (emp.businessUnit) score += 1;
  if (emp.reportingManager) score += 1;
  if (emp.currentProject) score += 1;
  if (emp.location) score += 1;
  if (emp.deployableRoles && emp.deployableRoles.length > 0) score += 1;
  if (emp.technicalSkills && emp.technicalSkills.length > 0) score += 1;

  return Math.min(100, Math.round((score / max) * 100));
}

// Automatically save custom user-entered fields into SQLite master lookup tables
function autoRecordMasterLookups(emp) {
  if (emp.designation && emp.designation.trim() && emp.designation !== '__OTHER__' && emp.designation.toLowerCase() !== 'other') {
    db.prepare('INSERT OR IGNORE INTO designations (name) VALUES (?)').run(emp.designation.trim());
  }
  if (emp.businessUnit && emp.businessUnit.trim() && emp.businessUnit !== '__OTHER__' && emp.businessUnit.toLowerCase() !== 'other') {
    db.prepare('INSERT OR IGNORE INTO business_units (name) VALUES (?)').run(emp.businessUnit.trim());
  }
  if (emp.location && emp.location.trim() && emp.location !== '__OTHER__' && emp.location.toLowerCase() !== 'other') {
    db.prepare('INSERT OR IGNORE INTO locations (name) VALUES (?)').run(emp.location.trim());
  }
  if (emp.currentRole && emp.currentRole.trim() && emp.currentRole !== '__OTHER__' && emp.currentRole.toLowerCase() !== 'other') {
    db.prepare('INSERT OR IGNORE INTO current_roles (name) VALUES (?)').run(emp.currentRole.trim());
  }
  if (emp.owlSureDesignation && emp.owlSureDesignation.trim() && emp.owlSureDesignation !== '__OTHER__' && emp.owlSureDesignation.toLowerCase() !== 'other') {
    db.prepare('INSERT OR IGNORE INTO owlsure_designations (name) VALUES (?)').run(emp.owlSureDesignation.trim());
  }
  let managerName = (emp.reportingManager || '').trim();
  let managerEmail = (emp.reportingManagerEmail || '').trim();
  const mgrMatch = managerName.match(/^(.+?)\s*\((.+?@.+?)\)$/);
  if (mgrMatch) {
    managerName = mgrMatch[1].trim();
    if (!managerEmail) {
      managerEmail = mgrMatch[2].trim();
    }
  }
  if (managerName && managerName !== '__OTHER__' && managerName.toLowerCase() !== 'other') {
    db.prepare('INSERT OR IGNORE INTO managers (name, email) VALUES (?, ?)').run(managerName, managerEmail);
  }
  if (emp.currentProject && emp.currentProject.trim() && emp.currentProject !== '__OTHER__' && emp.currentProject.toLowerCase() !== 'other') {
    db.prepare('INSERT OR IGNORE INTO projects (name) VALUES (?)').run(emp.currentProject.trim());
  }
  if (emp.currentCustomer && emp.currentCustomer.trim() && emp.currentCustomer !== '__OTHER__' && emp.currentCustomer.toLowerCase() !== 'other') {
    db.prepare('INSERT OR IGNORE INTO customers (name) VALUES (?)').run(emp.currentCustomer.trim());
  }
  if (Array.isArray(emp.deployableRoles)) {
    const insertDeployable = db.prepare('INSERT OR IGNORE INTO deployable_roles (name) VALUES (?)');
    emp.deployableRoles.forEach(r => {
      if (r && r.trim() && r !== '__OTHER__' && r.toLowerCase() !== 'other') insertDeployable.run(r.trim());
    });
  }
  if (Array.isArray(emp.technicalSkills)) {
    const insertGlobalSkill = db.prepare('INSERT OR IGNORE INTO skills (id, name, slug, category, description, is_verified) VALUES (?, ?, ?, ?, ?, 1)');
    emp.technicalSkills.forEach(s => {
      if (s && s.name && s.name.trim() && s.name !== '__OTHER__' && s.name.toLowerCase() !== 'other') {
        if (!s.category || !s.category.trim()) return;
        const slug = s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const skillId = 'skill_' + slug;
        insertGlobalSkill.run(skillId, s.name.trim(), slug, s.category.trim(), '');
      }
    });
  }
  if (Array.isArray(emp.domainExpertise)) {
    const insertDomain = db.prepare('INSERT OR IGNORE INTO domains (name, is_standard) VALUES (?, 1)');
    emp.domainExpertise.forEach(d => {
      const domName = (d.domain === 'Others' ? d.customDomain : d.domain) || '';
      if (domName && domName.trim() && domName.toLowerCase() !== 'others' && domName.toLowerCase() !== 'other' && domName !== '__OTHER__') {
        insertDomain.run(domName.trim());
      }
    });
  }
}

// GET /api/employees - List all employees with filtering
router.get('/', authenticateToken, (req, res) => {
  try {
    const { search, practice, location, proficiency, profileStatus, minExperience, domain, manager } = req.query;

    let query = 'SELECT * FROM employees WHERE 1=1';
    const params = [];

    if (search && search.trim() !== '') {
      const q = `%${search.trim().toLowerCase()}%`;
      query += ` AND (
        LOWER(name) LIKE ? OR
        LOWER(id) LIKE ? OR
        LOWER(designation) LIKE ? OR
        LOWER(email) LIKE ? OR
        LOWER(reporting_manager) LIKE ? OR
        id IN (SELECT employee_id FROM employee_skills WHERE LOWER(skill_name) LIKE ?) OR
        id IN (SELECT employee_id FROM employee_domain_expertise WHERE LOWER(domain) LIKE ? OR LOWER(custom_domain) LIKE ?)
      )`;
      params.push(q, q, q, q, q, q, q, q);
    }

    if (manager && manager !== 'All') {
      query += ' AND LOWER(reporting_manager) LIKE ?';
      params.push(`%${manager.toLowerCase()}%`);
    }

    if (practice && practice !== 'All') {
      query += ' AND LOWER(business_unit) LIKE ?';
      params.push(`%${practice.toLowerCase()}%`);
    }

    if (location && location !== 'All') {
      query += ' AND location = ?';
      params.push(location);
    }

    if (profileStatus && profileStatus !== 'All') {
      query += ' AND status = ?';
      params.push(profileStatus);
    }

    if (minExperience && Number(minExperience) > 0) {
      query += ' AND total_experience >= ?';
      params.push(Number(minExperience));
    }

    query += ' ORDER BY id ASC';

    let empRows = db.prepare(query).all(...params);

    // If proficiency filter is applied, filter by employee_skills
    if (proficiency && proficiency !== 'All') {
      const empIdsWithProficiency = db.prepare(`
        SELECT DISTINCT employee_id FROM employee_skills WHERE proficiency = ?
      `).all(proficiency).map(r => r.employee_id);

      empRows = empRows.filter(r => empIdsWithProficiency.includes(r.id));
    }

    // If domain filter is applied, filter by employee_domain_expertise
    if (domain && domain !== 'All') {
      const empIdsWithDomain = db.prepare(`
        SELECT DISTINCT employee_id FROM employee_domain_expertise 
        WHERE LOWER(domain) = LOWER(?) OR LOWER(custom_domain) = LOWER(?)
      `).all(domain, domain).map(r => r.employee_id);

      empRows = empRows.filter(r => empIdsWithDomain.includes(r.id));
    }

    // Hydrate child arrays
    const employees = empRows.map(hydrateEmployee);

    return res.json({ employees, total: employees.length });
  } catch (err) {
    console.error('Error fetching employees:', err);
    return res.status(500).json({ error: 'Failed to retrieve employees' });
  }
});

// GET /api/employees/:id - Single employee profile
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const empRow = db.prepare('SELECT * FROM employees WHERE LOWER(id) = LOWER(?)').get(req.params.id);
    if (!empRow) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    return res.json({ employee: hydrateEmployee(empRow) });
  } catch (err) {
    console.error('Error fetching employee:', err);
    return res.status(500).json({ error: 'Failed to retrieve employee profile' });
  }
});

// POST /api/employees - Create new employee (Protected: employee:create)
router.post('/', authenticateToken, requirePermission('employee:create'), (req, res) => {
  const emp = req.body;

  if (!emp.id || typeof emp.id !== 'string' || !emp.id.trim()) {
    return res.status(400).json({ error: 'Employee ID is required' });
  }

  const normalizedId = emp.id.trim().toUpperCase();
  if (/\s/.test(normalizedId)) {
    return res.status(400).json({ error: 'Employee ID must not contain spaces' });
  }

  if (!emp.name || typeof emp.name !== 'string' || !emp.name.trim()) {
    return res.status(400).json({ error: 'Employee Name is required' });
  }

  if (!emp.email || typeof emp.email !== 'string' || !emp.email.trim()) {
    return res.status(400).json({ error: 'Employee Email is required' });
  }

  const trimmedEmail = emp.email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return res.status(400).json({ error: 'Valid work email address is required' });
  }

  const existingId = db.prepare('SELECT id FROM employees WHERE id = ?').get(normalizedId);
  if (existingId) {
    return res.status(409).json({ error: `Employee with ID "${normalizedId}" already exists` });
  }

  const existingEmail = db.prepare('SELECT id FROM employees WHERE LOWER(email) = LOWER(?)').get(trimmedEmail);
  if (existingEmail) {
    return res.status(409).json({ error: 'Another employee with this email already exists' });
  }

  const completion = calculateCompletion(emp);
  const computedStatus = completion >= 85 ? 'Complete' : (completion >= 65 ? 'In Progress' : 'Needs Review');
  const updatedAt = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  let managerName = (emp.reportingManager || '').trim();
  let managerEmail = (emp.reportingManagerEmail || '').trim();
  const mgrMatch = managerName.match(/^(.+?)\s*\((.+?@.+?)\)$/);
  if (mgrMatch) {
    managerName = mgrMatch[1].trim();
    if (!managerEmail) {
      managerEmail = mgrMatch[2].trim();
    }
  }

  const createTransaction = db.transaction(() => {
    // 1. Insert main employee
    db.prepare(`
      INSERT INTO employees (
        id, name, email, designation, business_unit, reporting_manager, reporting_manager_email,
        current_project, current_customer, location, total_experience,
        current_role, owlsure_designation, profile_completion, status,
        avatar_color, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      normalizedId,
      emp.name.trim(),
      trimmedEmail,
      (emp.designation || '').trim(),
      (emp.businessUnit || '').trim(),
      managerName,
      managerEmail,
      (emp.currentProject || '').trim(),
      (emp.currentCustomer || '').trim(),
      (emp.location || '').trim(),
      Number(emp.totalExperience) || 0.0,
      (emp.currentRole || '').trim(),
      (emp.owlSureDesignation || '').trim(),
      completion,
      computedStatus,
      emp.avatarColor || 'bg-blue-100 text-[#1265FF]',
      updatedAt
    );

    // Auto-record all custom entered fields into master SQLite lookup tables
    autoRecordMasterLookups({ ...emp, reportingManager: managerName, reportingManagerEmail: managerEmail });

    // 2. Deployable roles
    if (Array.isArray(emp.deployableRoles)) {
      const insertRole = db.prepare('INSERT OR IGNORE INTO employee_deployable_roles (employee_id, role_name) VALUES (?, ?)');
      emp.deployableRoles.forEach(r => {
        if (r && typeof r === 'string' && r.trim()) {
          insertRole.run(normalizedId, r.trim());
        }
      });
    }

    // 3. Technical skills
    if (Array.isArray(emp.technicalSkills)) {
      const insertSkill = db.prepare(`
        INSERT OR REPLACE INTO employee_skills (
          id, employee_id, skill_name, category, proficiency, experience_years, last_used, last_project, specialization
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      emp.technicalSkills.forEach(s => {
        const skillName = (s && (s.name || s.skill) ? (s.name || s.skill) : '').trim();
        if (skillName) {
          const skillId = s.id || `s_${Math.random().toString(36).substring(2, 8)}`;
          insertSkill.run(
            skillId, normalizedId, skillName, (s.category || '').trim(), (s.proficiency || '').trim(),
            Number(s.experienceYears) || 0, (s.lastUsed || '').trim(), (s.lastProject || '').trim(), (s.specialization || '').trim()
          );
        }
      });
    }

    // 4. Immediate technologies
    if (Array.isArray(emp.immediateTechnologies)) {
      const insertImm = db.prepare('INSERT OR IGNORE INTO employee_immediate_technologies (employee_id, technology_name) VALUES (?, ?)');
      emp.immediateTechnologies.forEach(t => {
        if (t && typeof t === 'string' && t.trim()) {
          insertImm.run(normalizedId, t.trim());
        }
      });
    }

    // 5. Learning technologies
    if (Array.isArray(emp.learningTechnologies)) {
      const insertLearn = db.prepare('INSERT OR IGNORE INTO employee_learning_technologies (employee_id, technology_name) VALUES (?, ?)');
      emp.learningTechnologies.forEach(t => {
        if (t && typeof t === 'string' && t.trim()) {
          insertLearn.run(normalizedId, t.trim());
        }
      });
    }

    // 6. Domain expertise
    if (Array.isArray(emp.domainExpertise)) {
      const insertDomain = db.prepare(`
        INSERT OR REPLACE INTO employee_domain_expertise (
          id, employee_id, domain, custom_domain, experience_years, proficiency, last_used, last_project, specialization
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      emp.domainExpertise.forEach(d => {
        if (d && (d.domain || d.customDomain)) {
          const domainId = d.id || `d_${Math.random().toString(36).substring(2, 8)}`;
          insertDomain.run(
            domainId, normalizedId, (d.domain || '').trim(), (d.customDomain || '').trim(),
            Number(d.experienceYears) || 0, (d.proficiency || '').trim(),
            (d.lastUsed || '').trim(), (d.lastProject || '').trim(), (d.specialization || '').trim()
          );
        }
      });
    }
  });

  try {
    createTransaction();
    const created = db.prepare('SELECT * FROM employees WHERE id = ?').get(normalizedId);
    return res.status(201).json({ employee: hydrateEmployee(created), message: 'Employee profile created successfully' });
  } catch (err) {
    console.error('Error creating employee:', err);
    return res.status(500).json({ error: 'Failed to create employee profile in database' });
  }
});

// PUT /api/employees/:id - Update employee (Protected: employee:update)
router.put('/:id', authenticateToken, requirePermission('employee:update'), (req, res) => {
  const { id } = req.params;
  const emp = req.body;

  const existing = db.prepare('SELECT * FROM employees WHERE LOWER(id) = LOWER(?)').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Employee not found' });
  }
  const storedId = existing.id;

  if (!emp.name || typeof emp.name !== 'string' || !emp.name.trim()) {
    return res.status(400).json({ error: 'Employee Name is required' });
  }

  if (!emp.email || typeof emp.email !== 'string' || !emp.email.trim()) {
    return res.status(400).json({ error: 'Employee Email is required' });
  }

  const trimmedEmail = emp.email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return res.status(400).json({ error: 'Valid work email address is required' });
  }

  // Check if another employee already uses this email
  const existingEmail = db.prepare('SELECT id FROM employees WHERE LOWER(email) = LOWER(?) AND id != ?').get(trimmedEmail, storedId);
  if (existingEmail) {
    return res.status(409).json({ error: 'Another employee with this email already exists' });
  }

  const completion = calculateCompletion(emp);
  const computedStatus = completion >= 85 ? 'Complete' : (completion >= 65 ? 'In Progress' : 'Needs Review');
  const updatedAt = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  let managerName = (emp.reportingManager || '').trim();
  let managerEmail = (emp.reportingManagerEmail || '').trim();
  const mgrMatch = managerName.match(/^(.+?)\s*\((.+?@.+?)\)$/);
  if (mgrMatch) {
    managerName = mgrMatch[1].trim();
    if (!managerEmail) {
      managerEmail = mgrMatch[2].trim();
    }
  }

  const updateTransaction = db.transaction(() => {
    // 1. Update main employee using storedId
    db.prepare(`
      UPDATE employees SET
        name = ?, email = ?, designation = ?, business_unit = ?, reporting_manager = ?, reporting_manager_email = ?,
        current_project = ?, current_customer = ?, location = ?, total_experience = ?,
        current_role = ?, owlsure_designation = ?, profile_completion = ?, status = ?,
        avatar_color = ?, updated_at = ?
      WHERE id = ?
    `).run(
      emp.name.trim(),
      trimmedEmail,
      (emp.designation || '').trim(),
      (emp.businessUnit || '').trim(),
      managerName,
      managerEmail,
      (emp.currentProject || '').trim(),
      (emp.currentCustomer || '').trim(),
      (emp.location || '').trim(),
      Number(emp.totalExperience) || 0.0,
      (emp.currentRole || '').trim(),
      (emp.owlSureDesignation || '').trim(),
      completion,
      computedStatus,
      emp.avatarColor || existing.avatar_color || 'bg-blue-100 text-[#1265FF]',
      updatedAt,
      storedId
    );

    // Auto-record all custom entered fields into master SQLite lookup tables
    autoRecordMasterLookups({ ...emp, reportingManager: managerName, reportingManagerEmail: managerEmail });

    // 2. Refresh deployable roles using storedId
    db.prepare('DELETE FROM employee_deployable_roles WHERE employee_id = ?').run(storedId);
    if (Array.isArray(emp.deployableRoles)) {
      const insertRole = db.prepare('INSERT OR IGNORE INTO employee_deployable_roles (employee_id, role_name) VALUES (?, ?)');
      emp.deployableRoles.forEach(r => {
        if (r && typeof r === 'string' && r.trim()) {
          insertRole.run(storedId, r.trim());
        }
      });
    }

    // 3. Refresh technical skills using storedId
    db.prepare('DELETE FROM employee_skills WHERE employee_id = ?').run(storedId);
    if (Array.isArray(emp.technicalSkills)) {
      const insertSkill = db.prepare(`
        INSERT OR REPLACE INTO employee_skills (
          id, employee_id, skill_name, category, proficiency, experience_years, last_used, last_project, specialization
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      emp.technicalSkills.forEach(s => {
        const skillName = (s && (s.name || s.skill) ? (s.name || s.skill) : '').trim();
        if (skillName) {
          const skillId = s.id || `s_${Math.random().toString(36).substring(2, 8)}`;
          insertSkill.run(
            skillId, storedId, skillName, (s.category || '').trim(), (s.proficiency || '').trim(),
            Number(s.experienceYears) || 0, (s.lastUsed || '').trim(), (s.lastProject || '').trim(), (s.specialization || '').trim()
          );
        }
      });
    }

    // 4. Refresh immediate technologies using storedId
    db.prepare('DELETE FROM employee_immediate_technologies WHERE employee_id = ?').run(storedId);
    if (Array.isArray(emp.immediateTechnologies)) {
      const insertImm = db.prepare('INSERT OR IGNORE INTO employee_immediate_technologies (employee_id, technology_name) VALUES (?, ?)');
      emp.immediateTechnologies.forEach(t => {
        if (t && typeof t === 'string' && t.trim()) {
          insertImm.run(storedId, t.trim());
        }
      });
    }

    // 5. Refresh learning technologies using storedId
    db.prepare('DELETE FROM employee_learning_technologies WHERE employee_id = ?').run(storedId);
    if (Array.isArray(emp.learningTechnologies)) {
      const insertLearn = db.prepare('INSERT OR IGNORE INTO employee_learning_technologies (employee_id, technology_name) VALUES (?, ?)');
      emp.learningTechnologies.forEach(t => {
        if (t && typeof t === 'string' && t.trim()) {
          insertLearn.run(storedId, t.trim());
        }
      });
    }

    // 6. Refresh domain expertise using storedId
    db.prepare('DELETE FROM employee_domain_expertise WHERE employee_id = ?').run(storedId);
    if (Array.isArray(emp.domainExpertise)) {
      const insertDomain = db.prepare(`
        INSERT OR REPLACE INTO employee_domain_expertise (
          id, employee_id, domain, custom_domain, experience_years, proficiency, last_used, last_project, specialization
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      emp.domainExpertise.forEach(d => {
        if (d && (d.domain || d.customDomain)) {
          const domainId = d.id || `d_${Math.random().toString(36).substring(2, 8)}`;
          insertDomain.run(
            domainId, storedId, (d.domain || '').trim(), (d.customDomain || '').trim(),
            Number(d.experienceYears) || 0, (d.proficiency || '').trim(),
            (d.lastUsed || '').trim(), (d.lastProject || '').trim(), (d.specialization || '').trim()
          );
        }
      });
    }
  });

  try {
    updateTransaction();
    const updated = db.prepare('SELECT * FROM employees WHERE id = ?').get(storedId);
    return res.json({ employee: hydrateEmployee(updated), message: 'Employee profile updated successfully' });
  } catch (err) {
    console.error('Error updating employee:', err);
    return res.status(500).json({ error: 'Failed to update employee profile in database' });
  }
});

// DELETE /api/employees/:id - Delete employee (Protected: employee:delete)
router.delete('/:id', authenticateToken, requirePermission('employee:delete'), (req, res) => {
  const { id } = req.params;

  try {
    const result = db.prepare('DELETE FROM employees WHERE LOWER(id) = LOWER(?)').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    return res.json({ message: `Employee ${id} deleted successfully from database` });
  } catch (err) {
    console.error('Error deleting employee:', err);
    return res.status(500).json({ error: 'Failed to delete employee' });
  }
});

// POST /api/employees/reset - Reset system to clean state (Protected: system:reset)
router.post('/reset', authenticateToken, requirePermission('system:reset'), (req, res) => {
  const ALLOW_SYSTEM_RESET = process.env.ALLOW_SYSTEM_RESET === 'true';
  if (!ALLOW_SYSTEM_RESET) {
    return res.status(403).json({ error: 'System reset is disabled on this server' });
  }

  try {
    resetDatabase();
    const count = db.prepare('SELECT count(*) as count FROM employees').get().count;
    return res.json({ message: 'All database tables reset to baseline state', total: count });
  } catch (err) {
    console.error('Error resetting database:', err);
    return res.status(500).json({ error: 'Failed to reset database' });
  }
});

export default router;
