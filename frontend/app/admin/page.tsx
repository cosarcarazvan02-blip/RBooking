'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/context/LanguageContext';
import { Shield, Users, Building2, Calendar, Trash2, Edit, CheckCircle2, UserCheck, Search, Plus, Server } from 'lucide-react';
import { getActiveApiKey } from '@/lib/apiKey';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'Client' | 'Operator' | 'Admin' | string;
  createdAt?: string;
}

interface AccommodationItem {
  id: string;
  title: string;
  location: string;
  price: number;
  type: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<'users' | 'accommodations' | 'system'>('users');
  const [users, setUsers] = useState<UserItem[]>([
    { id: 'usr-1', name: 'System Admin', email: 'admin@booking.com', role: 'Admin', createdAt: '2026-01-10' },
    { id: 'usr-2', name: 'Alex Operator', email: 'operator@hotel.com', role: 'Operator', createdAt: '2026-02-15' },
    { id: 'usr-3', name: 'Elena Popescu', email: 'client@booking.com', role: 'Client', createdAt: '2026-03-01' },
    { id: 'usr-4', name: 'Ion Ionescu', email: 'ion.ionescu@example.com', role: 'Client', createdAt: '2026-04-12' },
  ]);

  const [accommodations, setAccommodations] = useState<AccommodationItem[]>([
    { id: 'acc-1', title: 'Grand Hotel Continental', location: 'București', price: 450, type: 'Hotel' },
    { id: 'acc-2', title: 'Kronwell Alpine Retreat', location: 'Brașov', price: 320, type: 'Hotel' },
    { id: 'acc-3', title: 'Skyline Luxury Penthouse', location: 'București', price: 380, type: 'Apartment' },
  ]);

  const [userSearch, setUserSearch] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Verificăm rolul de Admin la încărcarea paginii
  useEffect(() => {
    const token = localStorage.getItem('rbooking_token') || localStorage.getItem('authToken');
    const savedProfile = localStorage.getItem('rbooking_user_profile') || localStorage.getItem('currentUser');

    if (!token || !savedProfile) {
      router.push('/login');
      return;
    }

    try {
      const profile = JSON.parse(savedProfile);
      const userRole = (profile.role || profile.Role || '').toLowerCase();
      if (userRole !== 'admin') {
        router.push('/');
      }
    } catch (e) {
      router.push('/login');
    }
  }, [router]);

  // Încărcăm datele salvate din localStorage dacă există
  useEffect(() => {
    const savedUsers = localStorage.getItem('rbooking_admin_users');
    if (savedUsers) {
      try {
        setUsers(JSON.parse(savedUsers));
      } catch (e) {}
    }
  }, []);

  const saveUsers = (updated: UserItem[]) => {
    setUsers(updated);
    localStorage.setItem('rbooking_admin_users', JSON.stringify(updated));
  };

  const handleChangeRole = (userId: string, newRole: string) => {
    const updated = users.map(u => u.id === userId ? { ...u, role: newRole } : u);
    saveUsers(updated);
    setSuccessMessage(lang === 'RO' ? `Rolul utilizatorului a fost schimbat în ${newRole}!` : `User role updated to ${newRole}!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDeleteUser = (userId: string) => {
    const updated = users.filter(u => u.id !== userId);
    saveUsers(updated);
    setSuccessMessage(lang === 'RO' ? 'Utilizatorul a fost șters!' : 'User deleted successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBF9] dark:bg-[#0D0E11] text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Admin Header */}
        <div className="mb-8 pb-6 border-b border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-mono uppercase tracking-[0.25em] text-purple-600 dark:text-purple-400 font-semibold">
                [ PANOU ADMINISTRATOR SYSTEM ]
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium">
              {lang === 'RO' ? 'Administrare Platformă RBooking' : 'Platform System Admin'}
            </h1>
            <p className="text-xs text-neutral-500 font-mono mt-1">
              {lang === 'RO' 
                ? 'Gestionare globală utilizatori, cazări, roluri și setări de securitate.' 
                : 'Global management for users, accommodations, roles and security.'}
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>System Status: Online</span>
            </span>
          </div>
        </div>

        {/* Global Success Notification */}
        {successMessage && (
          <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-[#121418] border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase text-neutral-500">{lang === 'RO' ? 'Total Utilizatori' : 'Total Users'}</p>
              <h3 className="text-3xl font-serif font-semibold mt-1">{users.length}</h3>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950/50 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#121418] border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase text-neutral-500">{lang === 'RO' ? 'Total Cazări' : 'Accommodations'}</p>
              <h3 className="text-3xl font-serif font-semibold mt-1">{accommodations.length}</h3>
            </div>
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/50 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Building2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#121418] border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase text-neutral-500">{lang === 'RO' ? 'Bază de Date API' : 'Database API'}</p>
              <h3 className="text-lg font-mono text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Active (Port 5293)</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/50 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Server className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-3 border-b border-neutral-200 dark:border-neutral-800 mb-6 pb-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold rounded-lg transition ${
              activeTab === 'users'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            {lang === 'RO' ? 'Utilizatori & Roluri' : 'Users & Roles'}
          </button>
          <button
            onClick={() => setActiveTab('accommodations')}
            className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold rounded-lg transition ${
              activeTab === 'accommodations'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            {lang === 'RO' ? 'Cazări Înregistrate' : 'Accommodations Catalog'}
          </button>
        </div>

        {/* Tab 1: Management Utilizatori & Roluri */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-[#121418] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h2 className="font-serif text-xl font-medium">
                {lang === 'RO' ? 'Gestionare Conturi Utilizatori' : 'User Accounts Directory'}
              </h2>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder={lang === 'RO' ? 'Caută nume, email sau rol...' : 'Search name, email or role...'}
                  className="w-full pl-9 pr-4 py-2 bg-neutral-50 dark:bg-[#181a20] border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-mono focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Nume</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Rol Actual</th>
                    <th className="py-3 px-4">Modificare Rol</th>
                    <th className="py-3 px-4 text-right">Acțiuni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 text-xs font-mono">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition">
                      <td className="py-3.5 px-4 font-sans font-medium text-sm text-neutral-900 dark:text-neutral-100">
                        {u.name}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${
                          u.role === 'Admin'
                            ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                            : u.role === 'Operator' || u.role === 'Manager'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u.id, e.target.value)}
                          className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-xs focus:outline-none focus:border-purple-500 cursor-pointer"
                        >
                          <option value="Client">Client / User</option>
                          <option value="Operator">Operator / Manager</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition cursor-pointer"
                          title="Șterge utilizator"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Management Cazări */}
        {activeTab === 'accommodations' && (
          <div className="bg-white dark:bg-[#121418] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs">
            <h2 className="font-serif text-xl font-medium mb-6">
              {lang === 'RO' ? 'Toate Cazările din Sistem' : 'All Accommodations in System'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accommodations.map((acc) => (
                <div key={acc.id} className="p-5 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-[#181a20] flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-serif font-semibold text-lg">{acc.title}</h3>
                      <span className="text-[10px] font-mono uppercase bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded">
                        {acc.type}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 font-mono mb-2">📍 {acc.location}</p>
                    <p className="text-sm font-semibold font-mono text-amber-600 dark:text-amber-400">
                      €{acc.price} <span className="text-xs font-normal text-neutral-400">/ noapte</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
