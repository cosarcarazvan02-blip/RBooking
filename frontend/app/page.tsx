import React from "react";
import Navbar from "@/components/Navbar";
import HeroBanner from "@/components/HeroBanner";
import Accommodations from "@/components/Accommodations";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBF9] dark:bg-[#0D0E11] text-neutral-900 dark:text-neutral-100 selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900 transition-colors duration-300">
      {/* 1. Bara de Navigație cu Nume Utilizator și Buton Logout */}
      <Navbar />

      {/* 2. Hero Banner cu efecte dinamice */}
      <HeroBanner />

      {/* 3. Lista de Hoteluri / Cazări */}
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
