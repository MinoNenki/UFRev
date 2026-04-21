'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Language } from '@/lib/i18n';

const tt = (
  l: Language,
  v: { en: string; pl: string; de?: string; es?: string; pt?: string; ja?: string; zh?: string; id?: string; ru?: string }
) => l === 'pl' ? v.pl : l === 'de' ? (v.de ?? v.en) : l === 'es' ? (v.es ?? v.pt ?? v.en) : l === 'pt' ? (v.pt ?? v.es ?? v.en) : l === 'ja' ? (v.ja ?? v.en) : l === 'zh' ? (v.zh ?? v.en) : l === 'id' ? (v.id ?? v.en) : l === 'ru' ? (v.ru ?? v.en) : v.en;

export default function ReferralPanel({
  currentLanguage,
  referralCode,
  rewardCredits,
}: {
  currentLanguage: Language;
  referralCode: string;
  rewardCredits: number;
}) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const referralLink = useMemo(() => {
    if (!origin) return `/auth/register?ref=${referralCode}`;
    return `${origin}/auth/register?ref=${referralCode}`;
  }, [origin, referralCode]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="premium-panel p-8">
      <div className="mb-3 inline-flex rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm font-medium text-emerald-200">
        {tt(currentLanguage, {
          en: 'Referral growth',
          pl: 'Polecenia',
          de: 'Empfehlungen',
          es: 'Referidos',
          ja: '紹介成長',
          zh: '推荐增长',
          id: 'Pertumbuhan referral',
          ru: 'Рост рефералов',
        })}
      </div>

      <h2 className="text-3xl font-black text-white">
        {tt(currentLanguage, {
          en: 'Invite users and earn AI tokens',
          pl: 'Zaproś użytkowników i zdobywaj tokeny AI',
          de: 'Lade Nutzer ein und erhalte AI-Tokens',
          es: 'Invita usuarios y gana tokens AI',
          ja: 'ユーザーを招待して AI トークンを獲得',
          zh: '邀请用户并赚取 AI 代币',
          id: 'Undang pengguna dan dapatkan token AI',
          ru: 'Приглашай пользователей и получай AI токены',
        })}
      </h2>

      <div className="mt-3 text-sm text-emerald-300">
        {tt(currentLanguage, {
          en: `Earn ${rewardCredits} AI tokens for successful referrals`,
          pl: `Zyskaj ${rewardCredits} tokenów AI za skuteczne polecenia`,
          de: `Erhalte ${rewardCredits} AI-Tokens für erfolgreiche Empfehlungen`,
          es: `Gana ${rewardCredits} tokens AI por referencias exitosas`,
          pt: `Recebe ${rewardCredits} tokens AI por referências bem-sucedidas`,
          ja: `成功した紹介ごとに ${rewardCredits} AI トークンを獲得`,
          zh: `每次成功推荐可获得 ${rewardCredits} 个 AI 代币`,
          id: `Dapatkan ${rewardCredits} token AI untuk referral yang berhasil`,
          ru: `Получи ${rewardCredits} AI токенов за успешную рекомендацию`,
        })}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200">{tt(currentLanguage, { en: 'Invite → trial → upgrade loop', pl: 'Pętla: zaproś → test → upgrade', de: 'Loop: einladen → testen → Upgrade', es: 'Bucle: invitar → probar → upgrade', pt: 'Loop: convidar → testar → upgrade', ru: 'Цикл: пригласи → протестируй → апгрейд' })}</div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200">{tt(currentLanguage, { en: 'Works well with shared results', pl: 'Działa świetnie z udostępnianiem wyników', de: 'Funktioniert stark mit geteilten Ergebnissen', es: 'Funciona muy bien con resultados compartidos', pt: 'Funciona muito bem com resultados partilhados', ru: 'Хорошо работает вместе с общими результатами' })}</div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200">{tt(currentLanguage, { en: 'Organic growth without cheapening the product', pl: 'Wzrost organiczny bez psucia wartości produktu', de: 'Organisches Wachstum ohne Wertverlust', es: 'Crecimiento orgánico sin abaratar el producto', pt: 'Crescimento orgânico sem baratear o produto', ru: 'Органический рост без удешевления продукта' })}</div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
          {tt(currentLanguage, {
            en: 'Your referral link',
            pl: 'Twój link polecający',
            de: 'Dein Empfehlungslink',
            es: 'Tu enlace de referido',
            ja: 'あなたの紹介リンク',
            zh: '你的推荐链接',
            id: 'Link referral Anda',
            ru: 'Ваша реферальная ссылка',
          })}
        </div>
        <div className="mt-2 break-all text-sm text-white">
          {referralLink}
        </div>
      </div>

      <button
        onClick={copyLink}
        className="mt-6 rounded-2xl bg-emerald-300 px-6 py-4 font-semibold text-slate-950"
      >
        {copied
          ? tt(currentLanguage, {
              en: 'Copied',
              pl: 'Skopiowano',
              de: 'Kopiert',
              es: 'Copiado',
              pt: 'Copiado',
              ru: 'Скопировано',
            })
          : tt(currentLanguage, {
              en: 'Copy referral link',
              pl: 'Kopiuj link polecający',
              de: 'Empfehlungslink kopieren',
              es: 'Copiar enlace de referido',
              pt: 'Copiar link de referência',
              ru: 'Скопировать реферальную ссылку',
            })}
      </button>
    </div>
  );
}