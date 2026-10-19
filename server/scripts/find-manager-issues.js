import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '..', 'db', 'nexus_ld.sqlite');

const db = new Database(DB_PATH, { readonly: true });

console.log('=== FINDING MANAGER DATA & FABRICATED EMAIL ISSUES (READ-ONLY) ===');
console.log(`Database path: ${DB_PATH}\n`);

// Helper to calculate fabricated email pattern for a name
function getFabricatedEmail(name) {
  if (!name) return '';
  return `${name.toLowerCase().trim().replace(/\s+/g, '.')}@company.com`;
}

// 1. Employees whose reporting_manager contains "(email)" suffix
const allEmployees = db.prepare('SELECT id, name, reporting_manager, reporting_manager_email FROM employees').all();

const employeesWithEmailSuffix = [];
const employeesWithFabricatedEmail = [];

const suffixRegex = /^(.+?)\s*\((.+?@.+?)\)$/;

for (const emp of allEmployees) {
  const rm = emp.reporting_manager || '';
  const rme = emp.reporting_manager_email || '';

  // Case A: Suffix in reporting_manager column
  const match = rm.match(suffixRegex);
  if (match) {
    employeesWithEmailSuffix.push({
      id: emp.id,
      name: emp.name,
      reporting_manager: rm,
      parsed_name: match[1].trim(),
      parsed_email: match[2].trim(),
    });
  }

  // Case B: Fabricated email in reporting_manager_email or in parsed suffix
  const managerName = match ? match[1].trim() : rm.trim();
  const currentEmail = rme.trim() || (match ? match[2].trim() : '');
  const fabricated = getFabricatedEmail(managerName);

  if (managerName && currentEmail && currentEmail.toLowerCase() === fabricated.toLowerCase()) {
    employeesWithFabricatedEmail.push({
      id: emp.id,
      name: emp.name,
      reporting_manager: rm,
      reporting_manager_email: currentEmail,
      fabricated_email: fabricated,
    });
  }
}

// 2. Managers table rows whose email matches fabricated pattern
const allManagers = db.prepare('SELECT id, name, email FROM managers').all();
const managersWithFabricatedEmail = [];

for (const mgr of allManagers) {
  const fabricated = getFabricatedEmail(mgr.name);
  if (mgr.email && fabricated && mgr.email.toLowerCase() === fabricated.toLowerCase()) {
    managersWithFabricatedEmail.push({
      id: mgr.id,
      name: mgr.name,
      email: mgr.email,
      fabricated_email: fabricated,
    });
  }
}

console.log('------------------------------------------------------------');
console.log('SUMMARY OF FINDINGS:');
console.log(`1. Employees with "(email)" in reporting_manager: ${employeesWithEmailSuffix.length}`);
console.log(`2. Employees with fabricated @company.com email: ${employeesWithFabricatedEmail.length}`);
console.log(`3. Managers table rows with fabricated @company.com email: ${managersWithFabricatedEmail.length}`);
console.log('------------------------------------------------------------\n');

if (employeesWithEmailSuffix.length > 0) {
  console.log('SAMPLE EMPLOYEES WITH "(email)" SUFFIX (up to 5):');
  console.table(employeesWithEmailSuffix.slice(0, 5));
  console.log('');
}

if (employeesWithFabricatedEmail.length > 0) {
  console.log('SAMPLE EMPLOYEES WITH FABRICATED @company.com EMAIL (up to 5):');
  console.table(employeesWithFabricatedEmail.slice(0, 5));
  console.log('');
}

if (managersWithFabricatedEmail.length > 0) {
  console.log('SAMPLE MANAGERS ROWS WITH FABRICATED @company.com EMAIL (up to 5):');
  console.table(managersWithFabricatedEmail.slice(0, 5));
  console.log('');
}

console.log('Done scanning.');
