export type Contestant = {
  id: string;
  type: "contestant";
  name: string;
  matric: string;
  department: string;
  level: string;
  phone: string;
  email: string;
  registeredAt: string;
};

export type Audience = {
  id: string;
  type: "audience";
  name: string;
  department: string;
  level: string;
  phone: string;
  email: string;
  registeredAt: string;
};

export type Registrant = Contestant | Audience;

export type CohortScore = {
  name: string;
  sprint: number;
  clash: number;
  specialist: number;
  puzzle: number;
  buzzer: number;
  blackout: number;
};

export type NewsItem = {
  id: string;
  date: string;
  title: string;
  body: string;
};

const KEYS = {
  registrants: "desco_registrants",
  scores: "desco_scores",
  news: "desco_news",
};

const DEFAULT_SCORES: CohortScore[] = [
  { name: "Biology", sprint: 480, clash: 520, specialist: 610, puzzle: 440, buzzer: 470, blackout: 330 },
  { name: "Chemistry", sprint: 450, clash: 490, specialist: 580, puzzle: 410, buzzer: 450, blackout: 340 },
  { name: "Physics", sprint: 460, clash: 470, specialist: 550, puzzle: 430, buzzer: 440, blackout: 230 },
  { name: "Mathematics", sprint: 420, clash: 460, specialist: 520, puzzle: 470, buzzer: 420, blackout: 250 },
  { name: "Computer Science", sprint: 400, clash: 430, specialist: 480, puzzle: 390, buzzer: 410, blackout: 270 },
  { name: "Integrated Science", sprint: 390, clash: 420, specialist: 460, puzzle: 380, buzzer: 390, blackout: 250 },
  { name: "Geography", sprint: 350, clash: 400, specialist: 430, puzzle: 360, buzzer: 380, blackout: 220 },
  { name: "Human Kinetics", sprint: 330, clash: 370, specialist: 410, puzzle: 340, buzzer: 360, blackout: 200 },
];

const DEFAULT_NEWS: NewsItem[] = [
  {
    id: "1",
    date: "May 25, 2026",
    title: "Registration Opens for DESCO 2.0",
    body: "Contestant and audience registration is now live. All Science Education departments are encouraged to register their best representatives before the deadline.",
  },
  {
    id: "2",
    date: "May 20, 2026",
    title: "Computer Science Joins The Lineup",
    body: "Computer Science Education has been added as the 8th competing cohort, expanding the field and raising the stakes for DESCO 2.0.",
  },
  {
    id: "3",
    date: "May 15, 2026",
    title: "New Round Revealed: Blackout Question",
    body: "DESCO 2.0 introduces the dramatic Blackout Question — a double-or-nothing finale where cohorts wager accumulated points on one final answer.",
  },
];

function parse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Registrants ──────────────────────────────────────────────────────────────

export function getRegistrants(): Registrant[] {
  return parse<Registrant[]>(KEYS.registrants, []);
}

export function addRegistrant(r: Registrant) {
  const list = getRegistrants();
  list.unshift(r);
  save(KEYS.registrants, list);
}

export function deleteRegistrant(id: string) {
  const list = getRegistrants().filter((r) => r.id !== id);
  save(KEYS.registrants, list);
}

export function clearRegistrants() {
  save(KEYS.registrants, []);
}

// ── Scores ───────────────────────────────────────────────────────────────────

export function getScores(): CohortScore[] {
  return parse<CohortScore[]>(KEYS.scores, DEFAULT_SCORES);
}

export function saveScores(scores: CohortScore[]) {
  save(KEYS.scores, scores);
}

export function resetScores() {
  save(KEYS.scores, DEFAULT_SCORES);
}

export function totalScore(s: CohortScore) {
  return s.sprint + s.clash + s.specialist + s.puzzle + s.buzzer + s.blackout;
}

// ── News ─────────────────────────────────────────────────────────────────────

export function getNews(): NewsItem[] {
  return parse<NewsItem[]>(KEYS.news, DEFAULT_NEWS);
}

export function saveNews(items: NewsItem[]) {
  save(KEYS.news, items);
}

export function addNews(item: Omit<NewsItem, "id">) {
  const items = getNews();
  items.unshift({ ...item, id: Date.now().toString() });
  save(KEYS.news, items);
}

export function deleteNews(id: string) {
  save(KEYS.news, getNews().filter((n) => n.id !== id));
}
