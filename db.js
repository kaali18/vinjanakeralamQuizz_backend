// db.js
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
  const newQuizQuestions = [
    {
      question: 'What is the full form of DWMS in the context of Kerala’s Knowledge Economy Mission?',
      options: ['Digital Workforce Maintenance System', 'Digital Working Management Software', 'Digital Workforce Management System', 'Digital Workforce Management Software'],
      correctAnswer: 2
    },
    {
      question: 'What programming language is named after a type of Indonesian coffee?',
      options: ['Rust', 'Java', 'php', 'C#'],
      correctAnswer: 1
    },
    {
      question: 'Which application certifies English test in DWMS?',
      options: ['British Council', 'British Academy', 'Council of Britain', 'British University'],
      correctAnswer: 0
    },
    {
      question: 'Which authority provides employability skills training through DWMS?',
      options: ['Wadhwani Foundation', 'Adani Foundation', 'TCS Ion', 'Rightwalk Foundation'],
      correctAnswer: 0
    },
    {
      question: 'The E-commerce platform which got licence from RBI to function as an NBFC?',
      options: ['Amazon', 'Ebay', 'Flipkart', 'ONDC'],
      correctAnswer: 2
    },
    {
      question: 'Which of the following doesn\'t come under DWMS dashboard?',
      options: ['Learning Circle', 'Robotic Interview', 'Career Counselling', 'Skillgap Assessment'],
      correctAnswer: 1
    },
    {
      question: 'On October 8th 2024, National Film Awards for the year 2022 were declared and the award for the best film was for a Malayalam film ATTAM. Who was the director of the film?',
      options: ['Vishnu Mohan', 'Anand Ekarshi', 'Sajin Babu', 'Kavya Prakash'],
      correctAnswer: 1
    },
    {
      question: 'The course "Junior Cloud Core Engineer" comes under which domain?',
      options: ['Artificial Intelligence and Machine Learning', 'Automotive', '5G Technology', 'Cybersecurity'],
      correctAnswer: 3
    },
    {
      question: 'The campaign launched by Kerala government in 2025 budget for Kerala\'s transition to a knowledge economy, aiming to align skill development and employment creation?',
      options: ['Knowledge Economy Mission', 'Vijnana Keralam', 'Navakeralam Karma Padhathi', 'Public Education Rejuvenation Campaign'],
      correctAnswer: 1
    },
    {
      question: 'Which country invented the cryptocurrency Bitcoin?',
      options: ['Japan', 'China', 'USA', 'India'],
      correctAnswer: 2
    }
  ];

  const vijnanaKeralamQuiz = {
    id: 'vijnanakeralam_quiz', // Unique ID for the new quiz
    title: 'Vijnana Keralam Quiz',
    questions: JSON.stringify(newQuizQuestions),
    timePerQuestion: 30, // You can adjust this if needed
    createdAt: new Date().toISOString(),
    isActive: 1
  };

  // Delete existing quizzes before inserting the new one to ensure only the new quiz is present
  db.run('DELETE FROM quizzes', (err) => {
    if (err) {
      console.error('Error deleting existing quizzes:', err.message);
      return;
    }
    console.log('Existing quizzes deleted.');

    // Insert the new "Vijnana Keralam Quiz"
    db.get('SELECT id FROM quizzes WHERE id = ?', [vijnanaKeralamQuiz.id], (err, row) => {
      if (err) {
        console.error('Error checking for existing Vijnana Keralam quiz:', err.message);
        return;
      }
      if (!row) {
        const stmt = db.prepare(`
          INSERT INTO quizzes (id, title, questions, timePerQuestion, createdAt, isActive)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          vijnanaKeralamQuiz.id,
          vijnanaKeralamQuiz.title,
          vijnanaKeralamQuiz.questions,
          vijnanaKeralamQuiz.timePerQuestion,
          vijnanaKeralamQuiz.createdAt,
          vijnanaKeralamQuiz.isActive,
          (err) => {
            if (err) console.error('Error seeding Vijnana Keralam quiz:', err.message);
            else console.log('Seeded Vijnana Keralam quiz');
          }
        );
        stmt.finalize();
      } else {
        console.log('Vijnana Keralam quiz already exists.');
      }
    });
  });
});

console.log('Database initialized successfully');

module.exports = db;
