'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Parolele nu coincid!');
      return;
    }

    const newUserProfile = {
      name: name,
      email: email,
      phone: '+40 700 000 000',
      role: 'User',
    };

    localStorage.setItem('rbooking_user_profile', JSON.stringify(newUserProfile));

    router.push('/login');
  };

  return (
    <main className="min-h-[calc(100vh-80px)] flex flex-col justify-center items-center px-4 sm:px-6 py-12 text-neutral-900 dark:text-neutral-100 selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900">
      <div className="max-w-md w-full mx-auto bg-white dark:bg-[#111] border border-neutral-200 dark:border-neutral-800 p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <p className="text-[10px] tracking-[0.25em] text-neutral-500 uppercase mb-2 font-mono">[ RBOOKING HOSPITALITY ]</p>
          <h1 className="text-2xl font-serif tracking-wide text-neutral-900 dark:text-white">Creare Cont Nou</h1>
          <div className="w-8 h-[1px] bg-neutral-300 dark:bg-neutral-700 mx-auto mt-3"></div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs rounded-xl text-center font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2 font-medium font-mono">Nume Complet</label>
            <input 
              type="text" 
              placeholder="Introduceți numele complet"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-neutral-50 dark:bg-[#181818] border border-neutral-300 dark:border-neutral-800 p-3 rounded-xl text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-400 text-sm transition"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2 font-medium font-mono">Adresă Email</label>
            <input 
              type="email" 
              placeholder="nume@exemplu.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-neutral-50 dark:bg-[#181818] border border-neutral-300 dark:border-neutral-800 p-3 rounded-xl text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-400 text-sm transition"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2 font-medium font-mono">Parolă</label>
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
            <label className="block text-[11px] uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2 font-medium font-mono">Confirmă Parola</label>
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
            Finalizare Înregistrare
          </button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800/60 font-mono">
          <Link href="/login" className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition tracking-wider">
            Ai deja un cont? <span className="text-neutral-950 dark:text-white underline underline-offset-4">Autentifică-te</span>
          </Link>
        </div>
      </div>
    </main>
  );
}