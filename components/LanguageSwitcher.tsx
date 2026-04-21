'use client';

import { VISIBLE_LANGUAGE_OPTIONS, type Language } from '@/lib/i18n';

export default function LanguageSwitcher({ currentLanguage }: { currentLanguage: Language }) {
  function setLanguage(language: Language) {
    document.cookie = `lang=${language}; path=/; max-age=31536000; samesite=lax`;
    window.location.reload();
  }

  return (
    <div className="inline-flex flex-wrap rounded-2xl border border-white/10 bg-white/5 p-1 text-sm">
      {VISIBLE_LANGUAGE_OPTIONS.map((language) => {
        const active = currentLanguage === language.value;
        return (
          <button
            key={language.value}
            type="button"
            onClick={() => setLanguage(language.value)}
            className={`rounded-xl px-3 py-2 font-medium transition ${active ? 'bg-cyan-300 text-slate-950' : 'text-slate-300 hover:bg-white/5'}`}
          >
            {language.label}
          </button>
        );
      })}
    </div>
  );
}
