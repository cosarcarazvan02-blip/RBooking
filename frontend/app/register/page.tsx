'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { getActiveApiKey } from '@/lib/apiKey';
import { translateApiError } from '@/lib/translateApiError';

export default function RegisterPage() {
  const { lang } = useLanguage();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError(
        lang === 'RO'
          ? 'Te rugăm să completezi toate câmpurile.'
          : 'Please complete all fields.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        lang === 'RO'
          ? 'Parolele nu coincid!'
          : 'Passwords do not match!'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5293/api';
      const apiKey = getActiveApiKey();
      const response = await fetch(`${apiUrl}/Auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          translateApiError(data?.message, lang) ||
            (lang === 'RO' ? 'Înregistrarea a eșuat. Încearcă din nou.' : 'Registration failed. Please try again.')
        );
        return;
      }

      const userProfile = {
        id: data.user.id,
        name: name || data.user.firstName,
        email: data.user.email,
        role: data.user.role,
      };

      localStorage.setItem('rbooking_token', data.token);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      localStorage.setItem('rbooking_user_profile', JSON.stringify(userProfile));
      localStorage.setItem('rbooking_logged_in', 'true');
      window.dispatchEvent(new Event('rbooking_auth_change'));
      window.dispatchEvent(new Event('auth-state-change'));

      router.push('/');
    } catch {
      setError(
        lang === 'RO'
          ? 'Eroare de conexiune la server. Verifică dacă API-ul rulează.'
          : 'Connection error. Please check that the API is running.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-80px)] flex flex-col justify-center items-center px-4 sm:px-6 py-12 text-neutral-900 dark:text-neutral-100 selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900">
      <div className="max-w-md w-full mx-auto bg-white dark:bg-[#111] border border-neutral-200 dark:border-neutral-800 p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <p className="text-[10px] tracking-[0.25em] text-neutral-500 uppercase mb-2 font-mono">
            [ RBOOKING HOSPITALITY ]
          </p>
          <h1 className="text-2xl font-serif tracking-wide text-neutral-900 dark:text-white">
            {lang === 'RO' ? 'Creare Cont Nou' : 'Create New Account'}
          </h1>
          <div className="w-8 h-[1px] bg-neutral-300 dark:bg-neutral-700 mx-auto mt-3"></div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs rounded-xl text-center font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2 font-medium font-mono">
              {lang === 'RO' ? 'Nume Complet' : 'Full Name'}
            </label>
            <input 
              type="text" 
              placeholder={lang === 'RO' ? 'Introduceți numele complet' : 'Enter your full name'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-neutral-50 dark:bg-[#181818] border border-neutral-300 dark:border-neutral-800 p-3 rounded-xl text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-400 text-sm transition"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2 font-medium font-mono">
              {lang === 'RO' ? 'Adresă Email' : 'Email Address'}
            </label>
            <input 
              type="email" 
              placeholder={lang === 'RO' ? 'nume@exemplu.com' : 'name@example.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-neutral-50 dark:bg-[#181818] border border-neutral-300 dark:border-neutral-800 p-3 rounded-xl text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-400 text-sm transition"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2 font-medium font-mono">
              {lang === 'RO' ? 'Parolă' : 'Password'}
            </label>
            <input 
              type="password" 
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-neutral-50 dark:bg-[#181818] border border-neutral-300 dark:border-neutral-800 p-3 rounded-xl text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-400 text-sm transition"
            />
            <p className="text-[10px] text-neutral-500 dark:text-neutral-500 mt-1.5 font-mono">
              {lang === 'RO'
                ? 'Minim 8 caractere, cu literă mare, literă mică și o cifră.'
                : 'At least 8 characters, with an uppercase letter, a lowercase letter, and a digit.'}
            </p>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2 font-medium font-mono">
              {lang === 'RO' ? 'Confirmă Parola' : 'Confirm Password'}
            </label>
            <input 
              type="password" 
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-neutral-50 dark:bg-[#181818] border border-neutral-300 dark:border-neutral-800 p-3 rounded-xl text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-400 text-sm transition"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 py-3 rounded-xl font-medium hover:bg-neutral-800 dark:hover:bg-amber-300 transition text-xs tracking-[0.15em] uppercase mt-3 shadow-md cursor-pointer font-mono disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? (lang === 'RO' ? 'Se creează contul...' : 'Creating account...')
              : (lang === 'RO' ? 'Finalizare Înregistrare' : 'Complete Registration')}
          </button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800/60 font-mono">
          <Link href="/login" className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition tracking-wider">
            {lang === 'RO' ? 'Ai deja un cont? ' : 'Already have an account? '}
            <span className="text-neutral-950 dark:text-white underline underline-offset-4">
              {lang === 'RO' ? 'Autentifică-te' : 'Sign in'}
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}