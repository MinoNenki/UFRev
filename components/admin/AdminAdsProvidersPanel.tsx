'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Language } from '@/lib/i18n';
import GoogleAdSenseSlot from '@/components/ads/GoogleAdSenseSlot';

type ProviderSync = {
  state?: 'connected' | 'configured' | 'incomplete' | 'error';
  ok?: boolean;
  checkedAt?: string;
  message?: string;
  warnings?: string[];
};

type ProviderConfig = {
  publisherId?: string;
  clientId?: string;
  displaySlotId?: string;
  autoAdsEnabled?: boolean;
  managementAccessToken?: string;
  customerId?: string;
  loginCustomerId?: string;
  developerToken?: string;
  clientSecret?: string;
  refreshToken?: string;
  rewardedEnabled?: boolean;
  sync?: ProviderSync;
};

interface AdProvider {
  id: string;
  provider_type: string;
  provider_name: string;
  enabled: boolean;
  description?: string;
  config_json?: ProviderConfig;
}

const tt = (l: Language, v: { en: string; pl: string; de?: string; es?: string; pt?: string; ja?: string; zh?: string; id?: string; ru?: string }) =>
  l === 'pl' ? v.pl : l === 'de' ? (v.de ?? v.en) : l === 'es' ? (v.es ?? v.pt ?? v.en) : l === 'pt' ? (v.pt ?? v.es ?? v.en) : l === 'ja' ? (v.ja ?? v.en) : l === 'zh' ? (v.zh ?? v.en) : l === 'id' ? (v.id ?? v.en) : l === 'ru' ? (v.ru ?? v.en) : v.en;

function stateTone(state?: ProviderSync['state']) {
  if (state === 'connected') return 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200';
  if (state === 'configured') return 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100';
  if (state === 'error') return 'border-rose-300/30 bg-rose-300/10 text-rose-200';
  return 'border-white/10 bg-white/[0.04] text-slate-300';
}

function defaultDraft(provider: AdProvider): ProviderConfig {
  return {
    rewardedEnabled: false,
    ...provider.config_json,
    sync: provider.config_json?.sync,
  };
}

export default function AdminAdsProvidersPanel({ currentLanguage = 'en' }: { currentLanguage?: Language }) {
  const [providers, setProviders] = useState<AdProvider[]>([]);
  const [drafts, setDrafts] = useState<Record<string, ProviderConfig>>({});
  const [loading, setLoading] = useState(true);
  const [savingProviderId, setSavingProviderId] = useState<string | null>(null);
  const [syncingProviderType, setSyncingProviderType] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function loadProviders() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ads/providers', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load providers');
      const data = (await res.json()) as AdProvider[];
      setProviders(data);
      setDrafts(Object.fromEntries(data.map((provider) => [provider.id, defaultDraft(provider)])));
    } catch (error) {
      console.error('Error loading ad providers:', error);
      setMessage({ type: 'error', text: tt(currentLanguage, { en: 'Failed to load providers', pl: 'Nie udało się załadować dostawców', de: 'Anbieter konnten nicht geladen werden', es: 'No se pudieron cargar proveedores', ru: 'Не удалось загрузить поставщиков' }) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProviders();
  }, [currentLanguage]);

  function updateDraft(providerId: string, field: keyof ProviderConfig, value: string | boolean) {
    setDrafts((current) => ({
      ...current,
      [providerId]: {
        ...(current[providerId] || {}),
        [field]: value,
      },
    }));
  }

  async function saveProvider(provider: AdProvider, enabled = provider.enabled) {
    setSavingProviderId(provider.id);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/ads/providers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: provider.id,
          enabled,
          config_json: drafts[provider.id] || {},
        }),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Could not save provider');

      setProviders((current) => current.map((item) => item.id === payload.id ? payload : item));
      setDrafts((current) => ({ ...current, [payload.id]: defaultDraft(payload) }));
      setMessage({ type: 'success', text: tt(currentLanguage, { en: 'Provider settings saved', pl: 'Ustawienia dostawcy zapisane', de: 'Anbieter-Einstellungen gespeichert', es: 'Configuración del proveedor guardada', ru: 'Настройки поставщика сохранены' }) });
      return payload as AdProvider;
    } catch (error) {
      console.error('Error saving provider:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : tt(currentLanguage, { en: 'Could not save provider', pl: 'Nie udało się zapisać dostawcy', de: 'Anbieter konnte nicht gespeichert werden', es: 'No se pudo guardar el proveedor', ru: 'Не удалось сохранить поставщика' }) });
      return null;
    } finally {
      setSavingProviderId(null);
    }
  }

  async function syncProvider(provider: AdProvider) {
    setSyncingProviderType(provider.provider_type);
    setMessage(null);
    try {
      const saved = await saveProvider(provider);
      if (!saved) return;

      const res = await fetch('/api/admin/ads/providers/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerType: provider.provider_type }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Sync failed');
      setProviders((current) => current.map((item) => item.provider_type === provider.provider_type ? payload.provider : item));
      setDrafts((current) => ({ ...current, [payload.provider.id]: defaultDraft(payload.provider) }));
      setMessage({ type: 'success', text: payload.sync?.message || tt(currentLanguage, { en: 'Provider synced', pl: 'Dostawca zsynchronizowany', de: 'Anbieter synchronisiert', es: 'Proveedor sincronizado', ru: 'Поставщик синхронизирован' }) });
    } catch (error) {
      console.error('Error syncing provider:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : tt(currentLanguage, { en: 'Sync failed', pl: 'Synchronizacja nie powiodła się', de: 'Synchronisierung fehlgeschlagen', es: 'La sincronización falló', ru: 'Синхронизация не удалась' }) });
    } finally {
      setSyncingProviderType(null);
    }
  }

  const enabledCount = useMemo(() => providers.filter((provider) => provider.enabled).length, [providers]);

  if (loading) {
    return <div className="text-slate-400">{tt(currentLanguage, { en: 'Loading...', pl: 'Ładowanie...', de: 'Wird geladen...', es: 'Cargando...', ru: 'Загрузка...' })}</div>;
  }

  return (
    <div className="rounded-[32px] border border-white/10 bg-slate-950/60 p-8 shadow-[0_24px_100px_rgba(2,6,23,0.45)]">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tt(currentLanguage, { en: 'Ad monetization setup', pl: 'Konfiguracja monetyzacji reklam', de: 'Ad-Monetarisierung', es: 'Configuración de monetización de anuncios', ru: 'Настройка монетизации рекламы' })}</div>
          <h2 className="mt-2 text-3xl font-black">{tt(currentLanguage, { en: 'Ad providers', pl: 'Dostawcy reklam', de: 'Ad-Anbieter', es: 'Proveedores de anuncios', ru: 'Поставщики рекламы' })}</h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
            {tt(currentLanguage, {
              en: 'Google AdSense now acts as the first live publisher integration. Google Ads can verify advertiser access and account wiring. Reward unlocks remain blocked until you enable a network that explicitly supports rewarded ads.',
              pl: 'Google AdSense działa teraz jako pierwszy live provider wydawcy. Google Ads potrafi zweryfikować dostęp reklamowy i powiązanie konta. Odblokowanie nagród pozostaje zablokowane, dopóki nie włączysz sieci, która naprawdę obsługuje rewarded ads.',
              de: 'Google AdSense fungiert jetzt als erste Live-Publisher-Integration. Google Ads kann Werbezugriff und Kontoverknüpfung prüfen. Reward-Freischaltungen bleiben blockiert, bis ein Reward-Netzwerk aktiv ist.',
              es: 'Google AdSense ya funciona como la primera integración live para publishers. Google Ads puede verificar el acceso publicitario y el enlace de cuenta. Los desbloqueos de recompensa seguirán bloqueados hasta habilitar una red compatible con rewarded ads.',
              ru: 'Google AdSense теперь работает как первый live-провайдер издателя. Google Ads умеет проверять рекламный доступ и связку аккаунта. Reward-разблокировки останутся заблокированными, пока не будет включена сеть с rewarded ads.',
            })}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-amber-300">{enabledCount}</div>
          <div className="text-xs text-slate-400">{tt(currentLanguage, { en: 'active', pl: 'aktywne', de: 'aktiv', es: 'activo', ru: 'активно' })}</div>
        </div>
      </div>

      {message ? (
        <div className={`mb-6 rounded-2xl border p-4 ${message.type === 'success' ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200' : 'border-rose-300/30 bg-rose-300/10 text-rose-200'}`}>
          {message.text}
        </div>
      ) : null}

      <div className="space-y-6">
        {providers.map((provider) => {
          const draft = drafts[provider.id] || defaultDraft(provider);
          const sync = draft.sync || provider.config_json?.sync;
          const isGoogleAdSense = provider.provider_type === 'google_adsense';
          const isGoogleAds = provider.provider_type === 'google_ads';
          const isBusy = savingProviderId === provider.id || syncingProviderType === provider.provider_type;

          return (
            <div key={provider.id} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-bold text-white">{provider.provider_name}</h3>
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${provider.enabled ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200' : 'border-white/10 bg-white/[0.04] text-slate-300'}`}>
                      {provider.enabled ? tt(currentLanguage, { en: 'Enabled', pl: 'Włączone', de: 'Aktiviert', es: 'Habilitado', ru: 'Включено' }) : tt(currentLanguage, { en: 'Disabled', pl: 'Wyłączone', de: 'Deaktiviert', es: 'Deshabilitado', ru: 'Отключено' })}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${stateTone(sync?.state)}`}>
                      {sync?.state || tt(currentLanguage, { en: 'Not checked', pl: 'Nie sprawdzono', de: 'Nicht geprüft', es: 'Sin comprobar', ru: 'Не проверено' })}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{provider.description}</p>
                  <div className="mt-3 text-xs text-slate-500">{tt(currentLanguage, { en: 'Type:', pl: 'Typ:', de: 'Typ:', es: 'Tipo:', ru: 'Тип:' })} <span className="font-mono text-slate-300">{provider.provider_type}</span></div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => saveProvider(provider, !provider.enabled)}
                    disabled={isBusy}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:opacity-60"
                  >
                    {provider.enabled ? tt(currentLanguage, { en: 'Disable provider', pl: 'Wyłącz dostawcę', de: 'Anbieter deaktivieren', es: 'Desactivar proveedor', ru: 'Отключить поставщика' }) : tt(currentLanguage, { en: 'Enable provider', pl: 'Włącz dostawcę', de: 'Anbieter aktivieren', es: 'Activar proveedor', ru: 'Включить поставщика' })}
                  </button>
                  <button
                    type="button"
                    onClick={() => saveProvider(provider)}
                    disabled={isBusy}
                    className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-300/15 disabled:opacity-60"
                  >
                    {savingProviderId === provider.id ? tt(currentLanguage, { en: 'Saving...', pl: 'Zapisywanie...', de: 'Speichern...', es: 'Guardando...', ru: 'Сохранение...' }) : tt(currentLanguage, { en: 'Save config', pl: 'Zapisz konfigurację', de: 'Konfiguration speichern', es: 'Guardar configuración', ru: 'Сохранить конфигурацию' })}
                  </button>
                  {(isGoogleAdSense || isGoogleAds) ? (
                    <button
                      type="button"
                      onClick={() => syncProvider(provider)}
                      disabled={isBusy}
                      className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/15 disabled:opacity-60"
                    >
                      {syncingProviderType === provider.provider_type ? tt(currentLanguage, { en: 'Syncing...', pl: 'Synchronizacja...', de: 'Synchronisiert...', es: 'Sincronizando...', ru: 'Синхронизация...' }) : tt(currentLanguage, { en: 'Sync now', pl: 'Synchronizuj teraz', de: 'Jetzt synchronisieren', es: 'Sincronizar ahora', ru: 'Синхронизировать сейчас' })}
                    </button>
                  ) : null}
                </div>
              </div>

              {sync?.message ? (
                <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${stateTone(sync.state)}`}>
                  <div>{sync.message}</div>
                  {sync.checkedAt ? <div className="mt-1 text-xs opacity-80">{tt(currentLanguage, { en: 'Last check', pl: 'Ostatnie sprawdzenie', de: 'Letzte Prüfung', es: 'Última comprobación', ru: 'Последняя проверка' })}: {new Date(sync.checkedAt).toLocaleString()}</div> : null}
                  {sync.warnings?.length ? <div className="mt-2 text-xs opacity-90">{sync.warnings.join(' ')}</div> : null}
                </div>
              ) : null}

              {isGoogleAdSense ? (
                <div className="mt-5 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm text-slate-300">Google publisher ID</label>
                      <input value={draft.publisherId || ''} onChange={(event) => updateDraft(provider.id, 'publisherId', event.target.value)} placeholder="pub-1234567890" className="input" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-slate-300">AdSense client ID</label>
                      <input value={draft.clientId || ''} onChange={(event) => updateDraft(provider.id, 'clientId', event.target.value)} placeholder="ca-pub-1234567890" className="input" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-slate-300">Display slot ID</label>
                      <input value={draft.displaySlotId || ''} onChange={(event) => updateDraft(provider.id, 'displaySlotId', event.target.value)} placeholder="1234567890" className="input" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-slate-300">Management access token</label>
                      <input value={draft.managementAccessToken || ''} onChange={(event) => updateDraft(provider.id, 'managementAccessToken', event.target.value)} placeholder="ya29..." className="input" />
                    </div>
                    <label className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200">
                      <input type="checkbox" checked={Boolean(draft.autoAdsEnabled)} onChange={(event) => updateDraft(provider.id, 'autoAdsEnabled', event.target.checked)} className="mr-3" />
                      {tt(currentLanguage, { en: 'Auto ads enabled for publisher account', pl: 'Auto ads włączone dla konta wydawcy', de: 'Auto Ads für Publisher-Konto aktiv', es: 'Auto ads activados para la cuenta del publisher', ru: 'Auto ads включены для аккаунта издателя' })}
                    </label>
                    <label className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200">
                      <input type="checkbox" checked={Boolean(draft.rewardedEnabled)} onChange={(event) => updateDraft(provider.id, 'rewardedEnabled', event.target.checked)} className="mr-3" />
                      {tt(currentLanguage, { en: 'Treat this provider as rewarded-capable', pl: 'Traktuj tego providera jako obsługującego rewarded ads', de: 'Diesen Provider als Reward-fähig behandeln', es: 'Tratar este proveedor como compatible con rewarded ads', ru: 'Считать этого провайдера поддерживающим rewarded ads' })}
                    </label>
                  </div>

                  <div className="rounded-[24px] border border-amber-300/20 bg-amber-300/[0.06] p-4">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-amber-200">Live AdSense preview</div>
                    <div className="mt-3 text-sm leading-6 text-slate-300">
                      {tt(currentLanguage, { en: 'If client ID and slot ID are valid, this preview uses the real AdSense script. It is separate from reward ads and monetizes normal display inventory.', pl: 'Jeśli client ID i slot ID są poprawne, ten podgląd używa prawdziwego skryptu AdSense. To działa niezależnie od rewarded ads i monetyzuje zwykły inventory display.', de: 'Wenn Client-ID und Slot-ID korrekt sind, nutzt diese Vorschau das echte AdSense-Skript. Das ist unabhängig von Reward Ads und monetarisiert normales Display-Inventar.', es: 'Si el client ID y el slot ID son válidos, esta vista previa usa el script real de AdSense. Funciona por separado de los rewarded ads y monetiza inventario display normal.', ru: 'Если client ID и slot ID корректны, этот preview использует реальный скрипт AdSense. Это работает отдельно от rewarded ads и монетизирует обычный display inventory.' })}
                    </div>
                    {draft.clientId && draft.displaySlotId ? (
                      <GoogleAdSenseSlot clientId={draft.clientId} slotId={draft.displaySlotId} className="mt-4" />
                    ) : (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">
                        {tt(currentLanguage, { en: 'Fill in the client ID and slot ID to preview the live inventory.', pl: 'Uzupełnij client ID i slot ID, aby zobaczyć podgląd live inventory.', de: 'Trage Client-ID und Slot-ID ein, um die Live-Vorschau zu sehen.', es: 'Rellena el client ID y el slot ID para ver la vista previa del inventario en vivo.', ru: 'Заполни client ID и slot ID, чтобы увидеть live-preview инвентаря.' })}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {isGoogleAds ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Customer ID</label>
                    <input value={draft.customerId || ''} onChange={(event) => updateDraft(provider.id, 'customerId', event.target.value)} placeholder="123-456-7890" className="input" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Login customer ID</label>
                    <input value={draft.loginCustomerId || ''} onChange={(event) => updateDraft(provider.id, 'loginCustomerId', event.target.value)} placeholder="098-765-4321" className="input" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Developer token</label>
                    <input value={draft.developerToken || ''} onChange={(event) => updateDraft(provider.id, 'developerToken', event.target.value)} placeholder="devtoken" className="input" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">OAuth client ID</label>
                    <input value={draft.clientId || ''} onChange={(event) => updateDraft(provider.id, 'clientId', event.target.value)} placeholder="google-oauth-client-id" className="input" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">OAuth client secret</label>
                    <input value={draft.clientSecret || ''} onChange={(event) => updateDraft(provider.id, 'clientSecret', event.target.value)} placeholder="google-oauth-client-secret" className="input" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Refresh token</label>
                    <input value={draft.refreshToken || ''} onChange={(event) => updateDraft(provider.id, 'refreshToken', event.target.value)} placeholder="1//0g..." className="input" />
                  </div>
                </div>
              ) : null}

              {!isGoogleAdSense && !isGoogleAds ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">
                  {tt(currentLanguage, { en: 'This provider is seeded and can be enabled now. Live sync is not implemented yet, but the card is ready for future connector work.', pl: 'Ten provider jest już zasiany i może zostać włączony. Live sync nie jest jeszcze wdrożony, ale karta jest gotowa pod kolejne konektory.', de: 'Dieser Provider ist vorbereitet und kann aktiviert werden. Live-Sync ist noch nicht umgesetzt, aber die Karte ist für weitere Connector-Arbeit bereit.', es: 'Este proveedor ya está preparado y puede habilitarse. El live sync aún no está implementado, pero la tarjeta está lista para futuros conectores.', ru: 'Этот провайдер уже подготовлен и может быть включён. Live-sync пока не реализован, но карточка готова для следующих коннекторов.' })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-100">
        {tt(currentLanguage, { en: 'For Google AdSense the platform owner connects the publisher account, not end users. Reward ads remain blocked until you enable a network that explicitly supports rewarded inventory.', pl: 'W przypadku Google AdSense konto wydawcy podpina właściciel platformy, a nie użytkownicy końcowi. Reklamy nagradzane pozostają zablokowane, dopóki nie włączysz sieci, która naprawdę obsługuje rewarded inventory.', de: 'Bei Google AdSense verbindet der Plattformbetreiber das Publisher-Konto, nicht die Endnutzer. Reward Ads bleiben blockiert, bis ein Netzwerk mit Reward-Inventar aktiv ist.', es: 'Con Google AdSense, quien conecta la cuenta del publisher es el propietario de la plataforma, no los usuarios finales. Los rewarded ads seguirán bloqueados hasta habilitar una red que soporte rewarded inventory.', ru: 'В Google AdSense аккаунт издателя подключает владелец платформы, а не конечные пользователи. Reward ads останутся заблокированными, пока не будет включена сеть с rewarded inventory.' })}
      </div>
    </div>
  );
}