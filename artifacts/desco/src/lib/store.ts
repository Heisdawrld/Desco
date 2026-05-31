const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

// ── Types ────────────────────────────────────────────────────────────────────

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
  id?: string;
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

// ── Fallback defaults for offline/SSR ────────────────────────────────────────

const DEFAULT_SCORES: CohortScore[] = [
  { id: "biology", name: "Biology", sprint: 480, clash: 520, specialist: 610, puzzle: 440, buzzer: 470, blackout: 330 },
  { id: "chemistry", name: "Chemistry", sprint: 450, clash: 490, specialist: 580, puzzle: 410, buzzer: 450, blackout: 340 },
  { id: "physics", name: "Physics", sprint: 460, clash: 470, specialist: 550, puzzle: 430, buzzer: 440, blackout: 230 },
  { id: "mathematics", name: "Mathematics", sprint: 420, clash: 460, specialist: 520, puzzle: 470, buzzer: 420, blackout: 250 },
  { id: "computerscience", name: "Computer Science", sprint: 400, clash: 430, specialist: 480, puzzle: 390, buzzer: 410, blackout: 270 },
  { id: "integratedscience", name: "Integrated Science", sprint: 390, clash: 420, specialist: 460, puzzle: 380, buzzer: 390, blackout: 250 },
  { id: "geography", name: "Geography", sprint: 350, clash: 400, specialist: 430, puzzle: 360, buzzer: 380, blackout: 220 },
  { id: "humankinetics", name: "Human Kinetics", sprint: 330, clash: 370, specialist: 410, puzzle: 340, buzzer: 360, blackout: 200 },
];

const DEFAULT_NEWS: NewsItem[] = [
  { id: "1", date: "May 25, 2026", title: "Registration Opens for DESCO 2.0", body: "Contestant and audience registration is now live. All Science Education departments are encouraged to register their best representatives before the deadline." },
  { id: "2", date: "May 20, 2026", title: "Computer Science Joins The Lineup", body: "Computer Science Education has been added as the 8th competing cohort, expanding the field and raising the stakes for DESCO 2.0." },
  { id: "3", date: "May 15, 2026", title: "New Round Revealed: Blackout Question", body: "DESCO 2.0 introduces the dramatic Blackout Question — a double-or-nothing finale where cohorts wager accumulated points on one final answer." },
];

// ── Local state cache (for when API unavailable) ────────────────────────────

let _registrants: Registrant[] | null = null;
let _scores: CohortScore[] = DEFAULT_SCORES;
let _news: NewsItem[] = DEFAULT_NEWS;

function persist(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ── API fetch wrapper ─────────────────────────────────────────────────────────

async function api<T>(path: string, opts?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, opts);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json() as T;
  } catch (err) {
    console.warn(`[store] API ${path} failed:`, err);
    return null;
  }
}

// ── Registrants ───────────────────────────────────────────────────────────────

export async function fetchRegistrants(): Promise<Registrant[]> {
  const data = await api<Registrant[]>("/registrants");
  if (data) {
    _registrants = data;
    persist("desco_registrants", data);
    return data;
  }
  return _registrants ?? load<Registrant[]>("desco_registrants") ?? [];
}

export function getRegistrants(): Registrant[] {
  return _registrants ?? load<Registrant[]>("desco_registrants") ?? [];
}

export async function addRegistrant(r: Registrant): Promise<boolean> {
  const data = await api<Registrant>("/registrants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(r),
  });
  if (data) {
    _registrants = [data, ...(_registrants ?? [])];
    return true;
  }
  // fallback: add locally
  _registrants = [r, ...(_registrants ?? [])];
  persist("desco_registrants", _registrants);
  return true;
}

export async function deleteRegistrant(id: string): Promise<boolean> {
  await api(`/registrants/${id}`, { method: "DELETE" });
  _registrants = (_registrants ?? []).filter((r) => r.id !== id);
  persist("desco_registrants", _registrants);
  return true;
}

export async function clearRegistrants(): Promise<boolean> {
  await api("/registrants", { method: "DELETE" });
  _registrants = [];
  persist("desco_registrants", []);
  return true;
}

// ── Scores ───────────────────────────────────────────────────────────────────

export async function fetchScores(): Promise<CohortScore[]> {
  const data = await api<CohortScore[]>("/scores");
  if (data) {
    _scores = data;
    persist("desco_scores", data);
    return data;
  }
  return _scores;
}

export function getScores(): CohortScore[] {
  return _scores;
}

export async function saveScores(scores: CohortScore[]): Promise<boolean> {
  const data = await api<CohortScore[]>("/scores", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scores }),
  });
  if (data) { _scores = data; persist("desco_scores", data); }
  return !!data;
}

export async function resetScores(): Promise<CohortScore[]> {
  const data = await api<CohortScore[]>("/scores/reset", { method: "POST" });
  if (data) { _scores = data; persist("desco_scores", data); }
  return _scores;
}

export function totalScore(s: CohortScore) {
  return s.sprint + s.clash + s.specialist + s.puzzle + s.buzzer + s.blackout;
}

// ── News ─────────────────────────────────────────────────────────────────────

export async function fetchNews(): Promise<NewsItem[]> {
  const data = await api<NewsItem[]>("/news");
  if (data) {
    _news = data;
    persist("desco_news", data);
    return data;
  }
  return _news;
}

export function getNews(): NewsItem[] {
  return _news;
}

export async function saveNews(items: NewsItem[]): Promise<boolean> {
  persist("desco_news", items);
  _news = items;
  return true;
}

export async function addNews(item: Omit<NewsItem, "id">): Promise<boolean> {
  const data = await api<NewsItem>("/news", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  if (data) {
    _news = [data, ..._news];
    persist("desco_news", _news);
    return true;
  }
  const local: NewsItem = { ...item, id: Date.now().toString() };
  _news = [local, ..._news];
  persist("desco_news", _news);
  return true;
}

export async function deleteNews(id: string): Promise<boolean> {
  await api(`/news/${id}`, { method: "DELETE" });
  _news = _news.filter((n) => n.id !== id);
  persist("desco_news", _news);
  return true;
}
