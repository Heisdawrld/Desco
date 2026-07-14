import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { Layout } from "@/components/layout";
import { ArrowRight, Zap, Trophy, Users, Clock } from "lucide-react";

const COHORTS = [
  { name: "Biology Education", desc: "Defending Champions. The ones to beat.", status: "champion", color: "from-yellow-500/20 to-amber-500/10" },
  { name: "Chemistry Education", desc: "Precision, reactions, and pure intellect.", status: "active", color: "from-purple-500/20 to-violet-500/10" },
  { name: "Physics Education", desc: "Harnessing the forces of knowledge.", status: "active", color: "from-cyan-500/20 to-blue-500/10" },
  { name: "Mathematics Education", desc: "Numbers don't lie. Neither do they.", status: "active", color: "from-indigo-500/20 to-purple-500/10" },
  { name: "Integrated Science", desc: "Versatility across all disciplines.", status: "active", color: "from-pink-500/20 to-rose-500/10" },
];

const ROUNDS = [
  { num: "01", name: "Academic Sprint", icon: <Zap size={20} /> },
  { num: "02", name: "Cross-Discipline Clash", icon: <Users size={20} /> },
  { num: "03", name: "Specialist Round", icon: <Trophy size={20} /> },
  { num: "04", name: "Puzzle & Logic Arena", icon: <Zap size={20} /> },
  { num: "05", name: "Buzzer War", icon: <Clock size={20} /> },
  { num: "06", name: "Blackout Question", icon: <Trophy size={20} /> },
];

// Event start time: July 17, 2026 at 9:00 AM West African Time (UTC+1).
// Explicit timezone offset ensures the countdown is correct for every visitor
// regardless of their browser's local timezone.
const EVENT_TIME = new Date("2026-07-17T09:00:00+01:00").getTime();

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, EVENT_TIME - Date.now());
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return timeLeft;
}

function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl glass-card flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />
        <span className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-gradient relative z-10">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">{label}</span>
    </div>
  );
}

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${p.opacity})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(animate);
    };
    animate();

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />;
}

function StatCard({ num, label, delay }: { num: string; label: string; delay: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5 }}
      className="text-center"
    >
      <div className="font-display font-bold text-4xl md:text-5xl text-gradient">{num}</div>
      <div className="text-muted-foreground text-sm mt-1 uppercase tracking-widest">{label}</div>
    </motion.div>
  );
}

export default function Home() {
  const countdown = useCountdown();
  const cohortsRef = useRef(null);
  const cohortsInView = useInView(cohortsRef, { once: true });

  return (
    <Layout>
      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <ParticleCanvas />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 container mx-auto px-4 md:px-6 py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8 text-sm text-muted-foreground"
            data-testid="hero-badge"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Presented by ULSESA — University of Lagos
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display font-bold text-gradient leading-none mb-4"
            style={{ fontSize: "clamp(4rem, 12vw, 10rem)" }}
            data-testid="hero-title"
          >
            DESCO 2.0
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground mb-2 font-medium"
          >
            The Ultimate Academic &amp; Intellectual Showdown
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg md:text-xl text-primary font-display font-bold mb-10 italic"
          >
            "Dominate or Don't Show Up."
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-16"
          >
            <Link href="/register" data-testid="hero-register-btn">
              <button className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-white font-semibold glow-effect hover:bg-primary/90 transition-all hover:gap-3">
                Register Now
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
            <Link href="/about" data-testid="hero-explore-btn">
              <button className="inline-flex items-center gap-2 px-8 py-4 rounded-full glass-card text-white font-semibold hover:border-primary/30 transition-all glow-effect-hover">
                Explore DESCO
              </button>
            </Link>
            <Link href="/cohorts" data-testid="hero-cohorts-btn">
              <button className="inline-flex items-center gap-2 px-8 py-4 rounded-full glass-card text-white font-semibold hover:border-primary/30 transition-all glow-effect-hover">
                Meet The Cohorts
              </button>
            </Link>
          </motion.div>

          {/* Countdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col items-center gap-4"
            data-testid="countdown-section"
          >
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Competition Starts In</p>
            <div className="flex items-end gap-3">
              <CountdownBox value={countdown.days} label="Days" />
              <span className="font-display font-bold text-3xl text-primary mb-10">:</span>
              <CountdownBox value={countdown.hours} label="Hours" />
              <span className="font-display font-bold text-3xl text-primary mb-10">:</span>
              <CountdownBox value={countdown.minutes} label="Min" />
              <span className="font-display font-bold text-3xl text-primary mb-10">:</span>
              <CountdownBox value={countdown.seconds} label="Sec" />
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* STATS BAR */}
      <section className="py-16 border-y border-white/5 bg-background/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-3 gap-8 md:gap-16">
            <StatCard num="5" label="Cohorts" delay={0} />
            <StatCard num="6" label="Rounds" delay={0.1} />
            <StatCard num="1" label="Champion" delay={0.2} />
          </div>
        </div>
      </section>

      {/* ABOUT INTRO */}
      <section className="py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-4">About The Event</p>
              <h2 className="font-display font-bold text-3xl md:text-5xl mb-6">
                Where Intellect, Speed, Strategy &amp; Excellence Collide
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                DESCO (Cohort Showdown Competition) is the premier intellectual battleground for Science Education students at the University of Lagos. DESCO 2.0 raises the stakes higher than ever before.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Six rigorous rounds. Five cohorts within the Science Education department. One champion. This isn't just a quiz — it's the ultimate test of knowledge and teamwork where only the sharpest survive.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* COHORTS GRID */}
      <section className="py-24 bg-card/30 border-y border-white/5">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-4">The Competition</p>
            <h2 className="font-display font-bold text-3xl md:text-5xl mb-4">Meet The Cohorts</h2>
            <p className="text-muted-foreground">Five academic cohorts. One department. One title. Who will dominate DESCO 2.0?</p>
          </motion.div>

          <div ref={cohortsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {COHORTS.map((cohort, i) => (
              <motion.div
                key={cohort.name}
                initial={{ opacity: 0, y: 30 }}
                animate={cohortsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.07, duration: 0.5 }}
                className={`glass-card rounded-2xl p-6 bg-gradient-to-br ${cohort.color} glow-effect-hover border border-white/10 hover:border-primary/30 transition-all group cursor-default`}
                data-testid={`cohort-card-${cohort.name.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <h3 className="font-display font-bold text-lg mb-2 group-hover:text-gradient transition-all">{cohort.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{cohort.desc}</p>
                {cohort.status === "champion" ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-yellow-400 uppercase tracking-wider">
                    <Trophy size={12} />
                    Defending Champions
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-primary uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Active
                  </span>
                )}
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/cohorts">
              <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-card text-sm font-semibold hover:border-primary/30 glow-effect-hover transition-all">
                View All Cohorts <ArrowRight size={16} />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ROUNDS PREVIEW */}
      <section className="py-24">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-4">The Format</p>
            <h2 className="font-display font-bold text-3xl md:text-5xl mb-4">Six Rounds of Domination</h2>
            <p className="text-muted-foreground">Every round tests a different dimension of excellence.</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {ROUNDS.map((round, i) => (
              <motion.div
                key={round.num}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass-card rounded-xl p-6 glow-effect-hover border border-white/10 hover:border-primary/30 transition-all group"
              >
                <div className="font-display font-bold text-5xl text-primary/20 mb-3 leading-none">{round.num}</div>
                <h3 className="font-display font-bold text-base group-hover:text-primary transition-colors">{round.name}</h3>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/competition">
              <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-card text-sm font-semibold hover:border-primary/30 glow-effect-hover transition-all">
                Full Competition Structure <ArrowRight size={16} />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
        <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-4">Registration Open</p>
            <h2 className="font-display font-bold text-3xl md:text-6xl mb-6">Ready to Dominate?</h2>
            <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
              Registration is open for contestants and audience members. Secure your spot at DESCO 2.0.
            </p>
            <Link href="/register" data-testid="cta-register-btn">
              <button className="group inline-flex items-center gap-2 px-10 py-5 rounded-full bg-primary text-white font-bold text-lg glow-effect hover:bg-primary/90 transition-all hover:gap-3">
                Register Now
                <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* SPONSORS */}
      <section className="py-16 border-t border-white/5">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-8">Organized with the support of</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {["ULSESA", "University of Lagos"].map((s) => (
              <div key={s} className="px-6 py-3 rounded-full glass-card text-muted-foreground text-sm font-semibold tracking-widest uppercase hover:border-primary/20 transition-colors">
                {s}
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link href="/contact">
              <button className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:gap-3 transition-all">
                Become a Sponsor <ArrowRight size={16} />
              </button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
