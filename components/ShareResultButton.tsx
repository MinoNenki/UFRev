'use client';

import type { Language } from '@/lib/i18n';

const tt = (l: Language, v: { en: string; pl: string; de?: string; es?: string; pt?: string; ja?: string; zh?: string; id?: string; ru?: string }) =>
  l === 'pl' ? v.pl : l === 'de' ? (v.de ?? v.en) : l === 'es' ? (v.es ?? v.pt ?? v.en) : l === 'pt' ? (v.pt ?? v.es ?? v.en) : l === 'ja' ? (v.ja ?? v.en) : l === 'zh' ? (v.zh ?? v.en) : l === 'id' ? (v.id ?? v.en) : l === 'ru' ? (v.ru ?? v.en) : v.en;

function scoreLabel(score: number, language: Language) {
  if (score >= 75) {
    return tt(language, { en: 'Scalable', pl: 'Skalowalne' });
  }

  if (score >= 45) {
    return tt(language, { en: 'Test carefully', pl: 'Testuj ostrożnie' });
  }

  return tt(language, { en: 'Too risky', pl: 'Zbyt ryzykowne' });
}

function shareHeadline(result: any, language: Language) {
  const score = Number(result?.score || 0);
  const margin = Number(result?.pricing?.marginPercent || 0);

  if (result?.verdict === 'AVOID' || score < 45) {
    return tt(language, {
      en: 'This product looks too risky to scale.',
      pl: 'Ten produkt wygląda na zbyt ryzykowny do skalowania.',
    });
  }

  if (margin > 0 && margin < 20) {
    return tt(language, {
      en: 'Margin looks too thin for safe scaling.',
      pl: 'Marża wygląda na zbyt cienką do bezpiecznego skalowania.',
    });
  }

  if (result?.verdict === 'BUY' || score >= 75) {
    return tt(language, {
      en: 'This product looks strong enough for a controlled scale test.',
      pl: 'Ten produkt wygląda dość mocno na kontrolowany test skali.',
    });
  }

  return tt(language, {
    en: 'This product needs a careful test before spending more.',
    pl: 'Ten produkt wymaga ostrożnego testu zanim wydasz więcej.',
  });
}

export default function ShareResultButton({ productName, result, currentLanguage = 'en' }: { productName: string; result: any; currentLanguage?: Language }) {
  if (!result) return null;

  const verdictLabel = String(result.verdict === 'AVOID' ? 'SKIP' : result.verdict || 'TEST');
  const score = Number(result.score || 0);
  const margin = Number(result?.pricing?.marginPercent || 0);
  const shareTitle = shareHeadline(result, currentLanguage);
  const shareText = `${shareTitle}\n\n${tt(currentLanguage, { en: 'Product', pl: 'Produkt', de: 'Produkt', es: 'Producto', pt: 'Produto', ru: 'Продукт' })}: ${productName || tt(currentLanguage, { en: 'Untitled', pl: 'Bez nazwy', de: 'Ohne Titel', es: 'Sin título', pt: 'Sem título', ru: 'Без названия' })}\n${tt(currentLanguage, { en: 'Verdict', pl: 'Werdykt', de: 'Urteil', es: 'Veredicto', pt: 'Veredito', ru: 'Вердикт' })}: ${verdictLabel}\n${tt(currentLanguage, { en: 'Score', pl: 'Wynik', de: 'Score', es: 'Puntuación', pt: 'Pontuação', ru: 'Оценка' })}: ${score}/100 (${scoreLabel(score, currentLanguage)})\n${tt(currentLanguage, { en: 'Margin', pl: 'Marża', de: 'Marge', es: 'Margen', pt: 'Margem', ru: 'Маржа' })}: ${margin ? `${margin}%` : '—'}\n${tt(currentLanguage, { en: 'Check yours', pl: 'Sprawdź swój', de: 'Prüfe dein Ergebnis', es: 'Comprueba el tuyo', pt: 'Vê o teu', ru: 'Проверь свой' })}: ${typeof window !== 'undefined' ? window.location.origin : ''}`;

  async function handleShare() {
    try {
      if (typeof window === 'undefined') return;

      const nav = window.navigator as Navigator & {
        share?: (data?: ShareData) => Promise<void>;
        clipboard?: Clipboard;
      };

      if (typeof nav.share === 'function') {
        await nav.share({
          title: shareTitle,
          text: shareText,
          url: window.location.origin,
        });
        return;
      }

      if (nav.clipboard?.writeText) {
        await nav.clipboard.writeText(shareText);
        alert(tt(currentLanguage, {
          en: 'Result copied to clipboard.',
          pl: 'Wynik skopiowany do schowka.',
          de: 'Ergebnis in die Zwischenablage kopiert.',
          es: 'Resultado copiado al portapapeles.',
          pt: 'Resultado copiado para a área de transferência.',
          ru: 'Результат скопирован в буфер обмена.',
        }));
        return;
      }

      throw new Error('share-unavailable');
    } catch {
      alert(tt(currentLanguage, {
        en: 'Could not share the result.',
        pl: 'Nie udało się udostępnić wyniku.',
        de: 'Das Ergebnis konnte nicht geteilt werden.',
        es: 'No se pudo compartir el resultado.',
        pt: 'Não foi possível partilhar o resultado.',
        ru: 'Не удалось поделиться результатом.',
      }));
    }
  }

  return (
    <button type="button" onClick={handleShare} className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/5">
      {tt(currentLanguage, { en: 'Share result', pl: 'Udostępnij wynik', de: 'Ergebnis teilen', es: 'Compartir resultado', pt: 'Partilhar resultado', ru: 'Поделиться результатом' })}
    </button>
  );
}
