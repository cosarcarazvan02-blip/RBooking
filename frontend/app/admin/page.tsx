'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { Shield, Building2, Users, CalendarCheck, ArrowUpRight } from 'lucide-react';
import { getActiveApiKey } from '@/lib/apiKey';

export default function AdminPage() {
  const { lang } = useLanguage();
  const [accommodationsCount, setAccommodationsCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5293/api';
        const apiKey = getActiveApiKey();
        const res = await fetch(`${apiUrl}/Accommodations?PageNumber=1&PageSize=1`, {
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': apiKey,
          },
        });
        if (res.ok) {
          const data = await res.json();
          const total =
            typeof data.totalCount === 'number'
              ? data.totalCount
              : Array.isArray(data)
              ? data.length
              : data.items?.length || 0;
          setAccommodationsCount(total);
          return;
        }
      } catch {
        // ignore
      }

      const saved = localStorage.getItem('rbooking_accommodations');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setAccommodationsCount(Array.isArray(parsed) ? parsed.length : 0);
          return;
        } catch {}
      }
      setAccommodationsCount(0);
    };

    fetchStats();
  }, []);

  return (
    <main className="min-h-screen bg-[#FBFBF9] dark:bg-[#0D0E11] text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 pb-6 border-b border-neutral-300 dark:border-neutral-800">
          <p className="text-[10px] tracking-[0.25em] text-neutral-500 uppercase mb-2 font-mono">
            [ {lang === 'RO' ? 'PANOUL ADMINISTRATORULUI' : 'ADMINISTRATOR CONSOLE'} ]
          </p>
          <h1 className="text-3xl font-serif tracking-wide">
            {lang === 'RO' ? 'Panou Administrare' : 'Admin Dashboard'}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            {lang === 'RO'
              ? 'Supravegherea cazărilor, utilizatorilor și a platformei RBooking.'
              : 'Overview of accommodations, users and RBooking system metrics.'}
          </p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-white dark:bg-[#111] border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono uppercase text-neutral-500">{lang === 'RO' ? 'Cazări Totale' : 'Total Stays'}</span>
              <Building2 className="w-5 h-5 text-neutral-500" />
            </div>
            <div className="text-3xl font-serif font-semibold">{accommodationsCount}</div>
            <p className="text-xs text-neutral-400 mt-2 font-mono">{lang === 'RO' ? 'Listate pe platformă' : 'Active listings'}</p>
          </div>

          <div className="bg-white dark:bg-[#111] border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono uppercase text-neutral-500">{lang === 'RO' ? 'Utilizatori Înregistrați' : 'Registered Users'}</span>
              <Users className="w-5 h-5 text-neutral-500" />
            </div>
            <div className="text-3xl font-serif font-semibold">128</div>
            <p className="text-xs text-neutral-400 mt-2 font-mono">{lang === 'RO' ? 'Conturi active' : 'Active accounts'}</p>
          </div>

          <div className="bg-white dark:bg-[#111] border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono uppercase text-neutral-500">{lang === 'RO' ? 'Rezervări Confirmate' : 'Confirmed Bookings'}</span>
              <CalendarCheck className="w-5 h-5 text-neutral-500" />
            </div>
            <div className="text-3xl font-serif font-semibold">42</div>
            <p className="text-xs text-neutral-400 mt-2 font-mono">{lang === 'RO' ? 'În luna curentă' : 'This month'}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-[#111] border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-lg font-serif">{lang === 'RO' ? 'Acțiuni Rapide' : 'Quick Actions'}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/manager/accommodation"
              className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-900 transition group"
            >
              <div>
                <p className="text-sm font-medium">{lang === 'RO' ? 'Gestionare Cazări' : 'Manage Accommodations'}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{lang === 'RO' ? 'Adaugă, editează sau șterge locații' : 'Add, edit or remove listings'}</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>

            <Link
              href="/hotels"
              className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-900 transition group"
            >
              <div>
                <p className="text-sm font-medium">{lang === 'RO' ? 'Catalog Public' : 'Public Catalog'}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{lang === 'RO' ? 'Previzualizează oferta disponibilă' : 'Preview public hotel catalog'}</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
