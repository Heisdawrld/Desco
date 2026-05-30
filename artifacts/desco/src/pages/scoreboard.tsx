import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getScores, totalScore, type CohortScore } from "@/lib/store";

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

const RANK_COLORS: Record<number, string> = {
  1: "text-yellow-400",
  2: "text-slate-300",
  3: "text-amber-600",
};

function buildRankedScores(scores: CohortScore[]) {
  return scores
    .map((s) => ({ ...s, total: totalScore(s) }))
    .sort((a, b) => b.total - a.total)
    .map((s, i) => ({ ...s, rank: i + 1 }));
}

export default function Scoreboard() {
  const [scores, setScores] = useState<CohortScore[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setScores(getScores());
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        const fresh = getScores();
        setScores(fresh);
        setLastUpdate(new Date());
        setAnimating(false);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const ranked = buildRankedScores(scores);

  return (
    <Layout>
      <PageHeader
        label="Live Data"
        title="Live Scoreboard"
        subtitle="Real-time rankings. Watch the battle unfold."
      />

      <section className="py-12 pb-24">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          {/* Live indicator */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8 glass-card rounded-xl p-4 border border-white/10"
            data-testid="live-indicator"
          >
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
              <span className="font-semibold text-sm">Live Updates</span>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground text-xs">
              <span className={`transition-opacity ${animating ? "opacity-100 text-primary" : "opacity-50"}`}>Syncing...</span>
              <span>Last: {lastUpdate.toLocaleTimeString()}</span>
              <span className="hidden sm:inline">Refreshes every 5 seconds</span>
            </div>
          </motion.div>

          {/* Leaderboard */}
          <div className="space-y-3 mb-12">
            {ranked.map((entry, i) => (
              <motion.div
                key={entry.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`glass-card rounded-xl p-4 md:p-5 flex items-center gap-4 border transition-all ${
                  entry.rank === 1
                    ? "border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-amber-500/5"
                    : entry.rank === 2
                    ? "border-slate-400/20"
                    : entry.rank === 3
                    ? "border-amber-700/20"
                    : "border-white/10 hover:border-primary/20"
                }`}
                data-testid={`leaderboard-row-${entry.rank}`}
              >
                <div className={`font-display font-bold text-2xl md:text-3xl w-12 text-center shrink-0 ${RANK_COLORS[entry.rank] || "text-muted-foreground"}`}>
                  {entry.rank === 1 ? <Trophy size={28} className="mx-auto text-yellow-400" /> : entry.rank}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-base md:text-lg">{entry.name}</h3>
                  {entry.rank === 1 && (
                    <p className="text-yellow-400 text-xs font-semibold uppercase tracking-wider">Defending Champions</p>
                  )}
                </div>

                {/* Change indicator placeholder */}
                <div className="shrink-0 hidden sm:block">
                  {entry.rank <= 3 ? (
                    <TrendingUp size={18} className="text-green-400" />
                  ) : entry.rank >= 7 ? (
                    <TrendingDown size={18} className="text-red-400" />
                  ) : (
                    <Minus size={18} className="text-muted-foreground" />
                  )}
                </div>

                {/* Score bar */}
                <div className="hidden md:flex items-center gap-3 flex-1 max-w-[200px]">
                  <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-700"
                      style={{ width: `${(entry.total / (ranked[0]?.total || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <motion.div
                    key={entry.total}
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    className="font-display font-bold text-xl md:text-2xl text-gradient"
                    data-testid={`score-${entry.name.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {entry.total.toLocaleString()}
                  </motion.div>
                  <div className="text-muted-foreground text-xs">pts</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Round Breakdown Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-2xl p-6 border border-white/10"
          >
            <h3 className="font-display font-bold text-xl mb-6">Round-by-Round Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    {["Cohort", "Sprint", "Clash", "Specialist", "Puzzle", "Buzzer", "Blackout", "Total"].map((h) => (
                      <th key={h} className="text-left py-3 px-3 text-xs uppercase tracking-widest text-muted-foreground font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((row, i) => (
                    <tr key={row.name} className={`border-b border-white/5 hover:bg-white/2 transition-colors ${i === 0 ? "text-yellow-400" : ""}`}>
                      <td className="py-4 px-3 font-semibold flex items-center gap-2">
                        {i === 0 && <Trophy size={14} className="text-yellow-400 shrink-0" />}
                        {row.name}
                      </td>
                      <td className="py-4 px-3 text-muted-foreground">{row.sprint}</td>
                      <td className="py-4 px-3 text-muted-foreground">{row.clash}</td>
                      <td className="py-4 px-3 text-muted-foreground">{row.specialist}</td>
                      <td className="py-4 px-3 text-muted-foreground">{row.puzzle}</td>
                      <td className="py-4 px-3 text-muted-foreground">{row.buzzer}</td>
                      <td className={`py-4 px-3 font-bold ${row.blackout > 300 ? "text-green-400" : row.blackout < 220 ? "text-red-400" : "text-muted-foreground"}`}>
                        +{row.blackout}
                      </td>
                      <td className="py-4 px-3 font-display font-bold text-primary">{row.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
