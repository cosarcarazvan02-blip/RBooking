'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Heart, Trash2, ArrowUpRight, MapPin } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
}

interface FavoriteItem {
  id: string;
  name: string;
  location: string;
  city?: string;
  country?: string;
  pricePerNight: number;
  imageUrl: string;
  accommodationType?: string;
  averageRating?: number;
  savedAt?: string;
}

export default function AccountPage() {
  const { lang } = useLanguage();
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    role: 'User',
  });
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadFavorites = useCallback(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('rbooking_favorites');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    setFavorites([]);
  }, []);

  const handleRemoveFavorite = (id: string) => {
    const updated = favorites.filter(item => item.id !== id);
    setFavorites(updated);
    localStorage.setItem('rbooking_favorites', JSON.stringify(updated));
    window.dispatchEvent(new Event('rbooking_favorites_change'));
  };

  useEffect(() => {
    let ignore = false;
    loadFavorites();

    const handleFavoritesChange = () => {
      loadFavorites();
    };
    window.addEventListener('rbooking_favorites_change', handleFavoritesChange);

    const timer = setTimeout(() => {
      const saved = localStorage.getItem('rbooking_user_profile');
      if (saved) {
        try {
          if (!ignore) {
            const parsed = JSON.parse(saved);
            setProfile({
              name: parsed.name || parsed.Name || '',
              email: parsed.email || parsed.Email || '',
              phone: parsed.phone || parsed.Phone || '',
              role: parsed.role || parsed.Role || 'User',
            });
          }
        } catch (e) {
          console.error(e);
        }
      }
    }, 0);

    return () => {
      ignore = true;
      clearTimeout(timer);
      window.removeEventListener('rbooking_favorites_change', handleFavoritesChange);
    };
  }, [loadFavorites]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProfile = { ...profile };
    localStorage.setItem('rbooking_user_profile', JSON.stringify(updatedProfile));
    setIsEditing(false);
    setSuccessMessage(lang === 'RO' ? 'Modificările au fost salvate cu succes!' : 'Changes saved successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-neutral-900 dark:text-neutral-100">
      <div className="mb-6 flex justify-between items-center">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase tracking-widest border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{lang === 'RO' ? 'Înapoi Acasă' : 'Back to Home'}</span>
        </Link>
      </div>
      <div className="mb-8 pb-6 border-b border-neutral-300 dark:border-neutral-800">
        <p className="text-[10px] tracking-[0.25em] text-neutral-500 uppercase mb-2 font-mono">
          [ {lang === 'RO' ? 'CONFIGURARE CONT' : 'ACCOUNT SETTINGS'} ]
        </p>
        <h1 className="text-3xl font-serif">
          {lang === 'RO' ? 'Contul Meu' : 'My Account'}
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          {lang === 'RO' 
            ? 'Gestionează-ți datele personale și preferințele contului.' 
            : 'Manage your personal details and account preferences.'}
        </p>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-mono">
          {successMessage}
        </div>
      )}

      <div className="bg-white dark:bg-[#111] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-lg font-serif">
              {lang === 'RO' ? 'Informații Personale' : 'Personal Information'}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {lang === 'RO' ? 'Detaliile profilului tău înregistrat.' : 'Your registered profile details.'}
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-amber-300 rounded-xl text-xs font-mono uppercase tracking-wider transition cursor-pointer"
            >
              {lang === 'RO' ? 'Editează' : 'Edit'}
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-neutral-500 mb-1">
                {lang === 'RO' ? 'Nume Complet' : 'Full Name'}
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-neutral-500 mb-1">
                {lang === 'RO' ? 'Adresă Email' : 'Email Address'}
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-neutral-500 mb-1">
                {lang === 'RO' ? 'Număr Telefon' : 'Phone Number'}
              </label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-400"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="px-5 py-2.5 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-amber-300 rounded-xl text-xs font-mono uppercase tracking-wider transition cursor-pointer"
              >
                {lang === 'RO' ? 'Salvează' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-mono uppercase tracking-wider hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                {lang === 'RO' ? 'Anulează' : 'Cancel'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-sm font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-3 py-2 border-b border-neutral-100 dark:border-neutral-800/50">
              <span className="text-neutral-500">{lang === 'RO' ? 'Nume:' : 'Name:'}</span>
              <span className="sm:col-span-2 font-medium">{profile.name || (lang === 'RO' ? 'Nespecificat' : 'Not specified')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 py-2 border-b border-neutral-100 dark:border-neutral-800/50">
              <span className="text-neutral-500">{lang === 'RO' ? 'Email:' : 'Email:'}</span>
              <span className="sm:col-span-2 font-medium">{profile.email || (lang === 'RO' ? 'Nespecificat' : 'Not specified')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 py-2 border-b border-neutral-100 dark:border-neutral-800/50">
              <span className="text-neutral-500">{lang === 'RO' ? 'Telefon:' : 'Phone:'}</span>
              <span className="sm:col-span-2 font-medium">{profile.phone || (lang === 'RO' ? 'Nespecificat' : 'Not specified')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 py-2 border-b border-neutral-100 dark:border-neutral-800/50">
              <span className="text-neutral-500">{lang === 'RO' ? 'Rol:' : 'Role:'}</span>
              <span className="sm:col-span-2 font-medium">{profile.role || 'User'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Secțiune Cazări Favorite (Salvate) */}
      <div className="mt-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-serif">
              {lang === 'RO' ? 'Cazări Favorite (Salvate)' : 'Saved Favorite Stays'}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {lang === 'RO'
                ? 'Proprietățile salvate de tine pentru rezervări viitoare.'
                : 'Properties you saved for future bookings.'}
            </p>
          </div>
          <span className="px-2.5 py-1 text-xs font-mono bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 rounded-lg">
            {favorites.length} {lang === 'RO' ? (favorites.length === 1 ? 'favorită' : 'favorite') : (favorites.length === 1 ? 'saved stay' : 'saved stays')}
          </span>
        </div>

        {favorites.length === 0 ? (
          <div className="p-8 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl bg-white dark:bg-[#111] text-center space-y-2">
            <Heart className="w-8 h-8 text-neutral-400 mx-auto stroke-[1.5]" />
            <p className="text-xs font-mono uppercase text-neutral-500">
              {lang === 'RO' ? 'Nu ai adăugat nicio cazare la favorite.' : 'No saved stays in your favorites yet.'}
            </p>
            <Link
              href="/#accommodations"
              className="inline-block mt-2 text-xs font-mono text-amber-600 dark:text-amber-400 underline underline-offset-4 hover:opacity-80"
            >
              {lang === 'RO' ? 'Explorează cazările din colecție →' : 'Explore collection stays →'}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {favorites.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-white dark:bg-[#111] border border-neutral-200 dark:border-neutral-800 rounded-2xl flex gap-4 items-center justify-between shadow-xs hover:border-neutral-400 dark:hover:border-neutral-700 transition"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 shrink-0 relative">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <h3 className="text-sm font-serif font-medium truncate text-neutral-900 dark:text-neutral-100">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-neutral-500 font-mono flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </p>
                    <p className="text-xs font-mono font-bold text-neutral-900 dark:text-white pt-1">
                      {item.pricePerNight} LEI <span className="text-[10px] font-normal text-neutral-500">/ {lang === 'RO' ? 'noapte' : 'night'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/hotels/${item.id}`}
                    className="p-2 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 rounded-lg hover:bg-neutral-800 dark:hover:bg-amber-300 transition"
                    title={lang === 'RO' ? 'Vezi detalii' : 'View details'}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRemoveFavorite(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition cursor-pointer"
                    title={lang === 'RO' ? 'Șterge din favorite' : 'Remove from favorites'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}