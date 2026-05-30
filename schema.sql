-- ==========================================
-- DESCO 2.0 Database Schema (Turso)
-- ==========================================

-- Cohorts / Departments
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

-- Contestant Registrations
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

-- Audience Registrations
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

-- Scoreboard (per round)
CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cohort_code TEXT NOT NULL,
    round_name TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cohort_code, round_name)
);

-- Contact Messages
CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed cohorts
INSERT OR IGNORE INTO cohorts (name, code, icon, description, division, status, is_defending_champion) VALUES
('Biology', 'BIO', '🧬', 'Defending champions. The ones to beat.', 'Life Sciences', 'active', 1),
('Chemistry', 'CHEM', '⚗️', 'Precision, reactions, and pure intellect.', 'Physical Sciences', 'active', 0),
('Physics', 'PHY', '⚡', 'Harnessing the forces of knowledge.', 'Physical Sciences', 'active', 0),
('Mathematics', 'MATH', '📐', 'Numbers don''t lie. Neither do they.', 'Pure Sciences', 'active', 0),
('Computer Science', 'CS', '💻', 'Coding their way to the throne.', 'Technology', 'active', 0),
('Integrated Science', 'IS', '🔬', 'Versatility across all disciplines.', 'Interdisciplinary', 'active', 0),
('Geography', 'GEO', '🌍', 'Mapping their route to victory.', 'Environmental Sciences', 'active', 0),
('Human Kinetics', 'HK', '🏃', 'Fast on their feet, sharper in mind.', 'Health Sciences', 'active', 0);

-- Seed initial scores for all rounds
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
