'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
}

export default function AccountPage() {
  const { lang } = useLanguage();
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    role: 'User',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let ignore = false;
    const timer = setTimeout(() => {
      const saved = localStorage.getItem('rbooking_user_profile');
      if (saved) {
        try {
          if (!ignore) setProfile(JSON.parse(saved));
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('rbooking_user_profile', JSON.stringify(profile));
    setIsEditing(false);
    setSuccessMessage(lang === 'RO' ? 'Modificările au fost salvate cu succes!' : 'Changes saved successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-neutral-900 dark:text-neutral-100">
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
          </div>
        )}
      </div>
    </div>
  );
}