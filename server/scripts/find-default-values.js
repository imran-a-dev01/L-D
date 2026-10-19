import Database from 'better-sqlite3';
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

const db = new Database(DB_PATH, { readonly: true });

console.log('=== SEARCHING FOR INVENTED DEFAULT VALUES IN SQLITE DATABASE ===');
console.log(`Database path: ${DB_PATH}\n`);

// Get all user tables
const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name NOT LIKE 'sqlite_%'
  ORDER BY name ASC
`).all();

let totalOccurrences = 0;
const resultsByTable = {};

for (const { name: tableName } of tables) {
  const columns = db.prepare(`PRAGMA table_info("${tableName}")`).all();
  const textColumns = columns.filter(col => {
    const t = (col.type || '').toUpperCase();
    return t.includes('CHAR') || t.includes('CLOB') || t.includes('TEXT') || t === '';
  });

  const tableResults = [];

  for (const col of textColumns) {
    const colName = col.name;
    for (const val of TARGET_VALUES) {
      try {
        const row = db.prepare(`
          SELECT COUNT(*) as cnt FROM "${tableName}" 
          WHERE "${colName}" = ?
        `).get(val);

        if (row && row.cnt > 0) {
          tableResults.push({
            column: colName,
            value: val,
            count: row.cnt,
          });
          totalOccurrences += row.cnt;
        }
      } catch (err) {
        // Skip errors if column query fails
      }
    }
  }

  if (tableResults.length > 0) {
    resultsByTable[tableName] = tableResults;
  }
}

console.log('--- Summary of Invented Values by Table and Column ---');
if (Object.keys(resultsByTable).length === 0) {
  console.log('No invented default values found in any tables.\n');
} else {
  for (const [table, items] of Object.entries(resultsByTable)) {
    console.log(`\nTable: [${table}]`);
    for (const item of items) {
      console.log(`  - Column "${item.column}": ${item.count} row(s) with exact value '${item.value}'`);
    }
  }
  console.log(`\nTotal occurrences found across all tables: ${totalOccurrences}`);
}

db.close();
