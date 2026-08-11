'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { useLanguage } from '@/context/LanguageContext';
import {
  LogIn,
  Calendar,
  LogOut,
  Globe,
  User,
  Building2,
  Shield,
  Hotel,
  Key,
  Check,
  X,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { getActiveApiKey, setActiveApiKey, DEFAULT_API_KEY } from '@/lib/apiKey';

export default function Navbar() {
  const pathname = usePathname();
  const { lang, toggleLang } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('User');

  // Stare Cheie API
  const [currentApiKey, setCurrentApiKey] = useState<string>(DEFAULT_API_KEY);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [showKeyText, setShowKeyText] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const checkAuth = useCallback(() => {
    if (typeof window === 'undefined') return;

    const logged = localStorage.getItem('rbooking_logged_in');
    const authToken = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');
    const profile = localStorage.getItem('rbooking_user_profile');

    const isUserLoggedIn = logged === 'true' || Boolean(authToken) || Boolean(currentUser);
    setIsLoggedIn(isUserLoggedIn);

    if (profile) {
      try {
        const parsed = JSON.parse(profile);
        if (parsed.role) {
          setUserRole(parsed.role);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (currentUser) {
      try {
        const parsed = JSON.parse(currentUser);
        if (parsed.role) {
          setUserRole(parsed.role === 'Operator' ? 'Manager' : parsed.role);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    setUserRole('User');
  }, []);

  useEffect(() => {
    checkAuth();
    setCurrentApiKey(getActiveApiKey());

    const handleApiKeyUpdate = () => {
      setCurrentApiKey(getActiveApiKey());
    };

    window.addEventListener('storage', checkAuth);
    window.addEventListener('auth-state-change', checkAuth);
    window.addEventListener('api-key-change', handleApiKeyUpdate);
    window.addEventListener('storage', handleApiKeyUpdate);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('auth-state-change', checkAuth);
      window.removeEventListener('api-key-change', handleApiKeyUpdate);
      window.removeEventListener('storage', handleApiKeyUpdate);
    };
  }, [checkAuth]);

  // Re-verificare automată la schimbarea rutei (ex: navigare de la /login la /)
  useEffect(() => {
    checkAuth();
  }, [pathname, checkAuth]);

  const handleLogout = () => {
    localStorage.removeItem('rbooking_logged_in');
    localStorage.removeItem('rbooking_user_profile');
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    setIsLoggedIn(false);
    window.dispatchEvent(new Event('auth-state-change'));
    window.dispatchEvent(new Event('storage'));
    window.location.href = '/';
  };

  // Handlers pentru Cheia API
  const handleOpenKeyModal = () => {
    const key = getActiveApiKey();
    setInputKey(key);
    setTestStatus('idle');
    setTestMessage('');
    setIsKeyModalOpen(true);
  };

  const handleSaveKey = () => {
    setActiveApiKey(inputKey);
    setTestStatus('valid');
    setTestMessage(
      lang === 'RO'
        ? 'Cheia API a fost salvată și activată cu succes!'
        : 'API Key saved and activated successfully!'
    );
    setTimeout(() => {
      setIsKeyModalOpen(false);
      setTestStatus('idle');
      setTestMessage('');
    }, 800);
  };

  const handleResetDefaultKey = () => {
    setInputKey(DEFAULT_API_KEY);
    setActiveApiKey(DEFAULT_API_KEY);
    setTestStatus('valid');
    setTestMessage(
      lang === 'RO'
        ? 'Restabilit la cheia API implicită.'
        : 'Reset to default API Key.'
    );
  };

  const handleTestKey = async () => {
    setTestStatus('testing');
    setTestMessage(lang === 'RO' ? 'Se verifică cheia cu backend-ul...' : 'Testing key with backend...');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5293/api';
      const res = await fetch(`${apiUrl}/Accommodations?PageNumber=1&PageSize=1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': inputKey.trim(),
        },
      });

      if (res.ok) {
        setTestStatus('valid');
        setTestMessage(
          lang === 'RO'
            ? '✓ Conexiune reușită! Cheia API este validă.'
            : '✓ Connection successful! API key is valid.'
        );
      } else {
        setTestStatus('invalid');
        setTestMessage(
          lang === 'RO'
            ? `✕ Acces respins (${res.status}). Cheia API este incorectă.`
            : `✕ Access denied (${res.status}). Invalid API key.`
        );
      }
    } catch {
      setTestStatus('invalid');
      setTestMessage(
        lang === 'RO'
          ? '✕ Nu s-a putut conecta la serverul backend.'
          : '✕ Could not connect to backend server.'
      );
    }
  };

  const isPathActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/') return pathname === '/';
    if (href === '/hotels') return pathname === '/hotels' || pathname.startsWith('/hotels/');
    return pathname === href || pathname.startsWith(`${href}/`);
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

  return (
    <>
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

          <nav className="flex items-center gap-2 sm:gap-3">
            {/* Buton Cheie API */}
            <button
              onClick={handleOpenKeyModal}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-semibold uppercase tracking-widest bg-amber-500/10 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all rounded shadow-sm cursor-pointer"
              title={lang === 'RO' ? 'Setează sau modifică cheia API' : 'Set or configure API Key'}
            >
              <Key className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
              <span className="hidden md:inline">{lang === 'RO' ? 'Cheie API' : 'API Key'}</span>
              <span className="text-[10px] opacity-75 font-mono">
                {currentApiKey ? `[•••${currentApiKey.slice(-4)}]` : '[Set]'}
              </span>
            </button>

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
              // 1. Vizitator neautentificat: Accommodations | Register | Login
              <div className="flex items-center gap-2">
                <Link
                  href="/hotels"
                  className={getNavLinkClass('/hotels')}
                >
                  <Hotel className="w-3.5 h-3.5" />
                  <span>{lang === 'RO' ? 'Cazări' : 'Accommodations'}</span>
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
                {userRole === 'Manager' ? (
                  // 2. Manager hotel: Accommodations | Manage my accommodations | My account | Logout
                  <>
                    <Link
                      href="/hotels"
                      className={getNavLinkClass('/hotels')}
                    >
                      <Hotel className="w-3.5 h-3.5" />
                      <span>{lang === 'RO' ? 'Cazări' : 'Accommodations'}</span>
                    </Link>
                    <Link
                      href="/manager/accommodation"
                      className={getNavLinkClass('/manager/accommodation')}
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
                      className={getNavLinkClass('/hotels')}
                    >
                      <Hotel className="w-3.5 h-3.5" />
                      <span>{lang === 'RO' ? 'Cazări' : 'Accommodations'}</span>
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
                  // 4. User simplu: Hotels (Accommodations) | Reservations | My account | Logout
                  <>
                    <Link
                      href="/hotels"
                      className={getNavLinkClass('/hotels')}
                    >
                      <Hotel className="w-3.5 h-3.5" />
                      <span>{lang === 'RO' ? 'Cazări' : 'Accommodations'}</span>
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

      {/* Modal Configurare Cheie API */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#131519] border border-neutral-300 dark:border-neutral-800 w-full max-w-md p-6 sm:p-8 rounded-2xl shadow-2xl relative text-neutral-900 dark:text-white">
            <button
              onClick={() => setIsKeyModalOpen(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-700 dark:text-amber-300">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-medium">
                  {lang === 'RO' ? 'Configurare Cheie API' : 'API Key Configuration'}
                </h3>
                <p className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
                  [ Header: X-Api-Key ]
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-5 leading-relaxed">
              {lang === 'RO'
                ? 'Introduceți cheia API de securitate pentru a autoriza cererile frontend către backend-ul .NET și baza de date PostgreSQL.'
                : 'Enter the security API key to authorize frontend requests to the .NET backend and PostgreSQL database.'}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                  {lang === 'RO' ? 'Valoare Cheie API' : 'API Key Value'}
                </label>
                <div className="relative">
                  <input
                    type={showKeyText ? 'text' : 'password'}
                    value={inputKey}
                    onChange={(e) => {
                      setInputKey(e.target.value);
                      setTestStatus('idle');
                    }}
                    placeholder="RBooking_Secret_ApiKey_..."
                    className="w-full pl-3 pr-11 py-2.5 bg-neutral-50 dark:bg-[#181a20] text-xs font-mono text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-neutral-900 dark:focus:border-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyText(!showKeyText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1 cursor-pointer"
                  >
                    {showKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {testMessage && (
                <div
                  className={`p-3 text-xs font-mono flex items-center gap-2 rounded-xl border ${
                    testStatus === 'valid'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                      : testStatus === 'invalid'
                      ? 'bg-red-50 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                      : 'bg-neutral-100 text-neutral-800 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  {testStatus === 'testing' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {testStatus === 'valid' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  {testStatus === 'invalid' && <X className="w-3.5 h-3.5 text-red-600" />}
                  <span>{testMessage}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveKey}
                  className="flex-1 py-2.5 px-4 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 text-xs font-mono uppercase tracking-widest font-semibold rounded-xl border border-neutral-950 dark:border-white hover:bg-neutral-800 dark:hover:bg-amber-300 dark:hover:text-neutral-950 cursor-pointer text-center transition"
                >
                  {lang === 'RO' ? 'Salvează & Aplică' : 'Save & Apply'}
                </button>
                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={testStatus === 'testing' || !inputKey.trim()}
                  className="py-2.5 px-4 border border-neutral-300 dark:border-neutral-800 rounded-xl text-xs font-mono uppercase tracking-widest text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer disabled:opacity-50 transition"
                >
                  {lang === 'RO' ? 'Test Conexiune' : 'Test Connection'}
                </button>
              </div>

              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center text-[11px] font-mono">
                <span className="text-neutral-400">{lang === 'RO' ? 'Cheie prestabilită:' : 'Default key:'}</span>
                <button
                  type="button"
                  onClick={handleResetDefaultKey}
                  className="text-amber-700 dark:text-amber-300 hover:underline uppercase tracking-wider cursor-pointer"
                >
                  [ {lang === 'RO' ? 'Încarcă Cheia Default 2026' : 'Load Default 2026 Key'} ]
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}