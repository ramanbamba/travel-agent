"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 z-50 w-full transition-all duration-500 ${scrolled
          ? "border-b border-white/[0.05] bg-[#050A15]/60 backdrop-blur-Heavy shadow-[0_4px_30px_rgba(0,0,0,0.1)] py-3"
          : "bg-transparent py-5"
        }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/20 transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
            <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">SkySwift</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          <a href="#how-it-works" className="text-sm font-medium text-slate-300 transition-colors hover:text-white">How It Works</a>
          <a href="#platform" className="text-sm font-medium text-slate-300 transition-colors hover:text-white">Platform</a>
          <a href="#pricing" className="text-sm font-medium text-slate-300 transition-colors hover:text-white">Pricing</a>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <Link href="/login" className="text-sm font-medium text-slate-300 transition-colors hover:text-white">
            Log in
          </Link>
          <Link
            href="/signup"
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-500 active:scale-95"
          >
            {/* Animated glowing pseudo-element */}
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            Start Free Pilot
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 relative z-50 items-center justify-center rounded-lg text-white md:hidden hover:bg-white/5 transition-colors"
          aria-label="Toggle menu"
        >
          <motion.div animate={mobileOpen ? "open" : "closed"} className="flex flex-col gap-[5px]">
            <motion.span
              variants={{ closed: { rotate: 0, y: 0 }, open: { rotate: 45, y: 7 } }}
              className="block h-[2px] w-6 bg-current rounded-full"
            />
            <motion.span
              variants={{ closed: { opacity: 1 }, open: { opacity: 0 } }}
              className="block h-[2px] w-6 bg-current rounded-full"
            />
            <motion.span
              variants={{ closed: { rotate: 0, y: 0 }, open: { rotate: -45, y: -7 } }}
              className="block h-[2px] w-6 bg-current rounded-full"
            />
          </motion.div>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "anticipate" }}
            className="absolute top-full left-0 w-full overflow-hidden border-b border-white/5 bg-[#050A15]/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-6 p-6">
              <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="text-base font-medium text-slate-200">How It Works</a>
              <a href="#platform" onClick={() => setMobileOpen(false)} className="text-base font-medium text-slate-200">Platform</a>
              <a href="#pricing" onClick={() => setMobileOpen(false)} className="text-base font-medium text-slate-200">Pricing</a>
              <div className="flex flex-col gap-4 pt-6 border-t border-white/10">
                <Link href="/login" onClick={() => setMobileOpen(false)} className="text-base font-medium text-slate-200">Log in</Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)} className="rounded-full bg-blue-600 px-6 py-3.5 text-center text-sm font-semibold text-white active:scale-[0.98]">
                  Start Free Pilot
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
