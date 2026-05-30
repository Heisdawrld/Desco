/**
 * DESCO 2.0 Backend API + Static Server
 * Connects to Turso (libSQL) for data persistence
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@libsql/client');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config for passport uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname);
  }
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } }); // 2MB limit

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Turso client
const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

// ==========================================
// INITIALIZE DATABASE
// ==========================================
async function initDb() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    const statements = schema.split(';').map(s => s.trim()).filter(s => s.length > 0);
    for (const stmt of statements) {
      await turso.execute(stmt);
    }
    console.log('✅ Database initialized');
  } catch (err) {
    console.error('DB init error:', err.message);
  }
}

// ==========================================
// API ROUTES
// ==========================================

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const rs = await turso.execute("SELECT 1");
    res.json({ status: 'ok', db: 'connected', time: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ---------- SCOREBOARD ----------

// Get live scoreboard (totals + round breakdown)
app.get('/api/scoreboard', async (req, res) => {
  try {
    const scores = await turso.execute(`
      SELECT c.code, c.name, c.icon, s.round_name, s.points
      FROM cohorts c
      LEFT JOIN scores s ON c.code = s.cohort_code
      ORDER BY c.code, s.round_name
    `);

    // Group by cohort
    const board = {};
    for (const row of scores.rows) {
      const code = row.code;
      if (!board[code]) {
        board[code] = {
          code,
          name: row.name,
          icon: row.icon,
          total: 0,
          rounds: {}
        };
      }
      if (row.round_name) {
        board[code].rounds[row.round_name] = row.points;
        board[code].total += row.points;
      }
    }

    // Convert to array and sort by total
    const sorted = Object.values(board).sort((a, b) => b.total - a.total);
    res.json({ leaderboard: sorted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update score (admin)
app.post('/api/scoreboard/update', async (req, res) => {
  const { cohort_code, round_name, points } = req.body;
  if (!cohort_code || !round_name || points === undefined) {
    return res.status(400).json({ error: 'Missing cohort_code, round_name, or points' });
  }
  try {
    await turso.execute({
      sql: `INSERT INTO scores (cohort_code, round_name, points)
            VALUES (?, ?, ?)
            ON CONFLICT(cohort_code, round_name) DO UPDATE SET
            points = excluded.points, updated_at = CURRENT_TIMESTAMP`,
      args: [cohort_code, round_name, points]
    });
    res.json({ success: true, message: 'Score updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- REGISTRATIONS ----------

// Contestant registration
app.post('/api/register/contestant', upload.single('passport'), async (req, res) => {
  try {
    const { full_name, department, level, phone, email } = req.body;
    if (!full_name || !department || !level || !phone || !email) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const filename = req.file ? req.file.filename : null;
    const cohortCode = department.substring(0, 4).toUpperCase(); // simple mapping

    await turso.execute({
      sql: `INSERT INTO contestants (full_name, department, cohort_code, level, phone, email, passport_filename)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [full_name, department, cohortCode, level, phone, email, filename]
    });

    res.status(201).json({ success: true, message: 'Contestant registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Audience registration
app.post('/api/register/audience', async (req, res) => {
  try {
    const { full_name, department, level, phone, email } = req.body;
    if (!full_name || !department || !level || !phone || !email) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    await turso.execute({
      sql: `INSERT INTO audience (full_name, department, level, phone, email)
            VALUES (?, ?, ?, ?, ?)`,
      args: [full_name, department, level, phone, email]
    });

    res.status(201).json({ success: true, message: 'Audience seat reserved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- ADMIN / DASHBOARD ----------

// Get all registrations
app.get('/api/registrations', async (req, res) => {
  try {
    const contestants = await turso.execute(`
      SELECT id, full_name, department, level, phone, email, status, created_at
      FROM contestants ORDER BY created_at DESC
    `);
    const audience = await turso.execute(`
      SELECT id, full_name, department, level, phone, email, status, created_at
      FROM audience ORDER BY created_at DESC
    `);

    const all = [
      ...contestants.rows.map(r => ({ ...r, type: 'Contestant' })),
      ...audience.rows.map(r => ({ ...r, type: 'Audience' }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ registrations: all });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stats for admin dashboard
app.get('/api/stats', async (req, res) => {
  try {
    const contestantCount = await turso.execute(`SELECT COUNT(*) as count FROM contestants`);
    const audienceCount = await turso.execute(`SELECT COUNT(*) as count FROM audience`);
    const pendingCount = await turso.execute(`SELECT COUNT(*) as count FROM contestants WHERE status = 'pending'`);

    res.json({
      contestants: contestantCount.rows[0]?.count || 0,
      audience: audienceCount.rows[0]?.count || 0,
      pending: pendingCount.rows[0]?.count || 0,
      cohorts: 8
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- COHORTS ----------

// Get all cohorts
app.get('/api/cohorts', async (req, res) => {
  try {
    const rs = await turso.execute(`SELECT * FROM cohorts ORDER BY id`);
    res.json({ cohorts: rs.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get contestants for a cohort
app.get('/api/cohorts/:code/contestants', async (req, res) => {
  try {
    const rs = await turso.execute({
      sql: `SELECT id, full_name, level, status, created_at
            FROM contestants WHERE cohort_code = ? ORDER BY created_at DESC`,
      args: [req.params.code]
    });
    res.json({ contestants: rs.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- CONTACT ----------

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields required' });
    }
    await turso.execute({
      sql: `INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)`,
      args: [name, email, subject, message]
    });
    res.status(201).json({ success: true, message: 'Message sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// STATIC FILES (Serve frontend)
// ==========================================
app.use(express.static(__dirname));

// Fallback to index.html for SPA-like behavior on unknown routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API endpoint not found' });
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, async () => {
  await initDb();
  console.log(`🚀 DESCO 2.0 server running on http://localhost:${PORT}`);
});
