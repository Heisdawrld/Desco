import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { Eye, Target, Trophy } from "lucide-react";

function PageHeader({ label, title, subtitle }: { label: string; title: string; subtitle: string }) {
  return (
    <header className="relative pt-36 pb-20 overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs uppercase tracking-widest text-primary font-semibold mb-4"
        >
          {label}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display font-bold text-gradient mb-4"
          style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-muted-foreground text-lg max-w-2xl mx-auto"
        >
          {subtitle}
        </motion.p>
      </div>
    </header>
  );
}

export default function About() {
  return (
    <Layout>
      <PageHeader
        label="The Story"
        title="About DESCO"
        subtitle="The story, the vision, and the mission behind the ultimate academic showdown."
      />

      {/* WHAT IS DESCO */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-4">What is DESCO?</p>
              <h2 className="font-display font-bold text-3xl md:text-4xl mb-6">The Premier Intellectual Battleground</h2>
              <p className="text-muted-foreground leading-relaxed mb-4 text-lg">
                DESCO — the <strong className="text-white">Cohort Showdown Competition</strong> — is the flagship intellectual competition organized by the University of Lagos Science Education Students' Association (ULSESA).
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Born from a desire to celebrate academic brilliance beyond the classroom, DESCO brings together the brightest minds across all academic cohorts in the Science Education department in a battle of wits, speed, and strategy.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                DESCO 2.0 is bigger, bolder, and more competitive than ever. With six intense rounds, only one cohort will emerge victorious.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { label: "Cohorts Competing", value: "5" },
                { label: "Competition Rounds", value: "6" },
                { label: "Edition", value: "2.0" },
                { label: "Champion", value: "1" },
              ].map((stat) => (
                <div key={stat.label} className="glass-card rounded-2xl p-6 text-center border border-white/10">
                  <div className="font-display font-bold text-4xl text-gradient mb-2">{stat.value}</div>
                  <div className="text-muted-foreground text-sm">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* VISION & MISSION */}
      <section className="py-20 bg-card/30 border-y border-white/5">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                label: "Our Vision",
                icon: <Eye size={24} />,
                title: "Vision",
                body: "To establish DESCO as the premier academic competition in Nigerian universities — a platform that discovers, celebrates, and elevates the brightest scientific minds of tomorrow.",
              },
              {
                label: "Our Mission",
                icon: <Target size={24} />,
                title: "Mission",
                body: "To foster interdisciplinary excellence, build competitive spirit, and create an ecosystem where academic achievement is celebrated with the same energy as athletic glory.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="glass-card rounded-2xl p-8 border border-white/10 glow-effect-hover"
              >
                <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-4">{item.label}</p>
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary">
                  {item.icon}
                </div>
                <h3 className="font-display font-bold text-2xl mb-4">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* DESCO 1.0 RECAP */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-4">Legacy</p>
            <h2 className="font-display font-bold text-3xl md:text-5xl mb-4">DESCO 1.0 Recap</h2>
            <p className="text-muted-foreground">The inaugural edition set the standard. This year, we raise the bar.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto glass-card rounded-3xl p-10 text-center border border-yellow-500/20 bg-gradient-to-b from-yellow-500/5 to-transparent"
          >
            <div className="w-20 h-20 mx-auto rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-6 text-yellow-400">
              <Trophy size={36} />
            </div>
            <h3 className="font-display font-bold text-3xl mb-6">DESCO 1.0 Champions</h3>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-bold text-lg mb-6">
              <Trophy size={20} />
              Biology Education Cohort
            </div>
            <p className="text-muted-foreground leading-relaxed">
              The Biology Education cohort claimed the inaugural DESCO crown in a thrilling finale that went down to the final buzzer question. Their deep knowledge base, tactical discipline, and unshakeable teamwork proved too much for the competition. Now the crown is on the line — and four other cohorts are coming for it.
            </p>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
