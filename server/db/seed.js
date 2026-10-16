import db from './database.js';

export function seedDatabase() {
  console.log('Seeding SQLite database with roles, permissions, reference data, and skills catalog...');

  const runSeed = db.transaction(() => {
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

export function resetDatabase() {
  const runReset = db.transaction(() => {
    db.exec('DELETE FROM employee_skills');
    db.exec('DELETE FROM employee_deployable_roles');
    db.exec('DELETE FROM employee_immediate_technologies');
    db.exec('DELETE FROM employee_learning_technologies');
    db.exec('DELETE FROM employee_domain_expertise');
    db.exec('DELETE FROM employees');
    db.exec('DELETE FROM users');
    db.exec('DELETE FROM skills');
    db.exec('DELETE FROM business_units');
    db.exec('DELETE FROM locations');
    db.exec('DELETE FROM designations');
    db.exec('DELETE FROM owlsure_designations');
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
