'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

interface NavbarProps {
  role?: 'guest' | 'user' | 'manager' | 'admin';
}

export default function Navbar({ role = 'user' }: NavbarProps) {
  const { lang, toggleLang } = useLanguage();

  return (
    <nav className="w-full flex justify-between items-center px-8 py-4 bg-white dark:bg-[#121418] border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-serif font-bold text-sm">
          R
        </div>
        <span className="font-serif font-medium text-lg tracking-tight">RBooking</span>
      </div>

      <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-wider">
        {role === 'guest' && (
          <>
            <Link href="/" className="hover:text-blue-600 transition">
              {lang === 'RO' ? 'Cazări' : 'Accommodations'}
            </Link>
            <Link href="/register" className="hover:text-blue-600 transition">
              {lang === 'RO' ? 'Înregistrare' : 'Register'}
            </Link>
            <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg transition">
              {lang === 'RO' ? 'Autentificare' : 'Login'}
            </Link>
          </>
        )}

        {role === 'user' && (
          <>
            <Link href="/" className="hover:text-blue-600 transition">
              {lang === 'RO' ? 'Acasă' : 'Home'}
            </Link>
            <Link href="/hotels" className="hover:text-blue-600 transition">
              {lang === 'RO' ? 'Hoteluri' : 'Hotels'}
            </Link>
            <Link href="/reservations" className="hover:text-blue-600 transition">
              {lang === 'RO' ? 'Rezervări' : 'Reservations'}
            </Link>
            <Link href="/account" className="px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded transition hover:bg-neutral-100 dark:hover:bg-neutral-800">
              {lang === 'RO' ? 'Contul meu' : 'My Account'}
            </Link>
          </>
        )}

        {role === 'manager' && (
          <>
            <Link href="/" className="hover:text-blue-600 transition">
              {lang === 'RO' ? 'Cazări' : 'Accommodations'}
            </Link>
            <Link href="/manage-accommodations" className="hover:text-blue-600 transition">
              {lang === 'RO' ? 'Administrare' : 'Manage'}
            </Link>
            <Link href="/account" className="px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded transition hover:bg-neutral-100 dark:hover:bg-neutral-800">
              {lang === 'RO' ? 'Contul meu' : 'My Account'}
            </Link>
          </>
        )}

        {role === 'admin' && (
          <>
            <Link href="/" className="hover:text-blue-600 transition">
              {lang === 'RO' ? 'Cazări' : 'Accommodations'}
            </Link>
            <Link href="/admin" className="hover:text-blue-600 transition">Admin</Link>
            <Link href="/account" className="px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded transition hover:bg-neutral-100 dark:hover:bg-neutral-800">
              {lang === 'RO' ? 'Contul meu' : 'My Account'}
            </Link>
          </>
        )}

        {/* Buton Limbă */}
        <button 
          onClick={toggleLang}
          className="px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
        >
          {lang}
        </button>

        {/* Logout */}
        <Link 
          href="/" 
          onClick={() => localStorage.removeItem('rbooking_logged_in')}
          className="px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-black rounded transition"
        >
          {lang === 'RO' ? 'Ieșire' : 'Logout'}
        </Link>
      </div>
    </nav>
  );
}