import { useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { Users, UserCheck, Upload } from "lucide-react";
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

const DEPARTMENTS = ["Biology Education", "Chemistry Education", "Physics Education", "Mathematics Education", "Integrated Science"];
const LEVELS = ["100 Level", "200 Level", "300 Level", "400 Level", "500 Level"];

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
      {children} {required && <span className="text-destructive">*</span>}
    </label>
  );
}

function InputField({ id, type = "text", placeholder, value, onChange, required }: {
  id: string; type?: string; placeholder: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean;
}) {
  return (
    <input
      id={id} type={type} required={required} value={value} onChange={onChange} placeholder={placeholder}
      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all text-sm"
      data-testid={`input-${id}`}
    />
  );
}

function SelectField({ id, options, value, onChange, placeholder, required }: {
  id: string; options: string[]; value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; placeholder: string; required?: boolean;
}) {
  return (
    <select
      id={id} required={required} value={value} onChange={onChange}
      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50 transition-all text-sm"
      data-testid={`select-${id}`}
    >
      <option value="" className="bg-background text-muted-foreground">{placeholder}</option>
      {options.map((o) => <option key={o} value={o} className="bg-background">{o}</option>)}
    </select>
  );
}

function ContestantForm() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", matric: "", dept: "", level: "", phone: "", email: "" });
  const [sending, setSending] = useState(false);
  const [fileName, setFileName] = useState("");

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName) {
      toast({ title: "Passport photo required", description: "Please upload your passport photograph.", variant: "destructive" });
      return;
    }
    setSending(true);
    await addRegistrant({
      id: crypto.randomUUID(),
      type: "contestant",
      name: form.name,
      matric: form.matric,
      department: form.dept,
      level: form.level,
      phone: form.phone,
      email: form.email,
      registeredAt: new Date().toISOString(),
    });
    setSending(false);
    toast({ title: "Registration submitted!", description: "You'll receive a confirmation email shortly." });
    setForm({ name: "", matric: "", dept: "", level: "", phone: "", email: "" });
    setFileName("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" data-testid="contestant-form">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <FieldLabel required>Full Name</FieldLabel>
          <InputField id="cf-name" placeholder="Your full name" value={form.name} onChange={set("name")} required />
        </div>
        <div>
          <FieldLabel required>Matric Number</FieldLabel>
          <InputField id="cf-matric" placeholder="e.g. 190402001" value={form.matric} onChange={set("matric")} required />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <FieldLabel required>Cohort</FieldLabel>
          <SelectField id="cf-dept" options={DEPARTMENTS} value={form.dept} onChange={set("dept")} placeholder="Select cohort" required />
        </div>
        <div>
          <FieldLabel required>Level</FieldLabel>
          <SelectField id="cf-level" options={LEVELS} value={form.level} onChange={set("level")} placeholder="Select level" required />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <FieldLabel required>Phone Number</FieldLabel>
          <InputField id="cf-phone" type="tel" placeholder="+234..." value={form.phone} onChange={set("phone")} required />
        </div>
        <div>
          <FieldLabel required>Email Address</FieldLabel>
          <InputField id="cf-email" type="email" placeholder="your@email.com" value={form.email} onChange={set("email")} required />
        </div>
      </div>
      <div>
        <FieldLabel required>Passport Photograph</FieldLabel>
        <label
          htmlFor="passport-upload"
          className="flex flex-col items-center gap-3 px-6 py-8 rounded-xl border-2 border-dashed border-white/15 hover:border-primary/40 cursor-pointer transition-all bg-white/3 hover:bg-primary/5 group"
          data-testid="photo-upload-area"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
            <Upload size={22} />
          </div>
          {fileName ? (
            <p className="text-primary text-sm font-semibold">{fileName}</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground text-center">Click to upload or drag & drop your passport photo</p>
              <p className="text-xs text-muted-foreground/60">PNG, JPG up to 5MB</p>
            </>
          )}
          <input id="passport-upload" type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      </div>
      <button
        type="submit" disabled={sending}
        className="w-full py-4 rounded-xl bg-primary text-white font-bold glow-effect hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base"
        data-testid="button-contestant-submit"
      >
        {sending ? "Submitting..." : "Submit Registration"}
      </button>
    </form>
  );
}

function AudienceForm() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", dept: "", level: "", phone: "", email: "" });
  const [sending, setSending] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await addRegistrant({
      id: crypto.randomUUID(),
      type: "audience",
      name: form.name,
      department: form.dept,
      level: form.level,
      phone: form.phone,
      email: form.email,
      registeredAt: new Date().toISOString(),
    });
    setSending(false);
    toast({ title: "Seat reserved!", description: "See you at the showdown." });
    setForm({ name: "", dept: "", level: "", phone: "", email: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" data-testid="audience-form">
      <div>
        <FieldLabel required>Full Name</FieldLabel>
        <InputField id="af-name" placeholder="Your full name" value={form.name} onChange={set("name")} required />
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <FieldLabel required>Cohort</FieldLabel>
          <InputField id="af-dept" placeholder="Your cohort (e.g. Biology Education)" value={form.dept} onChange={set("dept")} required />
        </div>
        <div>
          <FieldLabel required>Level</FieldLabel>
          <SelectField id="af-level" options={LEVELS} value={form.level} onChange={set("level")} placeholder="Select level" required />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <FieldLabel required>Phone Number</FieldLabel>
          <InputField id="af-phone" type="tel" placeholder="+234..." value={form.phone} onChange={set("phone")} required />
        </div>
        <div>
          <FieldLabel required>Email Address</FieldLabel>
          <InputField id="af-email" type="email" placeholder="your@email.com" value={form.email} onChange={set("email")} required />
        </div>
      </div>
      <button
        type="submit" disabled={sending}
        className="w-full py-4 rounded-xl bg-primary text-white font-bold glow-effect hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base"
        data-testid="button-audience-submit"
      >
        {sending ? "Reserving..." : "Reserve My Seat"}
      </button>
    </form>
  );
}

export default function Register() {
  const [activeTab, setActiveTab] = useState<"contestant" | "audience">("contestant");

  return (
    <Layout>
      <PageHeader
        label="Registration"
        title="Register for DESCO 2.0"
        subtitle="Choose your path — compete for glory or witness greatness as part of the audience."
      />
      <section className="py-12 pb-24">
        <div className="container mx-auto px-4 md:px-6 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 mb-8 glass-card rounded-xl p-1.5 border border-white/10"
          >
            {[
              { key: "contestant" as const, label: "Contestant Registration", icon: <UserCheck size={16} /> },
              { key: "audience" as const, label: "Audience Registration", icon: <Users size={16} /> },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.key ? "bg-primary text-white glow-effect" : "text-muted-foreground hover:text-white"}`}
                data-testid={`tab-${tab.key}`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.key === "contestant" ? "Contestant" : "Audience"}</span>
              </button>
            ))}
          </motion.div>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="glass-card rounded-2xl p-8 border border-white/10"
          >
            {activeTab === "contestant" ? (
              <>
                <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-2">Contestant</p>
                <h3 className="font-display font-bold text-2xl mb-2">Represent Your Cohort</h3>
                <p className="text-muted-foreground text-sm mb-8">Prove your worth. Dominate or don't show up.</p>
                <ContestantForm />
              </>
            ) : (
              <>
                <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-2">Audience</p>
                <h3 className="font-display font-bold text-2xl mb-2">Reserve Your Seat</h3>
                <p className="text-muted-foreground text-sm mb-8">Be part of the energy. Witness the showdown live.</p>
                <AudienceForm />
              </>
            )}
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
