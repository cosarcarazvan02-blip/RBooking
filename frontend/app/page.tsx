import React from "react";
import HeroBanner from "@/components/HeroBanner";
import Accommodations from "@/components/Accommodations";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";
import { LogIn } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBF9] dark:bg-[#0D0E11] text-neutral-900 dark:text-neutral-100 selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900 transition-colors duration-300">
      {/* Editorial Navigation Bar (Full Transparent cu blur xs) */}
      <header className="sticky top-0 z-50 w-full border-b border-black/10 dark:border-white/10 bg-transparent backdrop-blur-xs text-neutral-900 dark:text-white transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-9 h-9 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 flex items-center justify-center font-serif font-bold text-lg shadow-sm group-hover:bg-amber-600 dark:group-hover:bg-amber-300 transition-colors">
              R
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl tracking-tight font-medium text-neutral-950 dark:text-white">
                RBooking
              </span>
              <span className="text-[9px] tracking-[0.25em] uppercase text-neutral-500 dark:text-neutral-400 font-mono -mt-0.5">
                Hospitality
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 text-xs font-mono font-semibold uppercase tracking-widest bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-amber-300 dark:hover:text-neutral-950 transition-all border border-neutral-950 dark:border-white active:scale-95 shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Autentificare</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* 1. Hero Banner cu efecte dinamice de scroll */}
      <HeroBanner />

      {/* 2. Lista de Hoteluri / Cazări */}
      <main className="flex-1">
        <Accommodations />
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-neutral-300 dark:border-neutral-800 py-12 text-neutral-600 dark:text-neutral-400 text-xs bg-neutral-100 dark:bg-[#0A0B0D] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-2">
            <span className="font-serif text-sm font-medium text-neutral-950 dark:text-neutral-200">RBooking</span>
            <span>/</span>
            <span>Colecție editorială de cazări</span>
          </div>
          <div>© {new Date().getFullYear()} RBooking. Toate drepturile rezervate.</div>
        </div>
      </footer>
    </div>
  );
}
