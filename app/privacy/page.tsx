import { tr } from '@/lib/i18n';
import { getLanguage } from '@/lib/i18n-server';
import { SITE } from '@/lib/site';

export default async function PrivacyPage() {
  const language = await getLanguage();

  const sections = [
    {
      title: tr(language, { en: '1. Data controller', pl: '1. Administrator danych', es: '1. Responsable del tratamiento', ru: '1. Администратор данных' }),
      body: tr(language, {
        en: `The data controller for ${SITE.domain} and the ${SITE.name} application is ${SITE.legalOwner}. Contact: ${SITE.supportEmail}. Mailing address: ${SITE.legalAddress}.`,
        pl: `Administratorem danych dla ${SITE.domain} i aplikacji ${SITE.name} jest ${SITE.legalOwner}. Kontakt: ${SITE.supportEmail}. Adres korespondencyjny: ${SITE.legalAddress}.`,
        es: `El responsable del tratamiento para ${SITE.domain} y la aplicación ${SITE.name} es ${SITE.legalOwner}. Contacto: ${SITE.supportEmail}. Dirección postal: ${SITE.legalAddress}.`,
        ru: `Администратором данных для ${SITE.domain} и приложения ${SITE.name} является ${SITE.legalOwner}. Контакт: ${SITE.supportEmail}. Почтовый адрес: ${SITE.legalAddress}.`,
      }),
    },
    {
      title: tr(language, { en: '2. What data we process', pl: '2. Jakie dane przetwarzamy', es: '2. Qué datos procesamos', ru: '2. Какие данные мы обрабатываем' }),
      body: tr(language, {
        en: 'We may process user account data, email address, billing data, analysis history, content submitted for analysis, technical identifiers, security logs, and information required for payments, reviews, and support.',
        pl: 'Możemy przetwarzać dane konta użytkownika, adres e-mail, dane rozliczeniowe, historię analiz, treści przesłane do analizy, identyfikatory techniczne, logi bezpieczeństwa oraz informacje potrzebne do płatności, opinii i wsparcia.',
        es: 'Podemos procesar datos de la cuenta de usuario, dirección de correo, datos de facturación, historial de análisis, contenido enviado para análisis, identificadores técnicos, logs de seguridad e información necesaria para pagos, reseñas y soporte.',
        ru: 'Мы можем обрабатывать данные аккаунта пользователя, адрес электронной почты, платёжные данные, историю анализов, контент, отправленный на анализ, технические идентификаторы, журналы безопасности и информацию, необходимую для платежей, отзывов и поддержки.',
      }),
    },
    {
      title: tr(language, { en: '3. Purposes and legal basis', pl: '3. Cele i podstawa prawna', es: '3. Finalidades y base legal', ru: '3. Цели и правовое основание' }),
      body: tr(language, {
        en: 'We process data to provide the SaaS service, manage user accounts, authenticate sessions, handle subscriptions and billing, maintain security, process support messages, moderate reviews, and pursue or defend legal claims.',
        pl: 'Przetwarzamy dane w celu świadczenia usługi SaaS, zarządzania kontami użytkowników, uwierzytelniania sesji, obsługi subskrypcji i rozliczeń, utrzymania bezpieczeństwa, obsługi wiadomości supportowych, moderacji opinii oraz dochodzenia lub obrony roszczeń prawnych.',
        es: 'Procesamos datos para prestar el servicio SaaS, gestionar cuentas de usuario, autenticar sesiones, gestionar suscripciones y facturación, mantener la seguridad, tramitar mensajes de soporte, moderar reseñas y ejercer o defender reclamaciones legales.',
        ru: 'Мы обрабатываем данные для предоставления SaaS-сервиса, управления аккаунтами пользователей, аутентификации сессий, работы с подписками и оплатой, поддержания безопасности, обработки обращений в поддержку, модерации отзывов и защиты либо предъявления правовых требований.',
      }),
    },
    {
      title: tr(language, { en: '4. Data recipients', pl: '4. Odbiorcy danych', es: '4. Destinatarios de los datos', ru: '4. Получатели данных' }),
      body: tr(language, {
        en: 'Data may be shared with infrastructure and technology providers necessary to operate the product, including Vercel, Supabase, Stripe, and OpenAI. We limit data sharing to what is necessary to deliver the service.',
        pl: 'Dane mogą być udostępniane dostawcom infrastruktury i technologii niezbędnym do działania produktu, w tym Vercel, Supabase, Stripe i OpenAI. Ograniczamy udostępnianie danych do zakresu koniecznego do świadczenia usługi.',
        es: 'Los datos pueden compartirse con proveedores de infraestructura y tecnología necesarios para operar el producto, incluidos Vercel, Supabase, Stripe y OpenAI. Limitamos el intercambio de datos a lo estrictamente necesario para prestar el servicio.',
        ru: 'Данные могут передаваться поставщикам инфраструктуры и технологий, необходимым для работы продукта, включая Vercel, Supabase, Stripe и OpenAI. Мы ограничиваем передачу данных только тем объёмом, который необходим для оказания услуги.',
      }),
    },
    {
      title: tr(language, { en: '5. Retention period', pl: '5. Okres przechowywania', es: '5. Plazo de conservación', ru: '5. Срок хранения' }),
      body: tr(language, {
        en: 'We store account data while the user account remains active and for as long as necessary for billing, security, and legal obligations. Data may be deleted earlier when legally possible and upon a justified user request.',
        pl: 'Przechowujemy dane konta tak długo, jak konto użytkownika pozostaje aktywne oraz przez okres potrzebny do rozliczeń, bezpieczeństwa i obowiązków prawnych. Dane mogą zostać usunięte wcześniej, jeśli jest to prawnie możliwe i po uzasadnionym wniosku użytkownika.',
        es: 'Conservamos los datos de la cuenta mientras la cuenta siga activa y durante el tiempo necesario para facturación, seguridad y obligaciones legales. Los datos pueden eliminarse antes cuando sea legalmente posible y tras una solicitud justificada del usuario.',
        ru: 'Мы храним данные аккаунта, пока аккаунт пользователя активен, а также столько, сколько необходимо для расчётов, безопасности и выполнения правовых обязательств. Данные могут быть удалены раньше, если это юридически возможно и по обоснованному запросу пользователя.',
      }),
    },
    {
      title: tr(language, { en: '6. User rights', pl: '6. Prawa użytkownika', es: '6. Derechos del usuario', ru: '6. Права пользователя' }),
      body: tr(language, {
        en: 'Users may have the right to access, rectify, delete, restrict processing, transfer data, object to processing, and lodge a complaint with the relevant supervisory authority if they believe their data is processed unlawfully.',
        pl: 'Użytkownicy mogą mieć prawo dostępu, sprostowania, usunięcia, ograniczenia przetwarzania, przeniesienia danych, sprzeciwu wobec przetwarzania oraz wniesienia skargi do właściwego organu nadzorczego, jeśli uznają, że dane są przetwarzane niezgodnie z prawem.',
        es: 'Los usuarios pueden tener derecho a acceder, rectificar, eliminar, limitar el tratamiento, portar datos, oponerse al tratamiento y presentar una reclamación ante la autoridad supervisora competente si consideran que sus datos se tratan de forma ilícita.',
        ru: 'Пользователи могут иметь право на доступ, исправление, удаление, ограничение обработки, перенос данных, возражение против обработки и подачу жалобы в соответствующий надзорный орган, если считают, что их данные обрабатываются незаконно.',
      }),
    },
    {
      title: tr(language, { en: '7. Cookies and technical data', pl: '7. Cookies i dane techniczne', es: '7. Cookies y datos técnicos', ru: '7. Cookies и технические данные' }),
      body: tr(language, {
        en: 'The service may use cookies and similar technologies to maintain login sessions, provide security, operate forms, and support basic technical analytics. Before production launch, adapt the cookie banner and consent settings to your analytics stack.',
        pl: 'Usługa może wykorzystywać cookies i podobne technologie do utrzymania sesji logowania, zapewnienia bezpieczeństwa, działania formularzy i podstawowej analityki technicznej. Przed uruchomieniem produkcyjnym dostosuj baner cookies i ustawienia zgód do swojego stacku analitycznego.',
        es: 'El servicio puede usar cookies y tecnologías similares para mantener sesiones de inicio, aportar seguridad, operar formularios y soportar analítica técnica básica. Antes del lanzamiento en producción, adapta el banner de cookies y los ajustes de consentimiento a tu stack analítico.',
        ru: 'Сервис может использовать cookies и аналогичные технологии для поддержки сессий входа, безопасности, работы форм и базовой технической аналитики. Перед коммерческим запуском адаптируй cookie-banner и настройки согласия под свой аналитический стек.',
      }),
    },
    {
      title: tr(language, { en: '8. Data submitted for analysis', pl: '8. Dane przesyłane do analizy', es: '8. Datos enviados para análisis', ru: '8. Данные, отправляемые на анализ' }),
      body: tr(language, {
        en: `Users are responsible for the legality of content submitted to ${SITE.name}. Do not submit sensitive personal data, trade secrets, or information that is not necessary for the analysis.`,
        pl: `Użytkownicy ponoszą odpowiedzialność za legalność treści przesyłanych do ${SITE.name}. Nie przesyłaj wrażliwych danych osobowych, tajemnic handlowych ani informacji, które nie są niezbędne do analizy.`,
        es: `Los usuarios son responsables de la legalidad del contenido enviado a ${SITE.name}. No envíes datos personales sensibles, secretos comerciales ni información que no sea necesaria para el análisis.`,
        ru: `Пользователи несут ответственность за законность контента, отправляемого в ${SITE.name}. Не отправляй чувствительные персональные данные, коммерческие тайны или информацию, которая не требуется для анализа.`,
      }),
    },
    {
      title: tr(language, { en: '9. Legal data to complete before launch', pl: '9. Dane prawne do uzupełnienia przed startem', es: '9. Datos legales a completar antes del lanzamiento', ru: '9. Юридические данные, которые нужно дополнить до запуска' }),
      body: tr(language, {
        en: `Before commercial launch, add the full company or owner name, address, registration details, and ${SITE.legalTaxId}. This document is a strong starter template, but it still requires real legal details from the operator.`,
        pl: `Przed startem komercyjnym uzupełnij pełną nazwę firmy lub właściciela, adres, dane rejestrowe i ${SITE.legalTaxId}. Ten dokument jest mocnym szablonem startowym, ale nadal wymaga prawdziwych danych prawnych operatora.`,
        es: `Antes del lanzamiento comercial, añade el nombre completo de la empresa o propietario, dirección, datos registrales y ${SITE.legalTaxId}. Este documento es una buena plantilla inicial, pero aún requiere los datos legales reales del operador.`,
        ru: `До коммерческого запуска добавь полное название компании или владельца, адрес, регистрационные данные и ${SITE.legalTaxId}. Этот документ является хорошим стартовым шаблоном, но всё ещё требует реальных юридических данных оператора.`,
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
