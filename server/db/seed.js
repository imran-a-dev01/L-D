import db, { transaction } from './database.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SEED_DATA_PATH = path.join(__dirname, 'seed-data.json');

export function seedDatabase() {
  console.log('Seeding SQLite database with roles, permissions, reference data, and skills catalog...');

  const runSeed = transaction(() => {
    // ------------------------------------------------------------------------
    // 1. Seed Roles & Permissions (RBAC)
    // ------------------------------------------------------------------------
    const insertRole = db.prepare('INSERT OR IGNORE INTO roles (id, name, description) VALUES (?, ?, ?)');
    insertRole.run('SUPER_ADMIN', 'Super Administrator', 'Full access to all modules, users, workforce and system settings');
    insertRole.run('LND_ADMIN', 'L&D Administrator', 'Can manage employees, skill taxonomy, directory export and reviews');
    insertRole.run('PRACTICE_LEAD', 'Practice Lead', 'Can review practice workforce, propose skills and view directory');
    insertRole.run('EMPLOYEE', 'Employee', 'Can view self profile, update self skills and request competency evaluations');

    const insertPermission = db.prepare('INSERT OR IGNORE INTO permissions (id, module, description) VALUES (?, ?, ?)');
    const permissions = [
      ['employee:create', 'WORKFORCE', 'Add new employees to the enterprise directory'],
      ['employee:read', 'WORKFORCE', 'View enterprise employee profiles and directories'],
      ['employee:update', 'WORKFORCE', 'Edit employee designations, roles and skills'],
      ['employee:delete', 'WORKFORCE', 'Delete employee records from directory'],
      ['employee:export', 'WORKFORCE', 'Export workforce directory to CSV'],
      ['skill:manage', 'TAXONOMY', 'Create, update or delete skills in global catalog'],
      ['skill:view', 'TAXONOMY', 'Browse enterprise skill intelligence matrix'],
      ['rbac:manage', 'SYSTEM', 'Manage user roles and access control policies'],
      ['system:reset', 'SYSTEM', 'Reset system to baseline state'],
    ];
    for (const [id, mod, desc] of permissions) {
      insertPermission.run(id, mod, desc);
    }

    const insertRolePerm = db.prepare('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)');
    for (const [id] of permissions) { insertRolePerm.run('SUPER_ADMIN', id); }
    for (const [id] of permissions) {
      if (id !== 'rbac:manage' && id !== 'system:reset') insertRolePerm.run('LND_ADMIN', id);
    }
    insertRolePerm.run('PRACTICE_LEAD', 'employee:read');
    insertRolePerm.run('PRACTICE_LEAD', 'employee:update');
    insertRolePerm.run('PRACTICE_LEAD', 'employee:export');
    insertRolePerm.run('PRACTICE_LEAD', 'skill:view');
    insertRolePerm.run('EMPLOYEE', 'employee:read');
    insertRolePerm.run('EMPLOYEE', 'skill:view');

    // ------------------------------------------------------------------------
    // 2. Master System Reference (Only structural metadata, NO hardcoded user dropdown options)
    // All dropdown options (designations, practices, locations, roles, projects,
    // customers, managers, domains, skills) start 100% empty and are dynamically
    // populated exclusively by user entries saved to the SQLite database.
    // ------------------------------------------------------------------------
    const insertCat = db.prepare('INSERT OR IGNORE INTO skill_categories (name) VALUES (?)');
    ['Frontend', 'Backend', 'Database', 'Cloud', 'Data', 'DevOps & Tools', 'Domain Expertise']
      .forEach((name) => insertCat.run(name));

    const insertProfLevel = db.prepare('INSERT OR IGNORE INTO proficiency_levels (name, sort_order) VALUES (?, ?)');
    [['Beginner', 1], ['Intermediate', 2], ['Advanced', 3], ['Expert', 4]]
      .forEach(([name, order]) => insertProfLevel.run(name, order));

    const insertProfileStatus = db.prepare('INSERT OR IGNORE INTO profile_statuses (name, sort_order) VALUES (?, ?)');
    [['Complete', 1], ['In Progress', 2], ['Needs Review', 3]]
      .forEach(([name, order]) => insertProfileStatus.run(name, order));

    console.log('Successfully seeded system roles, permissions, categories and scales (No hardcoded dropdown seed data).');
  });

  runSeed();
}

export function importSeedData() {
  if (!fs.existsSync(SEED_DATA_PATH)) return;

  const empCount = db.prepare('SELECT COUNT(*) as count FROM employees').get();
  if (empCount && empCount.count > 0) return;

  console.log('[Setup] Importing data from seed-data.json...');
  const data = JSON.parse(fs.readFileSync(SEED_DATA_PATH, 'utf-8'));

  const runImport = transaction(() => {
    const tables = [
      { key: 'business_units', cols: ['id', 'name'] },
      { key: 'locations', cols: ['id', 'name'] },
      { key: 'designations', cols: ['id', 'name', 'grade_level'] },
      { key: 'current_roles', cols: ['id', 'name'] },
      { key: 'deployable_roles', cols: ['id', 'name'] },
      { key: 'projects', cols: ['id', 'name'] },
      { key: 'customers', cols: ['id', 'name'] },
      { key: 'managers', cols: ['id', 'name', 'email'] },
      { key: 'domains', cols: ['id', 'name', 'is_standard'] },
    ];

    for (const { key, cols } of tables) {
      if (!data[key]) continue;
      const placeholders = cols.map(() => '?').join(', ');
      const stmt = db.prepare(`INSERT OR IGNORE INTO ${key} (${cols.join(', ')}) VALUES (${placeholders})`);
      for (const row of data[key]) stmt.run(...cols.map(c => row[c]));
    }

    if (data.skills) {
      const stmt = db.prepare('INSERT OR IGNORE INTO skills (id, name, slug, category, description, is_verified) VALUES (?, ?, ?, ?, ?, ?)');
      for (const r of data.skills) stmt.run(r.id, r.name, r.slug, r.category, r.description, r.is_verified);
    }

    if (data.employees) {
      const stmt = db.prepare(`INSERT OR IGNORE INTO employees
        (id, name, email, designation, business_unit, reporting_manager, reporting_manager_email, current_project, current_customer, location, total_experience, current_role, profile_completion, status, avatar_color)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      for (const r of data.employees) stmt.run(r.id, r.name, r.email, r.designation, r.business_unit, r.reporting_manager, r.reporting_manager_email, r.current_project, r.current_customer, r.location, r.total_experience, r.current_role, r.profile_completion, r.status, r.avatar_color);
    }

    if (data.employee_skills) {
      const stmt = db.prepare(`INSERT OR IGNORE INTO employee_skills
        (id, employee_id, skill_name, category, proficiency, experience_years, last_used, last_project, specialization)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      for (const r of data.employee_skills) stmt.run(r.id, r.employee_id, r.skill_name, r.category, r.proficiency, r.experience_years, r.last_used, r.last_project, r.specialization);
    }

    if (data.employee_deployable_roles) {
      const stmt = db.prepare('INSERT OR IGNORE INTO employee_deployable_roles (employee_id, role_name) VALUES (?, ?)');
      for (const r of data.employee_deployable_roles) stmt.run(r.employee_id, r.role_name);
    }

    if (data.employee_immediate_technologies) {
      const stmt = db.prepare('INSERT OR IGNORE INTO employee_immediate_technologies (employee_id, technology_name) VALUES (?, ?)');
      for (const r of data.employee_immediate_technologies) stmt.run(r.employee_id, r.technology_name);
    }

    if (data.employee_learning_technologies) {
      const stmt = db.prepare('INSERT OR IGNORE INTO employee_learning_technologies (employee_id, technology_name) VALUES (?, ?)');
      for (const r of data.employee_learning_technologies) stmt.run(r.employee_id, r.technology_name);
    }

    if (data.employee_domain_expertise) {
      const stmt = db.prepare(`INSERT OR IGNORE INTO employee_domain_expertise
        (id, employee_id, domain, custom_domain, experience_years, proficiency, last_used, last_project, specialization)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      for (const r of data.employee_domain_expertise) stmt.run(r.id, r.employee_id, r.domain, r.custom_domain, r.experience_years, r.proficiency, r.last_used, r.last_project, r.specialization);
    }

    if (data.users) {
      const DEFAULT_PASSWORD = 'Valuemomentum@2026';
      const stmt = db.prepare(`INSERT OR IGNORE INTO users (id, name, email, password_hash, role_id, employee_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)`);
      for (const r of data.users) {
        const hash = r.password_hash || bcrypt.hashSync(DEFAULT_PASSWORD, 10);
        stmt.run(r.id, r.name, r.email, hash, r.role_id, r.employee_id, r.status);
      }
    }
  });

  runImport();
  const imported = db.prepare('SELECT COUNT(*) as count FROM employees').get();
  console.log(`[Setup] Imported ${imported.count} employees from seed-data.json.`);
}

export function resetDatabase() {
  const runReset = transaction(() => {
    db.exec('DELETE FROM employee_skills');
    db.exec('DELETE FROM employee_deployable_roles');
    db.exec('DELETE FROM employee_immediate_technologies');
    db.exec('DELETE FROM employee_learning_technologies');
    db.exec('DELETE FROM employee_domain_expertise');
    db.exec('DELETE FROM employees');
    // Keep users intact so active authentication sessions remain valid
    db.exec('DELETE FROM skills');
    db.exec('DELETE FROM business_units');
    db.exec('DELETE FROM locations');
    db.exec('DELETE FROM designations');
    db.exec('DELETE FROM current_roles');
    db.exec('DELETE FROM deployable_roles');
    db.exec('DELETE FROM projects');
    db.exec('DELETE FROM customers');
    db.exec('DELETE FROM managers');
    db.exec('DELETE FROM skill_categories');
    db.exec('DELETE FROM domains');
    db.exec('DELETE FROM proficiency_levels');
    db.exec('DELETE FROM profile_statuses');
    db.exec('DELETE FROM daily_snapshots');
  });
  runReset();
  seedDatabase();
}

// Auto-seed reference data if roles table is empty
try {
  const result = db.prepare('SELECT count(*) as count FROM roles').get();
  if (!result || result.count === 0) {
    seedDatabase();
  } else {
    const empCount = db.prepare('SELECT count(*) as count FROM employees').get();
    const userCount = db.prepare('SELECT count(*) as count FROM users').get();
    console.log(`SQLite database ready. ${empCount.count} employees, ${userCount.count} users, roles/permissions/reference data present.`);
  }
} catch (e) {
  console.log('Initializing database tables and running seed...', e.message);
  seedDatabase();
}

importSeedData();
