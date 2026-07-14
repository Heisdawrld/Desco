import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Users, UserCheck, Trophy, Newspaper, Trash2, Plus, Save, RotateCcw,
  LogOut, ChevronRight, Eye, EyeOff, ArrowLeft, X, Image, Calendar, Phone, Mail, User, GraduationCap, Hash,
  MailCheck, AlertCircle, Send, RefreshCw, Clock, CheckCircle2, XCircle
} from "lucide-react";
import {
  fetchRegistrants,
  addRegistrant, deleteRegistrant, clearRegistrants,
  fetchScores, saveScores, resetScores, totalScore,
  fetchNews, addNews, deleteNews,
  fetchEmailLogs, fetchEmailConfig, sendTestEmail, resendRegistrationEmail,
  adminLogin, adminLogout, isAuthed, AuthError,
  type Registrant, type CohortScore, type NewsItem,
  type EmailLogEntry, type EmailConfig,
} from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { safeUUID } from "@/lib/uuid";

// 5 official Science Education cohorts. No Computer Science.
const COHORTS = [
  "Biology Education",
  "Chemistry Education",
  "Physics Education",
  "Mathematics Education",
  "Integrated Science",
];
const LEVELS = ["100 Level", "200 Level", "300 Level", "400 Level", "500 Level"];

type Tab = "overview" | "registrants" | "scores" | "news" | "emails";

// ── LOGIN ────────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setSubmitting(true);
    try {
      await adminLogin(pw);
      onLogin();
    } catch (err) {
      console.error("Login failed:", err);
      setError(true);
      toast({
        title: "Access denied",
        description: err instanceof Error ? err.message : "Incorrect password.",
        variant: "destructive",
      });
      setPw("");
    } finally {
      setSubmitting(false);
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
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-primary text-white font-bold glow-effect hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-admin-login"
          >
            {submitting ? "Authenticating..." : "Access Dashboard"}
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

// Admin-only modal to register a contestant. The owner wanted to register
// participants themselves (instead of a public form), so this lives here.
// On submit, the API sends a confirmation email to the contestant's address.
function AddContestantModal({ onClose, onAdded }: { onClose: () => void; onAdded: (r: Registrant) => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "", matric: "", dept: "", level: "", phone: "", email: "",
  });
  const [fileName, setFileName] = useState("");
  const [passportBase64, setPassportBase64] = useState<string | null>(null);
  const [passportError, setPassportError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  // Validate file size (max 5 MB) and type (jpeg/png/webp) before reading.
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassportError("");
    const file = e.target.files?.[0];
    if (!file) {
      setFileName("");
      setPassportBase64(null);
      return;
    }
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setPassportError("Only JPG, PNG, or WebP images are allowed.");
      setFileName("");
      setPassportBase64(null);
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPassportError("File is too large. Maximum size is 5 MB.");
      setFileName("");
      setPassportBase64(null);
      e.target.value = "";
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => setPassportBase64(event.target?.result as string);
    reader.onerror = () => setPassportError("Could not read the file. Try another image.");
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passportBase64) {
      setPassportError("A passport photograph is required.");
      return;
    }
    setSubmitting(true);
    try {
      const added = await addRegistrant({
        id: safeUUID(),
        type: "contestant",
        name: form.name.trim(),
        matric: form.matric.trim(),
        department: form.dept,
        level: form.level,
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
        passportBase64,
        registeredAt: new Date().toISOString(),
      });
      toast({
        title: "Contestant registered!",
        description: `${added.name} has been added and will receive a confirmation email.`,
      });
      onAdded(added);
      onClose();
    } catch (err) {
      console.error(err);
      toast({
        title: "Registration failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10">
          <div>
            <h3 className="font-display font-bold text-xl">Add Contestant</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              The contestant will receive a confirmation email at the address you enter.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
            type="button"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">Full Name <span className="text-destructive">*</span></label>
              <input className={inputCls} placeholder="Contestant's full name" value={form.name} onChange={set("name")} required disabled={submitting} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">Matric Number <span className="text-destructive">*</span></label>
              <input className={inputCls} placeholder="e.g. 190402001" value={form.matric} onChange={set("matric")} required disabled={submitting} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">Cohort <span className="text-destructive">*</span></label>
              <select className={inputCls} value={form.dept} onChange={set("dept")} required disabled={submitting}>
                <option value="" className="bg-background">Select cohort</option>
                {COHORTS.map((c) => <option key={c} value={c} className="bg-background">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">Level <span className="text-destructive">*</span></label>
              <select className={inputCls} value={form.level} onChange={set("level")} required disabled={submitting}>
                <option value="" className="bg-background">Select level</option>
                {LEVELS.map((l) => <option key={l} value={l} className="bg-background">{l}</option>)}
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">Phone Number <span className="text-destructive">*</span></label>
              <input type="tel" className={inputCls} placeholder="+234..." value={form.phone} onChange={set("phone")} required disabled={submitting} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">Email Address <span className="text-destructive">*</span></label>
              <input type="email" className={inputCls} placeholder="contestant@email.com" value={form.email} onChange={set("email")} required disabled={submitting} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">Passport Photograph <span className="text-destructive">*</span></label>
            <label
              htmlFor="admin-passport-upload"
              className="flex flex-col items-center gap-3 px-6 py-8 rounded-xl border-2 border-dashed border-white/15 hover:border-primary/40 cursor-pointer transition-all bg-white/3 hover:bg-primary/5 group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <Image size={22} />
              </div>
              {fileName ? (
                <p className="text-primary text-sm font-semibold">{fileName}</p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground text-center">Click to upload passport photo</p>
                  <p className="text-xs text-muted-foreground/60">JPG, PNG, or WebP — max 5 MB</p>
                </>
              )}
              <input id="admin-passport-upload" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} disabled={submitting} />
            </label>
            {passportError && <p className="text-destructive text-xs mt-2">{passportError}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-primary text-white font-bold glow-effect hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Registering..." : "Register Contestant"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl glass-card border border-white/10 font-bold hover:bg-white/10 transition-all"
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function RegistrantsTab({ registrants, onDelete, onClear, onAdd, onResendEmail }: {
  registrants: Registrant[]; onDelete: (id: string) => void; onClear: () => void; onAdd: (r: Registrant) => void;
  onResendEmail: (r: Registrant) => Promise<void>;
}) {
  const [filter, setFilter] = useState<"all" | "contestant" | "audience">("all");
  const [confirmClear, setConfirmClear] = useState(false);
  const [selectedRegistrant, setSelectedRegistrant] = useState<Registrant | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [resending, setResending] = useState(false);

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-primary text-white glow-effect hover:bg-primary/90 transition-all"
          >
            <Plus size={14} /> Add Contestant
          </button>
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

              <div className="pt-4 flex gap-3 flex-wrap">
                <button
                  onClick={async () => {
                    setResending(true);
                    try {
                      await onResendEmail(selectedRegistrant);
                    } finally {
                      setResending(false);
                    }
                  }}
                  disabled={resending}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resending ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                  {resending ? "Sending…" : "Resend Confirmation Email"}
                </button>
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

      {showAddModal && (
        <AddContestantModal
          onClose={() => setShowAddModal(false)}
          onAdded={(r) => onAdd(r)}
        />
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

// ── EMAILS ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: EmailLogEntry["status"] }) {
  const map = {
    sent: { icon: <CheckCircle2 size={12} />, cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "Sent" },
    failed: { icon: <XCircle size={12} />, cls: "bg-red-500/10 text-red-400 border-red-500/20", label: "Failed" },
    queued: { icon: <Clock size={12} />, cls: "bg-amber-500/10 text-amber-400 border-amber-500/20", label: "Queued" },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-semibold ${map.cls}`}>
      {map.icon} {map.label}
    </span>
  );
}

function EmailsTab({ logs, config, onRefresh }: {
  logs: EmailLogEntry[];
  config: EmailConfig | null;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [testEmailTarget, setTestEmailTarget] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingTest(true);
    try {
      const result = await sendTestEmail(testEmailTarget.trim() || undefined);
      if (result.status === "sent") {
        toast({
          title: "Test email sent!",
          description: `Check the inbox of ${testEmailTarget.trim() || config?.adminNotifyEmail || "the admin email"}.`,
        });
        setTestEmailTarget("");
      } else {
        toast({
          title: "Test email failed",
          description: result.error || "See the email log for details.",
          variant: "destructive",
        });
      }
      onRefresh();
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to send test email",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingTest(false);
    }
  };

  const sent = logs.filter((l) => l.status === "sent").length;
  const failed = logs.filter((l) => l.status === "failed").length;
  const queued = logs.filter((l) => l.status === "queued").length;

  return (
    <div className="space-y-6">
      {/* Config card */}
      <div className="glass-card rounded-2xl p-6 border border-white/10">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-display font-bold text-lg mb-1 flex items-center gap-2">
              <MailCheck size={18} className="text-primary" />
              Resend Email Configuration
            </h3>
            <p className="text-xs text-muted-foreground">
              Verify the email service is wired up before competition day.
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold glass-card border border-white/10 hover:bg-white/10 transition-all"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mt-5">
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Resend API Key</p>
            {config ? (
              config.resendConfigured ? (
                <p className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Configured
                </p>
              ) : (
                <p className="text-sm font-semibold text-red-400 flex items-center gap-1.5">
                  <AlertCircle size={14} /> Not set — emails will fail
                </p>
              )
            ) : (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
          </div>

          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Sender Address</p>
            <p className="text-sm font-mono break-all">{config?.mailFrom ?? "—"}</p>
            {config?.usingSandboxSender && (
              <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> Sandbox sender — only delivers to the Resend account owner.
                Set <code className="bg-white/10 px-1 rounded">MAIL_FROM</code> to a verified sender for production.
              </p>
            )}
          </div>

          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Admin Notification Email</p>
            <p className="text-sm font-mono break-all">{config?.adminNotifyEmail ?? "—"}</p>
          </div>

          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Reply-To Address</p>
            <p className="text-sm font-mono break-all">{config?.replyTo ?? "—"}</p>
          </div>
        </div>

        {/* Test email form */}
        <form onSubmit={handleTestEmail} className="mt-5 pt-5 border-t border-white/10 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-muted-foreground">
              Send Test Email To (optional)
            </label>
            <input
              type="email"
              placeholder={config?.adminNotifyEmail || "admin@example.com"}
              value={testEmailTarget}
              onChange={(e) => setTestEmailTarget(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={sendingTest}
            className="px-5 py-2.5 rounded-lg text-sm font-bold bg-primary text-white glow-effect hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {sendingTest ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
            {sendingTest ? "Sending…" : "Send Test Email"}
          </button>
        </form>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-4 border border-emerald-500/20 text-center">
          <div className="text-2xl font-display font-bold text-emerald-400">{sent}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Sent</div>
        </div>
        <div className="glass-card rounded-xl p-4 border border-amber-500/20 text-center">
          <div className="text-2xl font-display font-bold text-amber-400">{queued}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Queued</div>
        </div>
        <div className="glass-card rounded-xl p-4 border border-red-500/20 text-center">
          <div className="text-2xl font-display font-bold text-red-400">{failed}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Failed</div>
        </div>
      </div>

      {/* Email log table */}
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-display font-bold text-sm">Email Audit Log</h3>
          <span className="text-xs text-muted-foreground">Last 200 attempts</span>
        </div>
        {logs.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No emails sent yet. Registrations will trigger confirmation emails automatically.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/2">
                  {["Status", "Recipient", "Type", "Attempts", "Sent At", "Error"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs uppercase tracking-widest text-muted-foreground font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="py-3 px-4"><StatusBadge status={log.status} /></td>
                    <td className="py-3 px-4 text-sm font-mono">{log.recipient}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      {log.type === "student_confirmation" ? "Student Confirmation" :
                       log.type === "admin_notification" ? "Admin Notification" :
                       log.type === "test" ? "Test Email" : log.type}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{log.attempts}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      {new Date(log.sentAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-xs text-red-400 max-w-xs truncate" title={log.error || ""}>
                      {log.error || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
  const [emailLogs, setEmailLogs] = useState<EmailLogEntry[]>([]);
  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null);
  const { toast } = useToast();

  // If an API call returns 401, clear auth and bounce to login.
  const handleAuthError = (err: unknown): boolean => {
    if (err instanceof AuthError) {
      toast({ title: "Session expired", description: "Please log in again.", variant: "destructive" });
      onLogout();
      return true;
    }
    return false;
  };

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
      if (handleAuthError(err)) return;
      toast({
        title: "Failed to load data",
        description: err instanceof Error ? err.message : "Please check your network and try again.",
        variant: "destructive",
      });
    }
  };

  // Email tab loads independently — only when the user actually opens it,
  // so the initial dashboard load doesn't pay for two extra API calls.
  const refreshEmails = async () => {
    try {
      const [logs, cfg] = await Promise.all([
        fetchEmailLogs(),
        fetchEmailConfig(),
      ]);
      setEmailLogs(logs);
      setEmailConfig(cfg);
    } catch (err) {
      console.error(err);
      if (handleAuthError(err)) return;
      toast({
        title: "Failed to load email data",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (tab === "emails") refreshEmails();
  }, [tab]);

  useEffect(() => { refresh(); }, []);

  const handleDeleteRegistrant = async (id: string) => {
    try {
      await deleteRegistrant(id);
      setRegistrants((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Registrant removed." });
    } catch (err) {
      console.error(err);
      if (handleAuthError(err)) return;
      toast({
        title: "Failed to delete registrant",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddRegistrant = (r: Registrant) => {
    // addRegistrant already ran in the modal; just update local state.
    setRegistrants((prev) => [r, ...prev]);
  };

  const handleClearRegistrants = async () => {
    try {
      await clearRegistrants();
      setRegistrants([]);
      toast({ title: "All registrants cleared." });
    } catch (err) {
      console.error(err);
      if (handleAuthError(err)) return;
      toast({
        title: "Failed to clear registrants",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveScores = async (s: CohortScore[]) => {
    try {
      await saveScores(s);
      setScores(s);
    } catch (err) {
      console.error(err);
      if (handleAuthError(err)) return;
      toast({
        title: "Failed to save scores",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleResetScores = async () => {
    try {
      const s = await resetScores();
      setScores(s);
      toast({ title: "Scores reset to defaults." });
    } catch (err) {
      console.error(err);
      if (handleAuthError(err)) return;
      toast({
        title: "Failed to reset scores",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddNews = async (item: Omit<NewsItem, "id">) => {
    try {
      await addNews(item);
      refresh();
    } catch (err) {
      console.error(err);
      if (handleAuthError(err)) return;
      toast({
        title: "Failed to publish news",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNews = async (id: string) => {
    try {
      await deleteNews(id);
      setNews((prev) => prev.filter((n) => n.id !== id));
      toast({ title: "News item deleted." });
    } catch (err) {
      console.error(err);
      if (handleAuthError(err)) return;
      toast({
        title: "Failed to delete news",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleResendEmail = async (r: Registrant) => {
    try {
      const result = await resendRegistrationEmail(r.id);
      if (result.email.status === "sent") {
        toast({
          title: "Confirmation email resent!",
          description: `A new confirmation was sent to ${result.registrant.email}.`,
        });
      } else {
        toast({
          title: "Resend failed",
          description: result.email.error || "See the Emails tab for details.",
          variant: "destructive",
        });
      }
      // If the user is currently on the emails tab, refresh the log so the
      // new entry is visible immediately.
      if (tab === "emails") refreshEmails();
    } catch (err) {
      console.error(err);
      if (handleAuthError(err)) return;
      toast({
        title: "Failed to resend email",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <Eye size={16} /> },
    { key: "registrants", label: "Registrants", icon: <Users size={16} /> },
    { key: "scores", label: "Scores", icon: <Trophy size={16} /> },
    { key: "news", label: "News", icon: <Newspaper size={16} /> },
    { key: "emails", label: "Emails", icon: <MailCheck size={16} /> },
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
            {tab === "registrants" && <RegistrantsTab registrants={registrants} onDelete={handleDeleteRegistrant} onClear={handleClearRegistrants} onAdd={handleAddRegistrant} onResendEmail={handleResendEmail} />}
            {tab === "scores" && <ScoresTab scores={scores} onSave={handleSaveScores} onReset={handleResetScores} />}
            {tab === "news" && <NewsTab news={news} onAdd={handleAddNews} onDelete={handleDeleteNews} />}
            {tab === "emails" && <EmailsTab logs={emailLogs} config={emailConfig} onRefresh={refreshEmails} />}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────

export default function Admin() {
  const [authed, setAuthed] = useState(() => isAuthed());

  const handleLogout = async () => {
    await adminLogout();
    setAuthed(false);
  };

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;
  return <Dashboard onLogout={handleLogout} />;
}
