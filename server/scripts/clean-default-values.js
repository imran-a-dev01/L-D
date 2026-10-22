import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '..', 'db', 'nexus_ld.sqlite');

const TARGET_VALUES = [
  'Client Project',
  'Functional Practice',
  'Internal Engineering',
  'Current',
  'Leadership Group',
  'Bench',
  'Internal',
  'General',
  'Remote',
];

const args = process.argv.slice(2);
const hasConfirm = args.includes('--confirm');

console.log('=== CLEAN INVENTED DEFAULT VALUES SCRIPT ===');
console.log(`Target Database: ${DB_PATH}\n`);

if (!hasConfirm) {
  console.log('SAFETY WARNING: This script will blank out target invented values across SQLite tables.');
  console.log('A user could have genuinely typed one of these words, so please review the counts first.');
  console.log('\nTo execute this cleanup with a database backup, run:');
  console.log('  node server/scripts/clean-default-values.js --confirm\n');
  process.exit(0);
}

// 1. Create backup
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = `${DB_PATH}.backup_${timestamp}`;
console.log(`Creating database backup at: ${backupPath}...`);
fs.copyFileSync(DB_PATH, backupPath);
console.log('Backup created successfully.\n');

// 2. Open DB and perform transaction
const db = new DatabaseSync(DB_PATH);

// Tables and specific columns to check for blanking
const cleanupTargets = [
  { table: 'employees', columns: ['reporting_manager', 'current_project', 'current_customer', 'location', 'business_unit', 'current_role'] },
  { table: 'employee_skills', columns: ['last_used', 'last_project', 'specialization'] },
  { table: 'employee_domain_expertise', columns: ['last_used', 'last_project', 'specialization'] },
];

let totalModified = 0;

function localTransaction(fn) {
  return (...args) => {
    db.exec('BEGIN');
    try {
      const result = fn(...args);
      db.exec('COMMIT');
      return result;
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  };
}

const cleanupTx = localTransaction(() => {
  for (const { table, columns } of cleanupTargets) {
    for (const col of columns) {
      for (const val of TARGET_VALUES) {
        try {
          const selectStmt = db.prepare(`SELECT id, "${col}" FROM "${table}" WHERE "${col}" = ?`);
          const rows = selectStmt.all(val);

          if (rows.length > 0) {
            const updateStmt = db.prepare(`UPDATE "${table}" SET "${col}" = '' WHERE "${col}" = ?`);
            const info = updateStmt.run(val);
            console.log(`[${table}] Column "${col}": Blanked ${info.changes} row(s) having value '${val}'`);
            totalModified += info.changes;
          }
        } catch (err) {
          // Table or column might not exist or match
        }
      }
    }
  }
});

cleanupTx();

console.log(`\nCleanup complete! Total fields blanked: ${totalModified}`);
db.close();
