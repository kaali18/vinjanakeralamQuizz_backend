const express = require('express');
const cors = require('cors');
const db = require('./db');
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://vinjanakeralamquiz.onrender.com',
      'https://vinjanakeralamquizz.onrender.com',
      'http://localhost:8080',
      'http://localhost:3000',
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-api-key']
}));

app.use(express.json());

// Global error handler for route parsing issues
app.use((err, req, res, next) => {
  if (err instanceof TypeError && err.message.includes('Missing parameter name')) {
    console.error('Route parsing error:', err.message);
    return res.status(500).json({ error: 'Invalid route configuration' });
  }
  next(err);
});

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'ADMIN123';

// Middleware to verify API key for admin actions
const verifyAdmin = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
  }
  next();
};

// Create a new quiz (Admin only)
app.post('/api/quizzes', verifyAdmin, (req, res) => {
  const { id, title, questions, timePerQuestion, createdAt, isActive } = req.body;
  if (!id || !title || !questions || !timePerQuestion || !createdAt) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const stmt = db.prepare(`
    INSERT INTO quizzes (id, title, questions, timePerQuestion, createdAt, isActive)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  try {
    stmt.run(id, title, JSON.stringify(questions), timePerQuestion, createdAt, isActive ? 1 : 0);
    res.status(201).json({ message: 'Quiz created successfully' });
  } catch (err) {
    console.error('Error inserting quiz:', err.message);
    res.status(500).json({ error: 'Failed to create quiz: ' + err.message });
  } finally {
    stmt.finalize();
  }
});

// Get all quizzes (Admin only)
app.get('/api/quizzes', verifyAdmin, (req, res) => {
  db.all('SELECT * FROM quizzes ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching quizzes:', err.message);
      return res.status(500).json({ error: 'Failed to fetch quizzes: ' + err.message });
    }
    res.json(rows.map(row => ({
      id: row.id,
      title: row.title,
      questions: JSON.parse(row.questions),
      timePerQuestion: row.timePerQuestion,
      createdAt: row.createdAt,
      isActive: row.isActive === 1
    })));
  });
});

// Get active quizzes
app.get('/api/quizzes/active', (req, res) => {
  db.all('SELECT * FROM quizzes WHERE isActive = 1', [], (err, rows) => {
    if (err) {
      console.error('Error fetching active quizzes:', err.message);
      return res.status(500).json({ error: 'Failed to fetch active quizzes: ' + err.message });
    }
    res.json(rows.map(row => ({
      id: row.id,
      title: row.title,
      questions: JSON.parse(row.questions),
      timePerQuestion: row.timePerQuestion,
      createdAt: row.createdAt,
      isActive: row.isActive === 1
    })));
  });
});

// Update quiz status (Admin only)
app.put('/api/quizzes/:id/status', verifyAdmin, (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;
  if (isActive === undefined) {
    return res.status(400).json({ error: 'Missing isActive field' });
  }
  const stmt = db.prepare('UPDATE quizzes SET isActive = ? WHERE id = ?');
  try {
    const result = stmt.run(isActive ? 1 : 0, id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    res.json({ message: 'Quiz status updated' });
  } catch (err) {
    console.error('Error updating quiz status:', err.message);
    res.status(500).json({ error: 'Failed to update quiz status: ' + err.message });
  } finally {
    stmt.finalize();
  }
});

// Submit participant result
app.post('/api/results', (req, res) => {
  const { participantName, quizId, score, totalQuestions, completedAt, totalTimeSpent } = req.body;
  if (!participantName || !quizId || score === undefined || !totalQuestions || !completedAt || !totalTimeSpent) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const stmt = db.prepare(`
    INSERT INTO results (participantName, quizId, score, totalQuestions, completedAt, totalTimeSpent)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  try {
    stmt.run(participantName, quizId, score, totalQuestions, completedAt, totalTimeSpent);
    res.status(201).json({ message: 'Result submitted successfully' });
  } catch (err) {
    console.error('Error inserting result:', err.message);
    res.status(500).json({ error: 'Failed to submit result: ' + err.message });
  } finally {
    stmt.finalize();
  }
});

// Get results for a quiz
app.get('/api/results/:quizId', (req, res) => {
  const { quizId } = req.params;
  db.all('SELECT * FROM results WHERE quizId = ? ORDER BY score DESC, totalTimeSpent ASC', [quizId], (err, rows) => {
    if (err) {
      console.error('Error fetching results:', err.message);
      return res.status(500).json({ error: 'Failed to fetch results: ' + err.message });
    }
    res.json(rows.map(row => ({
      participantName: row.participantName,
      quizId: row.quizId,
      score: row.score,
      totalQuestions: row.totalQuestions,
      completedAt: row.completedAt,
      totalTimeSpent: row.totalTimeSpent
    })));
  });
});

// Delete a quiz (Admin only)
app.delete('/api/quizzes/:id', verifyAdmin, (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM quizzes WHERE id = ?');
  try {
    const result = stmt.run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    console.log(`Quiz ${id} deleted successfully`);
    res.json({ message: 'Quiz deleted successfully' });
  } catch (err) {
    console.error('Error deleting quiz:', err.message);
    res.status(500).json({ error: 'Failed to delete quiz: ' + err.message });
  } finally {
    stmt.finalize();
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
