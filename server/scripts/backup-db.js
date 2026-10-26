import fs from 'fs';
import path from 'path';

const dbPath = process.env.DATABASE_PATH || path.join(import.meta.dirname, '..', 'db', 'nexus_ld.sqlite');
const backupDir = process.env.BACKUP_DIR || path.join(path.dirname(dbPath), 'backups');

if (!fs.existsSync(dbPath)) {
  console.error(`Database not found at ${dbPath}`);
  process.exit(1);
}

fs.mkdirSync(backupDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(backupDir, `nexus_ld_${timestamp}.sqlite`);

fs.copyFileSync(dbPath, backupPath);
console.log(`Backup created: ${backupPath}`);

const backups = fs.readdirSync(backupDir)
  .filter(f => f.endsWith('.sqlite'))
  .sort()
  .reverse();

const MAX_BACKUPS = 10;
if (backups.length > MAX_BACKUPS) {
  for (const old of backups.slice(MAX_BACKUPS)) {
    fs.unlinkSync(path.join(backupDir, old));
    console.log(`Removed old backup: ${old}`);
  }
}
