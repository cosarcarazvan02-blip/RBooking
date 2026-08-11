'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Trash2, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/context/LanguageContext';

interface Reservation {
  id: string;
  hotelName: string;
  location: string;
  dates: string;
  status: 'Confirmed' | 'Pending' | 'Completed';
  imageUrl: string;
  type: 'current' | 'past';
}

const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: 'res-1',
    hotelName: 'Grand Hotel Continental',
    location: 'Calea Victoriei 56, București',
    dates: '12 Sep 2026 - 15 Sep 2026',
    status: 'Confirmed',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
    type: 'current',
  },
  {
    id: 'res-2',
    hotelName: 'Kronwell Alpine Retreat',
    location: 'Bulevardul Gării 7A, Brașov',
    dates: '20 Oct 2026 - 23 Oct 2026',
    status: 'Pending',
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
    type: 'current',
  },
  {
    id: 'res-3',
    hotelName: 'Grand Hotel Bucharest',
    location: 'Bucharest, Romania',
    dates: '10 May 2026 - 15 May 2026',
    status: 'Completed',
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
    type: 'past',
  }
];

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  const { lang, toggleLang } = useLanguage();

  useEffect(() => {
    let ignore = false;
    const timer = setTimeout(() => {
      const savedReservations = localStorage.getItem('rbooking_user_reservations');
      if (savedReservations) {
        try {
          if (!ignore) setReservations(JSON.parse(savedReservations));
        } catch (e) {
          console.error(e);
        }
      }
    }, 0);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, []);


  const handleRemoveReservation = (id: string) => {
    const updated = reservations.filter((item) => item.id !== id);
    setReservations(updated);
    localStorage.setItem('rbooking_user_reservations', JSON.stringify(updated));
  };

  const currentBookings = reservations.filter((r) => r.type === 'current');
  const pastBookings = reservations.filter((r) => r.type === 'past');

  return (
    <div className="min-h-screen bg-[#FBFBF9] dark:bg-[#0D0E11] text-neutral-900 dark:text-neutral-100 transition-colors duration-300 font-sans">
      <Navbar />

      <div className="w-full max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10 pb-6 border-b border-neutral-300 dark:border-neutral-800">
          <p className="text-[10px] tracking-[0.25em] text-neutral-500 uppercase mb-2 font-mono">
            [ {lang === 'RO' ? 'ISTORIC CONT' : 'ACCOUNT HISTORY'} ]
          </p>
          <h1 className="text-3xl font-serif text-neutral-900 dark:text-neutral-50 tracking-wide">
            {lang === 'RO' ? 'Rezervările Mele' : 'My Reservations'}
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
            {lang === 'RO' 
              ? 'Vizualizează sejururile active din prezent și istoricul rezervărilor anterioare.' 
              : 'View your active stays and past booking history.'}
          </p>
        </div>

        {/* Sejururi Active */}
        <div className="mb-10">
          <h2 className="text-xs font-mono font-semibold tracking-widest text-neutral-500 dark:text-neutral-400 uppercase mb-4">
            {lang === 'RO' ? 'Sejururi Active (Prezent)' : 'Active Stays (Current)'}
          </h2>
          {currentBookings.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-xl bg-white dark:bg-[#111]">
              <Calendar className="w-10 h-10 mx-auto text-neutral-400 mb-3 stroke-[1.5]" />
              <p className="text-neutral-600 dark:text-neutral-400 font-mono text-xs uppercase">
                {lang === 'RO' ? 'Nu ai niciun sejur activ în prezent.' : 'You have no active stays at the moment.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {currentBookings.map((item) => (
                <div 
                  key={item.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white dark:bg-[#111] border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl gap-4 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 bg-neutral-100 shrink-0 overflow-hidden rounded-xl">
                      <img src={item.imageUrl} alt={item.hotelName} className="object-cover w-full h-full" />
                    </div>
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-600 dark:text-amber-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{item.status}</span>
                      </div>
                      <h3 className="text-lg font-serif font-medium text-neutral-900 dark:text-neutral-50">
                        {item.hotelName}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-mono">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{item.location}</span>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 font-mono pt-1">
                        📅 {item.dates}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveReservation(item.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40 text-xs font-mono uppercase tracking-wider transition-all cursor-pointer w-full sm:w-auto justify-center rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{lang === 'RO' ? 'Anulează' : 'Cancel'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rezervări Anterioare */}
        <div>
          <h2 className="text-xs font-mono font-semibold tracking-widest text-neutral-500 dark:text-neutral-400 uppercase mb-4">
            {lang === 'RO' ? 'Rezervări Anterioare (Istoric)' : 'Past Bookings (History)'}
          </h2>
          {pastBookings.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-xl bg-white dark:bg-[#111]">
              <p className="text-neutral-600 dark:text-neutral-400 font-mono text-xs uppercase">
                {lang === 'RO' ? 'Nu ai rezervări anterioare în istoric.' : 'No past bookings found.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 opacity-90">
              {pastBookings.map((item) => (
                <div 
                  key={item.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white dark:bg-[#111] border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl gap-4 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 bg-neutral-100 shrink-0 overflow-hidden rounded-xl">
                      <img src={item.imageUrl} alt={item.hotelName} className="object-cover w-full h-full" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-serif font-medium text-neutral-900 dark:text-neutral-50">
                        {item.hotelName}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-mono">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{item.location}</span>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 font-mono pt-1">
                        📅 {item.dates}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                      {lang === 'RO' ? 'Finalizat' : 'Completed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}