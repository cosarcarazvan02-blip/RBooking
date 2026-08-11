'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Te rugăm să introduci adresa de email.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5293/api/Auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Api-Key': 'RBooking_Secret_ApiKey_2026_x9k2M!'
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        setError('Eroare la autentificare.');
        return;
      }

      const data = await response.json();
      const token = data.token || data.Token;

      if (!token) {
        setError('Răspuns invalid de la server.');
        return;
      }

      // Extras rolul din datele venite de la backend (data.user)
      let role = 'User';
      if (data.user && (data.user.role || data.user.Role)) {
        role = data.user.role || data.user.Role;
      } else {
        const lowerEmail = email.toLowerCase();
        if (lowerEmail.includes('operator') || lowerEmail.includes('manager')) {
          role = 'Operator';
        } else if (lowerEmail.includes('admin')) {
          role = 'Admin';
        }
      }

      const userName = data.user
        ? `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() || email.split('@')[0]
        : email.split('@')[0];

      const userProfile = {
        id: data.user?.id || data.user?.Id || 'user-id',
        name: userName,
        email: email,
        phone: '+40 700 000 000',
        role: role,
      };

      localStorage.setItem('rbooking_token', token);
      localStorage.setItem('authToken', token);
      localStorage.setItem('rbooking_user_profile', JSON.stringify(userProfile));
      localStorage.setItem('currentUser', JSON.stringify(userProfile));
      localStorage.setItem('rbooking_logged_in', 'true');

      window.dispatchEvent(new Event('rbooking_auth_change'));
      window.dispatchEvent(new Event('auth-state-change'));
      window.dispatchEvent(new Event('storage'));

      const normalizedRole = role.toLowerCase();
      if (normalizedRole === 'manager' || normalizedRole === 'operator') {
        window.location.href = '/manager/accommodation';
      } else if (normalizedRole === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/';
      }

    } catch (err) {
      console.error(err);
      setError('A apărut o eroare la conectarea cu serverul.');
    }
  };

  return (
    <main className="min-h-screen bg-[#070707] text-gray-200 flex flex-col justify-between px-6 py-8 font-sans">
      <div className="flex justify-between items-center max-w-7xl mx-auto w-full">
        <Link href="/" className="bg-[#111] border border-neutral-800 px-4 py-2 text-white font-serif tracking-widest text-sm hover:border-neutral-700 transition">
          R <span className="font-sans font-normal text-neutral-400 tracking-normal text-xs">RBOOKING</span>
        </Link>
      </div>

      <div className="max-w-md w-full mx-auto bg-[#111111] border border-neutral-800/80 p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <p className="text-[10px] tracking-[0.25em] text-neutral-500 uppercase mb-2 font-mono">[ RBOOKING PLATFORM ]</p>
          <h1 className="text-2xl font-serif text-white tracking-wide">Autentificare Cont</h1>
          <div className="w-8 h-[1px] bg-neutral-700 mx-auto mt-3"></div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-950/40 border border-red-900/50 text-red-400 text-xs rounded text-center tracking-wider">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
            <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-2 font-medium">Parolă (Opțional)</label>
            <input 
              type="password" 
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#181818] border border-neutral-800 p-3 rounded-lg text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 text-sm transition"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-white text-black py-3 rounded-lg font-medium hover:bg-neutral-200 transition text-xs tracking-[0.15em] uppercase mt-3 shadow-lg cursor-pointer"
          >
            Intră în Cont
          </button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-neutral-800/60">
          <Link href="/register" className="text-xs text-neutral-400 hover:text-white transition tracking-wider">
            Nu ai un cont? <span className="text-white underline underline-offset-4">Înregistrează-te</span>
          </Link>
        </div>
      </div>

      <div className="text-center text-[11px] text-neutral-600 tracking-wider">
        © 2026 RBooking Hospitality Platform
      </div>
    </main>
  );
}