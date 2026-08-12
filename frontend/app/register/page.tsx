'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function RegisterPage() {
  const { lang } = useLanguage();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = (e: React.SubmitEvent<HTMLFormElement>) => {
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

    if (password.length < 6) {
      setError(
        lang === 'RO'
          ? 'Parola trebuie să aibă cel puțin 6 caractere.'
          : 'Password must be at least 6 characters.'
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

    const newUserProfile = {
      name: name,
      email: email,
      phone: '+40 700 000 000',
      role: 'User',
    };

    localStorage.setItem('rbooking_user_profile', JSON.stringify(newUserProfile));
    localStorage.setItem('currentUser', JSON.stringify(newUserProfile));
    router.push('/login');
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
            className="w-full bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 py-3 rounded-xl font-medium hover:bg-neutral-800 dark:hover:bg-amber-300 transition text-xs tracking-[0.15em] uppercase mt-3 shadow-md cursor-pointer font-mono"
          >
            {lang === 'RO' ? 'Finalizare Înregistrare' : 'Complete Registration'}
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