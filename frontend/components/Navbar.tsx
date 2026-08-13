'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { useLanguage } from '@/context/LanguageContext';
import { getUserFavorites } from '@/lib/userStorage';
import {
  LogIn,
  Calendar,
  LogOut,
  Globe,
  User,
  Building2,
  Shield,
  Hotel,
  Heart,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, toggleLang } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('User');
  const [favoritesCount, setFavoritesCount] = useState(0);

  const checkFavorites = useCallback(() => {
    if (typeof window === 'undefined') return;
    const favs = getUserFavorites();
    setFavoritesCount(favs.length);
  }, []);

  const checkAuth = useCallback(() => {
    if (typeof window === 'undefined') return;

    const logged = localStorage.getItem('rbooking_logged_in');
    const authToken = localStorage.getItem('rbooking_token') || localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');
    const profile = localStorage.getItem('rbooking_user_profile');

    const isUserLoggedIn = logged === 'true' || Boolean(authToken) || Boolean(currentUser);
    setIsLoggedIn(isUserLoggedIn);

    if (profile) {
      try {
        const parsed = JSON.parse(profile);
        const role = parsed.role || parsed.Role;
        if (role) {
          setUserRole(role);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (currentUser) {
      try {
        const parsed = JSON.parse(currentUser);
        const role = parsed.role || parsed.Role;
        if (role) {
          setUserRole(role === 'Operator' ? 'Manager' : role);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    setUserRole('User');
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      checkAuth();
      checkFavorites();
    });

    window.addEventListener('storage', checkAuth);
    window.addEventListener('storage', checkFavorites);
    window.addEventListener('rbooking_auth_change', checkAuth);
    window.addEventListener('rbooking_favorites_change', checkFavorites);
    window.addEventListener('auth-state-change', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('storage', checkFavorites);
      window.removeEventListener('rbooking_auth_change', checkAuth);
      window.removeEventListener('rbooking_favorites_change', checkFavorites);
      window.removeEventListener('auth-state-change', checkAuth);
    };
  }, [checkAuth, checkFavorites]);

  // Re-verificare automată la schimbarea rutei
  useEffect(() => {
    queueMicrotask(() => {
      checkAuth();
      checkFavorites();
    });
  }, [pathname, checkAuth, checkFavorites]);

  const handleLogout = () => {
    localStorage.removeItem('rbooking_token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('rbooking_user_profile');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('rbooking_logged_in');
    setIsLoggedIn(false);
    setUserRole('User');
    window.dispatchEvent(new Event('rbooking_auth_change'));
    window.dispatchEvent(new Event('auth-state-change'));
    window.dispatchEvent(new Event('storage'));
    router.push('/');
  };

  const isPathActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/' || href === '/#accommodations' || href === '/hotels') {
      return pathname === '/' || pathname === '/hotels';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleAccommodationsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === '/') {
      e.preventDefault();
      const element = document.getElementById('accommodations');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', '#accommodations');
      }
    }
  };

  const handleFavoritesClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === '/') {
      e.preventDefault();
      const element = document.getElementById('accommodations');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', '#accommodations');
      }
      window.dispatchEvent(new CustomEvent('rbooking_select_category', { detail: 'Favorites' }));
    }
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.pushState(null, '', '/');
    }
  };

  const getNavLinkClass = (href: string, isPrimaryAction = false) => {
    const active = isPathActive(href);
    if (active) {
      return 'inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold uppercase tracking-widest bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 border-2 border-amber-600 dark:border-amber-400 rounded shadow-md ring-2 ring-amber-500/30 transition-all scale-[1.02]';
    }
    if (isPrimaryAction) {
      return 'inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold uppercase tracking-widest bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-amber-300 transition-all border border-neutral-800 dark:border-neutral-200 rounded shadow-sm';
    }
    return 'inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold uppercase tracking-widest text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white bg-neutral-100/80 dark:bg-neutral-900/80 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-all border border-neutral-300 dark:border-neutral-700 rounded shadow-sm';
  };

  const normalizedRole = userRole.toLowerCase();
  const isManager = normalizedRole === 'operator' || normalizedRole === 'manager';
  const isAdmin = normalizedRole === 'admin';

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-neutral-200/40 dark:border-white/10 bg-transparent backdrop-blur-md text-neutral-900 dark:text-white transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" onClick={handleLogoClick} className="flex items-center gap-3.5 group">
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

          <nav className="flex items-center gap-2 sm:gap-3">
            {/* Buton Limbă */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-semibold uppercase tracking-widest border border-neutral-300 dark:border-neutral-700 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang}</span>
            </button>

            {/* Comutator Temă */}
            <ThemeToggle />

            {!isLoggedIn ? (
              // 1. Vizitator neautentificat: Accommodations | Favorites | Register | Login
              <div className="flex items-center gap-2">
                <Link
                  href="/#accommodations"
                  onClick={handleAccommodationsClick}
                  className={getNavLinkClass('/#accommodations')}
                >
                  <Hotel className="w-3.5 h-3.5" />
                  <span>{lang === 'RO' ? 'Cazări' : 'Accommodations'}</span>
                </Link>
                <Link
                  href="/#accommodations"
                  onClick={handleFavoritesClick}
                  className={getNavLinkClass('/#favorites')}
                >
                  <Heart className={`w-3.5 h-3.5 ${favoritesCount > 0 ? 'text-rose-500 fill-rose-500' : 'text-rose-500'}`} />
                  <span>{lang === 'RO' ? 'Favorite' : 'Favorites'}</span>
                  {favoritesCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[10px] rounded-full font-bold leading-none">
                      {favoritesCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/account"
                  className={getNavLinkClass('/account')}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{lang === 'RO' ? 'Contul meu' : 'My Account'}</span>
                </Link>
                <Link
                  href="/register"
                  className={getNavLinkClass('/register')}
                >
                  <span>{lang === 'RO' ? 'Înregistrare' : 'Register'}</span>
                </Link>
                <Link
                  href="/login"
                  className={getNavLinkClass('/login', true)}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{lang === 'RO' ? 'Autentificare' : 'Login'}</span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {isManager ? (
                  // 2. Manager hotel: Accommodations | Favorites | Manage my accommodations | My account | Logout
                  <>
                    <Link
                      href="/#accommodations"
                      onClick={handleAccommodationsClick}
                      className={getNavLinkClass('/#accommodations')}
                    >
                      <Hotel className="w-3.5 h-3.5" />
                      <span>{lang === 'RO' ? 'Cazări' : 'Accommodations'}</span>
                    </Link>
                    <Link
                      href="/#accommodations"
                      onClick={handleFavoritesClick}
                      className={getNavLinkClass('/#favorites')}
                    >
                      <Heart className={`w-3.5 h-3.5 ${favoritesCount > 0 ? 'text-rose-500 fill-rose-500' : 'text-rose-500'}`} />
                      <span>{lang === 'RO' ? 'Favorite' : 'Favorites'}</span>
                      {favoritesCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[10px] rounded-full font-bold leading-none">
                          {favoritesCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      href="/manager/accommodation"
                      className={getNavLinkClass('/manager/accommodation')}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{lang === 'RO' ? 'Gestionează cazările mele' : 'Manage my accommodations'}</span>
                    </Link>
                  </>
                ) : isAdmin ? (
                  // 3. Admin: Accommodations | Favorites | Admin | My account | Logout
                  <>
                    <Link
                      href="/#accommodations"
                      onClick={handleAccommodationsClick}
                      className={getNavLinkClass('/#accommodations')}
                    >
                      <Hotel className="w-3.5 h-3.5" />
                      <span>{lang === 'RO' ? 'Cazări' : 'Accommodations'}</span>
                    </Link>
                    <Link
                      href="/#accommodations"
                      onClick={handleFavoritesClick}
                      className={getNavLinkClass('/#favorites')}
                    >
                      <Heart className={`w-3.5 h-3.5 ${favoritesCount > 0 ? 'text-rose-500 fill-rose-500' : 'text-rose-500'}`} />
                      <span>{lang === 'RO' ? 'Favorite' : 'Favorites'}</span>
                      {favoritesCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[10px] rounded-full font-bold leading-none">
                          {favoritesCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      href="/admin"
                      className={getNavLinkClass('/admin')}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Admin</span>
                    </Link>
                  </>
                ) : (
                  // 4. User simplu: Hotels (Accommodations) | Favorites | Reservations | My account | Logout
                  <>
                    <Link
                      href="/#accommodations"
                      onClick={handleAccommodationsClick}
                      className={getNavLinkClass('/#accommodations')}
                    >
                      <Hotel className="w-3.5 h-3.5" />
                      <span>{lang === 'RO' ? 'Cazări' : 'Accommodations'}</span>
                    </Link>
                    <Link
                      href="/#accommodations"
                      onClick={handleFavoritesClick}
                      className={getNavLinkClass('/#favorites')}
                    >
                      <Heart className={`w-3.5 h-3.5 ${favoritesCount > 0 ? 'text-rose-500 fill-rose-500' : 'text-rose-500'}`} />
                      <span>{lang === 'RO' ? 'Favorite' : 'Favorites'}</span>
                      {favoritesCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[10px] rounded-full font-bold leading-none">
                          {favoritesCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      href="/reservations"
                      className={getNavLinkClass('/reservations')}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{lang === 'RO' ? 'Rezervări' : 'Reservations'}</span>
                    </Link>
                  </>
                )}

                {/* Comune pentru toți utilizatorii logați */}
                <Link
                  href="/account"
                  className={getNavLinkClass('/account')}
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
    </>
  );
}