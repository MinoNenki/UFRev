import { tr } from '@/lib/i18n';
import { getLanguage } from '@/lib/i18n-server';
import { SITE } from '@/lib/site';

export default async function TermsPage() {
  const language = await getLanguage();

  const sections = [
    {
      title: tr(language, { en: '1. General provisions', pl: '1. Postanowienia ogólne', es: '1. Disposiciones generales', ru: '1. Общие положения' }),
      body: tr(language, {
        en: `${SITE.name}, available at ${SITE.domain}, is a SaaS product used to generate AI-powered analyses of product descriptions, sales offers, marketing materials, and landing pages.`,
        pl: `${SITE.name}, dostępne pod adresem ${SITE.domain}, jest produktem SaaS służącym do generowania analiz wspieranych przez AI dla opisów produktów, ofert sprzedażowych, materiałów marketingowych i landing page’y.`,
        es: `${SITE.name}, disponible en ${SITE.domain}, es un producto SaaS utilizado para generar análisis impulsados por IA de descripciones de productos, ofertas de venta, materiales de marketing y landing pages.`,
        ru: `${SITE.name}, доступный по адресу ${SITE.domain}, — это SaaS-продукт для создания AI-анализов описаний товаров, торговых предложений, маркетинговых материалов и landing pages.`,
      }),
    },
    {
      title: tr(language, { en: '2. Service operator', pl: '2. Operator usługi', es: '2. Operador del servicio', ru: '2. Оператор сервиса' }),
      body: tr(language, {
        en: `The service operator is ${SITE.legalOwner}. Contact for support and complaints: ${SITE.supportEmail}. Address: ${SITE.legalAddress}.`,
        pl: `Operatorem usługi jest ${SITE.legalOwner}. Kontakt w sprawach wsparcia i reklamacji: ${SITE.supportEmail}. Adres: ${SITE.legalAddress}.`,
        es: `El operador del servicio es ${SITE.legalOwner}. Contacto para soporte y reclamaciones: ${SITE.supportEmail}. Dirección: ${SITE.legalAddress}.`,
        ru: `Оператором сервиса является ${SITE.legalOwner}. Контакт по поддержке и жалобам: ${SITE.supportEmail}. Адрес: ${SITE.legalAddress}.`,
      }),
    },
    {
      title: tr(language, { en: '3. User account', pl: '3. Konto użytkownika', es: '3. Cuenta de usuario', ru: '3. Аккаунт пользователя' }),
      body: tr(language, {
        en: 'Paid features require a user account. Users are responsible for accurate registration data and for securing login credentials. Sharing access with unauthorized persons is prohibited.',
        pl: 'Funkcje płatne wymagają konta użytkownika. Użytkownik odpowiada za poprawność danych rejestracyjnych i zabezpieczenie danych logowania. Udostępnianie dostępu osobom nieuprawnionym jest zabronione.',
        es: 'Las funciones de pago requieren una cuenta de usuario. Los usuarios son responsables de la exactitud de sus datos de registro y de proteger sus credenciales de acceso. Está prohibido compartir el acceso con personas no autorizadas.',
        ru: 'Платные функции требуют аккаунта пользователя. Пользователь отвечает за корректность регистрационных данных и безопасность учётных данных. Передача доступа посторонним лицам запрещена.',
      }),
    },
    {
      title: tr(language, { en: '4. Scope of the service', pl: '4. Zakres usługi', es: '4. Alcance del servicio', ru: '4. Объём сервиса' }),
      body: tr(language, {
        en: 'The service allows users to submit content for analysis, generate AI reports, store analysis history, submit reviews, contact support, and use subscription plans. The operator may improve features, modify the interface, and optimize the product over time.',
        pl: 'Usługa pozwala użytkownikom przesyłać treści do analizy, generować raporty AI, przechowywać historię analiz, dodawać opinie, kontaktować się ze wsparciem i korzystać z planów subskrypcyjnych. Operator może z czasem ulepszać funkcje, zmieniać interfejs i optymalizować produkt.',
        es: 'El servicio permite enviar contenido para análisis, generar informes con IA, almacenar historial de análisis, enviar reseñas, contactar con soporte y usar planes de suscripción. El operador puede mejorar funciones, modificar la interfaz y optimizar el producto con el tiempo.',
        ru: 'Сервис позволяет отправлять контент на анализ, создавать AI-отчёты, хранить историю анализов, оставлять отзывы, обращаться в поддержку и использовать подписки. Оператор может со временем улучшать функции, менять интерфейс и оптимизировать продукт.',
      }),
    },
    {
      title: tr(language, { en: '5. Payments and subscriptions', pl: '5. Płatności i subskrypcje', es: '5. Pagos y suscripciones', ru: '5. Платежи и подписки' }),
      body: tr(language, {
        en: 'Subscription payments are processed by Stripe. Limits and AI token allowances depend on the active plan. Failed payments, cancellation, or subscription expiration may limit access to paid features.',
        pl: 'Płatności subskrypcyjne są obsługiwane przez Stripe. Limity i pakiety tokenów AI zależą od aktywnego planu. Nieudane płatności, anulowanie lub wygaśnięcie subskrypcji mogą ograniczyć dostęp do funkcji płatnych.',
        es: 'Los pagos de suscripción son procesados por Stripe. Los límites y las asignaciones de tokens AI dependen del plan activo. Los pagos fallidos, la cancelación o el vencimiento de la suscripción pueden limitar el acceso a las funciones de pago.',
        ru: 'Платежи по подписке обрабатываются через Stripe. Лимиты и объём AI-токенов зависят от активного тарифа. Неудачные платежи, отмена или окончание подписки могут ограничить доступ к платным функциям.',
      }),
    },
    {
      title: tr(language, { en: '6. User responsibility', pl: '6. Odpowiedzialność użytkownika', es: '6. Responsabilidad del usuario', ru: '6. Ответственность пользователя' }),
      body: tr(language, {
        en: `Users are responsible for content submitted to ${SITE.name}, including legality, compliance, copyrights, and how AI-generated outputs are used.`,
        pl: `Użytkownicy odpowiadają za treści przesyłane do ${SITE.name}, w tym za ich legalność, zgodność, prawa autorskie i sposób wykorzystania wyników generowanych przez AI.`,
        es: `Los usuarios son responsables del contenido enviado a ${SITE.name}, incluyendo su legalidad, cumplimiento, derechos de autor y el modo de uso de los resultados generados por IA.`,
        ru: `Пользователи несут ответственность за контент, отправляемый в ${SITE.name}, включая его законность, соответствие требованиям, авторские права и то, как используются AI-результаты.`,
      }),
    },
    {
      title: tr(language, { en: '7. Nature of AI outputs', pl: '7. Charakter wyników AI', es: '7. Naturaleza de los resultados AI', ru: '7. Характер AI-результатов' }),
      body: tr(language, {
        en: 'Reports are supportive in nature and do not constitute legal, tax, investment, medical, or guaranteed business advice. Users should verify outputs before relying on them in real operations or legal matters.',
        pl: 'Raporty mają charakter wspierający i nie stanowią porady prawnej, podatkowej, inwestycyjnej, medycznej ani gwarantowanej porady biznesowej. Użytkownicy powinni weryfikować wyniki przed opieraniem na nich realnych działań operacyjnych lub prawnych.',
        es: 'Los informes tienen carácter de apoyo y no constituyen asesoramiento legal, fiscal, de inversión, médico ni garantía de consejo empresarial. Los usuarios deben verificar los resultados antes de basarse en ellos para operaciones reales o asuntos legales.',
        ru: 'Отчёты носят вспомогательный характер и не являются юридической, налоговой, инвестиционной, медицинской или гарантированной бизнес-консультацией. Пользователь должен проверять результаты перед тем, как опираться на них в реальных операциях или юридических вопросах.',
      }),
    },
    {
      title: tr(language, { en: '8. Prohibited use', pl: '8. Zabronione użycie', es: '8. Uso prohibido', ru: '8. Запрещённое использование' }),
      body: tr(language, {
        en: 'It is forbidden to use the service for unlawful activity, abuse, infringing third-party rights, bypassing limits, unauthorized security testing, or submitting content that may violate provider policies.',
        pl: 'Zabronione jest korzystanie z usługi do działań niezgodnych z prawem, nadużyć, naruszania praw osób trzecich, omijania limitów, nieautoryzowanych testów bezpieczeństwa lub przesyłania treści mogących naruszać zasady dostawców.',
        es: 'Está prohibido usar el servicio para actividades ilegales, abuso, infringir derechos de terceros, saltarse límites, pruebas de seguridad no autorizadas o enviar contenido que pueda violar las políticas de los proveedores.',
        ru: 'Запрещено использовать сервис для незаконной деятельности, злоупотреблений, нарушения прав третьих лиц, обхода лимитов, несанкционированного тестирования безопасности или отправки контента, который может нарушать правила поставщиков.',
      }),
    },
    {
      title: tr(language, { en: '9. Complaints and support', pl: '9. Reklamacje i wsparcie', es: '9. Reclamaciones y soporte', ru: '9. Жалобы и поддержка' }),
      body: tr(language, {
        en: `Complaints and technical requests may be submitted through the support form or to ${SITE.supportEmail}. Before commercial launch, complete refund policies, complaint timelines, and local disclosure obligations for your target market.`,
        pl: `Reklamacje i zgłoszenia techniczne można składać przez formularz wsparcia lub na adres ${SITE.supportEmail}. Przed startem komercyjnym uzupełnij zasady zwrotów, terminy reklamacyjne i lokalne obowiązki informacyjne dla swojego rynku docelowego.`,
        es: `Las reclamaciones y solicitudes técnicas pueden enviarse a través del formulario de soporte o a ${SITE.supportEmail}. Antes del lanzamiento comercial, completa la política de reembolsos, los plazos de reclamación y las obligaciones informativas locales de tu mercado objetivo.`,
        ru: `Жалобы и технические запросы можно направлять через форму поддержки или на ${SITE.supportEmail}. До коммерческого запуска дополни политику возвратов, сроки рассмотрения жалоб и местные требования к раскрытию информации для своего рынка.`,
      }),
    },
    {
      title: tr(language, { en: '10. Termination and account blocking', pl: '10. Zakończenie i blokada konta', es: '10. Terminación y bloqueo de cuenta', ru: '10. Прекращение и блокировка аккаунта' }),
      body: tr(language, {
        en: 'The operator may restrict or block an account in the event of legal violations, breaches of these terms, platform security issues, or payment abuse. Users may cancel the service in line with their plan and subscription settings.',
        pl: 'Operator może ograniczyć lub zablokować konto w przypadku naruszeń prawa, złamania niniejszych warunków, problemów bezpieczeństwa platformy lub nadużyć płatniczych. Użytkownicy mogą zrezygnować z usługi zgodnie z ustawieniami planu i subskrypcji.',
        es: 'El operador puede restringir o bloquear una cuenta en caso de infracciones legales, incumplimiento de estas condiciones, problemas de seguridad de la plataforma o abuso en los pagos. Los usuarios pueden cancelar el servicio de acuerdo con su plan y configuración de suscripción.',
        ru: 'Оператор может ограничить или заблокировать аккаунт в случае нарушений закона, несоблюдения этих условий, проблем безопасности платформы или злоупотреблений с оплатой. Пользователи могут отменить сервис в соответствии со своим тарифом и настройками подписки.',
      }),
    },
    {
      title: tr(language, { en: '11. Legal details required before selling publicly', pl: '11. Dane prawne wymagane przed publiczną sprzedażą', es: '11. Datos legales requeridos antes de vender públicamente', ru: '11. Юридические данные, необходимые перед публичным запуском продаж' }),
      body: tr(language, {
        en: `Before public launch, add the full legal identity of the company or owner, jurisdiction, consumer withdrawal rules if applicable, refund policy, and ${SITE.legalTaxId}.`,
        pl: `Przed publicznym startem uzupełnij pełną tożsamość prawną firmy lub właściciela, jurysdykcję, zasady odstąpienia konsumenta jeśli mają zastosowanie, politykę zwrotów oraz ${SITE.legalTaxId}.`,
        es: `Antes del lanzamiento público, añade la identidad legal completa de la empresa o del propietario, la jurisdicción, las reglas de desistimiento del consumidor si aplican, la política de reembolso y ${SITE.legalTaxId}.`,
        ru: `Перед публичным запуском добавь полные юридические данные компании или владельца, юрисдикцию, правила отказа для потребителей при необходимости, политику возвратов и ${SITE.legalTaxId}.`,
      }),
    },
  ];

  return (
    <main className="mx-auto max-w-4xl px-6 py-20 text-slate-200">
      <h1 className="mb-3 text-4xl font-black text-white">{tr(language, { en: 'Terms of Service', pl: 'Warunki korzystania z usługi', es: 'Términos del servicio', ru: 'Условия сервиса' })}</h1>
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
