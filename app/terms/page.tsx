import Link from 'next/link';
import { SITE } from '@/lib/site';
import { getLanguage } from '@/lib/i18n-server';
import { tr } from '@/lib/i18n';

export default async function TermsPage() {
  const language = await getLanguage();

  const sections = [
    {
      title: tr(language, { en: '1. Service Description', pl: '1. Opis usługi', es: '1. Descripción del servicio', ru: '1. Описание сервиса' }),
      body: tr(language, {
        en: `${SITE.name} is a SaaS platform providing AI-powered decision support for product analysis, market research, and business validation. This service is INFORMATIONAL ONLY and does NOT constitute financial, investment, legal, medical, or guaranteed business advice.`,
        pl: `${SITE.name} jest platformą SaaS zapewniającą wspieranie decyzji wspierane przez AI do analizy produktów, badań rynkowych i walidacji biznesu. Ta usługa jest WYŁĄCZNIE DO CELÓW INFORMACYJNYCH i nie stanowi porady finansowej, inwestycyjnej, prawnej, medycznej lub gwarantowanej porady biznesowej.`,
        es: `${SITE.name} es una plataforma SaaS que proporciona soporte de decisiones impulsado por IA para análisis de productos, investigación de mercado y validación empresarial. Este servicio es SOLO INFORMATIVO y NO constituye asesoramiento financiero, de inversión, legal, médico o garantía de consejo empresarial.`,
        ru: `${SITE.name} — это SaaS-платформа, предоставляющая поддержку принятия решений на основе ИИ для анализа товаров, исследований рынка и бизнес-валидации. Этот сервис ИСКЛЮЧИТЕЛЬНО ИНФОРМАЦИОНЕН и НЕ является финансовой, инвестиционной, юридической, медицинской или гарантированной бизнес-консультацией.`,
      }),
    },
    {
      title: tr(language, { en: '2. NO PROFIT GUARANTEE', pl: '2. BEZ GWARANCJI ZYSKU', es: '2. SIN GARANTÍA DE GANANCIAS', ru: '2. БЕЗ ГАРАНТИИ ПРИБЫЛИ' }),
      body: tr(language, {
        en: 'AI outputs are PROBABILISTIC and may be INACCURATE. We make NO GUARANTEE of: accuracy, profitability, financial gain, business success, usefulness, or reliability. Your decisions are made at YOUR OWN RISK. We are a SUPPORT TOOL, not a guarantee.',
        pl: 'Wyniki AI są PROBABILISTYCZNE i mogą być NIEDOKŁADNE. Nie gwarantujemy: dokładności, rentowności, zysku finansowego, sukcesu biznesu, użyteczności ani niezawodności. Decyzje podejmujesz NA WŁASNE RYZYKO. Jesteśmy NARZĘDZIEM WSPIERAJĄCYM, a nie gwarancją.',
        es: 'Los resultados de IA son PROBABILÍSTICOS y pueden ser INEXACTOS. No garantizamos: precisión, rentabilidad, ganancia financiera, éxito empresarial, utilidad o confiabilidad. Tus decisiones son en TU PROPIO RIESGO. Somos una HERRAMIENTA DE APOYO, no una garantía.',
        ru: 'Результаты ИИ ВЕРОЯТНОСТНЫ и могут быть НЕТОЧНЫ. Мы НЕ ГАРАНТИРУЕМ: точность, прибыльность, финансовый доход, успех в бизнесе, полезность или надёжность. Решения принимаешь НА СВОЙ РИСК. Мы ВСПОМОГАТЕЛЬНЫЙ ИНСТРУМЕНТ, а не гарантия.',
      }),
    },
    {
      title: tr(language, { en: '3. NO LIABILITY FOR USER DECISIONS', pl: '3. BEZ ODPOWIEDZIALNOŚCI ZA DECYZJE UŻYTKOWNIKA', es: '3. SIN RESPONSABILIDAD POR DECISIONES DEL USUARIO', ru: '3. БЕЗ ОТВЕТСТВЕННОСТИ ЗА РЕШЕНИЯ ПОЛЬЗОВАТЕЛЯ' }),
      body: tr(language, {
        en: 'We are NOT LIABLE for: financial losses, business failures, decisions based on our analysis, accuracy of AI recommendations, consequences of relying on outputs, or missed opportunities. You accept FULL RESPONSIBILITY for all decisions and actions.',
        pl: 'Nie odpowiadamy za: straty finansowe, niepowodzenia biznesu, decyzje na podstawie naszej analizy, dokładość rekomendacji AI, skutki polegania na wynikach ani utracone okazje. Akceptujesz PEŁNĄ ODPOWIEDZIALNOŚĆ za wszystkie decyzje i działania.',
        es: 'NO SOMOS RESPONSABLES POR: pérdidas financieras, fracasos empresariales, decisiones basadas en nuestro análisis, precisión de recomendaciones de IA, consecuencias de depender de nuestros resultados ni oportunidades perdidas. ACEPTAS RESPONSABILIDAD TOTAL por todas tus decisiones y acciones.',
        ru: 'Мы НЕ ОТВЕТСТВЕННЫ ЗА: финансовые убытки, бизнес-провалы, решения на основе нашего анализа, точность рекомендаций ИИ, последствия полагаться на результаты или упущенные возможности. Ты ПРИНИМАЕШЬ ПОЛНУЮ ОТВЕТСТВЕННОСТЬ за все решения и действия.',
      }),
    },
    {
      title: tr(language, { en: '4. LIMITATION OF LIABILITY CAP', pl: '4. LIMIT ODPOWIEDZIALNOŚCI', es: '4. LÍMITE DE RESPONSABILIDAD', ru: '4. ПРЕДЕЛ ОТВЕТСТВЕННОСТИ' }),
      body: tr(language, {
        en: 'Our maximum liability = fees you paid in the last 30 days only. We are NOT liable for: data loss, service interruptions, third-party failures (Stripe, Supabase, OpenAI), indirect/consequential damages, lost profits, or business opportunities.',
        pl: 'Nasza maksymalna odpowiedzialność = opłaty, które zapłaciłeś w ostatnich 30 dniach. Nie odpowiadamy za: utratę danych, przerwy w serwisie, awarie trzecich stron, szkody pośrednie, utracone zyski ani okazje biznesowe.',
        es: 'Nuestra responsabilidad máxima = tarifas que pagaste en los últimos 30 días. NO somos responsables por: pérdida de datos, interrupciones de servicio, fallas de terceros, daños indirectos, ganancias perdidas u oportunidades empresariales.',
        ru: 'Наша максимальная ответственность = комиссии, которые ты платил за последние 30 дней. Мы НЕ ОТВЕТСТВЕННЫ ЗА: потерю данных, перебои в сервисе, сбои третьих сторон, косвенные убытки, упущенные доходы или бизнес-возможности.',
      }),
    },
    {
      title: tr(language, { en: '5. NON-REFUNDABLE PAYMENTS', pl: '5. PŁATNOŚCI BEZ ZWROTU', es: '5. PAGOS NO REEMBOLSABLES', ru: '5. НЕВОЗВРАТНЫЕ ПЛАТЕЖИ' }),
      body: tr(language, {
        en: 'Except where law requires (EU consumer rights, chargebacks): All subscription payments are NON-REFUNDABLE. One-time purchases are NON-REFUNDABLE. Partial-month cancellations receive NO REFUND. Chargeback attempts result in permanent account suspension and possible legal action.',
        pl: 'Z wyjątkiem przypadków wymaganych przez prawo (prawa konsumenta UE, zwroty): Wszystkie płatności subskrypcji SĄ BEZ ZWROTU. Jednorazowe zakupy SĄ BEZ ZWROTU. Anulowania w połowie miesiąca BEZ ZWROTU. Próby zwrotu powodują trwałe zawieszenie konta i możliwą akcję prawną.',
        es: 'Excepto donde lo requiera la ley (derechos del consumidor de la UE, chargebacks): Todos los pagos de suscripción son NO REEMBOLSABLES. Las compras únicas son NO REEMBOLSABLES. Las cancelaciones a mitad de mes reciben SIN REEMBOLSO. Los intentos de chargeback resultan en suspensión permanente de cuenta y posible acción legal.',
        ru: 'За исключением случаев, требуемых законом (права потребителя ЕС, чарджбэки): ВСЕ платежи подписки НЕВОЗВРАТНЫ. Разовые покупки НЕВОЗВРАТНЫ. Отмена в середине месяца БЕЗ ВОЗВРАТА. Попытки чарджбэка приводят к постоянному приостановлению аккаунта и возможным судебным действиям.',
      }),
    },
    {
      title: tr(language, { en: '6. STRIPE PAYMENTS & CHARGEBACK POLICY', pl: '6. PŁATNOŚCI STRIPE I POLITYKA CHARGEBACKÓW', es: '6. PAGOS STRIPE Y POLÍTICA DE CHARGEBACKS', ru: '6. ПЛАТЕЖИ STRIPE И ПОЛИТИКА CHARGEBACKS' }),
      body: tr(language, {
        en: `All payments processed by Stripe (stripe.com). Subscriptions auto-renew monthly/yearly. You authorize recurring charges to your payment method. Failed payments may suspend access. Chargebacks, disputes, or fraud attempts = immediate account termination, data deletion, and blacklist. See Stripe ToS for payment terms.`,
        pl: `Wszystkie płatności przetwarzane przez Stripe (stripe.com). Subskrypcje auto-odnawiane miesięcznie/rocznie. Upoważniasz powtarzające się obciążenia. Nieudane płatności mogą wstrzymać dostęp. Chargebacki, spory lub próby oszustwa = natychmiastowe zakończenie, usunięcie danych i blacklist. Warunki Stripe.`,
        es: `Todos los pagos procesados por Stripe (stripe.com). Suscripciones con renovación automática mensual/anual. Autorizas cobros recurrentes. Pagos fallidos pueden suspender acceso. Chargebacks, disputas o fraude = terminación inmediata, eliminación de datos y blacklist.`,
        ru: `Все платежи обрабатываются Stripe (stripe.com). Подписки с автоматическим продлением ежемесячно/ежегодно. Ты уполномочиваешь повторяющиеся платежи. Неудачные платежи могут приостановить доступ. Чарджбэки, споры или мошенничество = немедленное прекращение, удаление данных и чёрный список.`,
      }),
    },
    {
      title: tr(language, { en: '7. USER RESPONSIBILITY & ACCOUNT SECURITY', pl: '7. ODPOWIEDZIALNOŚĆ UŻYTKOWNIKA I BEZPIECZEŃSTWO KONTA', es: '7. RESPONSABILIDAD DEL USUARIO Y SEGURIDAD DE CUENTA', ru: '7. ОТВЕТСТВЕННОСТЬ ПОЛЬЗОВАТЕЛЯ И БЕЗОПАСНОСТЬ АККАУНТА' }),
      body: tr(language, {
        en: 'You are responsible for: accurate registration data, login security, all account activity, content legality, copyright compliance, and how you use AI outputs. Sharing access is prohibited. Account abuse = immediate suspension without refund.',
        pl: 'Odpowiadasz za: dokładne dane rejestracyjne, bezpieczeństwo logowania, wszystkie aktywności na koncie, legalność treści, zgodność z prawami autorskimi i sposób wykorzystania wyników AI. Udostępnianie dostępu zabronione. Nadużycie konta = natychmiastowe zawieszenie bez zwrotu.',
        es: 'Eres responsable por: datos precisos de registro, seguridad de inicio, toda actividad de cuenta, legalidad de contenido, cumplimiento de derechos de autor y cómo usas resultados de IA. Compartir acceso prohibido. Abuso de cuenta = suspensión inmediata sin reembolso.',
        ru: 'Ты ответственен за: точные регистрационные данные, безопасность входа, всю активность аккаунта, законность контента, соблюдение авторских прав и использование результатов ИИ. Передача доступа запрещена. Злоупотребление аккаунтом = немедленное приостановление без возврата.',
      }),
    },
    {
      title: tr(language, { en: '8. AUTOMATIONS & RISK FEATURES', pl: '8. AUTOMATYZACJA I FUNKCJE RYZYKA', es: '8. AUTOMATIZACIÓN Y CARACTERÍSTICAS DE RIESGO', ru: '8. АВТОМАТИЗАЦИЯ И ФУНКЦИИ УПРАВЛЕНИЯ РИСКОМ' }),
      body: tr(language, {
        en: 'While we offer risk-limiting features: NO GUARANTEE of effectiveness, NO GUARANTEE against losses. You must monitor all automated actions. You must verify all automated decisions. Risk features are SUPPORT ONLY. Automated actions are YOUR RESPONSIBILITY.',
        pl: 'Chociaż oferujemy funkcje ograniczające ryzyko: BEZ GWARANCJI efektywności, BEZ GWARANCJI przed stratami. Musisz monitorować wszystkie automatyczne akcje. Musisz weryfikować wszystkie automatyczne decyzje. Funkcje ryzyka to WSPARCIE TYLKO. Działania automatyczne to TWOJA ODPOWIEDZIALNOŚĆ.',
        es: 'Aunque ofrecemos características limitadoras de riesgo: SIN GARANTÍA de efectividad, SIN GARANTÍA contra pérdidas. Debes monitorear todas las acciones automatizadas. Debes verificar todas las decisiones automatizadas. Las características de riesgo son SOLO APOYO. Las acciones automatizadas son TU RESPONSABILIDAD.',
        ru: 'Хотя мы предлагаем функции ограничения риска: БЕЗ ГАРАНТИИ эффективности, БЕЗ ГАРАНТИИ от потерь. Ты должен контролировать все автоматизированные действия. Ты должен проверять все автоматизированные решения. Функции риска только для ПОДДЕРЖКИ. Автоматизированные действия — ТВОЯ ОТВЕТСТВЕННОСТЬ.',
      }),
    },
    {
      title: tr(language, { en: '9. PRIVACY & DATA PROTECTION', pl: '9. PRYWATNOŚĆ I OCHRONA DANYCH', es: '9. PRIVACIDAD Y PROTECCIÓN DE DATOS', ru: '9. КОНФИДЕНЦИАЛЬНОСТЬ И ЗАЩИТА ДАННЫХ' }),
      body: tr(language, {
        en: 'Data processed per GDPR/CCPA/UK GDPR. See Privacy Policy. User rights: access, delete, export, opt-out of non-essential processing. Data may be processed globally with AI providers. By using, you consent to international transfers.',
        pl: 'Dane przetwarzane per RODO/CCPA/UK GDPR. Zobacz Politykę Prywatności. Prawa użytkownika: dostęp, usunięcie, eksport, rezygnacja z przetwarzania nieistotnego. Dane mogą być przetwarzane globalnie z dostawcami AI. Korzystając, wyrażasz zgodę na transfery międzynarodowe.',
        es: 'Datos procesados según RGPD/CCPA/RGPD del RU. Ver Política de Privacidad. Derechos del usuario: acceso, eliminación, exportación, optar por no participar. Los datos pueden procesarse globalmente con proveedores de IA. Al usar, consientes transferencias internacionales.',
        ru: 'Данные обрабатываются согласно GDPR/CCPA/UK GDPR. Смотри Политику конфиденциальности. Права пользователя: доступ, удаление, экспорт, отказ от ненужной обработки. Данные могут обрабатываться глобально с поставщиками ИИ. Используя, ты соглашаешься с международными передачами.',
      }),
    },
    {
      title: tr(language, { en: '10. EXTERNAL INTEGRATIONS', pl: '10. INTEGRACJE ZEWNĘTRZNE', es: '10. INTEGRACIONES EXTERNAS', ru: '10. ВНЕШНИЕ ИНТЕГРАЦИИ' }),
      body: tr(language, {
        en: 'While we integrate with Shopify, WooCommerce, Amazon, and other platforms: NOT responsible for external service functionality, NOT liable for third-party failures, NOT liable for their security, NOT liable for API changes. Use integrations at YOUR OWN RISK.',
        pl: 'Chociaż integrujemy się z Shopify, WooCommerce, Amazon i innymi platformami: NIEODPOWIEDZIALNI za funkcjonalność usług zewnętrznych, NIEODPOWIEDZIALNI za awarie trzecich stron, NIEODPOWIEDZIALNI za ich bezpieczeństwo, NIEODPOWIEDZIALNI za zmiany API. Używaj integracji NA WŁASNE RYZYKO.',
        es: 'Aunque nos integramos con Shopify, WooCommerce, Amazon y otras plataformas: NO RESPONSABLES por funcionalidad de servicios externos, NO RESPONSABLES por fallas de terceros, NO RESPONSABLES por su seguridad, NO RESPONSABLES por cambios de API. Usa integraciones en TU PROPIO RIESGO.',
        ru: 'Хотя мы интегрируемся с Shopify, WooCommerce, Amazon и другими платформами: НЕ ОТВЕТСТВЕННЫ за функциональность внешних сервисов, НЕ ОТВЕТСТВЕННЫ за сбои третьих лиц, НЕ ОТВЕТСТВЕННЫ за их безопасность, НЕ ОТВЕТСТВЕННЫ за изменения API. Используй интеграции НА СВОЙ РИСК.',
      }),
    },
    {
      title: tr(language, { en: '11. SERVICE CHANGES & TERMINATION', pl: '11. ZMIANY USŁUGI I ZAKOŃCZENIE', es: '11. CAMBIOS Y TERMINACIÓN DE SERVICIO', ru: '11. ИЗМЕНЕНИЯ СЕРВИСА И ПРЕКРАЩЕНИЕ' }),
      body: tr(language, {
        en: 'We may modify service, features, plans, or pricing anytime. Major changes will be notified. Account termination: we may suspend/delete for legal violations, ToS breaches, security issues, or payment abuse. Users may cancel anytime via settings without penalty (except non-refundable fees).',
        pl: 'Możemy modyfikować usługę, funkcje, plany lub ceny w dowolnym momencie. Duże zmiany będą powiadamiane. Zakończenie konta: możemy wstrzymać/usunąć za naruszenia prawa, złamania warunków, problemy bezpieczeństwa lub nadużycia płatnicze. Użytkownicy mogą anulować w dowolnym momencie bez kary (poza opłatami bez zwrotu).',
        es: 'Podemos modificar el servicio, características, planes o precios en cualquier momento. Los cambios importantes serán notificados. Terminación de cuenta: podemos suspender/eliminar por violaciones legales, incumplimiento de ToS, problemas de seguridad o abuso de pago. Los usuarios pueden cancelar en cualquier momento sin penalización.',
        ru: 'Мы можем изменять сервис, функции, тарифы или цены в любой момент. Важные изменения будут уведомлены. Прекращение аккаунта: мы можем приостановить/удалить за нарушения закона, нарушение ToS, проблемы безопасности или мошенничество с оплатой. Пользователи могут отменить в любое время без штрафа (кроме невозвратных сборов).',
      }),
    },
    {
      title: tr(language, { en: '12. GOVERNING LAW & JURISDICTION', pl: '12. PRAWO WŁAŚCIWE I JURYSDYKCJA', es: '12. LEY APLICABLE Y JURISDICCIÓN', ru: '12. ПРИМЕНИМОЕ ПРАВО И ЮРИСДИКЦИЯ' }),
      body: tr(language, {
        en: `Polish law and EU regulations apply. Disputes resolved in Polish courts or through arbitration per Polish law. For users outside EU: local laws may apply in addition. Contact ${SITE.supportEmail} for disputes.`,
        pl: `Obowiązuje prawo polskie i przepisy UE. Spory rozstrzygane przez sądy polskie lub arbitraż per prawo polskie. Dla użytkowników spoza UE: prawo lokalne może dodatkowo obowiązywać. Skontaktuj się z ${SITE.supportEmail} w sprawie sporów.`,
        es: `Se aplica la ley polaca y las regulaciones de la UE. Las disputas se resuelven en tribunales polacos o mediante arbitraje según la ley polaca. Para usuarios fuera de la UE: las leyes locales pueden aplicarse además. Contacta a ${SITE.supportEmail} para disputas.`,
        ru: `Применимо польское право и нормы ЕС. Споры разрешаются польскими судами или через арбитраж согласно польскому праву. Для пользователей вне ЕС: местное право может дополнительно применяться. Свяжись с ${SITE.supportEmail} для разрешения споров.`,
      }),
    },
    {
      title: tr(language, { en: '13. CHANGES TO TERMS', pl: '13. ZMIANY WARUNKÓW', es: '13. CAMBIOS EN LOS TÉRMINOS', ru: '13. ИЗМЕНЕНИЯ УСЛОВИЙ' }),
      body: tr(language, {
        en: 'We may update these Terms anytime. Major changes will be notified via email or prominent banner. Continued use after changes = acceptance. Your continued use of the service constitutes full agreement.',
        pl: 'Możemy aktualizować te Warunki w dowolnym momencie. Duże zmiany będą powiadamiane mailowo lub widocznym bannerem. Kontynuowanie użytkowania = akceptacja. Twoje dalsze korzystanie z usługi stanowi pełną zgodę.',
        es: 'Podemos actualizar estos Términos en cualquier momento. Los cambios importantes serán notificados por email o banner prominente. El uso continuado = aceptación. Tu uso continuado constituye acuerdo completo.',
        ru: 'Мы можем обновлять эти Условия в любой момент. Важные изменения будут уведомлены по электронной почте или видимым баннером. Продолжение использования = принятие. Твое продолжение использования сервиса составляет полное согласие.',
      }),
    },
    {
      title: tr(language, { en: '14. FINAL PROVISIONS', pl: '14. POSTANOWIENIA KOŃCOWE', es: '14. DISPOSICIONES FINALES', ru: '14. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ' }),
      body: tr(language, {
        en: `By using ${SITE.name}, you accept these Terms in their entirety. Service provided "AS IS" without warranties. Contact ${SITE.supportEmail} with questions.`,
        pl: `Korzystając z ${SITE.name}, akceptujesz te Warunki w całości. Usługa świadczona "JAK JEST" bez gwarancji. Skontaktuj się z ${SITE.supportEmail} w razie pytań.`,
        es: `Al usar ${SITE.name}, aceptas estos Términos en su totalidad. Servicio proporcionado "TAL CUAL" sin garantías. Contacta a ${SITE.supportEmail} con preguntas.`,
        ru: `Используя ${SITE.name}, ты принимаешь эти Условия полностью. Сервис предоставляется "КАК ЕСТЬ" без гарантий. Свяжись с ${SITE.supportEmail} с вопросами.`,
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
      <div className="mt-8 flex gap-4 justify-center flex-wrap">
        <Link href="/privacy" className="text-cyan-300 hover:underline">Privacy Policy</Link>
        <Link href="/cookies" className="text-cyan-300 hover:underline">Cookies Policy</Link>
      </div>
    </main>
  );
}
