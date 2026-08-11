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
    localStorage.setItem('currentUser', JSON.stringify(newUserProfile));

    router.push('/login');
  };

  return (
    <main className="min-h-screen bg-[#070707] text-gray-200 flex flex-col justify-between px-6 py-8 font-sans selection:bg-neutral-800">
      <div className="flex justify-between items-center max-w-7xl mx-auto w-full">
        <Link href="/" className="bg-[#111] border border-neutral-800 px-4 py-2 text-white font-serif tracking-widest text-sm hover:border-neutral-700 transition">
          R <span className="font-sans font-normal text-neutral-400 tracking-normal text-xs">RBOOKING</span>
        </Link>
      </div>

      <div className="max-w-md w-full mx-auto bg-[#111111] border border-neutral-800/80 p-8 rounded-2xl shadow-2xl backdrop-blur-md">
        <div className="text-center mb-8">
          <p className="text-[10px] tracking-[0.25em] text-neutral-500 uppercase mb-2 font-mono">[ RBOOKING HOSPITALITY ]</p>
          <h1 className="text-2xl font-serif text-white tracking-wide">Creare Cont Nou</h1>
          <div className="w-8 h-[1px] bg-neutral-700 mx-auto mt-3"></div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-950/40 border border-red-900/50 text-red-400 text-xs rounded text-center tracking-wider">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-2 font-medium">Nume Complet</label>
            <input 
              type="text" 
              placeholder="Introduceți numele complet"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-[#181818] border border-neutral-800 p-3 rounded-lg text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 text-sm transition"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-2 font-medium">Adresă Email</label>
            <input 
              type="email" 
              placeholder="nume@exemplu.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#181818] border border-neutral-800 p-3 rounded-lg text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 text-sm transition"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-2 font-medium">Parolă</label>
            <input 
              type="password" 
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#181818] border border-neutral-800 p-3 rounded-lg text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 text-sm transition"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-2 font-medium">Confirmă Parola</label>
            <input 
              type="password" 
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-[#181818] border border-neutral-800 p-3 rounded-lg text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 text-sm transition"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-white text-black py-3 rounded-lg font-medium hover:bg-neutral-200 transition text-xs tracking-[0.15em] uppercase mt-3 shadow-lg cursor-pointer"
          >
            Finalizare Înregistrare
          </button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-neutral-800/60">
          <Link href="/login" className="text-xs text-neutral-400 hover:text-white transition tracking-wider">
            Ai deja un cont? <span className="text-white underline underline-offset-4">Autentifică-te</span>
          </Link>
        </div>
      </div>

      <div className="text-center text-[11px] text-neutral-600 tracking-wider">
        © 2026 RBooking Hospitality Platform. Toate drepturile rezervate.
      </div>
    </main>
  );
}