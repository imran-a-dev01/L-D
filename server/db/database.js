import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path: server/db/nexus_ld.sqlite
const DB_PATH = path.join(__dirname, 'nexus_ld.sqlite');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Initialize better-sqlite3 with WAL mode for high concurrency
const db = new Database(DB_PATH, { verbose: process.env.NODE_ENV === 'development' ? null : null });
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

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

      const migrateManagers = db.transaction(() => {
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
