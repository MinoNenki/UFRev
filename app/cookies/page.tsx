'use client';

import Link from 'next/link';
import { SITE } from '@/lib/site';
import { tr } from '@/lib/i18n';
import { useEffect, useState } from 'react';

export default function CookiesPage() {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const lang = localStorage.getItem('language') || 'en';
    setLanguage(lang);
  }, []);

  const sections = [
    {
      title: tr(language, { en: '1. What Are Cookies?', pl: '1. Czym są Cookies?', es: '¿Qué son las Cookies?', ru: '1. Что такое Cookies?' }),
      body: tr(language, {
        en: 'Cookies are small text files stored on your device. They help maintain your login session, ensure security, remember preferences, and support platform analytics.',
        pl: 'Cookies to małe pliki tekstowe przechowywane na Twoim urządzeniu. Pomagają utrzymać sesję logowania, zapewnić bezpieczeństwo, zapamiętać preferencje i wspierać analitykę platformy.',
        es: 'Las cookies son pequeños archivos de texto almacenados en tu dispositivo. Ayudan a mantener tu sesión de inicio, garantizar seguridad, recordar preferencias y apoyar análisis de plataforma.',
        ru: 'Файлы cookie — это небольшие текстовые файлы, сохраняемые на вашем устройстве. Они помогают поддерживать сеанс входа, обеспечивать безопасность, запоминать предпочтения и поддерживать аналитику платформы.',
      }),
    },
    {
      title: tr(language, { en: '2. Types of Cookies We Use', pl: '2. Rodzaje Cookies, które używamy', es: '2. Tipos de Cookies que Usamos', ru: '2. Типы используемых нами Cookies' }),
      body: tr(language, {
        en: `Essential Cookies (Required): Session cookies keep you logged in. Security cookies prevent fraud. These are NECESSARY for ${SITE.name} to function.\n\nAnalytics Cookies (Optional): Track page usage, measure feature popularity, understand user behavior. You can disable these.\n\nFunctionality Cookies (Optional): Remember preferences and settings. You can disable these.`,
        pl: `Cookies Niezbędne (Wymagane): Ciasteczka sesji utrzymują Ciebie zalogowanego. Ciasteczka bezpieczeństwa zapobiegają oszustwom. Te są NIEZBĘDNE dla funkcjonowania ${SITE.name}.\n\nCookies Analityczne (Opcjonalne): Śledzą użycie strony, mierzą popularność funkcji, analizują zachowanie użytkownika. Możesz je wyłączyć.\n\nCookies Funkcjonalności (Opcjonalne): Zapamiętują preferencje i ustawienia. Możesz je wyłączyć.`,
        es: `Cookies Esenciales (Requeridas): Las cookies de sesión te mantienen conectado. Las cookies de seguridad previenen fraude. Estos son NECESARIOS para que ${SITE.name} funcione.\n\nCookies Analíticas (Opcionales): Rastrean el uso de página, miden la popularidad de características, analizan el comportamiento del usuario. Puedes deshabilitarlas.\n\nCookies de Funcionalidad (Opcionales): Recuerdan preferencias y configuración. Puedes deshabilitarlas.`,
        ru: `Основные Cookies (Обязательные): Файлы cookie сеанса держат вас в системе. Файлы cookie безопасности предотвращают мошенничество. Они НЕОБХОДИМЫ для работы ${SITE.name}.\n\nАналитические Cookies (Опциональные): Отслеживают использование страницы, измеряют популярность функций, анализируют поведение пользователя. Вы можете их отключить.\n\nФункциональные Cookies (Опциональные): Запоминают предпочтения и настройки. Вы можете их отключить.`,
      }),
    },
    {
      title: tr(language, { en: '3. Third-Party Cookies', pl: '3. Cookies Trzecich Stron', es: '3. Cookies de Terceros', ru: '3. Файлы Cookie третьих лиц' }),
      body: tr(language, {
        en: 'Services we use may set cookies: Stripe (payments), Supabase (authentication), Vercel (hosting). See their privacy policies for details. We are not responsible for their cookie practices.',
        pl: 'Usługi, których używamy, mogą ustawiać cookies: Stripe (płatności), Supabase (uwierzytelnianie), Vercel (hosting). Szczegóły w ich politykach prywatności. Nie odpowiadamy za ich praktyki cookie.',
        es: 'Los servicios que usamos pueden establecer cookies: Stripe (pagos), Supabase (autenticación), Vercel (hosting). Ver sus políticas de privacidad. No somos responsables de sus prácticas de cookies.',
        ru: 'Сервисы, которые мы используем, могут устанавливать файлы cookie: Stripe (платежи), Supabase (аутентификация), Vercel (хостинг). Подробности в их политиках конфиденциальности. Мы не отвечаем за их практики работы с файлами cookie.',
      }),
    },
    {
      title: tr(language, { en: '4. How to Control Cookies', pl: '4. Jak Kontrolować Cookies', es: '4. Cómo Controlar Cookies', ru: '4. Как управлять файлами Cookie' }),
      body: tr(language, {
        en: 'Chrome: Settings > Privacy > Cookies. Firefox: Preferences > Privacy > Cookies. Safari: Preferences > Privacy > Cookies. Edge: Settings > Privacy > Cookies. You can clear cookies anytime, but you\'ll be logged out.',
        pl: 'Chrome: Ustawienia > Prywatność > Cookies. Firefox: Preferencje > Prywatność > Cookies. Safari: Preferencje > Prywatność > Cookies. Edge: Ustawienia > Prywatność > Cookies. Możesz wyczyścić cookies w dowolnym momencie, ale zostaniesz wylogowany.',
        es: 'Chrome: Configuración > Privacidad > Cookies. Firefox: Preferencias > Privacidad > Cookies. Safari: Preferencias > Privacidad > Cookies. Edge: Configuración > Privacidad > Cookies. Puedes limpiar cookies en cualquier momento, pero serás desconectado.',
        ru: 'Chrome: Настройки > Приватность > Файлы cookie. Firefox: Настройки > Приватность > Файлы cookie. Safari: Настройки > Приватность > Файлы cookie. Edge: Настройки > Приватность > Файлы cookie. Вы можете очистить файлы cookie в любое время, но вы будете разлогинены.',
      }),
    },
    {
      title: tr(language, { en: '5. Cookie Consent & Duration', pl: '5. Zgoda na Cookies i Czas Przechowywania', es: '5. Consentimiento de Cookies y Duración', ru: '5. Согласие на Cookies и Длительность' }),
      body: tr(language, {
        en: 'By using our site, you consent to essential cookies (required). You can opt-out of non-essential cookies. Session cookies delete when you close browser. Persistent cookies delete manually or after 12 months. Essential cookies kept for 24 months (security).',
        pl: 'Korzystając z naszej strony, wyrażasz zgodę na niezbędne cookies (wymagane). Możesz zrezygnować z opcjonalnych cookies. Ciasteczka sesji usuwane po zamknięciu przeglądarki. Trwałe cookies usuwane ręcznie lub po 12 miesiącach. Niezbędne cookies przechowywane przez 24 miesiące (bezpieczeństwo).',
        es: 'Al usar nuestro sitio, consientes cookies esenciales (requeridas). Puedes optar por no aceptar cookies no esenciales. Las cookies de sesión se eliminan cuando cierras el navegador. Las cookies persistentes se eliminan manualmente o después de 12 meses. Las cookies esenciales se guardan durante 24 meses (seguridad).',
        ru: 'Используя наш сайт, вы соглашаетесь с основными файлами cookie (обязательными). Вы можете отказаться от неосновных файлов cookie. Файлы cookie сеанса удаляются при закрытии браузера. Постоянные файлы cookie удаляются вручную или через 12 месяцев. Основные файлы cookie хранятся 24 месяца (безопасность).',
      }),
    },
    {
      title: tr(language, { en: '6. Changes to Policy', pl: '6. Zmiany w Polityce', es: '6. Cambios en la Política', ru: '6. Изменения в политике' }),
      body: tr(language, {
        en: 'We may update this policy. Changes will be notified via banner or email. Continued use = acceptance.',
        pl: 'Możemy aktualizować tę politykę. Zmiany będą powiadamiane poprzez baner lub email. Kontynuowanie użytkowania = akceptacja.',
        es: 'Podemos actualizar esta política. Los cambios serán notificados mediante banner o correo. El uso continuado = aceptación.',
        ru: 'Мы можем обновить эту политику. Об изменениях будет сообщено через баннер или электронную почту. Продолжение использования = принятие.',
      }),
    },
  ];

  return (
    <main className="mx-auto max-w-4xl px-6 py-20 text-slate-200">
      <h1 className="mb-3 text-4xl font-black text-white">
        {tr(language, { en: 'Cookies Policy', pl: 'Polityka Cookies', es: 'Política de Cookies', ru: 'Политика использования Cookies' })}
      </h1>
      <p className="mb-8 text-sm text-slate-400">
        {tr(language, { en: 'Last updated: May 1, 2026', pl: 'Ostatnia aktualizacja: 1 maja 2026', es: 'Última actualización: 1 de mayo de 2026', ru: 'Последнее обновление: 1 мая 2026 г.' })}
      </p>

      <div className="space-y-6 rounded-[32px] border border-white/10 bg-white/[0.03] p-8 leading-8">
        {sections.map((section, idx) => (
          <section key={idx}>
            <h2 className="mb-2 text-xl font-bold text-white">{section.title}</h2>
            <p className="whitespace-pre-wrap">{section.body}</p>
          </section>
        ))}
      </div>

      <div className="mt-8 flex gap-4 justify-center flex-wrap">
        <Link href="/terms" className="text-cyan-300 hover:underline">
          {tr(language, { en: 'Terms of Service', pl: 'Warunki Korzystania', es: 'Términos de Servicio', ru: 'Условия Обслуживания' })}
        </Link>
        <Link href="/privacy" className="text-cyan-300 hover:underline">
          {tr(language, { en: 'Privacy Policy', pl: 'Polityka Prywatności', es: 'Política de Privacidad', ru: 'Политика Конфиденциальности' })}
        </Link>
      </div>
    </main>
  );
}
