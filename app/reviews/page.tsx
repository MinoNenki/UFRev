import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { Metadata } from 'next';
import InsightPanel from '@/components/pro-ui/InsightPanel';
import { tr } from '@/lib/i18n';
import { getLanguage } from '@/lib/i18n-server';

export const metadata: Metadata = {
  title: 'Customer Reviews and Product Validation Trust',
  description: 'Read customer reviews for UFREV.com and see how product review workflows, ecommerce validation and dropshipping checks support faster buying decisions.',
  alternates: { canonical: '/reviews' },
};

export default async function ReviewsPage({ searchParams }: { searchParams?: { sent?: string; error?: string } }) {
  const params = searchParams || {};
  const language = await getLanguage();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(24);

  return (
    <main className="mx-auto max-w-[1500px] px-6 py-16 text-white">
      <section className="rounded-[40px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_24%),linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.92))] p-8 shadow-[0_30px_140px_rgba(2,6,23,0.65)]">
        <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">{tr(language, { en: 'Customer reviews', pl: 'Opinie klientów', es: 'Reseñas de clientes', ru: 'Отзывы клиентов' })}</div>
        <h1 className="mt-4 text-5xl font-black tracking-tight">{tr(language, { en: 'Trust improves conversions and accelerates adoption', pl: 'Zaufanie poprawia konwersję i przyspiesza adopcję', es: 'La confianza mejora la conversión y acelera la adopción', ru: 'Доверие повышает конверсию и ускоряет внедрение' })}</h1>
        <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-300">{tr(language, { en: 'This premium review layer helps the product feel more established and enterprise-ready, while the moderation flow and protected logic remain unchanged.', pl: 'Ta premium warstwa opinii sprawia, że produkt wygląda bardziej dojrzale i gotowo dla firm, a moderacja i logika ochronna pozostają bez zmian.', es: 'Esta capa premium de reseñas hace que el producto se sienta más sólido y listo para empresas, mientras el flujo de moderación y la lógica protegida siguen igual.', ru: 'Этот премиальный слой отзывов делает продукт более зрелым и готовым для бизнеса, при этом модерация и защитная логика остаются без изменений.' })}</p>
      </section>

      {(params.sent || params.error) && (
        <div className={`mt-6 rounded-2xl border p-4 ${params.sent ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200' : 'border-rose-300/30 bg-rose-300/10 text-rose-200'}`}>
          {params.sent
            ? tr(language, { en: 'Thank you. Your review has been submitted for moderation.', pl: 'Dziękujemy. Twoja opinia została wysłana do moderacji.', es: 'Gracias. Tu reseña ha sido enviada para moderación.', ru: 'Спасибо. Твой отзыв отправлен на модерацию.' })
            : tr(language, { en: 'Please complete the form correctly.', pl: 'Uzupełnij formularz poprawnie.', es: 'Completa el formulario correctamente.', ru: 'Пожалуйста, правильно заполни форму.' })}
        </div>
      )}

      <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.88fr]">
        <div className="grid gap-6 md:grid-cols-2">
          {(reviews || []).map((item) => (
            <div key={item.id} className="rounded-[32px] border border-white/10 bg-slate-950/60 p-8 shadow-[0_24px_100px_rgba(2,6,23,0.45)]">
              <div className="mb-4 text-cyan-200">{'★'.repeat(item.rating)}</div>
              <p className="text-lg leading-8 text-slate-200">{item.content}</p>
              <div className="mt-6 font-semibold text-white">{item.name}</div>
              {item.company_or_role && <div className="text-sm text-slate-400">{item.company_or_role}</div>}
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <form action="/api/reviews/create" method="post" className="rounded-[32px] border border-white/10 bg-slate-950/60 p-8 shadow-[0_24px_100px_rgba(2,6,23,0.45)]">
            <h2 className="mb-6 text-2xl font-bold">{tr(language, { en: 'Submit a review', pl: 'Dodaj opinię', es: 'Enviar una reseña', ru: 'Оставить отзыв' })}</h2>
            <div><label className="mb-2 block text-sm text-slate-300">{tr(language, { en: 'Name or brand', pl: 'Imię lub marka', es: 'Nombre o marca', ru: 'Имя или бренд' })}</label><input name="name" defaultValue={user?.email?.split('@')[0] ?? ''} className="input" placeholder={tr(language, { en: 'Anna or Growth Studio', pl: 'Anna lub Growth Studio', es: 'Anna o Growth Studio', ru: 'Anna или Growth Studio' })} required /></div>
            <div className="mt-4"><label className="mb-2 block text-sm text-slate-300">{tr(language, { en: 'Role or company', pl: 'Rola lub firma', es: 'Rol o empresa', ru: 'Роль или компания' })}</label><input name="companyOrRole" className="input" placeholder={tr(language, { en: 'Store owner', pl: 'Właściciel sklepu', es: 'Dueño de tienda', ru: 'Владелец магазина' })} /></div>
            <div className="mt-4"><label className="mb-2 block text-sm text-slate-300">{tr(language, { en: 'Rating', pl: 'Ocena', es: 'Valoración', ru: 'Оценка' })}</label><select name="rating" className="input"><option value="5">5</option><option value="4">4</option><option value="3">3</option><option value="2">2</option><option value="1">1</option></select></div>
            <div className="mt-4"><label className="mb-2 block text-sm text-slate-300">{tr(language, { en: 'Review', pl: 'Opinia', es: 'Reseña', ru: 'Отзыв' })}</label><textarea name="content" rows={7} className="input" placeholder={tr(language, { en: 'Write a natural customer review', pl: 'Napisz naturalną opinię klienta', es: 'Escribe una reseña natural de cliente', ru: 'Напиши естественный отзыв клиента' })} required /></div>
            <button className="mt-6 rounded-2xl bg-cyan-300 px-6 py-3 font-semibold text-slate-950">{tr(language, { en: 'Send review', pl: 'Wyślij opinię', es: 'Enviar reseña', ru: 'Отправить отзыв' })}</button>
          </form>
          <InsightPanel
            language={language}
            title={tr(language, { en: 'Why reviews matter', pl: 'Dlaczego opinie są ważne', es: 'Por qué importan las reseñas', ru: 'Почему отзывы важны' })}
            items={[
              tr(language, { en: 'Approved reviews create trust and support paid conversion.', pl: 'Zatwierdzone opinie budują zaufanie i wspierają płatną konwersję.', es: 'Las reseñas aprobadas generan confianza y apoyan la conversión de pago.', ru: 'Одобренные отзывы создают доверие и поддерживают платную конверсию.' }),
              tr(language, { en: 'A more premium review experience strengthens the global SaaS impression.', pl: 'Bardziej premium doświadczenie opinii wzmacnia wrażenie globalnego SaaS.', es: 'Una experiencia de reseñas más premium refuerza la impresión de un SaaS global.', ru: 'Более премиальный опыт отзывов усиливает впечатление глобального SaaS.' }),
              tr(language, { en: 'The moderation flow stays protected in the admin panel.', pl: 'Przepływ moderacji pozostaje chroniony w panelu admina.', es: 'El flujo de moderación permanece protegido en el panel admin.', ru: 'Процесс модерации остаётся защищённым в админ-панели.' }),
            ]}
          />
        </div>
      </section>
    </main>
  );
}
