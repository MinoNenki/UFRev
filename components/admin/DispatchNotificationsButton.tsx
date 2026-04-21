'use client';

import { useState } from 'react';
import type { Language } from '@/lib/i18n';

const tt = (l: Language, v: { en: string; pl: string; es?: string; ru?: string }) =>
  l === 'pl' ? v.pl : l === 'es' ? (v.es ?? v.en) : l === 'ru' ? (v.ru ?? v.en) : v.en;

type DeliveryRouting = {
  channel: string;
  label?: string;
  enabled: boolean;
  ready: boolean;
  target?: string | null;
  reason?: string | null;
};

type DispatchResult = {
  success?: boolean;
  processed?: number;
  provider?: string;
  routing?: DeliveryRouting[];
  error?: string;
};

export default function DispatchNotificationsButton({ language }: { language: Language }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DispatchResult | null>(null);

  async function handleDispatch() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/notifications/dispatch', { method: 'POST' });
      const data = (await response.json()) as DispatchResult;

      if (!response.ok) {
        setResult(null);
        setError(data.error || tt(language, { en: 'Dispatch failed.', pl: 'Wysyłka nie powiodła się.', es: 'El envío falló.', ru: 'Отправка не удалась.' }));
        return;
      }

      setResult(data);
    } catch {
      setResult(null);
      setError(tt(language, { en: 'Connection error.', pl: 'Błąd połączenia.', es: 'Error de conexión.', ru: 'Ошибка соединения.' }));
    } finally {
      setLoading(false);
    }
  }

  const activeRouting = result?.routing || [];

  return (
    <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[340px] sm:items-end">
      <button
        type="button"
        onClick={handleDispatch}
        disabled={loading}
        className="rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading
          ? tt(language, { en: 'Dispatching...', pl: 'Wysyłam...', es: 'Enviando...', ru: 'Отправляю...' })
          : tt(language, { en: 'Dispatch queued notifications', pl: 'Wyślij powiadomienia z kolejki', es: 'Enviar notificaciones en cola', ru: 'Отправить уведомления из очереди' })}
      </button>

      {error ? (
        <div className="w-full rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100 sm:max-w-[460px]">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="w-full rounded-[24px] border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-200 shadow-[0_18px_60px_rgba(2,6,23,0.28)] sm:max-w-[460px]">
          <div className="text-[11px] uppercase tracking-[0.2em] text-cyan-200">
            {tt(language, { en: 'Dispatch result', pl: 'Wynik wysyłki', es: 'Resultado del envío', ru: 'Результат отправки' })}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3">
              <div className="text-xs text-slate-400">{tt(language, { en: 'Processed', pl: 'Przetworzone', es: 'Procesadas', ru: 'Обработано' })}</div>
              <div className="mt-1 text-xl font-black text-white">{result.processed ?? 0}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3">
              <div className="text-xs text-slate-400">{tt(language, { en: 'Provider', pl: 'Provider', es: 'Proveedor', ru: 'Провайдер' })}</div>
              <div className="mt-1 text-xl font-black uppercase text-white">{result.provider || 'none'}</div>
            </div>
          </div>

          {activeRouting.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {activeRouting.map((item) => (
                <span
                  key={`${item.channel}-${item.target || 'default'}`}
                  className={`rounded-full border px-3 py-1 text-xs ${item.enabled ? (item.ready ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100' : 'border-amber-300/30 bg-amber-300/10 text-amber-100') : 'border-white/10 bg-white/5 text-slate-400'}`}
                >
                  {(item.label || item.channel).replace('_', ' ')}
                  {item.enabled ? (item.ready ? ` • ${tt(language, { en: 'ready', pl: 'gotowe', es: 'listo', ru: 'готово' })}` : ` • ${item.reason || tt(language, { en: 'setup required', pl: 'wymaga konfiguracji', es: 'requiere configuración', ru: 'нужна настройка' })}`) : ` • ${tt(language, { en: 'disabled', pl: 'wyłączone', es: 'desactivado', ru: 'выключено' })}`}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}