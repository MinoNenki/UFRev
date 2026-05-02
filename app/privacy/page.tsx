import { tr } from '@/lib/i18n';
import { getLanguage } from '@/lib/i18n-server';
import { SITE } from '@/lib/site';

export default async function PrivacyPage() {
  const language = await getLanguage();

  const sections = [
    {
      title: tr(language, { en: '1. Data Controller', pl: '1. Administrator danych', es: '1. Responsable del tratamiento', ru: '1. Администратор данных' }),
      body: tr(language, {
        en: `The data controller for ${SITE.domain} and the ${SITE.name} application is ${SITE.legalOwner}. Contact: ${SITE.supportEmail}. Mailing address: ${SITE.legalAddress}.`,
        pl: `Administratorem danych dla ${SITE.domain} i aplikacji ${SITE.name} jest ${SITE.legalOwner}. Kontakt: ${SITE.supportEmail}. Adres korespondencyjny: ${SITE.legalAddress}.`,
        es: `El responsable del tratamiento para ${SITE.domain} y la aplicación ${SITE.name} es ${SITE.legalOwner}. Contacto: ${SITE.supportEmail}. Dirección postal: ${SITE.legalAddress}.`,
        ru: `Администратором данных для ${SITE.domain} и приложения ${SITE.name} является ${SITE.legalOwner}. Контакт: ${SITE.supportEmail}. Почтовый адрес: ${SITE.legalAddress}.`,
      }),
    },
    {
      title: tr(language, { en: '2. What Data We Collect', pl: '2. Jakie dane zbieramy', es: '2. Qué datos recopilamos', ru: '2. Какие данные мы собираем' }),
      body: tr(language, {
        en: 'We collect account registration data, email address, billing metadata, analysis history, files and content submitted for analysis, support messages, technical identifiers, IP address, device information, session logs, and cookies required to operate and secure the platform.',
        pl: 'Zbieramy dane rejestracyjne konta, adres e-mail, metadane rozliczeniowe, historię analiz, pliki i treści przesłane do analizy, wiadomości do supportu, identyfikatory techniczne, adres IP, informacje o urządzeniu, logi sesji oraz cookies potrzebne do działania i zabezpieczenia platformy.',
        es: 'Recopilamos datos de registro de cuenta, correo electrónico, metadatos de facturación, historial de análisis, archivos y contenido enviados para análisis, mensajes de soporte, identificadores técnicos, dirección IP, información del dispositivo, registros de sesión y cookies necesarias para operar y proteger la plataforma.',
        ru: 'Мы собираем регистрационные данные аккаунта, адрес электронной почты, платёжные метаданные, историю анализов, файлы и контент, отправленные на анализ, сообщения в поддержку, технические идентификаторы, IP-адрес, сведения об устройстве, журналы сессий и cookies, необходимые для работы и защиты платформы.',
      }),
    },
    {
      title: tr(language, { en: '3. How We Use Your Data', pl: '3. Jak wykorzystujemy Twoje dane', es: '3. Cómo usamos tus datos', ru: '3. Как мы используем ваши данные' }),
      body: tr(language, {
        en: 'We use data to provide the SaaS service, authenticate sessions, run AI analysis workflows, process subscriptions and payments, maintain security, prevent abuse, improve features, communicate service updates, and pursue or defend legal claims where necessary.',
        pl: 'Używamy danych do świadczenia usługi SaaS, uwierzytelniania sesji, uruchamiania procesów analizy AI, obsługi subskrypcji i płatności, utrzymania bezpieczeństwa, zapobiegania nadużyciom, ulepszania funkcji, komunikowania zmian w usłudze oraz dochodzenia lub obrony roszczeń, gdy to konieczne.',
        es: 'Usamos los datos para prestar el servicio SaaS, autenticar sesiones, ejecutar flujos de análisis con IA, procesar suscripciones y pagos, mantener la seguridad, prevenir abusos, mejorar funciones, comunicar actualizaciones del servicio y ejercer o defender reclamaciones legales cuando sea necesario.',
        ru: 'Мы используем данные для предоставления SaaS-сервиса, аутентификации сессий, запуска AI-анализов, обработки подписок и платежей, обеспечения безопасности, предотвращения злоупотреблений, улучшения функций, уведомления об обновлениях сервиса и защиты либо предъявления правовых требований при необходимости.',
      }),
    },
    {
      title: tr(language, { en: '4. Data Recipients', pl: '4. Odbiorcy danych', es: '4. Destinatarios de los datos', ru: '4. Получатели данных' }),
      body: tr(language, {
        en: 'Data may be shared with service providers required to run the product, including Vercel for hosting, Supabase for authentication and storage, Stripe for payments, and OpenAI or similar AI providers for analysis processing. We limit disclosure to what is reasonably necessary to provide the service.',
        pl: 'Dane mogą być udostępniane dostawcom usług wymaganym do działania produktu, w tym Vercel do hostingu, Supabase do uwierzytelniania i przechowywania, Stripe do płatności oraz OpenAI lub podobnym dostawcom AI do przetwarzania analiz. Ograniczamy ujawnianie do zakresu rozsądnie niezbędnego do świadczenia usługi.',
        es: 'Los datos pueden compartirse con proveedores necesarios para operar el producto, incluidos Vercel para hosting, Supabase para autenticación y almacenamiento, Stripe para pagos y OpenAI o proveedores similares de IA para el procesamiento de análisis. Limitamos la divulgación a lo razonablemente necesario para prestar el servicio.',
        ru: 'Данные могут передаваться поставщикам, необходимым для работы продукта, включая Vercel для хостинга, Supabase для аутентификации и хранения, Stripe для платежей и OpenAI либо аналогичных AI-поставщиков для обработки анализов. Мы ограничиваем передачу объёмом, разумно необходимым для оказания сервиса.',
      }),
    },
    {
      title: tr(language, { en: '5. Data Retention', pl: '5. Okres przechowywania danych', es: '5. Conservación de datos', ru: '5. Срок хранения данных' }),
      body: tr(language, {
        en: 'We retain account data while your account remains active and for as long as needed for billing, abuse prevention, security, backup integrity, and legal obligations. After account deletion, personal data is deleted or anonymized when reasonably possible, subject to retention required by law and backup cycles.',
        pl: 'Przechowujemy dane konta tak długo, jak konto pozostaje aktywne, oraz przez okres potrzebny do rozliczeń, zapobiegania nadużyciom, bezpieczeństwa, integralności kopii zapasowych i obowiązków prawnych. Po usunięciu konta dane osobowe są usuwane lub anonimizowane, gdy jest to rozsądnie możliwe, z zastrzeżeniem okresów wymaganych przez prawo i cykli backupu.',
        es: 'Conservamos los datos de la cuenta mientras tu cuenta permanezca activa y durante el tiempo necesario para facturación, prevención de abusos, seguridad, integridad de copias de seguridad y obligaciones legales. Tras eliminar la cuenta, los datos personales se eliminan o anonimizan cuando sea razonablemente posible, sujeto a obligaciones legales y ciclos de backup.',
        ru: 'Мы храним данные аккаунта, пока аккаунт активен, а также столько, сколько необходимо для биллинга, предотвращения злоупотреблений, безопасности, целостности резервных копий и выполнения правовых обязательств. После удаления аккаунта персональные данные удаляются или анонимизируются, когда это разумно возможно, с учётом сроков хранения по закону и циклов резервного копирования.',
      }),
    },
    {
      title: tr(language, { en: '6. Your Rights (GDPR / CCPA / UK GDPR)', pl: '6. Twoje prawa (RODO / CCPA / UK GDPR)', es: '6. Tus derechos (RGPD / CCPA / UK GDPR)', ru: '6. Ваши права (GDPR / CCPA / UK GDPR)' }),
      body: tr(language, {
        en: 'Depending on your jurisdiction, you may have the right to access, correct, delete, restrict, object to, or export your personal data, withdraw consent where consent is the legal basis, and file a complaint with the relevant supervisory authority. Requests can be submitted to our support contact.',
        pl: 'W zależności od jurysdykcji możesz mieć prawo dostępu, sprostowania, usunięcia, ograniczenia, sprzeciwu lub eksportu swoich danych osobowych, cofnięcia zgody tam, gdzie zgoda stanowi podstawę prawną, oraz złożenia skargi do właściwego organu nadzorczego. Wnioski można kierować na nasz kontakt supportowy.',
        es: 'Según tu jurisdicción, puedes tener derecho a acceder, corregir, eliminar, restringir, oponerte o exportar tus datos personales, retirar el consentimiento cuando sea la base legal y presentar una reclamación ante la autoridad supervisora correspondiente. Las solicitudes pueden enviarse a nuestro contacto de soporte.',
        ru: 'В зависимости от юрисдикции у вас может быть право на доступ, исправление, удаление, ограничение, возражение или экспорт персональных данных, отзыв согласия, если согласие является правовым основанием, и подачу жалобы в соответствующий надзорный орган. Запросы можно направлять на наш контакт поддержки.',
      }),
    },
    {
      title: tr(language, { en: '7. Cookies and Technical Data', pl: '7. Cookies i dane techniczne', es: '7. Cookies y datos técnicos', ru: '7. Cookies и технические данные' }),
      body: tr(language, {
        en: 'We use cookies, local storage, and similar technologies to keep users signed in, secure sessions, remember preferences, and support technical analytics where enabled. See our Cookies Policy for more detail about cookie categories and control options.',
        pl: 'Używamy cookies, local storage i podobnych technologii do utrzymania zalogowania użytkownika, zabezpieczenia sesji, zapamiętywania preferencji i wspierania analityki technicznej, jeśli jest włączona. Szczegóły kategorii cookies i sposobów kontroli znajdują się w Polityce Cookies.',
        es: 'Usamos cookies, almacenamiento local y tecnologías similares para mantener a los usuarios conectados, asegurar sesiones, recordar preferencias y apoyar analítica técnica cuando esté habilitada. Consulta nuestra Política de Cookies para más detalles sobre categorías y opciones de control.',
        ru: 'Мы используем cookies, local storage и аналогичные технологии для сохранения входа пользователя, защиты сессий, запоминания предпочтений и поддержки технической аналитики, если она включена. Подробности о категориях cookies и способах управления см. в нашей Политике Cookies.',
      }),
    },
    {
      title: tr(language, { en: '8. Data Submitted for Analysis', pl: '8. Dane przesyłane do analizy', es: '8. Datos enviados para análisis', ru: '8. Данные, отправляемые на анализ' }),
      body: tr(language, {
        en: `Users are responsible for the legality of content submitted to ${SITE.name}. Do not submit sensitive personal data, trade secrets, or information that is not necessary for the analysis.`,
        pl: `Użytkownicy ponoszą odpowiedzialność za legalność treści przesyłanych do ${SITE.name}. Nie przesyłaj wrażliwych danych osobowych, tajemnic handlowych ani informacji, które nie są niezbędne do analizy.`,
        es: `Los usuarios son responsables de la legalidad del contenido enviado a ${SITE.name}. No envíes datos personales sensibles, secretos comerciales ni información que no sea necesaria para el análisis.`,
        ru: `Пользователи несут ответственность за законность контента, отправляемого в ${SITE.name}. Не отправляй чувствительные персональные данные, коммерческие тайны или информацию, которая не требуется для анализа.`,
      }),
    },
    {
      title: tr(language, { en: '9. International Processing and Policy Changes', pl: '9. Transfer międzynarodowy i zmiany polityki', es: '9. Tratamiento internacional y cambios de la política', ru: '9. Международная обработка и изменения политики' }),
      body: tr(language, {
        en: 'Because our providers may process data in multiple jurisdictions, your data may be transferred internationally, including outside the EEA or UK, subject to provider safeguards where applicable. We may update this policy from time to time. Material changes will be reflected on this page and may also be communicated by email or in-product notice.',
        pl: 'Ponieważ nasi dostawcy mogą przetwarzać dane w wielu jurysdykcjach, Twoje dane mogą być przekazywane międzynarodowo, w tym poza EOG lub Wielką Brytanię, z zastosowaniem odpowiednich zabezpieczeń dostawców tam, gdzie ma to zastosowanie. Możemy okresowo aktualizować tę politykę. Istotne zmiany będą odzwierciedlone na tej stronie i mogą być także komunikowane e-mailem lub komunikatem w produkcie.',
        es: 'Dado que nuestros proveedores pueden procesar datos en múltiples jurisdicciones, tus datos pueden transferirse internacionalmente, incluso fuera del EEE o del Reino Unido, sujeto a salvaguardas del proveedor cuando corresponda. Podemos actualizar esta política periódicamente. Los cambios materiales se reflejarán en esta página y también podrán comunicarse por correo o aviso dentro del producto.',
        ru: 'Поскольку наши поставщики могут обрабатывать данные в нескольких юрисдикциях, ваши данные могут передаваться международно, в том числе за пределы ЕЭЗ или Великобритании, с применением соответствующих гарантий поставщиков там, где это требуется. Мы можем периодически обновлять эту политику. Существенные изменения будут отражены на этой странице и также могут сообщаться по электронной почте или уведомлением внутри продукта.',
      }),
    },
  ];

  return (
    <main className="mx-auto max-w-4xl px-6 py-20 text-slate-200">
      <h1 className="mb-3 text-4xl font-black text-white">{tr(language, { en: 'Privacy Policy', pl: 'Polityka prywatności', es: 'Política de privacidad', ru: 'Политика конфиденциальности' })}</h1>
      <p className="mb-8 text-sm text-slate-400">{tr(language, { en: 'Last updated', pl: 'Ostatnia aktualizacja', es: 'Última actualización', ru: 'Последнее обновление' })} {SITE.lastUpdated}</p>
      <div className="space-y-6 rounded-[32px] border border-white/10 bg-white/[0.03] p-8 leading-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="mb-2 text-xl font-bold text-white">{section.title}</h2>
            <p>{section.body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
