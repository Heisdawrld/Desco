import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export function CursorGlow() {
  const [mousePosition, setMousePosition] = useState({ x: -9999, y: -9999 });
  const [isVisible, setIsVisible] = useState(false);
  const isVisibleRef = useRef(false);
  // Track the latest mouse position without triggering a re-render on every
  // pixel move. We only commit to state inside a requestAnimationFrame callback
  // so we get at most one render per frame (~60fps) instead of hundreds.
  const pendingPos = useRef({ x: -9999, y: -9999 });
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    // Skip on touch devices — no cursor, wastes battery.
    if (window.matchMedia("(max-width: 768px)").matches) return;

    const commitPosition = () => {
      rafId.current = null;
      setMousePosition(pendingPos.current);
    };

    const handleMouseMove = (e: MouseEvent) => {
      pendingPos.current = { x: e.clientX, y: e.clientY };
      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        setIsVisible(true);
      }
      // Schedule a single state update for the next animation frame.
      if (rafId.current === null) {
        rafId.current = requestAnimationFrame(commitPosition);
      }
    };

    const handleMouseLeave = () => {
      isVisibleRef.current = false;
      setIsVisible(false);
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-30"
      animate={{
        background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.07), transparent 40%)`,
      }}
    />
  );
}
