import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path — configurable via DATABASE_PATH env var for Azure persistent storage
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'nexus_ld.sqlite');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Auto-create the database directory if it doesn't exist (needed for Azure /home/data/)
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

export function transaction(fn) {
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

// Run safe, idempotent migrations
export function runMigrations() {
  try {
    // 1. Check if reporting_manager_email exists in employees table
    const empColumns = db.prepare('PRAGMA table_info(employees)').all();
    const hasReportingManagerEmail = empColumns.some((col) => col.name === 'reporting_manager_email');
    if (!hasReportingManagerEmail) {
      db.prepare("ALTER TABLE employees ADD COLUMN reporting_manager_email TEXT DEFAULT ''").run();
      console.log('Migration: Added reporting_manager_email column to employees table.');
    }

    // 2. Check managers table unique constraint
    const mgrTableSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='managers'").get();
    if (mgrTableSql && mgrTableSql.sql && mgrTableSql.sql.includes('email TEXT NOT NULL UNIQUE')) {
      // Back up the database file before running the migration
      try {
        const backupDir = path.dirname(DB_PATH);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `nexus_ld_pre_migration_${timestamp}.sqlite`);
        fs.copyFileSync(DB_PATH, backupPath);
        console.log(`Migration: Database backed up to ${backupPath}`);
      } catch (backupErr) {
        console.warn('Migration backup warning:', backupErr);
      }

      const migrateManagers = transaction(() => {
        db.prepare(`
          CREATE TABLE IF NOT EXISTS managers_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL DEFAULT '',
            UNIQUE(name, email)
          )
        `).run();
        db.prepare(`
          INSERT OR IGNORE INTO managers_new (id, name, email)
          SELECT id, name, COALESCE(email, '') FROM managers
        `).run();
        db.prepare('DROP TABLE managers').run();
        db.prepare('ALTER TABLE managers_new RENAME TO managers').run();
      });

      migrateManagers();
      console.log('Migration: Migrated managers table to UNIQUE(name, email).');
    }
    // 3. Drop owlsure_designation column from employees (recreate without it)
    const empCols = db.prepare('PRAGMA table_info(employees)').all();
    const hasOwlsure = empCols.some((col) => col.name === 'owlsure_designation');
    if (hasOwlsure) {
      // Disable FK to prevent CASCADE deletes when dropping the old employees table
      db.exec('PRAGMA foreign_keys = OFF');
      const migrateOwlsure = transaction(() => {
        const keepCols = empCols.filter((c) => c.name !== 'owlsure_designation').map((c) => c.name);
        const colDefs = empCols
          .filter((c) => c.name !== 'owlsure_designation')
          .map((c) => {
            let def = `${c.name} ${c.type}`;
            if (c.pk) def += ' PRIMARY KEY';
            if (c.notnull && !c.pk) def += ' NOT NULL';
            if (c.dflt_value !== null) def += ` DEFAULT ${c.dflt_value}`;
            return def;
          });
        db.prepare(`CREATE TABLE IF NOT EXISTS employees_new (${colDefs.join(', ')})`).run();
        db.prepare(`INSERT OR IGNORE INTO employees_new (${keepCols.join(', ')}) SELECT ${keepCols.join(', ')} FROM employees`).run();
        db.prepare('DROP TABLE employees').run();
        db.prepare('ALTER TABLE employees_new RENAME TO employees').run();
        db.prepare('CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email)').run();
        db.prepare('CREATE INDEX IF NOT EXISTS idx_employees_bu ON employees(business_unit)').run();
        db.prepare('CREATE INDEX IF NOT EXISTS idx_employees_location ON employees(location)').run();
        db.prepare('CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status)').run();
      });
      migrateOwlsure();
      db.exec('PRAGMA foreign_keys = ON');
      console.log('Migration: Removed owlsure_designation column from employees table.');

      // Drop the owlsure_designations lookup table
      try { db.prepare('DROP TABLE IF EXISTS owlsure_designations').run(); } catch {}
      console.log('Migration: Dropped owlsure_designations table.');
    }

    // 4. Add is_required column to custom_fields if missing
    const cfCols = db.prepare('PRAGMA table_info(custom_fields)').all();
    if (cfCols.length > 0 && !cfCols.some((c) => c.name === 'is_required')) {
      db.prepare('ALTER TABLE custom_fields ADD COLUMN is_required INTEGER NOT NULL DEFAULT 0').run();
      console.log('Migration: Added is_required column to custom_fields.');
    }

    // 5. Deduplicate managers: if same name exists with and without email, keep the one with email
    const dupes = db.prepare(`
      SELECT m1.id as empty_id, m2.id as email_id, m1.name
      FROM managers m1
      JOIN managers m2 ON LOWER(TRIM(m1.name)) = LOWER(TRIM(m2.name))
      WHERE TRIM(m1.email) = '' AND TRIM(m2.email) != ''
    `).all();
    for (const d of dupes) {
      db.prepare('DELETE FROM managers WHERE id = ?').run(d.empty_id);
    }
    if (dupes.length > 0) {
      console.log(`Migration: Removed ${dupes.length} duplicate manager(s) without email.`);
    }
  } catch (err) {
    console.error('Migration error:', err);
  }
}

// Initialize schema
export function initDatabase() {
  if (fs.existsSync(SCHEMA_PATH)) {
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    db.exec(schema);
  }
  runMigrations();
}

initDatabase();

export default db;
