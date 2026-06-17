import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Users, UserCheck, Trophy, Newspaper, Trash2, Plus, Save, RotateCcw,
  LogOut, ChevronRight, Eye, EyeOff, ArrowLeft, X, Image, Calendar, Phone, Mail, User, GraduationCap, Hash
} from "lucide-react";
import {
  fetchRegistrants,
  deleteRegistrant, clearRegistrants,
  fetchScores, saveScores, resetScores, totalScore,
  fetchNews, addNews, deleteNews,
  type Registrant, type CohortScore, type NewsItem
} from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const ADMIN_PASSWORD = "desco2026"; // fallback, overridden by env

type Tab = "overview" | "registrants" | "scores" | "news";

// ── LOGIN ────────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);
  const { toast } = useToast();

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    
    // Attempt API login
    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      
      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem("desco_admin_token", data.token);
        sessionStorage.setItem("desco_admin", "1");
        onLogin();
        return;
      }
    } catch (err) {
      console.warn("API login failed, trying fallback:", err);
    }

    // Fallback to hardcoded password for local/offline/demo use
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem("desco_admin", "1");
      onLogin();
    } else {
      setError(true);
      toast({ title: "Access denied", description: "Incorrect password.", variant: "destructive" });
      setPw("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/8 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm mx-4"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <span className="font-display font-bold text-primary text-xl">D2</span>
          </div>
          <h1 className="font-display font-bold text-2xl text-white">DESCO Admin</h1>
          <p className="text-muted-foreground text-sm mt-1">Authorized personnel only</p>
        </div>

        <form onSubmit={handle} className="glass-card rounded-2xl p-8 border border-white/10 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">Admin Password</label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={pw}
                onChange={(e) => { setPw(e.target.value); setError(false); }}
                placeholder="Enter password"
                required
                autoFocus
                className={`w-full px-4 py-3 pr-12 rounded-lg bg-white/5 border text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all text-sm ${error ? "border-destructive" : "border-white/10"}`}
                data-testid="input-admin-password"
              />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors">
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <p className="text-destructive text-xs mt-2">Incorrect password. Try again.</p>}
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-primary text-white font-bold glow-effect hover:bg-primary/90 transition-all"
            data-testid="button-admin-login"
          >
            Access Dashboard
          </button>
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft size={12} /> Back to site
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── STAT CARD ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, sub }: { label: string; value: number | string; icon: React.ReactNode; sub?: string }) {
  return (
    <div className="glass-card rounded-2xl p-6 border border-white/10">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          {icon}
        </div>
      </div>
      <div className="font-display font-bold text-3xl text-gradient mb-1">{value}</div>
      <div className="text-sm font-semibold text-white mb-0.5">{label}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

// ── OVERVIEW ─────────────────────────────────────────────────────────────────

function Overview({ registrants, scores, news }: { registrants: Registrant[]; scores: CohortScore[]; news: NewsItem[] }) {
  const contestants = registrants.filter((r) => r.type === "contestant");
  const audience = registrants.filter((r) => r.type === "audience");
  const leader = [...scores].sort((a, b) => totalScore(b) - totalScore(a))[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Contestants" value={contestants.length} icon={<UserCheck size={18} />} sub="Registered competitors" />
        <StatCard label="Audience" value={audience.length} icon={<Users size={18} />} sub="Reserved seats" />
        <StatCard label="Leading Cohort" value={leader?.name ?? "—"} icon={<Trophy size={18} />} sub={leader ? `${totalScore(leader).toLocaleString()} pts` : "No data"} />
        <StatCard label="News Items" value={news.length} icon={<Newspaper size={18} />} sub="Published updates" />
      </div>

      {/* Recent registrants */}
      <div className="glass-card rounded-2xl p-6 border border-white/10">
        <h3 className="font-display font-bold text-lg mb-4">Recent Registrations</h3>
        {registrants.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">No registrations yet.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {registrants.slice(0, 10).map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
                <div>
                  <span className="font-semibold text-sm">{r.name}</span>
                  <span className="text-muted-foreground text-xs ml-2">{r.department}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${r.type === "contestant" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"}`}>
                  {r.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Score overview */}
      <div className="glass-card rounded-2xl p-6 border border-white/10">
        <h3 className="font-display font-bold text-lg mb-4">Current Standings</h3>
        <div className="space-y-3">
          {[...scores].sort((a, b) => totalScore(b) - totalScore(a)).map((s, i) => (
            <div key={s.name} className="flex items-center gap-3">
              <span className="w-6 text-center text-sm text-muted-foreground font-bold">{i + 1}</span>
              <span className="flex-1 text-sm font-semibold">{s.name}</span>
              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden hidden md:block">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                  style={{ width: `${(totalScore(s) / (totalScore([...scores].sort((a, b) => totalScore(b) - totalScore(a))[0]) || 1)) * 100}%` }}
                />
              </div>
              <span className="text-primary font-display font-bold text-sm">{totalScore(s).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── REGISTRANTS ───────────────────────────────────────────────────────────────

function RegistrantsTab({ registrants, onDelete, onClear }: {
  registrants: Registrant[]; onDelete: (id: string) => void; onClear: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "contestant" | "audience">("all");
  const [confirmClear, setConfirmClear] = useState(false);
  const [selectedRegistrant, setSelectedRegistrant] = useState<Registrant | null>(null);

  const filtered = filter === "all" ? registrants : registrants.filter((r) => r.type === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(["all", "contestant", "audience"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${filter === f ? "bg-primary text-white" : "glass-card text-muted-foreground border border-white/10 hover:text-white"}`}
            >
              {f} {f === "all" ? `(${registrants.length})` : `(${registrants.filter((r) => r.type === f).length})`}
            </button>
          ))}
        </div>
        {!confirmClear ? (
          <button
            onClick={() => setConfirmClear(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-destructive border border-destructive/30 hover:bg-destructive/10 transition-all"
          >
            <Trash2 size={14} /> Clear All
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Are you sure?</span>
            <button onClick={() => { onClear(); setConfirmClear(false); }} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-destructive text-white">Yes, clear</button>
            <button onClick={() => setConfirmClear(false)} className="px-3 py-1.5 rounded-lg text-xs font-bold glass-card border border-white/10">Cancel</button>
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">No registrants found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/2">
                  {["Photo", "Name", "Type", "Matric", "Department", "Level", "Email", "Phone", "Registered", ""].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs uppercase tracking-widest text-muted-foreground font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="py-3 px-4">
                      {r.passportBase64 ? (
                        <img
                          src={r.passportBase64}
                          alt={`${r.name}'s passport`}
                          className="w-10 h-10 rounded-full object-cover border border-white/20"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-muted-foreground">
                          <User size={16} />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-sm cursor-pointer hover:text-primary transition-colors" onClick={() => setSelectedRegistrant(r)}>
                      {r.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${r.type === "contestant" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"}`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-sm">{"matric" in r ? r.matric || "—" : "—"}</td>
                    <td className="py-3 px-4 text-muted-foreground text-sm">{r.department}</td>
                    <td className="py-3 px-4 text-muted-foreground text-sm">{r.level}</td>
                    <td className="py-3 px-4 text-muted-foreground text-sm">{r.email}</td>
                    <td className="py-3 px-4 text-muted-foreground text-sm">{r.phone}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{new Date(r.registeredAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 flex items-center gap-1">
                      <button
                        onClick={() => setSelectedRegistrant(r)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-all"
                        title="View details"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(r.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedRegistrant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-display font-bold text-xl">Registration Details</h3>
              <button
                onClick={() => setSelectedRegistrant(null)}
                className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-6">
                {selectedRegistrant.passportBase64 ? (
                  <img
                    src={selectedRegistrant.passportBase64}
                    alt={`${selectedRegistrant.name}'s passport`}
                    className="w-28 h-28 rounded-2xl object-cover border border-white/20"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-muted-foreground">
                    <User size={48} />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-display font-bold text-2xl mb-2">{selectedRegistrant.name}</h4>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold ${selectedRegistrant.type === "contestant" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"}`}>
                    {selectedRegistrant.type}
                  </span>
                </div>
              </div>

              <div className="grid gap-4">
                {selectedRegistrant.type === "contestant" && ("matric" in selectedRegistrant) && selectedRegistrant.matric && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                    <Hash className="text-primary mt-0.5" size={20} />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Matric Number</p>
                      <p className="font-semibold">{selectedRegistrant.matric}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                  <GraduationCap className="text-primary mt-0.5" size={20} />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Department</p>
                    <p className="font-semibold">{selectedRegistrant.department}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                  <Trophy className="text-primary mt-0.5" size={20} />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Level</p>
                    <p className="font-semibold">{selectedRegistrant.level}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                  <Mail className="text-primary mt-0.5" size={20} />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Email</p>
                    <p className="font-semibold">{selectedRegistrant.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                  <Phone className="text-primary mt-0.5" size={20} />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Phone</p>
                    <p className="font-semibold">{selectedRegistrant.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                  <Calendar className="text-primary mt-0.5" size={20} />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Registered At</p>
                    <p className="font-semibold">{new Date(selectedRegistrant.registeredAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => {
                    onDelete(selectedRegistrant.id);
                    setSelectedRegistrant(null);
                  }}
                  className="flex-1 py-3 rounded-xl bg-destructive text-white font-bold hover:bg-destructive/90 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} /> Delete Registration
                </button>
                <button
                  onClick={() => setSelectedRegistrant(null)}
                  className="px-6 py-3 rounded-xl glass-card border border-white/10 font-bold hover:bg-white/10 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ── SCORES ────────────────────────────────────────────────────────────────────

const ROUNDS = ["sprint", "clash", "specialist", "puzzle", "buzzer", "blackout"] as const;
const ROUND_LABELS: Record<string, string> = {
  sprint: "Academic Sprint",
  clash: "Cross-Discipline Clash",
  specialist: "Specialist Round",
  puzzle: "Puzzle & Logic Arena",
  buzzer: "Buzzer War",
  blackout: "Blackout Question",
};

function ScoresTab({ scores, onSave, onReset }: {
  scores: CohortScore[]; onSave: (s: CohortScore[]) => void; onReset: () => void;
}) {
  const [local, setLocal] = useState<CohortScore[]>(scores);
  const [dirty, setDirty] = useState(false);
  const { toast } = useToast();

  useEffect(() => { setLocal(scores); }, [scores]);

  const handleChange = (cohortIdx: number, round: typeof ROUNDS[number], val: string) => {
    const n = Math.max(0, parseInt(val) || 0);
    setLocal((prev) => prev.map((s, i) => i === cohortIdx ? { ...s, [round]: n } : s));
    setDirty(true);
  };

  const handleSave = () => {
    onSave(local);
    setDirty(false);
    toast({ title: "Scores saved!", description: "Scoreboard updated successfully." });
  };

  const handleReset = () => {
    onReset();
    setDirty(false);
    toast({ title: "Scores reset to defaults." });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-muted-foreground text-sm">Edit scores for each cohort and round, then save.</p>
        <div className="flex gap-2">
          <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold glass-card border border-white/10 hover:border-primary/30 text-muted-foreground hover:text-white transition-all">
            <RotateCcw size={14} /> Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={!dirty}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-primary text-white glow-effect hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save size={14} /> Save Changes
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/2">
                <th className="text-left py-3 px-4 text-xs uppercase tracking-widest text-muted-foreground font-semibold w-36">Cohort</th>
                {ROUNDS.map((r) => (
                  <th key={r} className="text-left py-3 px-3 text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                    {ROUND_LABELS[r].split(" ")[0]}
                  </th>
                ))}
                <th className="text-left py-3 px-4 text-xs uppercase tracking-widest text-primary font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {local.map((s, i) => (
                <tr key={s.name} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="py-3 px-4 font-semibold text-sm">{s.name}</td>
                  {ROUNDS.map((r) => (
                    <td key={r} className="py-3 px-3">
                      <input
                        type="number"
                        min="0"
                        value={s[r]}
                        onChange={(e) => handleChange(i, r, e.target.value)}
                        className="w-20 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50 transition-all"
                        data-testid={`score-input-${s.name.toLowerCase().replace(/\s+/g, "-")}-${r}`}
                      />
                    </td>
                  ))}
                  <td className="py-3 px-4 font-display font-bold text-primary">
                    {totalScore(s).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {dirty && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between glass-card rounded-xl p-4 border border-primary/30 bg-primary/5"
        >
          <span className="text-sm text-primary font-semibold">You have unsaved changes</span>
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-all">
            <Save size={14} /> Save Now
          </button>
        </motion.div>
      )}
    </div>
  );
}

// ── NEWS ─────────────────────────────────────────────────────────────────────

function NewsTab({ news, onAdd, onDelete }: {
  news: NewsItem[]; onAdd: (item: Omit<NewsItem, "id">) => void; onDelete: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: "", title: "", body: "" });
  const { toast } = useToast();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.title || !form.body) return;
    onAdd(form);
    setForm({ date: "", title: "", body: "" });
    setShowForm(false);
    toast({ title: "News item published!" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">{news.length} published update{news.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-primary text-white glow-effect hover:bg-primary/90 transition-all"
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? "Cancel" : "Add Update"}
        </button>
      </div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleAdd}
          className="glass-card rounded-2xl p-6 border border-primary/20 space-y-4"
        >
          <h3 className="font-display font-bold text-lg">New Update</h3>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">Date <span className="text-destructive">*</span></label>
            <input
              type="text"
              placeholder="e.g. June 1, 2026"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              required
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">Title <span className="text-destructive">*</span></label>
            <input
              type="text"
              placeholder="Update title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">Body <span className="text-destructive">*</span></label>
            <textarea
              rows={3}
              placeholder="Update body..."
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              required
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all text-sm resize-none"
            />
          </div>
          <button type="submit" className="px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all glow-effect">
            Publish Update
          </button>
        </motion.form>
      )}

      <div className="space-y-3">
        {news.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center border border-white/10 text-muted-foreground text-sm">No news items yet.</div>
        ) : (
          news.map((item) => (
            <div key={item.id} className="glass-card rounded-xl p-5 border border-white/10 flex gap-4 group">
              <div className="flex-1">
                <p className="text-xs text-primary font-bold uppercase tracking-widest mb-1">{item.date}</p>
                <h4 className="font-display font-bold text-base mb-1">{item.title}</h4>
                <p className="text-muted-foreground text-sm">{item.body}</p>
              </div>
              <button
                onClick={() => onDelete(item.id)}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [scores, setScores] = useState<CohortScore[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const { toast } = useToast();

  const refresh = async () => {
    try {
      const [r, s, n] = await Promise.all([
        fetchRegistrants(),
        fetchScores(),
        fetchNews(),
      ]);
      setRegistrants(r);
      setScores(s);
      setNews(n);
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to load data",
        description: err instanceof Error ? err.message : "Please check your network and try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => { refresh(); }, []);

  const handleDeleteRegistrant = async (id: string) => {
    try {
      await deleteRegistrant(id);
      setRegistrants((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Registrant removed." });
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to delete registrant",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClearRegistrants = async () => {
    try {
      await clearRegistrants();
      setRegistrants([]);
      toast({ title: "All registrants cleared." });
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to clear registrants",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveScores = async (s: CohortScore[]) => {
    await saveScores(s);
    setScores(s);
  };

  const handleResetScores = async () => {
    const s = await resetScores();
    setScores(s);
    toast({ title: "Scores reset to defaults." });
  };

  const handleAddNews = async (item: Omit<NewsItem, "id">) => {
    await addNews(item);
    refresh();
  };

  const handleDeleteNews = async (id: string) => {
    await deleteNews(id);
    setNews((prev) => prev.filter((n) => n.id !== id));
    toast({ title: "News item deleted." });
  };

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <Eye size={16} /> },
    { key: "registrants", label: "Registrants", icon: <Users size={16} /> },
    { key: "scores", label: "Scores", icon: <Trophy size={16} /> },
    { key: "news", label: "News", icon: <Newspaper size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-background dark text-foreground">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="font-display font-bold text-white text-xs">D2</span>
            </div>
            <span className="font-display font-bold text-sm">DESCO Admin</span>
            <ChevronRight size={14} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground capitalize">{tab}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors">
              <ArrowLeft size={12} /> Public Site
            </Link>
            <button onClick={onLogout} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors" data-testid="button-logout">
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="pt-14 flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-52 shrink-0 border-r border-white/10 pt-6 pb-8 px-3 gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-left ${tab === t.key ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}
              data-testid={`nav-tab-${t.key}`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden flex gap-2 px-4 py-3 border-b border-white/10 bg-background/50 fixed top-14 left-0 right-0 z-40">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === t.key ? "bg-primary text-white" : "text-muted-foreground bg-white/5"}`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Main */}
        <main className="flex-1 p-6 md:p-8 pt-20 md:pt-8 max-w-5xl">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <h2 className="font-display font-bold text-2xl mb-6 capitalize">{tab}</h2>
            {tab === "overview" && <Overview registrants={registrants} scores={scores} news={news} />}
            {tab === "registrants" && <RegistrantsTab registrants={registrants} onDelete={handleDeleteRegistrant} onClear={handleClearRegistrants} />}
            {tab === "scores" && <ScoresTab scores={scores} onSave={handleSaveScores} onReset={handleResetScores} />}
            {tab === "news" && <NewsTab news={news} onAdd={handleAddNews} onDelete={handleDeleteNews} />}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────

export default function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("desco_admin") === "1");

  const handleLogout = () => {
    sessionStorage.removeItem("desco_admin");
    setAuthed(false);
  };

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;
  return <Dashboard onLogout={handleLogout} />;
}
