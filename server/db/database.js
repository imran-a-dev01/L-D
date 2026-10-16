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

// Initialize schema
export function initDatabase() {
  if (fs.existsSync(SCHEMA_PATH)) {
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    db.exec(schema);
  }
}

initDatabase();

export default db;
