import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { Zap, Shuffle, Target, Grid, Radio, Moon, ArrowRight } from "lucide-react";

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

const ROUNDS = [
  {
    num: "01",
    name: "Academic Sprint",
    icon: <Zap size={28} />,
    desc: "A high-speed rapid-fire round testing foundational knowledge across all science disciplines. Speed and accuracy are everything. Wrong answers carry penalties — hesitation costs points.",
    tag: "Speed · Accuracy · Pressure",
    color: "from-purple-500/10 to-violet-500/5",
    border: "hover:border-purple-500/40",
  },
  {
    num: "02",
    name: "Cross-Discipline Clash",
    icon: <Shuffle size={28} />,
    desc: "Contestants face questions outside their specialization. Biology experts tackle physics, mathematicians answer chemistry. Adaptability and breadth of knowledge determine the survivors.",
    tag: "Adaptability · Breadth · Strategy",
    color: "from-cyan-500/10 to-blue-500/5",
    border: "hover:border-cyan-500/40",
  },
  {
    num: "03",
    name: "Specialist Round",
    icon: <Target size={28} />,
    desc: "Deep-dive questions within each cohort's core expertise. This is where specialists shine — advanced concepts, edge-case scenarios, and mastery-level problem solving.",
    tag: "Mastery · Depth · Precision",
    color: "from-green-500/10 to-emerald-500/5",
    border: "hover:border-green-500/40",
  },
  {
    num: "04",
    name: "Puzzle & Logic Arena",
    icon: <Grid size={28} />,
    desc: "Pure reasoning, pattern recognition, logical deduction, and lateral thinking challenges. No domain knowledge required — only raw cognitive horsepower.",
    tag: "Logic · Pattern · Reasoning",
    color: "from-indigo-500/10 to-purple-500/5",
    border: "hover:border-indigo-500/40",
  },
  {
    num: "05",
    name: "Buzzer War",
    icon: <Radio size={28} />,
    desc: "Head-to-head speed battle. First to buzz gets to answer — but buzz too early and face the consequences. Nerves of steel separate contenders from pretenders.",
    tag: "Speed · Nerve · Instinct",
    color: "from-red-500/10 to-orange-500/5",
    border: "hover:border-red-500/40",
  },
  {
    num: "06",
    name: "Blackout Question",
    icon: <Moon size={28} />,
    desc: "The final, high-stakes gamble. Double or nothing on one question. Cohorts can wager their accumulated points. Rise to glory or fall to zero. Legends are made here.",
    tag: "All-or-Nothing · Glory · Legends",
    color: "from-yellow-500/10 to-amber-500/5",
    border: "hover:border-yellow-500/40",
    finale: true,
  },
];

export default function Competition() {
  return (
    <Layout>
      <PageHeader
        label="The Format"
        title="Competition Structure"
        subtitle="Six rounds. One champion. Every round tests a different dimension of excellence."
      />

      <section className="py-12 pb-24">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <div className="space-y-6">
            {ROUNDS.map((round, i) => (
              <motion.div
                key={round.num}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className={`relative glass-card rounded-2xl p-8 border border-white/10 ${round.border} transition-all bg-gradient-to-br ${round.color} ${round.finale ? "border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-amber-500/5" : ""}`}
                data-testid={`round-card-${round.num}`}
              >
                {round.finale && (
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-bold uppercase tracking-wider">
                    Grand Finale
                  </div>
                )}
                <div className="flex items-start gap-6">
                  <div className="shrink-0">
                    <div className="font-display font-bold text-6xl md:text-8xl leading-none text-white/5 select-none">
                      {round.num}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                        {round.icon}
                      </div>
                      <h2 className="font-display font-bold text-xl md:text-2xl">{round.name}</h2>
                    </div>
                    <p className="text-muted-foreground leading-relaxed mb-4">{round.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {round.tag.split(" · ").map((tag) => (
                        <span key={tag} className="px-3 py-1 rounded-full bg-white/5 text-xs text-muted-foreground border border-white/10 uppercase tracking-wider font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 text-center glass-card rounded-2xl p-12 border border-white/10"
          >
            <h3 className="font-display font-bold text-2xl md:text-4xl mb-4">Think You Can Survive All Six?</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">Registration is open. Assemble your cohort, sharpen your minds, and prepare for the ultimate test.</p>
            <Link href="/register">
              <button className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-white font-semibold glow-effect hover:bg-primary/90 transition-all hover:gap-3">
                Register Your Cohort
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
