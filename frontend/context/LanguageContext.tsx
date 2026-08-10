'use client';

import React, { createContext, useContext, useSyncExternalStore } from 'react';

type Lang = 'RO' | 'EN';

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('lang-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('lang-change', callback);
  };
}

function getSnapshot(): Lang {
  if (typeof window === 'undefined') return 'RO';
  const saved = localStorage.getItem('app_lang');
  return saved === 'RO' || saved === 'EN' ? saved : 'RO';
}

function getServerSnapshot(): Lang {
  return 'RO';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLang = (newLang: Lang) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_lang', newLang);
      window.dispatchEvent(new Event('lang-change'));
    }
  };

  const toggleLang = () => {
    const nextLang = lang === 'RO' ? 'EN' : 'RO';
    setLang(nextLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}