'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, Trash2, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { getActiveApiKey } from '@/lib/apiKey';

interface Reservation {
  id: string;
  accommodationId?: string;
  hotelId?: string;
  hotelName: string;
  location: string;
  dates: string;
  status: 'Confirmed' | 'Pending' | 'Completed';
  imageUrl: string;
  type: 'current' | 'past';
  totalPrice?: number;
  guests?: number;
}

const STATUS_LABELS: Record<number, Reservation['status']> = {
  0: 'Pending',
  1: 'Confirmed',
  3: 'Completed',
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80';

interface BackendReservationDto {
  id: string;
  accommodationId: string;
  accommodationName: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  totalPrice: number;
  status: number;
}

interface AccommodationLookup {
  location: string;
  imageUrl: string;
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [availableAccommodations, setAvailableAccommodations] = useState<Array<{ id: string; name: string }>>([]);
  const { lang } = useLanguage();

  // 1. Fetch live accommodations from backend (used to resolve links + display info)
  useEffect(() => {
    let ignore = false;
    const fetchAccommodations = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5293/api';
        const apiKey = getActiveApiKey();
        const res = await fetch(`${apiUrl}/Accommodations?PageNumber=1&PageSize=50`, {
          headers: { 'X-Api-Key': apiKey },
        });
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : data.items || data.Items || [];
          if (!ignore && items.length > 0) {
            setAvailableAccommodations(items.map((acc: { id: string; name: string }) => ({ id: acc.id, name: acc.name })));
          }
          return items as Array<{ id: string; name: string; city?: string; location?: string; imageUrl?: string }>;
        }
      } catch (e) {
        console.error(e);
      }
      return [];
    };

    fetchAccommodations().then((accommodations) => {
      if (ignore) return;

      // 2. Fetch the CURRENT logged-in user's own reservations from the backend - never from
      // a shared localStorage key, which is how a previous account's bookings used to leak
      // into whichever account is currently logged in.
      const fetchMyReservations = async () => {
        const profile = localStorage.getItem('rbooking_user_profile') || localStorage.getItem('currentUser');
        const token = localStorage.getItem('rbooking_token') || localStorage.getItem('authToken');
        if (!profile) {
          setReservations([]);
          return;
        }

        let userId = '';
        try {
          const parsed = JSON.parse(profile);
          userId = parsed.id || parsed.Id || '';
        } catch (e) {
          console.error(e);
        }
        if (!userId) {
          setReservations([]);
          return;
        }

        const accommodationsById = new Map<string, AccommodationLookup>(
          accommodations.map((acc) => [
            acc.id,
            { location: acc.location || acc.city || '', imageUrl: acc.imageUrl || FALLBACK_IMAGE },
          ])
        );

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5293/api';
          const apiKey = getActiveApiKey();
          const res = await fetch(`${apiUrl}/Reservations/user/${userId}?PageNumber=1&PageSize=100`, {
            headers: {
              'X-Api-Key': apiKey,
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          if (!res.ok) {
            if (!ignore) setReservations([]);
            return;
          }
          const data = await res.json();
          const items: BackendReservationDto[] = data.items || data.Items || [];

          const mapped: Reservation[] = items
            .filter((r) => r.status !== 2) // excludem rezervările anulate
            .map((r) => {
              const lookup = accommodationsById.get(r.accommodationId);
              const checkIn = new Date(r.checkInDate);
              const checkOut = new Date(r.checkOutDate);
              return {
                id: r.id,
                accommodationId: r.accommodationId,
                hotelName: r.accommodationName,
                location: lookup?.location || r.accommodationName,
                dates: `${checkIn.toLocaleDateString(lang === 'RO' ? 'ro-RO' : 'en-US')} - ${checkOut.toLocaleDateString(lang === 'RO' ? 'ro-RO' : 'en-US')}`,
                status: STATUS_LABELS[r.status] || 'Pending',
                imageUrl: lookup?.imageUrl || FALLBACK_IMAGE,
                type: r.status === 3 || checkOut < new Date() ? 'past' : 'current',
                totalPrice: r.totalPrice,
                guests: r.numberOfGuests,
              };
            });

          if (!ignore) setReservations(mapped);
        } catch (e) {
          console.error(e);
          if (!ignore) setReservations([]);
        }
      };

      fetchMyReservations();
    });

    return () => {
      ignore = true;
    };
  }, [lang]);

  const handleRemoveReservation = async (id: string) => {
    const token = localStorage.getItem('rbooking_token') || localStorage.getItem('authToken');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5293/api';
    const apiKey = getActiveApiKey();
    try {
      const res = await fetch(`${apiUrl}/Reservations/${id}`, {
        method: 'DELETE',
        headers: {
          'X-Api-Key': apiKey,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok || res.status === 404) {
        setReservations((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getAccommodationUrl = (item: Reservation): string => {
    // 1. Verificare ID direct de cazare dacă este specificat
    const directId = item.accommodationId || item.hotelId;
    if (directId && directId.trim() && directId.length > 5) {
      return `/hotels/${directId.trim()}`;
    }

    // 2. Căutare după nume în lista de cazări din backend
    if (item.hotelName && availableAccommodations.length > 0) {
      const match = availableAccommodations.find((acc) => {
        const accName = acc.name.toLowerCase();
        const resName = item.hotelName.toLowerCase();
        return accName.includes(resName) || resName.includes(accName);
      });
      if (match && match.id) {
        return `/hotels/${match.id}`;
      }
    }

    // 3. Dacă ID-ul rezervării este GUID, îl putem folosi direct ca ID de pagină
    if (item.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id)) {
      return `/hotels/${item.id}`;
    }

    // 4. Fallback la prima cazare disponibilă sau direct la ID-ul itemului
    if (availableAccommodations.length > 0 && availableAccommodations[0]?.id) {
      return `/hotels/${availableAccommodations[0].id}`;
    }

    return `/hotels/${item.id || 'grand-plaza'}`;
  };

  const currentBookings = reservations.filter((r) => r.type === 'current');
  const pastBookings = reservations.filter((r) => r.type === 'past');

  return (
    <div className="min-h-screen bg-[#FBFBF9] dark:bg-[#0D0E11] text-neutral-900 dark:text-neutral-100 transition-colors duration-300 font-sans flex flex-col">
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 space-y-10">
        <div className="pb-6 border-b border-neutral-300 dark:border-neutral-800">
          <p className="text-[10px] tracking-[0.25em] text-neutral-500 uppercase mb-2 font-mono">
            [ {lang === 'RO' ? 'ISTORIC CONT & REZERVĂRI' : 'ACCOUNT HISTORY & BOOKINGS'} ]
          </p>
          <h1 className="text-3xl font-serif text-neutral-900 dark:text-neutral-50 tracking-wide">
            {lang === 'RO' ? 'Rezervările Mele' : 'My Reservations'}
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
            {lang === 'RO'
              ? 'Vizualizează sejururile active și apasă pe orice rezervare pentru a deschide direct pagina de detalii a cazării.'
              : 'View your active stays and click on any reservation to directly open its accommodation details page.'}
          </p>
        </div>

        {/* Sejururi Active */}
        <div className="space-y-4">
          <h2 className="text-xs font-mono font-semibold tracking-widest text-neutral-500 dark:text-neutral-400 uppercase">
            {lang === 'RO' ? 'Sejururi Active (Prezent)' : 'Active Stays (Current)'}
          </h2>
          {currentBookings.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl bg-white dark:bg-[#111] space-y-3">
              <Calendar className="w-10 h-10 mx-auto text-neutral-400 stroke-[1.5]" />
              <p className="text-neutral-600 dark:text-neutral-400 font-mono text-xs uppercase">
                {lang === 'RO' ? 'Nu ai niciun sejur activ în prezent.' : 'You have no active stays at the moment.'}
              </p>
              <Link
                href="/#accommodations"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-600 dark:text-amber-400 underline underline-offset-4 hover:opacity-80"
              >
                <span>{lang === 'RO' ? 'Descoperă cazări disponibile' : 'Discover available stays'}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {currentBookings.map((item) => {
                const targetUrl = getAccommodationUrl(item);
                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white dark:bg-[#111] border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl gap-4 shadow-sm hover:border-neutral-400 dark:hover:border-neutral-700 transition"
                  >
                    <Link
                      href={targetUrl}
                      className="flex items-center gap-4 group min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="relative w-20 h-20 bg-neutral-100 dark:bg-neutral-900 shrink-0 overflow-hidden rounded-xl">
                        <Image
                          src={item.imageUrl}
                          alt={item.hotelName}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-600 dark:text-amber-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{item.status}</span>
                        </div>
                        <h3 className="text-lg font-serif font-medium text-neutral-900 dark:text-neutral-50 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                          {item.hotelName}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-mono truncate">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                          <span className="truncate">{item.location}</span>
                        </div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 font-mono pt-0.5">
                          📅 {item.dates}
                        </p>
                      </div>
                    </Link>

                    <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100 dark:border-neutral-800">
                      <Link
                        href={targetUrl}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 text-xs font-mono uppercase tracking-wider rounded-xl hover:bg-neutral-800 dark:hover:bg-amber-300 transition shadow-xs"
                        title={lang === 'RO' ? 'Deschide cazarea' : 'Open accommodation'}
                      >
                        <span>{lang === 'RO' ? 'Vezi Cazarea' : 'View Stay'}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleRemoveReservation(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition cursor-pointer"
                        title={lang === 'RO' ? 'Anulează rezervarea' : 'Cancel reservation'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rezervări Anterioare */}
        <div className="space-y-4 pt-4">
          <h2 className="text-xs font-mono font-semibold tracking-widest text-neutral-500 dark:text-neutral-400 uppercase">
            {lang === 'RO' ? 'Rezervări Anterioare (Istoric)' : 'Past Bookings (History)'}
          </h2>
          {pastBookings.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl bg-white dark:bg-[#111]">
              <p className="text-neutral-600 dark:text-neutral-400 font-mono text-xs uppercase">
                {lang === 'RO' ? 'Nu ai rezervări anterioare în istoric.' : 'No past bookings found.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 opacity-95">
              {pastBookings.map((item) => {
                const targetUrl = getAccommodationUrl(item);
                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white dark:bg-[#111] border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl gap-4 shadow-sm hover:border-neutral-400 dark:hover:border-neutral-700 transition"
                  >
                    <Link
                      href={targetUrl}
                      className="flex items-center gap-4 group min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="relative w-20 h-20 bg-neutral-100 dark:bg-neutral-900 shrink-0 overflow-hidden rounded-xl">
                        <Image
                          src={item.imageUrl}
                          alt={item.hotelName}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <h3 className="text-lg font-serif font-medium text-neutral-900 dark:text-neutral-50 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                          {item.hotelName}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-mono truncate">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                          <span className="truncate">{item.location}</span>
                        </div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 font-mono pt-0.5">
                          📅 {item.dates}
                        </p>
                      </div>
                    </Link>

                    <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end shrink-0">
                      <span className="px-3 py-1 rounded-lg text-xs font-mono font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                        {lang === 'RO' ? 'Finalizat' : 'Completed'}
                      </span>
                      <Link
                        href={targetUrl}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-mono uppercase tracking-wider rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                      >
                        <span>{lang === 'RO' ? 'Rezervă din nou' : 'Book again'}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}