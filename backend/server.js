require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');

const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const notesRoutes = require('./routes/notes');
const quizRoutes = require('./routes/quiz');
const mindmapRoutes = require('./routes/mindmap');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5000;

/* ─────────────────────────────────────────────
   ✅ CHECK ENV VARIABLES
───────────────────────────────────────────── */
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MongoDB URI is missing in .env file');
  process.exit(1);
}

/* ─────────────────────────────────────────────
   🚀 START PYTHON AI SERVICE (SAFE)
───────────────────────────────────────────── */
function startAIService() {
  try {
    const py = spawn('python', ['ai_service.py'], { cwd: __dirname });

    py.stdout.on('data', (d) =>
      console.log(`[AI] ${d.toString().trim()}`)
    );

    py.stderr.on('data', (d) => {
      const msg = d.toString().trim();
      if (msg && !msg.includes('WARNING')) {
        console.error(`[AI ERROR] ${msg}`);
      }
    });

    py.on('error', () => {
      console.warn('⚠️ Python AI service not started automatically');
      console.warn('👉 Run manually: cd backend && python ai_service.py');
    });

  } catch (err) {
    console.warn('⚠️ Failed to start AI service:', err.message);
  }
}

startAIService();

/* ─────────────────────────────────────────────
   ⚙️ MIDDLEWARE
───────────────────────────────────────────── */
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ─────────────────────────────────────────────
   🟢 MONGODB CONNECTION
───────────────────────────────────────────── */
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

/* ─────────────────────────────────────────────
   📡 ROUTES (YOUR API)
───────────────────────────────────────────── */
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/mindmap', mindmapRoutes);
app.use('/api/dashboard', dashboardRoutes);

/* ─────────────────────────────────────────────
   ❤️ HEALTH CHECK
───────────────────────────────────────────── */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

/* ─────────────────────────────────────────────
   ❌ ERROR HANDLER
───────────────────────────────────────────── */
app.use((err, _req, res, _next) => {
  console.error('🔥 Server Error:', err.stack);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

/* ─────────────────────────────────────────────
   🚀 START SERVER
───────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});