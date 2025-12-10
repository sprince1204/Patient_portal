const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_FILE = path.join(__dirname, 'db.sqlite');

const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Failed to open DB', err);
  } else {
    console.log('Connected to SQLite DB:', DB_FILE);
  }
});

function init() {
  const ddl = `CREATE TABLE IF NOT EXISTS documents (
  
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    filesize INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );`;
  db.run(ddl, (err) => {
    if (err) console.error('DB init error', err);
  });
}

module.exports = { db, init };
