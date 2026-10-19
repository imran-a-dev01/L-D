import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '..', 'db', 'nexus_ld.sqlite');

const isConfirmed = process.argv.includes('--confirm');

console.log('=== MIGRATE MANAGER EMAILS & CLEAN FABRICATED DATA ===');
console.log(`Database path: ${DB_PATH}\n`);

if (!isConfirmed) {
  console.log('DRY RUN / SAFEGUARD ACTIVE:');
  console.log('No modifications will be made unless the script is invoked with --confirm.');
  console.log('Usage: node server/scripts/migrate-manager-emails.js --confirm\n');
  console.log('Please run server/scripts/find-manager-issues.js first to review existing counts.');
  process.exit(0);
}

// 1. Create timestamped database backup before any modification
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(path.dirname(DB_PATH), `nexus_ld_backup_${timestamp}.sqlite`);

try {
  fs.copyFileSync(DB_PATH, backupPath);
  console.log(`Safe backup created at: ${backupPath}\n`);
} catch (err) {
  console.error('Failed to create backup before migration! Aborting.', err);
  process.exit(1);
}

const db = new Database(DB_PATH);

// Helper to calculate fabricated email pattern for a name
function getFabricatedEmail(name) {
  if (!name) return '';
  return `${name.toLowerCase().trim().replace(/\s+/g, '.')}@company.com`;
}

const suffixRegex = /^(.+?)\s*\((.+?@.+?)\)$/;

const migrationTransaction = db.transaction(() => {
  let splitCount = 0;
  let blankedEmpEmails = 0;
  let blankedMgrEmails = 0;

  console.log('--- Processing Employees ---');
  const employees = db.prepare('SELECT id, name, reporting_manager, reporting_manager_email FROM employees').all();

  for (const emp of employees) {
    let currentManager = emp.reporting_manager || '';
    let currentEmail = emp.reporting_manager_email || '';
    let changed = false;

    // Check for "(email)" suffix in reporting_manager
    const match = currentManager.match(suffixRegex);
    if (match) {
      const parsedName = match[1].trim();
      const parsedEmail = match[2].trim();
      currentManager = parsedName;
      if (!currentEmail.trim()) {
        currentEmail = parsedEmail;
      }
      changed = true;
      splitCount += 1;
      console.log(`[EMP ${emp.id}] Split manager string "${emp.reporting_manager}" -> Name: "${currentManager}", Email: "${currentEmail}"`);
    }

    // Check if email equals fabricated pattern
    const fabricated = getFabricatedEmail(currentManager);
    if (currentEmail && fabricated && currentEmail.toLowerCase() === fabricated.toLowerCase()) {
      console.log(`[EMP ${emp.id}] Blanked fabricated email "${currentEmail}" for manager "${currentManager}"`);
      currentEmail = '';
      changed = true;
      blankedEmpEmails += 1;
    }

    if (changed) {
      db.prepare(`
        UPDATE employees 
        SET reporting_manager = ?, reporting_manager_email = ? 
        WHERE id = ?
      `).run(currentManager, currentEmail, emp.id);
    }
  }

  console.log('\n--- Processing Managers Table ---');
  const managers = db.prepare('SELECT id, name, email FROM managers').all();

  for (const mgr of managers) {
    const fabricated = getFabricatedEmail(mgr.name);
    if (mgr.email && fabricated && mgr.email.toLowerCase() === fabricated.toLowerCase()) {
      db.prepare('UPDATE managers SET email = ? WHERE id = ?').run('', mgr.id);
      blankedMgrEmails += 1;
      console.log(`[MGR ${mgr.id}] Blanked fabricated email "${mgr.email}" for manager "${mgr.name}"`);
    }
  }

  return { splitCount, blankedEmpEmails, blankedMgrEmails };
});

try {
  const result = migrationTransaction();
  console.log('\n------------------------------------------------------------');
  console.log('MIGRATION COMPLETE:');
  console.log(`• Split "(email)" manager suffixes: ${result.splitCount}`);
  console.log(`• Blanked fabricated employee manager emails: ${result.blankedEmpEmails}`);
  console.log(`• Blanked fabricated managers table emails: ${result.blankedMgrEmails}`);
  console.log('------------------------------------------------------------');
} catch (err) {
  console.error('Migration failed during transaction execution:', err);
  process.exit(1);
}
