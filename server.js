const express = require('express');
const cors = require('cors');
const db = require('./db');
const os = require('os');
const app = express();
const port = process.env.PORT || 3000; // Use Render's PORT env variable

// Enable CORS
app.use(cors({
  origin: 'https://vinjanakeralamquizzz.onrender.com', // Update with your frontend URL after deployment
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-api-key']
}));

app.use(express.json());

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'ADMIN123';

// Function to get local IP address
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'localhost';
}

// Middleware to verify API key for admin actions
const verifyAdmin = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Create a new quiz (Admin only)
app.post('/api/quizzes', verifyAdmin, (req, res) => {
  const { id, title, questions, timePerQuestion, createdAt, isActive } = req.body;
  const stmt = db.prepare(`
    INSERT INTO quizzes (id, title, questions, timePerQuestion, createdAt, isActive)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  try {
    stmt.run(id, title, JSON.stringify(questions), timePerQuestion, createdAt, isActive ? 1 : 0);
    res.status(201).json({ message: 'Quiz created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    stmt.finalize();
  }
});

// Get all quizzes (Admin only)
app.get('/api/quizzes', verifyAdmin, (req, res) => {
  db.all('SELECT * FROM quizzes ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
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
      return res.status(500).json({ error: err.message });
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
  const stmt = db.prepare('UPDATE quizzes SET isActive = ? WHERE id = ?');
  
  try {
    stmt.run(isActive ? 1 : 0, id);
    res.json({ message: 'Quiz status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    stmt.finalize();
  }
});

// Submit participant result
app.post('/api/results', (req, res) => {
  const { participantName, quizId, score, totalQuestions, completedAt, totalTimeSpent } = req.body;
  const stmt = db.prepare(`
    INSERT INTO results (participantName, quizId, score, totalQuestions, completedAt, totalTimeSpent)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  try {
    stmt.run(participantName, quizId, score, totalQuestions, completedAt, totalTimeSpent);
    res.status(201).json({ message: 'Result submitted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    stmt.finalize();
  }
});

// Get results for a quiz
app.get('/api/results/:quizId', (req, res) => {
  const { quizId } = req.params;
  db.all('SELECT * FROM results WHERE quizId = ? ORDER BY score DESC, totalTimeSpent ASC', [quizId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  const localIP = getLocalIPAddress();
  console.log(`Server running on:`);
  console.log(`- Local: http://localhost:${port}`);
  console.log(`- Network: http://${localIP}:${port}`);
  console.log(`\nUpdate your Flutter app's _baseUrl to: http://${localIP警方
