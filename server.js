const express = require('express');
const cors = require('cors');
const db = require('./db');
const app = express();
const port = process.env.PORT || 3000;

// Enhanced CORS configuration
app.use(cors({
  origin: [
    'https://vinjanakeralamquiz.onrender.com',
    'https://vinjanakeralamquizz.onrender.com',
    'https://vinjanakeralamquizz-backend-1.onrender.com',
    'http://localhost:3000',
    'http://localhost:8080',
    /\.onrender\.com$/,  // Allow all Render.com subdomains
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'ADMIN123';

// Middleware to verify API key for admin actions
const verifyAdmin = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Keep-alive endpoint to prevent cold starts
app.get('/api/ping', (req, res) => {
  res.json({ 
    status: 'alive', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Enhanced health check endpoint
app.get('/api/health', (req, res) => {
  // Test database connection
  db.get('SELECT 1', [], (err, row) => {
    if (err) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Database connection failed',
        error: err.message,
        timestamp: new Date().toISOString() 
      });
    }
    res.json({ 
      status: 'Server is running', 
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });
});

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
    console.error('Error creating quiz:', err);
    res.status(500).json({ error: err.message });
  } finally {
    stmt.finalize();
  }
});

// Get all quizzes (Admin only)
app.get('/api/quizzes', verifyAdmin, (req, res) => {
  db.all('SELECT * FROM quizzes ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching quizzes:', err);
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

// Get active quizzes - Enhanced with better error handling
app.get('/api/quizzes/active', (req, res) => {
  console.log('Fetching active quizzes...');
  db.all('SELECT * FROM quizzes WHERE isActive = 1', [], (err, rows) => {
    if (err) {
      console.error('Error fetching active quizzes:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log(`Found ${rows.length} active quizzes`);
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
    const result = stmt.run(isActive ? 1 : 0, id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    res.json({ message: 'Quiz status updated' });
  } catch (err) {
    console.error('Error updating quiz status:', err);
    res.status(500).json({ error: err.message });
  } finally {
    stmt.finalize();
  }
});

// Submit participant result
app.post('/api/results', (req, res) => {
  const { participantName, quizId, score, totalQuestions, completedAt, totalTimeSpent } = req.body;
  
  // Validate required fields
  if (!participantName || !quizId || score === undefined || !totalQuestions || !completedAt) {
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
    console.error('Error submitting result:', err);
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
      console.error('Error fetching results:', err);
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

// Delete quiz (Admin only)
app.delete('/api/quizzes/:id', verifyAdmin, (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM quizzes WHERE id = ?');
  try {
    const result = stmt.run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    res.json({ message: 'Quiz deleted successfully' });
  } catch (err) {
    console.error('Error deleting quiz:', err);
    res.status(500).json({ error: err.message });
  } finally {
    stmt.finalize();
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
