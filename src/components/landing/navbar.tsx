"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

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
      transition={{ duration: 0.5 }}
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-[#0A0F1E]/90 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">SkySwift</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          <a href="#how-it-works" className="text-sm text-slate-400 transition-colors hover:text-white">How It Works</a>
          <a href="#platform" className="text-sm text-slate-400 transition-colors hover:text-white">Platform</a>
          <a href="#pricing" className="text-sm text-slate-400 transition-colors hover:text-white">Pricing</a>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/25"
          >
            Start Free Pilot
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white md:hidden"
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {mobileOpen ? (
              <>
                <path d="M18 6L6 18" /><path d="M6 6l12 12" />
              </>
            ) : (
              <>
                <path d="M3 12h18" /><path d="M3 6h18" /><path d="M3 18h18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-white/10 bg-[#0A0F1E]/95 backdrop-blur-xl md:hidden"
        >
          <div className="flex flex-col gap-4 px-6 py-6">
            <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="text-sm text-slate-300 hover:text-white">How It Works</a>
            <a href="#platform" onClick={() => setMobileOpen(false)} className="text-sm text-slate-300 hover:text-white">Platform</a>
            <a href="#pricing" onClick={() => setMobileOpen(false)} className="text-sm text-slate-300 hover:text-white">Pricing</a>
            <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
              <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white">Log in</Link>
              <Link href="/signup" className="rounded-lg bg-blue-600 px-5 py-2.5 text-center text-sm font-medium text-white">
                Start Free Pilot
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
