'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Accommodations from '@/components/Accommodations';
import { useLanguage } from '@/context/LanguageContext';

export default function HotelsPage() {
  const { lang } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBF9] dark:bg-[#0D0E11] text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
      <Navbar />

      <main className="flex-1">
        <Accommodations />
      </main>

      <footer className="border-t border-neutral-300 dark:border-neutral-800 py-12 text-neutral-600 dark:text-neutral-400 text-xs bg-neutral-100 dark:bg-[#0A0B0D] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-2">
            <span className="font-serif text-sm font-medium text-neutral-950 dark:text-neutral-200">RBooking</span>
            <span>/</span>
            <span>{lang === 'RO' ? 'Catalog cazări' : 'Accommodations catalog'}</span>
          </div>
          <div>© {new Date().getFullYear()} RBooking. {lang === 'RO' ? 'Toate drepturile rezervate.' : 'All rights reserved.'}</div>
        </div>
      </footer>
    </div>
  );
}