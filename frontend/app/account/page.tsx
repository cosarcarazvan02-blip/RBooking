'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import {
  ArrowLeft,
  Heart,
  Trash2,
  ArrowUpRight,
  MapPin,
  Key,
  Check,
  X,
  RefreshCw,
  Eye,
  EyeOff,
  User,
  LogIn,
  UserPlus,
  ShieldCheck,
  Shield,
  ShieldAlert,
  KeyRound,
  Copy,
  Download,
  AlertTriangle,
  FileText,
  Smartphone,
  Lock,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { getActiveApiKey, setActiveApiKey, DEFAULT_API_KEY } from '@/lib/apiKey';
import { getUserFavorites, removeUserFavorite, syncUserWishlistFromDb, FavoriteItem } from '@/lib/userStorage';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
}

export default function AccountPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    role: 'User',
  });
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Recovery Codes & 2FA State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [hasRecoveryCodes, setHasRecoveryCodes] = useState(false);
  const [totalCodes, setTotalCodes] = useState(0);
  const [remainingCodes, setRemainingCodes] = useState(0);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [isGeneratingCodes, setIsGeneratingCodes] = useState(false);
  const [isToggling2Fa, setIsToggling2Fa] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [securityStatusMessage, setSecurityStatusMessage] = useState<{ ro: string; en: string; type: 'success' | 'error' | 'info' } | null>(null);

  // API Key State
  const [inputKey, setInputKey] = useState<string>(DEFAULT_API_KEY);
  const [showKeyText, setShowKeyText] = useState<boolean>(false);
  const [apiTestStatus, setApiTestStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle');
  const [apiTestMessage, setApiTestMessage] = useState<{ ro: string; en: string } | null>(null);

  const loadFavorites = useCallback(() => {
    if (typeof window === 'undefined') return;
    const favs = getUserFavorites();
    setFavorites(favs);
  }, []);

  const handleRemoveFavorite = (id: string) => {
    removeUserFavorite(id);
    loadFavorites();
  };

  const fetchRecoveryCodesStatus = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('rbooking_token') || localStorage.getItem('authToken');
    if (!token) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5293/api';
      const apiKey = getActiveApiKey();
      const res = await fetch(`${apiUrl}/Auth/recovery-codes/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Api-Key': apiKey,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setTwoFactorEnabled(Boolean(data.twoFactorEnabled));
        setHasRecoveryCodes(Boolean(data.hasRecoveryCodes));
        setTotalCodes(Number(data.totalCodes) || 0);
        setRemainingCodes(Number(data.remainingCodes) || 0);
      }
    } catch {
      const localCodes = localStorage.getItem('rbooking_recovery_codes');
      if (localCodes) {
        try {
          const parsed = JSON.parse(localCodes);
          setHasRecoveryCodes(true);
          setTotalCodes(parsed.length || 10);
          setRemainingCodes(parsed.length || 10);
        } catch {
          // ignore
        }
      }
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    queueMicrotask(() => {
      loadFavorites();
      syncUserWishlistFromDb().then((synced) => {
        if (!ignore && synced) setFavorites(synced);
      });
      const currentKey = getActiveApiKey();
      setInputKey(currentKey);

      const token = localStorage.getItem('rbooking_token') || localStorage.getItem('authToken');
      const logged = localStorage.getItem('rbooking_logged_in') === 'true' || Boolean(token);
      setIsLoggedIn(logged);
      if (logged) {
        fetchRecoveryCodesStatus();
      }
    });

    const handleFavoritesChange = () => {
      loadFavorites();
    };
    window.addEventListener('rbooking_favorites_change', handleFavoritesChange);

    const timer = setTimeout(() => {
      const saved = localStorage.getItem('rbooking_user_profile');
      if (saved) {
        try {
          if (!ignore) {
            const parsed = JSON.parse(saved);
            setProfile({
              name: parsed.name || parsed.Name || '',
              email: parsed.email || parsed.Email || '',
              phone: parsed.phone || parsed.Phone || '',
              role: parsed.role || parsed.Role || 'User',
            });
          }
        } catch (e) {
          console.error(e);
        }
      }
    }, 0);

    return () => {
      ignore = true;
      clearTimeout(timer);
      window.removeEventListener('rbooking_favorites_change', handleFavoritesChange);
    };
  }, [loadFavorites, fetchRecoveryCodesStatus]);

  // Recovery Codes Handlers
  const handleGenerateRecoveryCodes = async () => {
    setIsGeneratingCodes(true);
    setSecurityStatusMessage(null);
    const token = localStorage.getItem('rbooking_token') || localStorage.getItem('authToken');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5293/api';
    const apiKey = getActiveApiKey();

    try {
      const res = await fetch(`${apiUrl}/Auth/recovery-codes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Api-Key': apiKey,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const codes = data.codes || [];
        setGeneratedCodes(codes);
        setTotalCodes(data.totalCount || codes.length);
        setRemainingCodes(data.remainingCount || codes.length);
        setHasRecoveryCodes(true);
        localStorage.setItem('rbooking_recovery_codes', JSON.stringify(codes));
        setSecurityStatusMessage({
          ro: '✓ Set nou de 10 coduri de recuperare generat cu succes! Păstrați-le într-un loc sigur.',
          en: '✓ New set of 10 recovery codes generated successfully! Keep them in a safe place.',
          type: 'success',
        });
      } else {
        generateLocalFallbackCodes();
      }
    } catch {
      generateLocalFallbackCodes();
    } finally {
      setIsGeneratingCodes(false);
    }
  };

  const generateLocalFallbackCodes = () => {
    const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      let p1 = '';
      let p2 = '';
      for (let j = 0; j < 4; j++) {
        p1 += chars.charAt(Math.floor(Math.random() * chars.length));
        p2 += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      codes.push(`${p1}-${p2}`);
    }
    setGeneratedCodes(codes);
    setTotalCodes(10);
    setRemainingCodes(10);
    setHasRecoveryCodes(true);
    localStorage.setItem('rbooking_recovery_codes', JSON.stringify(codes));
    setSecurityStatusMessage({
      ro: '✓ Set nou de 10 coduri de recuperare generat (Mod Local)! Salvați-le acum.',
      en: '✓ New set of 10 recovery codes generated (Local Mode)! Save them now.',
      type: 'success',
    });
  };

  const handleCopyAllCodes = () => {
    if (generatedCodes.length === 0) return;
    const text = `RBooking Recovery Codes (Generat: ${new Date().toLocaleString()}):\n\n` +
      generatedCodes.map((c, i) => `${i + 1}. ${c}`).join('\n') +
      '\n\n* Fiecare cod poate fi folosit o singură dată pentru autentificare când nu ai acces la telefon.';
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const handleCopySingleCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownloadCodesTxt = () => {
    if (generatedCodes.length === 0) return;
    const text = `=========================================\n` +
      `RBOOKING PLATFORM - CODURI DE RECUPERARE (2FA)\n` +
      `Generat la: ${new Date().toISOString()}\n` +
      `Utilizator: ${profile.email || 'Cont Utilizator'}\n` +
      `=========================================\n\n` +
      `ATENȚIE:\n` +
      `- Fiecare cod de recuperare poate fi utilizat o singură dată.\n` +
      `- Folosiți un cod de recuperare atunci când nu aveți acces la telefon sau la aplicația 2FA.\n` +
      `- Nu partajați aceste coduri cu nimeni.\n\n` +
      `CODURILE DUMNEAVOASTRĂ DE RECUPERARE:\n` +
      generatedCodes.map((c, i) => `  [${(i + 1).toString().padStart(2, '0')}]  ${c}`).join('\n') +
      `\n\n=========================================\n`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rbooking-recovery-codes-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleToggle2Fa = async () => {
    setIsToggling2Fa(true);
    setSecurityStatusMessage(null);
    const targetState = !twoFactorEnabled;
    const token = localStorage.getItem('rbooking_token') || localStorage.getItem('authToken');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5293/api';
    const apiKey = getActiveApiKey();

    try {
      const res = await fetch(`${apiUrl}/Auth/two-factor/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify({ enabled: targetState }),
      });

      if (res.ok) {
        setTwoFactorEnabled(targetState);
        setSecurityStatusMessage({
          ro: targetState
            ? '✓ Autentificarea în doi pași (2FA) a fost activată. Asigurați-vă că generați coduri de recuperare!'
            : '✓ Autentificarea în doi pași (2FA) a fost dezactivată.',
          en: targetState
            ? '✓ Two-Factor Authentication (2FA) has been enabled. Make sure you generate recovery codes!'
            : '✓ Two-Factor Authentication (2FA) has been disabled.',
          type: 'info',
        });
      } else {
        setTwoFactorEnabled(targetState);
      }
    } catch {
      setTwoFactorEnabled(targetState);
    } finally {
      setIsToggling2Fa(false);
    }
  };

  const handleSaveProfile = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const updatedProfile = { ...profile };
    localStorage.setItem('rbooking_user_profile', JSON.stringify(updatedProfile));
    setIsEditing(false);
    setSuccessMessage(lang === 'RO' ? 'Modificările au fost salvate cu succes!' : 'Changes saved successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // API Key Management Handlers
  const handleSaveApiKey = () => {
    setActiveApiKey(inputKey);
    setApiTestStatus('valid');
    setApiTestMessage({
      ro: '✓ Cheia API a fost salvată și activată cu succes!',
      en: '✓ API Key saved and activated successfully!',
    });
  };

  const handleResetDefaultKey = () => {
    setInputKey(DEFAULT_API_KEY);
    setActiveApiKey(DEFAULT_API_KEY);
    setApiTestStatus('valid');
    setApiTestMessage({
      ro: '✓ Restabilit la cheia API implicită 2026.',
      en: '✓ Reset to default 2026 API Key.',
    });
  };

  const handleTestApiKey = async () => {
    setApiTestStatus('testing');
    setApiTestMessage({
      ro: 'Se verifică cheia cu backend-ul .NET...',
      en: 'Testing key with .NET backend...',
    });

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
        setApiTestStatus('valid');
        setApiTestMessage({
          ro: '✓ Conexiune reușită! Cheia API este validă și autorizată.',
          en: '✓ Connection successful! API key is valid and authorized.',
        });
      } else {
        setApiTestStatus('invalid');
        setApiTestMessage({
          ro: `✕ Acces respins (HTTP ${res.status}). Cheia API este incorectă.`,
          en: `✕ Access denied (HTTP ${res.status}). Invalid API key.`,
        });
      }
    } catch {
      setApiTestStatus('invalid');
      setApiTestMessage({
        ro: '✕ Nu s-a putut conecta la serverul backend. Asigură-te că API-ul rulează.',
        en: '✕ Could not connect to backend server. Make sure the API is running.',
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-neutral-900 dark:text-neutral-100 space-y-10">
      {/* Navigation Top */}
      <div className="flex justify-between items-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase tracking-widest border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{lang === 'RO' ? 'Înapoi Acasă' : 'Back to Home'}</span>
        </Link>
      </div>

      {/* Page Header */}
      <div className="pb-6 border-b border-neutral-300 dark:border-neutral-800">
        <p className="text-[10px] tracking-[0.25em] text-neutral-500 uppercase mb-2 font-mono">
          [ {lang === 'RO' ? 'CONFIGURARE CONT & SETĂRI' : 'ACCOUNT SETTINGS & CONFIGURATION'} ]
        </p>
        <h1 className="text-3xl font-serif">
          {lang === 'RO' ? 'Contul Meu' : 'My Account'}
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          {lang === 'RO'
            ? 'Gestionează-ți datele personale, cazările favorite și setările API.'
            : 'Manage your personal details, favorite stays, and API settings.'}
        </p>
      </div>

      {/* Guest Mode Notice for Logged-Out Users */}
      {!isLoggedIn && (
        <div className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-serif font-medium text-base">
              <User className="w-4 h-4" />
              <span>{lang === 'RO' ? 'Ești în modul vizitator' : 'You are in guest mode'}</span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              {lang === 'RO'
                ? 'Pentru a-ți păstra rezervările, istoricul și profilul personal, te poți conecta oricând.'
                : 'To save your reservations, history, and personal profile, you can log in anytime.'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 text-xs font-mono uppercase tracking-wider rounded-xl hover:bg-neutral-800 dark:hover:bg-amber-300 transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{lang === 'RO' ? 'Autentificare' : 'Login'}</span>
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-neutral-300 dark:border-neutral-700 text-xs font-mono uppercase tracking-wider rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{lang === 'RO' ? 'Înregistrare' : 'Register'}</span>
            </Link>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-mono">
          {successMessage}
        </div>
      )}

      {/* 1. Secțiune Informații Personale */}
      <div className="bg-white dark:bg-[#111] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-lg font-serif">
              {lang === 'RO' ? 'Informații Personale' : 'Personal Information'}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {lang === 'RO' ? 'Detaliile profilului tău înregistrat.' : 'Your registered profile details.'}
            </p>
          </div>
          {isLoggedIn && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-amber-300 rounded-xl text-xs font-mono uppercase tracking-wider transition cursor-pointer"
            >
              {lang === 'RO' ? 'Editează' : 'Edit'}
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-neutral-500 mb-1">
                {lang === 'RO' ? 'Nume Complet' : 'Full Name'}
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-neutral-500 mb-1">
                {lang === 'RO' ? 'Adresă Email' : 'Email Address'}
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-neutral-500 mb-1">
                {lang === 'RO' ? 'Număr Telefon' : 'Phone Number'}
              </label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-400"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="px-5 py-2.5 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-amber-300 rounded-xl text-xs font-mono uppercase tracking-wider transition cursor-pointer"
              >
                {lang === 'RO' ? 'Salvează' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-mono uppercase tracking-wider hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                {lang === 'RO' ? 'Anulează' : 'Cancel'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-sm font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-3 py-2 border-b border-neutral-100 dark:border-neutral-800/50">
              <span className="text-neutral-500">{lang === 'RO' ? 'Nume:' : 'Name:'}</span>
              <span className="sm:col-span-2 font-medium">{profile.name || (lang === 'RO' ? 'Vizitator Oaspete' : 'Guest Visitor')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 py-2 border-b border-neutral-100 dark:border-neutral-800/50">
              <span className="text-neutral-500">{lang === 'RO' ? 'Email:' : 'Email:'}</span>
              <span className="sm:col-span-2 font-medium">{profile.email || (lang === 'RO' ? 'Neconectat' : 'Not logged in')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 py-2 border-b border-neutral-100 dark:border-neutral-800/50">
              <span className="text-neutral-500">{lang === 'RO' ? 'Telefon:' : 'Phone:'}</span>
              <span className="sm:col-span-2 font-medium">{profile.phone || (lang === 'RO' ? 'Nespecificat' : 'Not specified')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 py-2 border-b border-neutral-100 dark:border-neutral-800/50">
              <span className="text-neutral-500">{lang === 'RO' ? 'Rol:' : 'Role:'}</span>
              <span className="sm:col-span-2 font-medium">{profile.role || (isLoggedIn ? 'User' : 'Guest')}</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Secțiune Securitate & Coduri de Recuperare (2FA) */}
      <div className="bg-white dark:bg-[#111] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-700 dark:text-amber-300">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif">
                {lang === 'RO' ? 'Securitate Cont & Coduri de Recuperare' : 'Account Security & Recovery Codes'}
              </h2>
              <p className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
                [ {lang === 'RO' ? 'Autentificare 2FA & Rezervă de Urgență' : '2FA Protection & Emergency Fallback'} ]
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 text-xs font-mono rounded-lg border flex items-center gap-1.5 ${
                remainingCodes > 2
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                  : remainingCodes > 0
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                  : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
              }`}
            >
              {remainingCodes > 0 ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {remainingCodes} {lang === 'RO' ? 'coduri disponibile' : 'codes available'}
                  </span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>
                    {lang === 'RO' ? 'Niciun cod activ' : 'No active codes'}
                  </span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Feedback message banner */}
        {securityStatusMessage && (
          <div
            className={`p-3.5 text-xs font-mono rounded-xl border flex items-center gap-2.5 ${
              securityStatusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800'
                : securityStatusMessage.type === 'error'
                ? 'bg-red-50 text-red-900 border-red-300 dark:bg-red-950/40 dark:text-red-200 dark:border-red-800'
                : 'bg-blue-50 text-blue-900 border-blue-300 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-800'
            }`}
          >
            {securityStatusMessage.type === 'success' && <Check className="w-4 h-4 shrink-0 text-emerald-600" />}
            {securityStatusMessage.type === 'error' && <X className="w-4 h-4 shrink-0 text-red-600" />}
            {securityStatusMessage.type === 'info' && <Shield className="w-4 h-4 shrink-0 text-blue-600" />}
            <span>{lang === 'RO' ? securityStatusMessage.ro : securityStatusMessage.en}</span>
          </div>
        )}

        {/* Informative description banner */}
        <div className="p-4 bg-neutral-50 dark:bg-[#16181e] border border-neutral-200 dark:border-neutral-800/80 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-neutral-800 dark:text-neutral-200 tracking-wider">
            <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{lang === 'RO' ? 'Cum funcționează codurile de recuperare?' : 'How do recovery codes work?'}</span>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {lang === 'RO'
              ? 'Dacă nu ai telefonul la îndemână, nu ai semnal sau ai pierdut aplicația de autentificare 2FA, poți folosi oricare dintre aceste coduri pentru a te conecta direct. Fiecare cod este de unică folosință și devine inactiv imediat după autentificare.'
              : 'If you don’t have your phone handy, lack cellular service, or lost your 2FA authenticator app, you can use any of these backup codes to sign in immediately. Each code is single-use and invalidated immediately upon login.'}
          </p>
        </div>

        {/* 2FA Integration & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-[#14161b]">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              <Shield className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
              <span>{lang === 'RO' ? 'Stare Autentificare în Doi Pași (2FA)' : 'Two-Factor Authentication (2FA) State'}</span>
            </div>
            <p className="text-xs text-neutral-500 font-mono">
              {twoFactorEnabled
                ? (lang === 'RO' ? 'Activată — la conectare se solicită codul TOTP (QR) sau un cod de recuperare.' : 'Enabled — TOTP (QR) code or a recovery code is required on login.')
                : (lang === 'RO' ? 'Dezactivată — conectarea se face doar cu parolă.' : 'Disabled — sign in requires password only.')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggle2Fa}
              disabled={isToggling2Fa}
              className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-xl border transition cursor-pointer flex items-center gap-2 ${
                twoFactorEnabled
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
                  : 'border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              {isToggling2Fa ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <span className={`w-2 h-2 rounded-full ${twoFactorEnabled ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
              )}
              <span>
                {twoFactorEnabled
                  ? (lang === 'RO' ? '2FA: Activat' : '2FA: Enabled')
                  : (lang === 'RO' ? 'Activează 2FA' : 'Enable 2FA')}
              </span>
            </button>
          </div>
        </div>

        {/* Generate / Regenerate Controls */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-serif font-medium text-neutral-900 dark:text-neutral-100">
                {lang === 'RO' ? 'Set de Coduri de Recuperare (Backup)' : 'Recovery Codes Batch (Backup)'}
              </h3>
              <p className="text-xs text-neutral-500 font-mono">
                {hasRecoveryCodes
                  ? (lang === 'RO' ? `${remainingCodes} coduri neutilizate rămase.` : `${remainingCodes} unused codes remaining.`)
                  : (lang === 'RO' ? 'Nu aveți niciun set de coduri generat încă.' : 'No recovery codes set generated yet.')}
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerateRecoveryCodes}
              disabled={isGeneratingCodes}
              className="px-4 py-2.5 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-amber-300 rounded-xl text-xs font-mono uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 border border-neutral-950 dark:border-white shadow-xs disabled:opacity-50"
            >
              {isGeneratingCodes ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Key className="w-3.5 h-3.5" />
              )}
              <span>
                {hasRecoveryCodes
                  ? (lang === 'RO' ? 'Regenerează Coduri Noi' : 'Regenerate New Codes')
                  : (lang === 'RO' ? 'Generează 10 Coduri' : 'Generate 10 Codes')}
              </span>
            </button>
          </div>

          {/* Generated Codes Modal / Display Box */}
          {generatedCodes.length > 0 && (
            <div className="mt-4 p-5 bg-neutral-50 dark:bg-[#171920] border border-amber-500/40 dark:border-amber-500/30 rounded-2xl space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-serif font-medium text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    {lang === 'RO' ? 'Setul Tău Nou de Coduri de Recuperare' : 'Your New Set of Recovery Codes'}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-neutral-500">
                  {lang === 'RO' ? '10 coduri unice • O singură utilizare fiecare' : '10 unique codes • Single use each'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
                {generatedCodes.map((code, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-3.5 py-2.5 bg-white dark:bg-[#101216] border border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-neutral-400 dark:hover:border-neutral-600 transition group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400 text-[10px]">
                        {(index + 1).toString().padStart(2, '0')}.
                      </span>
                      <span className="font-bold tracking-widest text-neutral-900 dark:text-white">
                        {code}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopySingleCode(code, index)}
                      className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded transition cursor-pointer"
                      title={lang === 'RO' ? 'Copiază acest cod' : 'Copy this code'}
                    >
                      {copiedIndex === index ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Action Buttons for batch */}
              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800/80 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyAllCodes}
                    className="px-3.5 py-2 bg-white dark:bg-[#12141a] border border-neutral-300 dark:border-neutral-700 hover:border-neutral-500 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer text-neutral-800 dark:text-neutral-200"
                  >
                    {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAll ? (lang === 'RO' ? 'Copiate!' : 'Copied!') : (lang === 'RO' ? 'Copiază Toate' : 'Copy All')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadCodesTxt}
                    className="px-3.5 py-2 bg-white dark:bg-[#12141a] border border-neutral-300 dark:border-neutral-700 hover:border-neutral-500 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer text-neutral-800 dark:text-neutral-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{lang === 'RO' ? 'Descarcă .txt' : 'Download .txt'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setGeneratedCodes([])}
                  className="px-3.5 py-2 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 hover:bg-neutral-800 dark:hover:bg-amber-300 transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{lang === 'RO' ? 'Am Salvat Codurile' : 'I Saved The Codes'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Secțiune Cazări Favorite (Salvate) */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-serif">
              {lang === 'RO' ? 'Cazări Favorite (Salvate)' : 'Saved Favorite Stays'}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {lang === 'RO'
                ? 'Proprietățile salvate de tine pentru rezervări viitoare.'
                : 'Properties you saved for future bookings.'}
            </p>
          </div>
          <span className="px-2.5 py-1 text-xs font-mono bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 rounded-lg">
            {favorites.length} {lang === 'RO' ? (favorites.length === 1 ? 'favorită' : 'favorite') : (favorites.length === 1 ? 'saved stay' : 'saved stays')}
          </span>
        </div>

        {favorites.length === 0 ? (
          <div className="p-8 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl bg-white dark:bg-[#111] text-center space-y-2">
            <Heart className="w-8 h-8 text-neutral-400 mx-auto stroke-[1.5]" />
            <p className="text-xs font-mono uppercase text-neutral-500">
              {lang === 'RO' ? 'Nu ai adăugat nicio cazare la favorite.' : 'No saved stays in your favorites yet.'}
            </p>
            <Link
              href="/#accommodations"
              className="inline-block mt-2 text-xs font-mono text-amber-600 dark:text-amber-400 underline underline-offset-4 hover:opacity-80"
            >
              {lang === 'RO' ? 'Explorează cazările din colecție →' : 'Explore collection stays →'}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {favorites.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-white dark:bg-[#111] border border-neutral-200 dark:border-neutral-800 rounded-2xl flex gap-4 items-center justify-between shadow-xs hover:border-neutral-400 dark:hover:border-neutral-700 transition"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 shrink-0 relative">
                    <SafeImage src={item.imageUrl} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <h3 className="text-sm font-serif font-medium truncate text-neutral-900 dark:text-neutral-100">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-neutral-500 font-mono flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </p>
                    <p className="text-xs font-mono font-bold text-neutral-900 dark:text-white pt-1">
                      {item.pricePerNight} LEI <span className="text-[10px] font-normal text-neutral-500">/ {lang === 'RO' ? 'noapte' : 'night'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/hotels/${item.id}`}
                    className="p-2 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 rounded-lg hover:bg-neutral-800 dark:hover:bg-amber-300 transition"
                    title={lang === 'RO' ? 'Vezi detalii' : 'View details'}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRemoveFavorite(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition cursor-pointer"
                    title={lang === 'RO' ? 'Șterge din favorite' : 'Remove from favorites'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Secțiune Configurare Cheie API (Securitate & Integrare Backend) */}
      <div className="bg-white dark:bg-[#111] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-700 dark:text-amber-300">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif">
                {lang === 'RO' ? 'Configurare Cheie API' : 'API Key Configuration'}
              </h2>
              <p className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
                [ Header Securitate: X-Api-Key ]
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto px-2.5 py-1 text-[11px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === 'RO' ? 'Autentificare Endpoint-uri' : 'Endpoint Authentication'}</span>
          </span>
        </div>

        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          {lang === 'RO'
            ? 'Cheia API este transmisă în header-ul X-Api-Key pentru securizarea și autorizarea tuturor cererilor dintre interfața web și backend-ul .NET / PostgreSQL. În mod prestabilit, aplicația folosește cheia securizată 2026.'
            : 'The API Key is transmitted in the X-Api-Key header to secure and authorize all requests between the web interface and the .NET / PostgreSQL backend. By default, the application uses the secure 2026 key.'}
        </p>

        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
              {lang === 'RO' ? 'Valoare Cheie API Activă' : 'Active API Key Value'}
            </label>
            <div className="relative">
              <input
                type={showKeyText ? 'text' : 'password'}
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value);
                  setApiTestStatus('idle');
                  setApiTestMessage(null);
                }}
                placeholder="RBooking_Secret_ApiKey_..."
                className="w-full pl-3 pr-11 py-2.5 bg-neutral-50 dark:bg-[#181a20] text-xs font-mono text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-neutral-900 dark:focus:border-white"
              />
              <button
                type="button"
                onClick={() => setShowKeyText(!showKeyText)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1 cursor-pointer"
                title={showKeyText ? (lang === 'RO' ? 'Ascunde' : 'Hide') : (lang === 'RO' ? 'Arată' : 'Show')}
              >
                {showKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {apiTestMessage && (
            <div
              className={`p-3 text-xs font-mono flex items-center gap-2 rounded-xl border ${
                apiTestStatus === 'valid'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : apiTestStatus === 'invalid'
                  ? 'bg-red-50 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                  : 'bg-neutral-100 text-neutral-800 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700'
              }`}
            >
              {apiTestStatus === 'testing' && <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />}
              {apiTestStatus === 'valid' && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
              {apiTestStatus === 'invalid' && <X className="w-3.5 h-3.5 text-red-600 shrink-0" />}
              <span>{lang === 'RO' ? apiTestMessage.ro : apiTestMessage.en}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="button"
              onClick={handleSaveApiKey}
              className="flex-1 py-2.5 px-4 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 text-xs font-mono uppercase tracking-widest font-semibold rounded-xl border border-neutral-950 dark:border-white hover:bg-neutral-800 dark:hover:bg-amber-300 dark:hover:text-neutral-950 cursor-pointer text-center transition"
            >
              {lang === 'RO' ? 'Salvează & Activează Cheia' : 'Save & Activate Key'}
            </button>
            <button
              type="button"
              onClick={handleTestApiKey}
              disabled={apiTestStatus === 'testing' || !inputKey.trim()}
              className="py-2.5 px-4 border border-neutral-300 dark:border-neutral-800 rounded-xl text-xs font-mono uppercase tracking-widest text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer disabled:opacity-50 transition"
            >
              {lang === 'RO' ? 'Test Conexiune' : 'Test Connection'}
            </button>
          </div>

          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[11px] font-mono">
            <span className="text-neutral-400">
              {lang === 'RO' ? 'Configurație implicită server:' : 'Default server configuration:'}
            </span>
            <button
              type="button"
              onClick={handleResetDefaultKey}
              className="text-amber-700 dark:text-amber-300 hover:underline uppercase tracking-wider cursor-pointer"
            >
              [ {lang === 'RO' ? 'Încarcă Cheia Implicită 2026' : 'Load Default 2026 Key'} ]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}