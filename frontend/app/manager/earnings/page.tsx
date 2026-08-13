'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { Coins, Percent, Wallet, Calendar, Building2 } from 'lucide-react';
import { getActiveApiKey } from '@/lib/apiKey';

interface AccommodationEarnings {
  accommodationId: string;
  accommodationName: string;
  totalCollected: number;
  totalCommission: number;
  totalNet: number;
  reservationsCount: number;
}

interface OperatorEarnings {
  totalCollected: number;
  totalCommission: number;
  totalNet: number;
  reservationsCount: number;
  byAccommodation: AccommodationEarnings[];
}

function getAuthToken(): string | null {
  const rawToken = localStorage.getItem('rbooking_token') || localStorage.getItem('authToken');
  if (!rawToken) return null;
  return rawToken.replace(/^"|"$/g, '').replace(/^Bearer\s+/i, '').trim();
}

function buildAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {};
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  try {
    const apiKey = getActiveApiKey();
    if (apiKey) {
      headers['X-Api-Key'] = apiKey;
    }
  } catch {
    // fara cheie - cererea oricum va pica la ApiKeyMiddleware
  }
  return headers;
}

function formatMoney(value: number): string {
  return `${value.toFixed(2)} RON`;
}

export default function ManagerEarningsPage() {
  const router = useRouter();
  const { lang } = useLanguage();

  const [earnings, setEarnings] = useState<OperatorEarnings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [accommodationFilter, setAccommodationFilter] = useState<string>('');

  // Verificăm tokenul și rolul de Operator/Admin la încărcarea paginii
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
      if (userRole !== 'manager' && userRole !== 'operator' && userRole !== 'admin') {
        router.push('/');
      }
    } catch {
      router.push('/login');
    }
  }, [router]);

  const fetchEarnings = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5293/api';
      const params = new URLSearchParams();
      if (fromDate) params.set('from', new Date(fromDate).toISOString());
      if (toDate) params.set('to', new Date(toDate).toISOString());
      if (accommodationFilter.trim()) params.set('accommodationId', accommodationFilter.trim());

      const res = await fetch(`${apiUrl}/Reservations/earnings?${params.toString()}`, {
        headers: buildAuthHeaders(),
      });

      if (!res.ok) {
        setError(
          lang === 'RO'
            ? 'Nu s-au putut încărca câștigurile.'
            : 'Could not load earnings.'
        );
        setEarnings(null);
        return;
      }

      const data: OperatorEarnings = await res.json();
      setEarnings(data);
    } catch {
      setError(
        lang === 'RO'
          ? 'Eroare de conexiune la server.'
          : 'Connection error.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [fromDate, toDate, accommodationFilter, lang]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchEarnings();
    });
  }, [fetchEarnings]);

  return (
    <main className="min-h-[calc(100vh-80px)] max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-neutral-900 dark:text-neutral-100">
      <div className="pb-6 border-b border-neutral-300 dark:border-neutral-800 mb-8">
        <p className="text-[10px] tracking-[0.25em] text-neutral-500 uppercase mb-2 font-mono">
          [ {lang === 'RO' ? 'ZONA OPERATOR' : 'OPERATOR AREA'} ]
        </p>
        <h1 className="text-3xl font-serif text-neutral-900 dark:text-neutral-50 tracking-wide">
          {lang === 'RO' ? 'Câștigurile Mele' : 'My Earnings'}
        </h1>
      </div>

      {/* Filtre */}
      <div className="flex flex-wrap gap-4 mb-8 items-end">
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5 font-mono">
            {lang === 'RO' ? 'De la' : 'From'}
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-neutral-50 dark:bg-[#181818] border border-neutral-300 dark:border-neutral-800 px-3 py-2 rounded-xl text-sm"
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5 font-mono">
            {lang === 'RO' ? 'Până la' : 'To'}
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-neutral-50 dark:bg-[#181818] border border-neutral-300 dark:border-neutral-800 px-3 py-2 rounded-xl text-sm"
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5 font-mono">
            {lang === 'RO' ? 'ID Cazare (opțional)' : 'Accommodation ID (optional)'}
          </label>
          <input
            type="text"
            value={accommodationFilter}
            onChange={(e) => setAccommodationFilter(e.target.value)}
            placeholder="00000000-0000-..."
            className="bg-neutral-50 dark:bg-[#181818] border border-neutral-300 dark:border-neutral-800 px-3 py-2 rounded-xl text-sm w-64"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs rounded-xl font-mono">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-neutral-500 font-mono">{lang === 'RO' ? 'Se încarcă...' : 'Loading...'}</p>
      ) : earnings ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-10">
            <div className="bg-white dark:bg-[#111] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
              <Coins className="w-5 h-5 text-amber-600 mb-2" />
              <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-mono mb-1">
                {lang === 'RO' ? 'Total Încasat' : 'Total Collected'}
              </p>
              <p className="text-2xl font-serif">{formatMoney(earnings.totalCollected)}</p>
            </div>
            <div className="bg-white dark:bg-[#111] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
              <Percent className="w-5 h-5 text-red-500 mb-2" />
              <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-mono mb-1">
                {lang === 'RO' ? 'Comision RBooking' : 'RBooking Commission'}
              </p>
              <p className="text-2xl font-serif">-{formatMoney(earnings.totalCommission)}</p>
            </div>
            <div className="bg-white dark:bg-[#111] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
              <Wallet className="w-5 h-5 text-emerald-600 mb-2" />
              <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-mono mb-1">
                {lang === 'RO' ? 'Total Net' : 'Total Net'}
              </p>
              <p className="text-2xl font-serif">{formatMoney(earnings.totalNet)}</p>
            </div>
            <div className="bg-white dark:bg-[#111] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
              <Calendar className="w-5 h-5 text-neutral-500 mb-2" />
              <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-mono mb-1">
                {lang === 'RO' ? 'Rezervări' : 'Reservations'}
              </p>
              <p className="text-2xl font-serif">{earnings.reservationsCount}</p>
            </div>
          </div>

          <h2 className="text-xs font-mono font-semibold tracking-widest text-neutral-500 uppercase mb-4">
            {lang === 'RO' ? 'Detaliu pe Cazare' : 'Breakdown by Accommodation'}
          </h2>

          {earnings.byAccommodation.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl">
              <Building2 className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
              <p className="text-sm text-neutral-500 font-mono">
                {lang === 'RO' ? 'Nicio rezervare în intervalul selectat.' : 'No reservations in the selected range.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-2xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 text-left text-[11px] uppercase tracking-wider text-neutral-500 font-mono">
                    <th className="px-4 py-3">{lang === 'RO' ? 'Cazare' : 'Accommodation'}</th>
                    <th className="px-4 py-3 text-right">{lang === 'RO' ? 'Rezervări' : 'Reservations'}</th>
                    <th className="px-4 py-3 text-right">{lang === 'RO' ? 'Încasat' : 'Collected'}</th>
                    <th className="px-4 py-3 text-right">{lang === 'RO' ? 'Comision' : 'Commission'}</th>
                    <th className="px-4 py-3 text-right">{lang === 'RO' ? 'Net' : 'Net'}</th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.byAccommodation.map((row) => (
                    <tr key={row.accommodationId} className="border-b border-neutral-100 dark:border-neutral-900 last:border-0">
                      <td className="px-4 py-3">{row.accommodationName}</td>
                      <td className="px-4 py-3 text-right font-mono">{row.reservationsCount}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatMoney(row.totalCollected)}</td>
                      <td className="px-4 py-3 text-right font-mono text-red-500">-{formatMoney(row.totalCommission)}</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-600">{formatMoney(row.totalNet)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </main>
  );
}
