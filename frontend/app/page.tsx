'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';

export default function Home() {
  // Starea care reține rolul curent (începe ca guest)
  const [role, setRole] = useState<'guest' | 'user' | 'manager' | 'admin'>('guest');

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Navbar-ul va prelua rolul selectat */}
      <Navbar role={role} />

      <div className="p-8 max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Panou de Testare Roluri</h1>
        <p className="text-gray-600 mb-6">
          Alege un rol de mai jos pentru a testa instant cum se schimbă taburile din Navbar, fără să fie nevoie să fii logat prin backend:
        </p>

        {/* Butoane de test pentru fiecare rol */}
        <div className="flex flex-wrap justify-center gap-3 bg-white p-4 rounded-xl shadow-sm border">
          <button 
            onClick={() => setRole('guest')}
            className={`px-4 py-2 rounded-lg font-medium transition ${role === 'guest' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Guest
          </button>
          <button 
            onClick={() => setRole('user')}
            className={`px-4 py-2 rounded-lg font-medium transition ${role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            User Simplu
          </button>
          <button 
            onClick={() => setRole('manager')}
            className={`px-4 py-2 rounded-lg font-medium transition ${role === 'manager' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Manager Hotel
          </button>
          <button 
            onClick={() => setRole('admin')}
            className={`px-4 py-2 rounded-lg font-medium transition ${role === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Admin
          </button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-200">
          Rol activ curent: <span className="font-bold uppercase">{role}</span>
        </div>
      </div>
    </main>
  );
}
