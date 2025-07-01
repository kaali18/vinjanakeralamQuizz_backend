const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database(':memory:', (err) => {
  if (err) {
    console.error('Error connecting to SQLite:', err.message);
    return;
  }
  console.log('Connected to in-memory SQLite database');
});

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
  `, (err) => {
    if (err) console.error('Error creating quizzes table:', err.message);
    else console.log('Quizzes table created');
  });

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
  `, (err) => {
    if (err) console.error('Error creating results table:', err.message);
    else console.log('Results table created');
  });

  // Seed initial quiz data
  const initialQuiz = {
    id: 'quiz1',
    title: 'Sample Kerala Quiz',
    questions: JSON.stringify([
      {
        question: 'What is the capital of Kerala?',
        options: ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur'],
        correctAnswer: 1
      },
      {
        question: 'Which river is known as the lifeline of Kerala?',
        options: ['Bharathapuzha', 'Periyar', 'Pamba', 'Chaliyar'],
        correctAnswer: 1
      }
    ]),
    timePerQuestion: 30,
    createdAt: new Date().toISOString(),
    isActive: 1
  };

  db.get('SELECT id FROM quizzes WHERE id = ?', [initialQuiz.id], (err, row) => {
    if (err) {
      console.error('Error checking for existing quiz:', err.message);
      return;
    }
    if (!row) {
      const stmt = db.prepare(`
        INSERT INTO quizzes (id, title, questions, timePerQuestion, createdAt, isActive)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        initialQuiz.id,
        initialQuiz.title,
        initialQuiz.questions,
        initialQuiz.timePerQuestion,
        initialQuiz.createdAt,
        initialQuiz.isActive,
        (err) => {
          if (err) console.error('Error seeding quiz:', err.message);
          else console.log('Seeded initial quiz');
        }
      );
      stmt.finalize();
    }
  });
});

console.log('Database initialized successfully');

module.exports = db;
