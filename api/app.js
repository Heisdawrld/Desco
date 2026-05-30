/**
 * DESCO 2.0 Express App (Netlify + Local compatible)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const { createClient } = require('@libsql/client');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer (memory storage for serverless compatibility)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

// Turso client
const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

// Embedded critical schema (fallback for serverless where fs path may fail)
const EMBEDDED_SCHEMA = `
CREATE TABLE IF NOT EXISTS cohorts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    icon TEXT,
    description TEXT,
    division TEXT,
    status TEXT DEFAULT 'active',
    is_defending_champion INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contestants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    department TEXT NOT NULL,
    cohort_code TEXT,
    level TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    passport_filename TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audience (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    department TEXT NOT NULL,
    level TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cohort_code TEXT NOT NULL,
    round_name TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cohort_code, round_name)
);

CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO cohorts (name, code, icon, description, division, status, is_defending_champion) VALUES
('Biology', 'BIO', '🧬', 'Defending champions. The ones to beat.', 'Life Sciences', 'active', 1),
('Chemistry', 'CHEM', '⚗️', 'Precision, reactions, and pure intellect.', 'Physical Sciences', 'active', 0),
('Physics', 'PHY', '⚡', 'Harnessing the forces of knowledge.', 'Physical Sciences', 'active', 0),
('Mathematics', 'MATH', '📐', 'Numbers don''t lie. Neither do they.', 'Pure Sciences', 'active', 0),
('Computer Science', 'CS', '💻', 'Coding their way to the throne.', 'Technology', 'active', 0),
('Integrated Science', 'IS', '🔬', 'Versatility across all disciplines.', 'Interdisciplinary', 'active', 0),
('Geography', 'GEO', '🌍', 'Mapping their route to victory.', 'Environmental Sciences', 'active', 0),
('Human Kinetics', 'HK', '🏃', 'Fast on their feet, sharper in mind.', 'Health Sciences', 'active', 0);

INSERT OR IGNORE INTO scores (cohort_code, round_name, points) VALUES
('BIO', 'Academic Sprint', 480),
('BIO', 'Cross-Discipline Clash', 520),
('BIO', 'Specialist Round', 610),
('BIO', 'Puzzle & Logic Arena', 440),
('BIO', 'Buzzer War', 470),
('BIO', 'Blackout Question', 330),
('CHEM', 'Academic Sprint', 450),
('CHEM', 'Cross-Discipline Clash', 490),
('CHEM', 'Specialist Round', 580),
('CHEM', 'Puzzle & Logic Arena', 410),
('CHEM', 'Buzzer War', 450),
('CHEM', 'Blackout Question', 340),
('PHY', 'Academic Sprint', 460),
('PHY', 'Cross-Discipline Clash', 470),
('PHY', 'Specialist Round', 550),
('PHY', 'Puzzle & Logic Arena', 430),
('PHY', 'Buzzer War', 440),
('PHY', 'Blackout Question', 230),
('MATH', 'Academic Sprint', 420),
('MATH', 'Cross-Discipline Clash', 460),
('MATH', 'Specialist Round', 520),
('MATH', 'Puzzle & Logic Arena', 470),
('MATH', 'Buzzer War', 420),
('MATH', 'Blackout Question', 250),
('CS', 'Academic Sprint', 400),
('CS', 'Cross-Discipline Clash', 440),
('CS', 'Specialist Round', 510),
('CS', 'Puzzle & Logic Arena', 490),
('CS', 'Buzzer War', 380),
('CS', 'Blackout Question', 270),
('IS', 'Academic Sprint', 380),
('IS', 'Cross-Discipline Clash', 470),
('IS', 'Specialist Round', 490),
('IS', 'Puzzle & Logic Arena', 420),
('IS', 'Buzzer War', 390),
('IS', 'Blackout Question', 210),
('GEO', 'Academic Sprint', 360),
('GEO', 'Cross-Discipline Clash', 410),
('GEO', 'Specialist Round', 450),
('GEO', 'Puzzle & Logic Arena', 380),
('GEO', 'Buzzer War', 340),
('GEO', 'Blackout Question', 240),
('HK', 'Academic Sprint', 340),
('HK', 'Cross-Discipline Clash', 390),
('HK', 'Specialist Round', 430),
('HK', 'Puzzle & Logic Arena', 400),
('HK', 'Buzzer War', 360),
('HK', 'Blackout Question', 180);
`;

// Initialize DB
async function initDb() {
  try {
    // Try file first (local dev)
    let schema = EMBEDDED_SCHEMA;
    try {
      const schemaPath = path.join(__dirname, '..', 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        schema = fs.readFileSync(schemaPath, 'utf8');
      }
    } catch (fsErr) {
      console.log('Using embedded schema (fs not available)');
    }

    const statements = schema.split(';').map(s => s.trim()).filter(s => s.length > 0);
    for (const stmt of statements) {
      await turso.execute(stmt);
    }
    console.log('✅ Database initialized');
  } catch (err) {
    console.error('DB init error:', err.message);
  }
}

// JWT helpers
const JWT_SECRET = process.env.JWT_SECRET || 'desco2_fallback_secret_change_me';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized — no token' });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized — invalid token' });
  }
}

// ==========================================
// ROUTES
// ==========================================

// DB setup (run once after deploy)
app.get('/api/setup', async (req, res) => {
  try {
    await initDb();
    res.json({ success: true, message: 'Database initialized' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health
app.get('/api/health', async (req, res) => {
  try {
    await turso.execute('SELECT 1');
    res.json({ status: 'ok', db: 'connected', time: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ---------- ADMIN AUTH ----------

app.post('/api/admin/login', async (req, res) => {
  const { password } = req.body;
  const adminPass = process.env.ADMIN_PASSWORD || 'desco2admin';
  if (!password) return res.status(400).json({ error: 'Password required' });

  // In production env, store bcrypt hash. For now compare plain or hash.
  const isValid = await bcryptjs.compare(password, adminPass).catch(() => password === adminPass);
  if (!isValid) return res.status(401).json({ error: 'Invalid password' });

  const token = signToken({ role: 'admin', loginAt: Date.now() });
  res.json({ success: true, token });
});

app.get('/api/admin/me', requireAuth, (req, res) => {
  res.json({ admin: true, role: req.admin.role });
});

// ---------- SCOREBOARD ----------

app.get('/api/scoreboard', async (req, res) => {
  try {
    const scores = await turso.execute(`
      SELECT c.code, c.name, c.icon, s.round_name, s.points
      FROM cohorts c
      LEFT JOIN scores s ON c.code = s.cohort_code
      ORDER BY c.code, s.round_name
    `);
    const board = {};
    for (const row of scores.rows) {
      const code = row.code;
      if (!board[code]) {
        board[code] = { code, name: row.name, icon: row.icon, total: 0, rounds: {} };
      }
      if (row.round_name) {
        board[code].rounds[row.round_name] = row.points;
        board[code].total += row.points;
      }
    }
    const sorted = Object.values(board).sort((a, b) => b.total - a.total);
    res.json({ leaderboard: sorted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/scoreboard/update', requireAuth, async (req, res) => {
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
      args: [cohort_code, round_name, parseInt(points)]
    });
    res.json({ success: true, message: 'Score updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk update scores (admin control room)
app.post('/api/scoreboard/bulk', requireAuth, async (req, res) => {
  const updates = req.body; // Array of { cohort_code, round_name, points }
  if (!Array.isArray(updates)) return res.status(400).json({ error: 'Expected array of updates' });
  try {
    for (const u of updates) {
      await turso.execute({
        sql: `INSERT INTO scores (cohort_code, round_name, points)
              VALUES (?, ?, ?)
              ON CONFLICT(cohort_code, round_name) DO UPDATE SET
              points = excluded.points, updated_at = CURRENT_TIMESTAMP`,
        args: [u.cohort_code, u.round_name, parseInt(u.points)]
      });
    }
    res.json({ success: true, message: `${updates.length} scores updated` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- REGISTRATIONS ----------

app.post('/api/register/contestant', async (req, res) => {
  try {
    const { full_name, department, level, phone, email } = req.body;
    if (!full_name || !department || !level || !phone || !email) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const cohortCode = department.substring(0, 4).toUpperCase();
    await turso.execute({
      sql: `INSERT INTO contestants (full_name, department, cohort_code, level, phone, email, passport_filename)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [full_name, department, cohortCode, level, phone, email, null]
    });
    res.status(201).json({ success: true, message: 'Contestant registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

// ---------- ADMIN DASHBOARD DATA ----------

app.get('/api/registrations', requireAuth, async (req, res) => {
  try {
    const contestants = await turso.execute(`
      SELECT id, full_name, department, level, phone, email, status, created_at
      FROM contestants ORDER BY created_at DESC`);
    const audience = await turso.execute(`
      SELECT id, full_name, department, level, phone, email, status, created_at
      FROM audience ORDER BY created_at DESC`);
    const all = [
      ...contestants.rows.map(r => ({ ...r, type: 'Contestant' })),
      ...audience.rows.map(r => ({ ...r, type: 'Audience' }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json({ registrations: all });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const c = await turso.execute('SELECT COUNT(*) as count FROM contestants');
    const a = await turso.execute('SELECT COUNT(*) as count FROM audience');
    const p = await turso.execute("SELECT COUNT(*) as count FROM contestants WHERE status = 'pending'");
    const co = await turso.execute('SELECT COUNT(*) as count FROM cohorts');
    res.json({
      contestants: c.rows[0]?.count || 0,
      audience: a.rows[0]?.count || 0,
      pending: p.rows[0]?.count || 0,
      cohorts: co.rows[0]?.count || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update registration status
app.post('/api/registrations/:id/status', requireAuth, async (req, res) => {
  try {
    const { type, status } = req.body;
    const table = type === 'Contestant' ? 'contestants' : 'audience';
    await turso.execute({
      sql: `UPDATE ${table} SET status = ? WHERE id = ?`,
      args: [status, req.params.id]
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- COHORTS ----------

app.get('/api/cohorts', async (req, res) => {
  try {
    const rs = await turso.execute('SELECT * FROM cohorts ORDER BY id');
    res.json({ cohorts: rs.rows });
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
      sql: 'INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)',
      args: [name, email, subject, message]
    });
    res.status(201).json({ success: true, message: 'Message sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/contacts', requireAuth, async (req, res) => {
  try {
    const rs = await turso.execute('SELECT * FROM contacts ORDER BY created_at DESC');
    res.json({ contacts: rs.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete contact message
app.delete('/api/contacts/:id', requireAuth, async (req, res) => {
  try {
    await turso.execute({
      sql: 'DELETE FROM contacts WHERE id = ?',
      args: [req.params.id]
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// STATIC FILES (for local dev; Netlify handles this via toml)
// ==========================================
app.use(express.static(path.join(__dirname, '..')));

// Fallback for SPA-like routes (non-API)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API endpoint not found' });
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

module.exports = { app, initDb, turso };
