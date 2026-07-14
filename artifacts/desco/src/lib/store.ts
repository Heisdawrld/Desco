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
  passportBase64?: string | null;
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
  passportBase64?: string | null;
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
  { id: "biology", name: "Biology Education", sprint: 480, clash: 520, specialist: 610, puzzle: 440, buzzer: 470, blackout: 330 },
  { id: "chemistry", name: "Chemistry Education", sprint: 450, clash: 490, specialist: 580, puzzle: 410, buzzer: 450, blackout: 340 },
  { id: "physics", name: "Physics Education", sprint: 460, clash: 470, specialist: 550, puzzle: 430, buzzer: 440, blackout: 230 },
  { id: "mathematics", name: "Mathematics Education", sprint: 420, clash: 460, specialist: 520, puzzle: 470, buzzer: 420, blackout: 250 },
  { id: "integratedscience", name: "Integrated Science", sprint: 390, clash: 420, specialist: 460, puzzle: 380, buzzer: 390, blackout: 250 },
];

const DEFAULT_NEWS: NewsItem[] = [
  { id: "1", date: "May 25, 2026", title: "Registration Opens for DESCO 2.0", body: "Contestant and audience registration is now live. All Science Education departments are encouraged to register their best representatives before the deadline." },
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

// ── Auth helpers ─────────────────────────────────────────────────────────────

const TOKEN_KEY = "desco_admin_token";
const AUTH_FLAG = "desco_admin";

export function getAuthToken(): string | null {
  try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function isAuthed(): boolean {
  try {
    return sessionStorage.getItem(AUTH_FLAG) === "1" && !!sessionStorage.getItem(TOKEN_KEY);
  } catch { return false; }
}

export function clearAuth(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(AUTH_FLAG);
  } catch {}
}

/**
 * Error thrown when the API returns 401. The admin dashboard should catch
 * this and redirect to the login screen.
 */
export class AuthError extends Error {
  constructor(message = "Session expired. Please log in again.") {
    super(message);
    this.name = "AuthError";
  }
}

// ── API fetch wrapper ─────────────────────────────────────────────────────────

type ApiOpts = RequestInit & { authed?: boolean };

async function api<T>(path: string, opts?: ApiOpts): Promise<T> {
  const { authed, headers: initHeaders, ...rest } = opts || {};
  const headers: Record<string, string> = {
    ...((initHeaders as Record<string, string>) || {}),
  };

  if (authed) {
    const token = getAuthToken();
    if (!token) {
      clearAuth();
      throw new AuthError();
    }
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...rest, headers });

  if (res.status === 401) {
    if (authed) clearAuth();
    throw new AuthError();
  }

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`API Error ${res.status}: ${errorText || res.statusText}`);
  }

  // 204 No Content (or empty body) — return undefined cast to T.
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

// ── Registrants ───────────────────────────────────────────────────────────────

export async function fetchRegistrants(): Promise<Registrant[]> {
  const data = await api<Registrant[]>("/registrants", { authed: true });
  _registrants = data;
  persist("desco_registrants", data);
  return data;
}

export function getRegistrants(): Registrant[] {
  return _registrants ?? load<Registrant[]>("desco_registrants") ?? [];
}

export async function addRegistrant(r: Registrant): Promise<Registrant> {
  // Contestant registrations require admin auth; audience is public.
  const data = await api<Registrant>("/registrants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(r),
    authed: r.type === "contestant",
  });
  _registrants = [data, ...(_registrants ?? [])];
  persist("desco_registrants", _registrants);
  return data;
}

export async function deleteRegistrant(id: string): Promise<void> {
  await api(`/registrants/${id}`, { method: "DELETE", authed: true });
  _registrants = (_registrants ?? []).filter((r) => r.id !== id);
  persist("desco_registrants", _registrants);
}

export async function clearRegistrants(): Promise<void> {
  await api("/registrants", { method: "DELETE", authed: true });
  _registrants = [];
  persist("desco_registrants", []);
}

// ── Scores ───────────────────────────────────────────────────────────────────

export async function fetchScores(): Promise<CohortScore[]> {
  const data = await api<CohortScore[]>("/scores");
  if (data && data.length > 0) {
    _scores = data;
    persist("desco_scores", data);
    return data;
  }
  // If the API returns an empty array (e.g. DB was wiped but not re-seeded),
  // fall back to cached defaults so the scoreboard is never blank.
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
    authed: true,
  });
  if (data) { 
    _scores = data; 
    persist("desco_scores", data); 
    return true;
  }
  // fallback
  _scores = scores;
  persist("desco_scores", scores);
  return true;
}

export async function resetScores(): Promise<CohortScore[]> {
  const data = await api<CohortScore[]>("/scores/reset", { method: "POST", authed: true });
  if (data) { 
    _scores = data; 
    persist("desco_scores", data); 
    return _scores;
  }
  // fallback
  _scores = DEFAULT_SCORES;
  persist("desco_scores", DEFAULT_SCORES);
  return _scores;
}

export function totalScore(s: CohortScore) {
  return s.sprint + s.clash + s.specialist + s.puzzle + s.buzzer + s.blackout;
}

// ── Admin auth ───────────────────────────────────────────────────────────────

export async function adminLogin(password: string): Promise<{ token: string; expiresAt: number }> {
  const data = await api<{ token: string; expiresAt: number }>("/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  try {
    sessionStorage.setItem(TOKEN_KEY, data.token);
    sessionStorage.setItem(AUTH_FLAG, "1");
  } catch {}
  return data;
}

export async function adminLogout(): Promise<void> {
  // Read the token BEFORE clearing, so we can still tell the server to delete
  // its session row. Clear locally first so the user sees the login screen
  // immediately even if the server call is slow.
  const token = getAuthToken();
  clearAuth();
  if (token) {
    try {
      await fetch(`${API_BASE}/admin/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Network error — we've already cleared locally, so this is best-effort.
    }
  }
}

// ── News ─────────────────────────────────────────────────────────────────────

export async function fetchNews(): Promise<NewsItem[]> {
  const data = await api<NewsItem[]>("/news");
  if (data && data.length > 0) {
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
    authed: true,
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
  await api(`/news/${id}`, { method: "DELETE", authed: true });
  _news = _news.filter((n) => n.id !== id);
  persist("desco_news", _news);
  return true;
}
