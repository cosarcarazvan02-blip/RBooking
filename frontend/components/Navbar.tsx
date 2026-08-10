'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { useLanguage } from '@/context/LanguageContext';
import { LogIn, Calendar, LogOut, Globe, User, Building2, Shield, Hotel } from 'lucide-react';

export default function Navbar() {
  const { lang, toggleLang } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('User');

  useEffect(() => {
    const checkAuth = () => {
      const logged = localStorage.getItem('rbooking_logged_in');
      if (logged === 'true') {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }

      const profile = localStorage.getItem('rbooking_user_profile');
      if (profile) {
        try {
          const parsed = JSON.parse(profile);
          if (parsed.role) {
            setUserRole(parsed.role);
          }
        } catch (e) {
          console.error(e);
        }
      }
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('rbooking_logged_in');
    localStorage.removeItem('rbooking_user_profile');
    setIsLoggedIn(false);
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 dark:border-white/10 bg-white/90 dark:bg-[#0D0E11]/85 backdrop-blur-xs text-neutral-900 dark:text-white transition-colors duration-300">
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
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-semibold uppercase tracking-widest border border-neutral-300 dark:border-neutral-700 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang}</span>
          </button>

          <ThemeToggle />

          {!isLoggedIn ? (
            // 1. Vizitator neautentificat: Accommodations | Register | Login
            <div className="flex items-center gap-2">
              <Link
                href="/hotels"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold uppercase tracking-widest text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all border border-neutral-300 dark:border-neutral-700 rounded shadow-sm"
              >
                <Hotel className="w-3.5 h-3.5" />
                <span>{lang === 'RO' ? 'Cazări' : 'Accommodations'}</span>
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold uppercase tracking-widest text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all border border-neutral-300 dark:border-neutral-700 rounded shadow-sm"
              >
                <span>{lang === 'RO' ? 'Înregistrare' : 'Register'}</span>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold uppercase tracking-widest bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-amber-300 transition-all border border-neutral-950 dark:border-white rounded shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{lang === 'RO' ? 'Autentificare' : 'Login'}</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {userRole === 'Manager' ? (
                // 2. Manager hotel: Accommodations | Manage my accommodations | My account | Logout
                <>
                  <Link
                    href="/hotels"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold uppercase tracking-widest text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all border border-neutral-300 dark:border-neutral-700 rounded shadow-sm"
                  >
                    <Hotel className="w-3.5 h-3.5" />
                    <span>{lang === 'RO' ? 'Cazări' : 'Accommodations'}</span>
                  </Link>
                  <Link
                    href="/manager/accommodation"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold uppercase tracking-widest bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-all border border-neutral-300 dark:border-neutral-700 rounded shadow-sm"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{lang === 'RO' ? 'Gestionează cazările mele' : 'Manage my accommodations'}</span>
                  </Link>
                </>
              ) : userRole === 'Admin' ? (
                // 3. Admin: Accommodations | Admin | My account | Logout
                <>
                  <Link
                    href="/hotels"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold uppercase tracking-widest text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all border border-neutral-300 dark:border-neutral-700 rounded shadow-sm"
                  >
                    <Hotel className="w-3.5 h-3.5" />
                    <span>{lang === 'RO' ? 'Cazări' : 'Accommodations'}</span>
                  </Link>
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold uppercase tracking-widest bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-all border border-neutral-300 dark:border-neutral-700 rounded shadow-sm"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </Link>
                </>
              ) : (
                // 4. User simplu: Hotels (Accommodations) | Reservations | My account | Logout
                <>
                  <Link
                    href="/hotels"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold uppercase tracking-widest text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all border border-neutral-300 dark:border-neutral-700 rounded shadow-sm"
                  >
                    <Hotel className="w-3.5 h-3.5" />
                    <span>{lang === 'RO' ? 'Cazări' : 'Accommodations'}</span>
                  </Link>
                  <Link
                    href="/reservations"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold uppercase tracking-widest bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-all border border-neutral-300 dark:border-neutral-700 rounded shadow-sm"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{lang === 'RO' ? 'Rezervări' : 'Reservations'}</span>
                  </Link>
                </>
              )}

              {/* Comune pentru toți utilizatorii logați */}
              <Link
                href="/account"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold uppercase tracking-widest bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-all border border-neutral-300 dark:border-neutral-700 rounded shadow-sm"
              >
                <User className="w-3.5 h-3.5" />
                <span>{lang === 'RO' ? 'Contul meu' : 'My Account'}</span>
              </Link>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold uppercase tracking-widest bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-amber-300 transition-all border border-neutral-950 dark:border-white rounded shadow-sm cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{lang === 'RO' ? 'Ieșire' : 'Logout'}</span>
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}