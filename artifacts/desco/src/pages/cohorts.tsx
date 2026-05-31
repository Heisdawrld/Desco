import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { Trophy, Microscope, FlaskConical, Atom, Calculator, Monitor, Globe2, MapPin, Activity } from "lucide-react";

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

const COHORTS = [
  {
    name: "Biology Education",
    subtitle: "Defending Champions · Life Sciences Division",
    icon: <Microscope size={28} />,
    desc: "The reigning champions of DESCO 1.0 return with a target on their backs. Known for encyclopedic knowledge of life sciences, clinical precision under pressure, and unmatched team chemistry.",
    achievements: "DESCO 1.0 Champions · Specialist Round Winners · Highest Aggregate Score Record",
    champion: true,
    color: "from-yellow-500/15 to-amber-500/5",
    borderColor: "border-yellow-500/30",
    iconColor: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
  },
  {
    name: "Chemistry Education",
    subtitle: "The Reaction Masters · Physical Sciences Division",
    icon: <FlaskConical size={28} />,
    desc: "A cohort built on precision and analytical rigor. The Chemistry Education cohort has retooled since DESCO 1.0, bringing in fresh tactical minds and a renewed hunger to dethrone Biology.",
    champion: false,
    color: "from-cyan-500/10 to-blue-500/5",
    borderColor: "hover:border-cyan-500/30",
    iconColor: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
  },
  {
    name: "Physics Education",
    subtitle: "The Force · Physical Sciences Division",
    icon: <Atom size={28} />,
    desc: "Harnessing the fundamental forces of the universe — and competitive academic spirit. The Physics Education cohort brings mathematical precision and conceptual depth to every round.",
    champion: false,
    color: "from-indigo-500/10 to-violet-500/5",
    borderColor: "hover:border-indigo-500/30",
    iconColor: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
  },
  {
    name: "Mathematics Education",
    subtitle: "The Calculated · Pure Sciences Division",
    icon: <Calculator size={28} />,
    desc: "Where logic meets lightning speed. The Mathematics Education cohort thrives in the Puzzle & Logic Arena and brings unshakeable analytical foundations to every discipline they touch.",
    champion: false,
    color: "from-purple-500/10 to-violet-500/5",
    borderColor: "hover:border-purple-500/30",
    iconColor: "bg-purple-500/10 border-purple-500/20 text-purple-400",
  },
  {
    name: "Integrated Science",
    subtitle: "The Generalists · Interdisciplinary Division",
    icon: <Globe2 size={28} />,
    desc: "Jack of all trades, master of cross-disciplinary warfare. The Integrated Science cohort's breadth across biology, chemistry, and physics makes them formidable in the Cross-Discipline Clash.",
    champion: false,
    color: "from-pink-500/10 to-rose-500/5",
    borderColor: "hover:border-pink-500/30",
    iconColor: "bg-pink-500/10 border-pink-500/20 text-pink-400",
  },
];

export default function Cohorts() {
  return (
    <Layout>
      <PageHeader
        label="The Teams"
        title="The Cohorts"
        subtitle="Five academic cohorts. One department. One title on the line."
      />

      <section className="py-12 pb-24">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="space-y-6">
            {COHORTS.map((cohort, i) => (
              <motion.div
                key={cohort.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className={`glass-card rounded-2xl overflow-hidden border ${cohort.champion ? cohort.borderColor : "border-white/10 " + cohort.borderColor} transition-all bg-gradient-to-br ${cohort.color}`}
                data-testid={`cohort-${cohort.name.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {/* Header */}
                <div className="p-6 md:p-8 flex items-center justify-between flex-wrap gap-4 border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${cohort.iconColor}`}>
                      {cohort.icon}
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-xl md:text-2xl">{cohort.name} Cohort</h2>
                      <p className="text-muted-foreground text-sm">{cohort.subtitle}</p>
                    </div>
                  </div>
                  {cohort.champion ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold uppercase tracking-wider">
                      <Trophy size={12} /> Defending Champions
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Active
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="p-6 md:p-8">
                  <p className="text-muted-foreground leading-relaxed mb-6">{cohort.desc}</p>

                  <div className="rounded-xl border border-white/5 bg-white/3 p-4 text-center">
                    <p className="text-muted-foreground text-sm">
                      Team representatives will be announced after the registration period closes. Follow DESCO updates for the latest roster announcements.
                    </p>
                  </div>

                  {cohort.achievements && (
                    <div className="mt-4 rounded-xl border border-yellow-500/15 bg-yellow-500/5 p-4">
                      <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-1">Achievements</p>
                      <p className="text-muted-foreground text-sm">{cohort.achievements}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
