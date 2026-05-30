import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { Instagram, CalendarDays } from "lucide-react";
import { getNews, type NewsItem } from "@/lib/store";

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

export default function Gallery() {
  const [updates, setUpdates] = useState<NewsItem[]>([]);

  useEffect(() => {
    setUpdates(getNews());
  }, []);

  return (
    <Layout>
      <PageHeader
        label="Media"
        title="DESCO Gallery"
        subtitle="Moments, memories, and the making of champions."
      />

      {/* Coming Soon */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center glass-card rounded-3xl p-12 border border-white/10"
          >
            <div className="w-24 h-24 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <h3 className="font-display font-bold text-2xl md:text-3xl mb-4">Memories in the Making</h3>
            <p className="text-muted-foreground leading-relaxed mb-8">
              The DESCO 2.0 gallery will be updated with photos, video highlights, and recaps after the competition. Follow us on social media for behind-the-scenes content and live updates.
            </p>
            <a
              href="https://www.instagram.com/ulsesa01/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold hover:from-pink-600 hover:to-rose-600 transition-all"
              data-testid="instagram-link"
            >
              <Instagram size={18} />
              Follow on Instagram
            </a>
          </motion.div>
        </div>
      </section>

      {/* Updates Feed */}
      <section className="py-20 bg-card/30 border-t border-white/5">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-4">News</p>
            <h2 className="font-display font-bold text-3xl md:text-4xl">DESCO Updates</h2>
          </motion.div>

          {updates.length === 0 ? (
            <p className="text-center text-muted-foreground">No updates yet.</p>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {updates.map((update, i) => (
                <motion.div
                  key={update.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="glass-card rounded-2xl p-6 border border-white/10 glow-effect-hover flex gap-4"
                  data-testid={`update-${i}`}
                >
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mt-1">
                    <CalendarDays size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-primary font-bold uppercase tracking-widest mb-2">{update.date}</p>
                    <h3 className="font-display font-bold text-lg mb-2">{update.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{update.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
