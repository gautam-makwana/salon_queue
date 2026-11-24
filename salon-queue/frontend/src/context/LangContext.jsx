// src/context/LangContext.jsx
// Provides language toggle; persists choice to localStorage.

import { createContext, useContext, useState } from 'react';
import en from '../i18n/en.js';
import gu from '../i18n/gu.js';

const LangContext = createContext(null);

const STORAGE_KEY = 'salon_lang';

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || 'en'
  );

  const t = lang === 'gu' ? gu : en;

  function toggleLang() {
    const next = lang === 'en' ? 'gu' : 'en';
    localStorage.setItem(STORAGE_KEY, next);
    setLangState(next);
  }

  return (
    <LangContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}
