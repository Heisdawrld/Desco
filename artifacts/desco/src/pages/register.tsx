import { useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { Info } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { addRegistrant } from "@/lib/store";

function PageHeader({ label, title, subtitle }: { label: string; title: string; subtitle: string }) {
  return (
    <header className="relative pt-36 pb-20 overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-xs uppercase tracking-widest text-primary font-semibold mb-4">{label}</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-display font-bold text-gradient mb-4" style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}>{title}</motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-muted-foreground text-lg max-w-2xl mx-auto">{subtitle}</motion.p>
      </div>
    </header>
  );
}

const COHORTS = ["Biology Education", "Chemistry Education", "Physics Education", "Mathematics Education", "Integrated Science"];
const LEVELS = ["100 Level", "200 Level", "300 Level", "400 Level", "500 Level"];

function AudienceForm() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", dept: "", level: "", phone: "", email: "" });
  const [sending, setSending] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await addRegistrant({
        id: crypto.randomUUID(),
        type: "audience",
        name: form.name.trim(),
        department: form.dept,
        level: form.level,
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
        registeredAt: new Date().toISOString(),
      });
      toast({ title: "Seat reserved!", description: "Check your email for confirmation and event details." });
      setForm({ name: "", dept: "", level: "", phone: "", email: "" });
    } catch (err) {
      console.error(err);
      toast({
        title: "Registration failed",
        description: err instanceof Error ? err.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" data-testid="audience-form">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">Full Name <span className="text-destructive">*</span></label>
        <input
          type="text"
          required
          value={form.name}
          onChange={set("name")}
          placeholder="Your full name"
          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all text-sm"
          data-testid="input-af-name"
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">Cohort <span className="text-destructive">*</span></label>
          <select
            required
            value={form.dept}
            onChange={set("dept")}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50 transition-all text-sm"
            data-testid="select-af-dept"
          >
            <option value="" className="bg-background text-muted-foreground">Select your cohort</option>
            {COHORTS.map((c) => <option key={c} value={c} className="bg-background">{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">Level <span className="text-destructive">*</span></label>
          <select
            required
            value={form.level}
            onChange={set("level")}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50 transition-all text-sm"
            data-testid="select-af-level"
          >
            <option value="" className="bg-background text-muted-foreground">Select level</option>
            {LEVELS.map((l) => <option key={l} value={l} className="bg-background">{l}</option>)}
          </select>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">Phone Number <span className="text-destructive">*</span></label>
          <input
            type="tel"
            required
            value={form.phone}
            onChange={set("phone")}
            placeholder="+234..."
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all text-sm"
            data-testid="input-af-phone"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">Email Address <span className="text-destructive">*</span></label>
          <input
            type="email"
            required
            value={form.email}
            onChange={set("email")}
            placeholder="your@email.com"
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all text-sm"
            data-testid="input-af-email"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={sending}
        className="w-full py-4 rounded-xl bg-primary text-white font-bold glow-effect hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base"
        data-testid="button-audience-submit"
      >
        {sending ? "Reserving..." : "Reserve My Seat"}
      </button>
    </form>
  );
}

export default function Register() {
  return (
    <Layout>
      <PageHeader
        label="Audience Registration"
        title="Reserve Your Seat"
        subtitle="Be part of the energy. Witness five cohorts battle through six rounds of intellectual combat at DESCO 2.0."
      />
      <section className="py-12 pb-24">
        <div className="container mx-auto px-4 md:px-6 max-w-2xl">
          {/* Contestant registration notice */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-5 border border-primary/20 mb-8 flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Info size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm mb-1">Are you a contestant?</p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Contestant registrations are handled directly by the organizing team. If you've been
                selected to represent your cohort, your details will be added by an admin and you'll
                receive a confirmation email. Questions? Reach out via the{" "}
                <Link href="/contact" className="text-primary hover:underline">contact page</Link>.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-8 border border-white/10"
          >
            <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-2">Audience</p>
            <h3 className="font-display font-bold text-2xl mb-2">Witness the Showdown</h3>
            <p className="text-muted-foreground text-sm mb-8">
              Doors open at 8:00 AM. Seating is first-come, first-served — arrive early to grab the best spot.
            </p>
            <AudienceForm />
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
