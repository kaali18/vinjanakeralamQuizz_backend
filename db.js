const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use Render's disk path for SQLite or fallback to local
const dbPath = process.env.RENDER ? '/opt/render/project/src/quiz_app.db' : path.join(__dirname, 'quiz_app.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite:', err.message);
    return;
  }
  console.log('Connected to SQLite database');
});

// Initialize tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      questions TEXT NOT NULL,
      timePerQuestion INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      isActive INTEGER DEFAULT 0
    )
  `, (err) => {
    if (err) console.error('Error creating quizzes table:', err.message);
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      participantName TEXT NOT NULL,
      quizId TEXT NOT NULL,
      score INTEGER NOT NULL,
      totalQuestions INTEGER NOT NULL,
      completedAt TEXT NOT NULL,
      totalTimeSpent INTEGER NOT NULL,
      FOREIGN KEY (quizId) REFERENCES quizzes (id)
    )
  `, (err) => {
    if (err) console.error('Error creating results table:', err.message);
  });
});

console.log('Database initialized successfully');

module.exports = db;
