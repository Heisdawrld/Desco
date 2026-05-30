import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/competition", label: "Competition" },
  { href: "/cohorts", label: "Cohorts" },
  { href: "/scoreboard", label: "Scoreboard" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-md border-b border-white/10 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center glow-effect transition-transform group-hover:scale-110">
            <span className="font-display font-bold text-white text-xs">D2</span>
          </div>
          <span className="font-display font-bold text-xl tracking-wider">DESCO</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location === link.href ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/register">
            <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 glow-effect font-medium px-6">
              Register Now
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-white/10 p-4 flex flex-col gap-4 md:hidden shadow-2xl"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between py-3 px-4 rounded-lg transition-colors ${
                  location === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-white/5"
                }`}
              >
                <span className="font-medium">{link.label}</span>
                <ChevronRight size={16} className="opacity-50" />
              </Link>
            ))}
            <div className="pt-4 border-t border-white/10">
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full rounded-full bg-primary text-primary-foreground">
                  Register Now
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-background border-t border-white/10 pt-16 pb-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
      
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="font-display font-bold text-white text-xs">D2</span>
              </div>
              <span className="font-display font-bold text-xl tracking-wider">DESCO</span>
            </div>
            <p className="text-muted-foreground text-sm max-w-xs">
              Designed for champions. The flagship intellectual competition organized by ULSESA. Dominate or Don't Show Up.
            </p>
          </div>

          <div>
            <h4 className="font-display font-bold mb-4 text-lg">Navigation</h4>
            <ul className="space-y-2">
              {navLinks.slice(0, 4).map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold mb-4 text-lg">Resources</h4>
            <ul className="space-y-2">
              {navLinks.slice(4).map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold mb-4 text-lg">Connect</h4>
            <ul className="space-y-2">
              <li>
                <a href="https://x.com/ulsesa01" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors text-sm">X (Twitter)</a>
              </li>
              <li>
                <a href="https://www.instagram.com/ulsesa01/" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors text-sm">Instagram</a>
              </li>
              <li>
                <a href="https://www.tiktok.com/@ulsesa01" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors text-sm">TikTok</a>
              </li>
              <li>
                <a href="mailto:desco@ulsesa.unilag.edu.ng" className="text-muted-foreground hover:text-primary transition-colors text-sm">Contact Us</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} ULSESA — University of Lagos. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Science Education Dept</span>
            <span className="w-1 h-1 rounded-full bg-primary"></span>
            <span>Faculty of Education</span>
            <span className="w-1 h-1 rounded-full bg-primary"></span>
            <span>Unilag</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col font-sans dark text-foreground bg-background">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
