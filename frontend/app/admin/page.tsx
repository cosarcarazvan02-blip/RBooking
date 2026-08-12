'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { Shield, Users, Building2, Trash2, CheckCircle2, Search, Server } from 'lucide-react';
import { getActiveApiKey } from '@/lib/apiKey';

type Role = 'Client' | 'Operator' | 'Admin';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
}

interface AccommodationItem {
  id: string;
  title: string;
  location: string;
  price: number;
  type: string;
}

// Forma bruta primita de la backend - campurile pot veni in orice casing
// (camelCase din System.Text.Json sau PascalCase, in functie de configurare),
// asa ca le declaram optionale in ambele variante in loc sa folosim `any`.
interface RawUser {
  id?: string;
  Id?: string;
  userId?: string;
  UserId?: string;
  firstName?: string;
  FirstName?: string;
  first_name?: string;
  lastName?: string;
  LastName?: string;
  last_name?: string;
  email?: string;
  Email?: string;
  userName?: string;
  UserName?: string;
  role?: string | number;
  Role?: string | number;
  roleId?: string | number;
  createdAt?: string;
  CreatedAt?: string;
}

// Wrapper-e posibile in care backend-ul poate impacheta lista (array simplu,
// { data: [...] }, sau serializarea speciala $values din System.Text.Json
// pentru referinte ciclice).
interface RawUserListWrapper {
  data?: RawUser[];
  items?: RawUser[];
  users?: RawUser[];
  result?: RawUser[];
  $values?: RawUser[];
}

interface ApiErrorBody {
  message?: string;
}

function isRawUserArray(value: unknown): value is RawUser[] {
  return Array.isArray(value);
}

function extractUserList(rawData: unknown): RawUser[] {
  if (isRawUserArray(rawData)) {
    return rawData;
  }
  if (rawData && typeof rawData === 'object') {
    const wrapper = rawData as RawUserListWrapper;
    return wrapper.data ?? wrapper.items ?? wrapper.users ?? wrapper.result ?? wrapper.$values ?? [];
  }
  return [];
}

// Conversie rol din baza de date (ex: 0, 1, 2 sau string) in text
function formatRole(roleVal: string | number | undefined): Role {
  const normalized = String(roleVal ?? '').toLowerCase();
  if (roleVal === 2 || normalized === '2' || normalized === 'admin') return 'Admin';
  if (roleVal === 1 || normalized === '1' || normalized === 'operator' || normalized === 'manager') return 'Operator';
  return 'Client';
}

function formatRawUser(u: RawUser): UserItem {
  const firstName = u.firstName ?? u.FirstName ?? u.first_name ?? '';
  const lastName = u.lastName ?? u.LastName ?? u.last_name ?? '';
  const fullName = `${firstName} ${lastName}`.trim();
  const email = u.email ?? u.Email ?? u.userName ?? u.UserName ?? '-';
  const createdAtRaw = u.createdAt ?? u.CreatedAt;

  return {
    id: String(u.id ?? u.Id ?? u.userId ?? u.UserId ?? crypto.randomUUID()),
    name: fullName.length > 0 ? fullName : email,
    email,
    role: formatRole(u.role ?? u.Role ?? u.roleId),
    createdAt: createdAtRaw ? createdAtRaw.split('T')[0] : '',
  };
}

async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as ApiErrorBody;
    return data.message ?? fallback;
  } catch {
    return fallback;
  }
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<'users' | 'accommodations' | 'system'>('users');
  const [users, setUsers] = useState<UserItem[]>([]);

  const [accommodations] = useState<AccommodationItem[]>([
    { id: 'acc-1', title: 'Grand Hotel Continental', location: 'București', price: 450, type: 'Hotel' },
    { id: 'acc-2', title: 'Kronwell Alpine Retreat', location: 'Brașov', price: 320, type: 'Hotel' },
    { id: 'acc-3', title: 'Skyline Luxury Penthouse', location: 'București', price: 380, type: 'Apartment' },
  ]);

  const [userSearch, setUserSearch] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Verificăm rolul de Admin la încărcarea paginii
  useEffect(() => {
    const token =
      localStorage.getItem('rbooking_token') ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('jwt');

    const savedProfile =
      localStorage.getItem('rbooking_user_profile') ||
      localStorage.getItem('currentUser') ||
      localStorage.getItem('user');

    if (!token && !savedProfile) {
      router.push('/login');
      return;
    }

    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile) as { role?: string; Role?: string };
        const userRole = (profile.role ?? profile.Role ?? '').toString().toLowerCase();
        if (userRole !== 'admin' && userRole !== '2') {
          router.push('/');
        }
      } catch {
        // Ignorăm erorile de parsare JSON
      }
    }
  }, [router]);

  // Preluăm token-ul activ din localStorage și eliminăm ghilimelele sau prefixul Bearer existent
  const getAuthToken = useCallback((): string | null => {
    const rawToken =
      localStorage.getItem('rbooking_token') ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('jwt');

    if (!rawToken) return null;

    return rawToken
      .replace(/^"|"$/g, '')
      .replace(/^Bearer\s+/i, '')
      .trim();
  }, []);

  // FIX: header-ele se construiesc o singura data, intr-un singur loc.
  // Inainte, 'x-api-key' si 'X-Api-Key' erau setate ca doua chei distincte
  // in obiectul JS (case-sensitive la nivel de proprietate), iar fetch() le
  // combina automat cu ", " intre ele - server-ul primea un string diferit
  // de cheia configurata si respingea cererea cu 401.
  const buildAuthHeaders = useCallback((): HeadersInit => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const cleanToken = getAuthToken();
    if (cleanToken) {
      headers['Authorization'] = `Bearer ${cleanToken}`;
    }

    let apiKey: string | null = null;
    try {
      apiKey = getActiveApiKey();
    } catch {
      apiKey = localStorage.getItem('rbooking_api_key');
    }
    if (apiKey) {
      headers['X-Api-Key'] = apiKey;
    }

    return headers;
  }, [getAuthToken]);

  // Preia toți utilizatorii din API
  const fetchUsersFromApi = useCallback(async (): Promise<void> => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5293/api';

      const res = await fetch(`${apiUrl}/Users`, {
        method: 'GET',
        headers: buildAuthHeaders(),
      });

      if (res.ok) {
        const rawData: unknown = await res.json();
        const userList = extractUserList(rawData);
        setUsers(userList.map(formatRawUser));
      } else {
        console.warn(`API Error Response Status: ${res.status}`);
      }
    } catch (error) {
      console.error('Eroare de rețea la fetchUsersFromApi:', error);
    }
  }, [buildAuthHeaders]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchUsersFromApi();
    });
  }, [fetchUsersFromApi]);

  const handleChangeRole = (userId: string, newRole: Role): void => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    setSuccessMessage(
      lang === 'RO' ? `Rolul utilizatorului a fost schimbat în ${newRole}!` : `User role updated to ${newRole}!`
    );
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDeleteUser = async (userId: string): Promise<void> => {
    const confirmed = window.confirm(
      lang === 'RO' ? 'Sigur doriți să ștergeți acest utilizator?' : 'Are you sure you want to delete this user?'
    );
    if (!confirmed) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5293/api';

      const res = await fetch(`${apiUrl}/Users/${userId}`, {
        method: 'DELETE',
        headers: buildAuthHeaders(),
      });

      if (res.ok || res.status === 204) {
        await fetchUsersFromApi();
        setSuccessMessage(
          lang === 'RO' ? 'Utilizatorul a fost șters din baza de date!' : 'User deleted successfully from database!'
        );
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const message = await extractErrorMessage(
          res,
          lang === 'RO' ? 'Eroare la ștergerea din baza de date.' : 'Error deleting from database.'
        );
        alert(message);
      }
    } catch (error) {
      console.error('Eroare de rețea:', error);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBF9] dark:bg-[#0D0E11] text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
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
              <p className="text-xs font-mono uppercase text-neutral-500">
                {lang === 'RO' ? 'Total Utilizatori' : 'Total Users'}
              </p>
              <h3 className="text-3xl font-serif font-semibold mt-1">{users.length}</h3>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950/50 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#121418] border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase text-neutral-500">
                {lang === 'RO' ? 'Total Cazări' : 'Accommodations'}
              </p>
              <h3 className="text-3xl font-serif font-semibold mt-1">{accommodations.length}</h3>
            </div>
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/50 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Building2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#121418] border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase text-neutral-500">
                {lang === 'RO' ? 'Bază de Date API' : 'Database API'}
              </p>
              <h3 className="text-lg font-mono text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                Active (Port 5293)
              </h3>
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
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition">
                        <td className="py-3.5 px-4 font-sans font-medium text-sm text-neutral-900 dark:text-neutral-100">
                          {u.name}
                        </td>
                        <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">{u.email}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${
                              u.role === 'Admin'
                                ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                                : u.role === 'Operator'
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={u.role}
                            onChange={(e) => handleChangeRole(u.id, e.target.value as Role)}
                            className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-xs focus:outline-none focus:border-purple-500 cursor-pointer"
                          >
                            <option value="Client">Client / User</option>
                            <option value="Operator">Operator / Manager</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => void handleDeleteUser(u.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition cursor-pointer"
                            title="Șterge utilizator"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-neutral-500 font-mono text-xs">
                        {lang === 'RO' ? 'Nu s-a găsit niciun utilizator.' : 'No users found.'}
                      </td>
                    </tr>
                  )}
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
                <div
                  key={acc.id}
                  className="p-5 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-[#181a20] flex flex-col justify-between"
                >
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