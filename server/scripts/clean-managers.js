import db from '../db/database.js';

// Delete any manager row where name contains '('
const deleted = db.prepare("DELETE FROM managers WHERE name LIKE '%(%'").run();
console.log('Deleted corrupted manager rows:', deleted.changes);

// Ensure Suresh Kumar has proper email
db.prepare('DELETE FROM managers WHERE LOWER(TRIM(name)) = ?').run('suresh kumar');
db.prepare('INSERT INTO managers (name, email) VALUES (?, ?)').run('Suresh Kumar', 'suresh.kumar@valuemomentum.com');

console.log('Current managers:', db.prepare('SELECT * FROM managers').all());
