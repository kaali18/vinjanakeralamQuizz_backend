const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database file
const dbPath = path.join(__dirname, 'quiz_app.db');
const db = new sqlite3.Database(dbPath);

// Initialize tables
db.serialize(() => {
  // Create quizzes table
  db.run(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      questions TEXT NOT NULL,
      timePerQuestion INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      isActive INTEGER DEFAULT 0
    )
  `);

  // Create results table
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
  `);
});

console.log('Database initialized successfully');

module.exports = db;
