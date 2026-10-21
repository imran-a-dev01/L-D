import db from '../db/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT = path.join(__dirname, '..', 'db', 'seed-data.json');

const data = {
  business_units: db.prepare('SELECT id, name FROM business_units').all(),
  locations: db.prepare('SELECT id, name FROM locations').all(),
  designations: db.prepare('SELECT id, name, grade_level FROM designations').all(),
  owlsure_designations: db.prepare('SELECT id, name FROM owlsure_designations').all(),
  current_roles: db.prepare('SELECT id, name FROM current_roles').all(),
  deployable_roles: db.prepare('SELECT id, name FROM deployable_roles').all(),
  projects: db.prepare('SELECT id, name FROM projects').all(),
  customers: db.prepare('SELECT id, name FROM customers').all(),
  managers: db.prepare('SELECT id, name, email FROM managers').all(),
  domains: db.prepare('SELECT id, name, is_standard FROM domains').all(),
  skills: db.prepare('SELECT id, name, slug, category, description, is_verified FROM skills').all(),
  employees: db.prepare(`SELECT id, name, email, designation, business_unit, reporting_manager, reporting_manager_email,
    current_project, current_customer, location, total_experience, current_role, owlsure_designation,
    profile_completion, status, avatar_color FROM employees`).all(),
  employee_skills: db.prepare(`SELECT id, employee_id, skill_name, category, proficiency, experience_years,
    last_used, last_project, specialization FROM employee_skills`).all(),
  employee_deployable_roles: db.prepare('SELECT employee_id, role_name FROM employee_deployable_roles').all(),
  employee_immediate_technologies: db.prepare('SELECT employee_id, technology_name FROM employee_immediate_technologies').all(),
  employee_learning_technologies: db.prepare('SELECT employee_id, technology_name FROM employee_learning_technologies').all(),
  employee_domain_expertise: db.prepare(`SELECT id, employee_id, domain, custom_domain, experience_years,
    proficiency, last_used, last_project, specialization FROM employee_domain_expertise`).all(),
  users: db.prepare('SELECT id, name, email, role_id, employee_id, status FROM users').all(),
};

fs.writeFileSync(OUTPUT, JSON.stringify(data, null, 2));

const stats = Object.entries(data).map(([k, v]) => `${k}: ${v.length}`).join(', ');
console.log(`[Export] Saved to seed-data.json — ${stats}`);
