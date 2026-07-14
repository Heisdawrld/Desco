import { useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { Mail, Phone, MapPin, Clock, Twitter, Instagram } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

const CONTACT_INFO = [
  {
    icon: <Mail size={20} />,
    label: "Email",
    lines: ["desco@ulsesa.unilag.edu.ng", "ulsesa@unilag.edu.ng"],
    href: (l: string) => `mailto:${l}`,
  },
  {
    icon: <Phone size={20} />,
    label: "Phone",
    lines: ["+234 801 234 5678", "+234 809 876 5432"],
    href: (l: string) => `tel:${l.replace(/\s/g, "")}`,
  },
  {
    icon: <MapPin size={20} />,
    label: "Location",
    lines: ["Science Education Department", "Faculty of Education, University of Lagos", "Akoka, Lagos, Nigeria"],
    href: () => "#",
  },
  {
    icon: <Clock size={20} />,
    label: "Office Hours",
    lines: ["Mon — Fri: 9:00 AM — 5:00 PM", "Event Day: 7:00 AM — 8:00 PM"],
    href: () => "#",
  },
];

export default function Contact() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    // Build a mailto: link so the user's own email client opens with the
    // message prefilled. This guarantees the message actually reaches the
    // organizing team (no backend email relay needed) and the sender's
    // real reply-to address is correct.
    const to = "desco@ulsesa.unilag.edu.ng";
    const subject = form.subject || "DESCO 2.0 Inquiry";
    const body = `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`;
    const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Small delay so the user sees the "Opening email..." state before
    // the mail client takes over.
    setTimeout(() => {
      window.location.href = mailto;
      setSending(false);
      toast({
        title: "Opening your email app...",
        description: "If nothing happened, email us directly at desco@ulsesa.unilag.edu.ng",
      });
      setForm({ name: "", email: "", subject: "", message: "" });
    }, 400);
  };

  return (
    <Layout>
      <PageHeader
        label="Reach Out"
        title="Contact Us"
        subtitle="Reach out to the DESCO 2.0 organizing team."
      />

      <section className="py-12 pb-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="mb-8">
                <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">Get In Touch</p>
                <h2 className="font-display font-bold text-2xl md:text-3xl mb-3">We'd Love to Hear From You</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Whether you're a prospective contestant, sponsor, media partner, or just curious about DESCO 2.0, we'd love to hear from you.
                </p>
              </div>

              {CONTACT_INFO.map((item) => (
                <div key={item.label} className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-1">{item.label}</p>
                    {item.lines.map((line) => (
                      <a
                        key={line}
                        href={item.href(line)}
                        className="block text-muted-foreground text-sm hover:text-primary transition-colors"
                      >
                        {line}
                      </a>
                    ))}
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-white/10">
                <p className="font-semibold text-sm mb-3">Follow DESCO</p>
                <div className="flex gap-3">
                  {[
                    { href: "https://x.com/ulsesa01", icon: <Twitter size={16} />, label: "X" },
                    { href: "https://www.instagram.com/ulsesa01/", icon: <Instagram size={16} />, label: "Instagram" },
                  ].map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      className="w-10 h-10 rounded-lg glass-card border border-white/10 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
                      aria-label={social.label}
                      data-testid={`social-${social.label.toLowerCase()}`}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card rounded-2xl p-8 border border-white/10"
            >
              <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">Send a Message</p>
              <h3 className="font-display font-bold text-xl mb-2">Get In Touch</h3>
              <p className="text-muted-foreground text-sm mb-8">Fill the form and we'll respond within 24 hours.</p>

              <form onSubmit={handleSubmit} className="space-y-5" data-testid="contact-form">
                {[
                  { id: "name", label: "Full Name", type: "text", key: "name" as const },
                  { id: "email", label: "Email Address", type: "email", key: "email" as const },
                ].map((field) => (
                  <div key={field.id}>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground" htmlFor={`c-${field.id}`}>
                      {field.label} <span className="text-destructive">*</span>
                    </label>
                    <input
                      id={`c-${field.id}`}
                      type={field.type}
                      required
                      value={form[field.key]}
                      onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all text-sm"
                      placeholder={field.label}
                      data-testid={`input-${field.id}`}
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground" htmlFor="c-subject">
                    Subject <span className="text-destructive">*</span>
                  </label>
                  <select
                    id="c-subject"
                    required
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50 transition-all text-sm"
                    data-testid="select-subject"
                  >
                    <option value="" className="bg-background">Select a subject</option>
                    {["Registration Support", "Sponsorship Inquiry", "Media & Press", "General Question", "Technical Support"].map((opt) => (
                      <option key={opt} value={opt} className="bg-background">{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground" htmlFor="c-message">
                    Message <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    id="c-message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all text-sm resize-none"
                    placeholder="Your message..."
                    data-testid="textarea-message"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-4 rounded-xl bg-primary text-white font-semibold glow-effect hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-submit"
                >
                  {sending ? "Sending..." : "Send Message"}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
