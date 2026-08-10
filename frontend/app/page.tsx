import React from "react";
import Accommodations from "@/components/Accommodations";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBF9] dark:bg-[#0D0E11] text-neutral-900 dark:text-neutral-100 selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900">
      {/* Editorial Minimal Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-black/[0.06] dark:border-white/[0.06] bg-[#FBFBF9]/90 dark:bg-[#0D0E11]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900 font-serif font-semibold text-lg shadow-sm">
              R
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl tracking-tight font-medium text-neutral-900 dark:text-neutral-50">
                RBooking
              </span>
              <span className="text-[9px] tracking-[0.25em] uppercase text-neutral-400 font-sans -mt-0.5">
                Hospitality
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-all shadow-sm"
            >
              Autentificare
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area: Accommodations */}
      <main className="flex-1">
        <Accommodations />
      </main>

      {/* Editorial Minimal Footer */}
      <footer className="border-t border-black/[0.06] dark:border-white/[0.06] py-12 text-neutral-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif text-neutral-800 dark:text-neutral-200">RBooking</span>
            <span>—</span>
            <span>Platformă de rezervări & ospitalitate</span>
          </div>
          <div>© {new Date().getFullYear()} Toate drepturile rezervate.</div>
        </div>
      </footer>
    </div>
  );
}
