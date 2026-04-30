'use client';

import Simulator from '@/components/whatif/Simulator';
import { tr, type Language } from '@/lib/i18n';
import { deriveMarketWatch, deriveOpportunityProfile } from '@/lib/decision-engine';
import { convertCurrency, formatMoney, getCurrencyForLanguage, normalizeCurrencyCode, type SupportedCurrency } from '@/lib/currency';

const tt = tr;

type DecisionResultShape = {
  verdict: 'BUY' | 'TEST' | 'AVOID';
  score?: number;
  confidence?: number;
  confidenceLabel?: string;
  burnRisk?: 'Low' | 'Medium' | 'High';
  moatScore?: number;
  dataMode?: 'manual_only' | 'manual_plus_evidence' | 'connector_ready';
  executionMode?: 'safe_test' | 'manual_review' | 'scale_ready' | 'blocked';
  analysisMode?: 'product_analysis' | 'cost_optimization' | 'document_analysis' | 'visual_analysis' | 'service_estimation';
  analysisHeadline?: string;
  why?: string[];
  issues?: string[];
  improvements?: string[];
  marketSignals?: string[];
  guardrailsTriggered?: string[];
  capitalProtection?: string[];
  rolloutPlan?: string[];
  revenuePlaybook?: string[];
  factors?: Array<{ key: string; label: string; score: number; weight: number; impact: 'positive' | 'neutral' | 'negative'; explanation: string }>;
  text?: string;
  pricing?: {
    currentPrice?: number | null;
    estimatedCost?: number | null;
    currency?: string | null;
    marginPercent?: number | null;
    breakEvenROAS?: number | null;
    suggestedTestPrice?: number | null;
    suggestedPriceMin?: number | null;
    suggestedPriceMax?: number | null;
  };
  market?: {
    competitorAvgPrice?: number | null;
    marketMonthlyUnits?: number | null;
    estimatedMonthlyRevenue?: number | null;
    estimatedMonthlyTurnoverRange?: { low?: number | null; high?: number | null };
    displayCurrency?: string | null;
    sources?: {
      ownPrice?: string | null;
      competitorAvgPrice?: string | null;
      marketMonthlyUnits?: string | null;
    };
  };
  adStrategy?: {
    nextStep?: string;
    primaryChannel?: string;
    testBudget?: number | null;
    firstObjective?: string;
  };
  usagePricing?: {
    tokensCharged?: number | null;
    billingUnit?: string | null;
  };
  productSourcing?: {
    shortlistTitle?: string;
    notes?: string[];
    recommendedNextStep?: string;
    recommendedOffers?: Array<{
      title: string;
      url: string;
      platform?: string;
      price?: number | null;
      currency?: string | null;
      reviewCount?: number | null;
      rating?: number | null;
      risk?: 'low' | 'medium' | 'high';
      whyItFits?: string;
      sourceType?: string;
    }>;
  };
  serviceSetup?: {
    primaryLane?: string;
    secondaryLane?: string | null;
    laneReason?: string;
    benchmarkLinks?: string[];
    riskNotes?: string[];
    starterSteps?: string[];
    equipment?: Array<{
      item: string;
      purpose: string;
      priority: 'starter' | 'scale';
      estimatedCost?: number | null;
    }>;
    capexBuckets?: Array<{
      label: string;
      low?: number | null;
      high?: number | null;
      note: string;
    }>;
    pricePackages?: Array<{
      name: string;
      target: string;
      priceFrom?: number | null;
      priceTo?: number | null;
      note: string;
    }>;
  };
};

function verdictColor(verdict?: string) {
  if (verdict === 'BUY') return 'text-emerald-400';
  if (verdict === 'AVOID') return 'text-rose-400';
  return 'text-amber-300';
}

function top(items?: string[], limit = 3) {
  return (items || []).filter(Boolean).slice(0, limit);
}

function localizeVerdict(verdict: string | undefined, language: Language) {
  if (language === 'pl') {
    if (verdict === 'BUY') return 'KUP';
    if (verdict === 'AVOID') return 'ODPUŚĆ';
    return 'TEST';
  }
  if (language === 'ru') {
    if (verdict === 'BUY') return 'ПОКУПАТЬ';
    if (verdict === 'AVOID') return 'ИЗБЕГАТЬ';
    return 'ТЕСТ';
  }
  if (language === 'pt') {
    if (verdict === 'BUY') return 'COMPRAR';
    if (verdict === 'AVOID') return 'EVITAR';
    return 'TESTE';
  }
  if (verdict === 'AVOID') return 'SKIP';
  return verdict || 'TEST';
}

function localizeScoreBand(score: number | undefined, language: Language) {
  const value = Number(score || 0);

  if (language === 'pl') {
    if (value >= 75) return 'Skalowalne';
    if (value >= 45) return 'Testuj ostrożnie';
    return 'Ryzykowne';
  }

  if (value >= 75) return 'Scalable';
  if (value >= 45) return 'Test carefully';
  return 'Risky';
}

function localizeRisk(value: string | undefined, language: Language) {
  if (language === 'pl') {
    if (value === 'Low') return 'Niskie';
    if (value === 'High') return 'Wysokie';
    if (value === 'Medium') return 'Średnie';
    return value || '—';
  }
  if (language === 'ru') {
    if (value === 'Low') return 'Низкий';
    if (value === 'High') return 'Высокий';
    if (value === 'Medium') return 'Средний';
    return value || '—';
  }
  if (language === 'pt') {
    if (value === 'Low') return 'Baixo';
    if (value === 'High') return 'Alto';
    if (value === 'Medium') return 'Médio';
    return value || '—';
  }
  return value || '—';
}

function localizeConfidence(value: string | undefined, language: Language) {
  if (language === 'pl') {
    if (value === 'Low') return 'Niska';
    if (value === 'High') return 'Wysoka';
    if (value === 'Medium') return 'Średnia';
    return value || null;
  }
  if (language === 'ru') {
    if (value === 'Low') return 'Низкая';
    if (value === 'High') return 'Высокая';
    if (value === 'Medium') return 'Средняя';
    return value || null;
  }
  if (language === 'pt') {
    if (value === 'Low') return 'Baixa';
    if (value === 'High') return 'Alta';
    if (value === 'Medium') return 'Média';
    return value || null;
  }
  return value || null;
}

function localizeDataMode(value: string | undefined, language: Language) {
  if (language === 'pl') {
    if (value === 'manual_only') return 'Ręczny input';
    if (value === 'manual_plus_evidence') return 'Input + dowody';
    if (value === 'connector_ready') return 'Connector-ready';
    return value || '—';
  }
  if (language === 'es') {
    if (value === 'manual_only') return 'Entrada manual';
    if (value === 'manual_plus_evidence') return 'Entrada + evidencias';
    if (value === 'connector_ready') return 'Listo para conector';
    return value || '—';
  }
  if (language === 'ru') {
    if (value === 'manual_only') return 'Ручной ввод';
    if (value === 'manual_plus_evidence') return 'Ввод + доказательства';
    if (value === 'connector_ready') return 'Готово к коннектору';
    return value || '—';
  }
  return value ? value.replace(/_/g, ' ') : '—';
}

function localizeExecutionMode(value: string | undefined, language: Language) {
  if (language === 'pl') {
    if (value === 'safe_test') return 'Bezpieczny test';
    if (value === 'manual_review') return 'Ręczna akceptacja';
    if (value === 'scale_ready') return 'Gotowe do skali';
    if (value === 'blocked') return 'Zablokowane';
    return value || '—';
  }
  if (language === 'es') {
    if (value === 'safe_test') return 'Test seguro';
    if (value === 'manual_review') return 'Revisión manual';
    if (value === 'scale_ready') return 'Listo para escalar';
    if (value === 'blocked') return 'Bloqueado';
    return value || '—';
  }
  if (language === 'ru') {
    if (value === 'safe_test') return 'Безопасный тест';
    if (value === 'manual_review') return 'Ручная проверка';
    if (value === 'scale_ready') return 'Готово к масштабу';
    if (value === 'blocked') return 'Заблокировано';
    return value || '—';
  }
  return value ? value.replace(/_/g, ' ') : '—';
}

function opportunityTone(value: 'open' | 'guarded' | 'closed') {
  if (value === 'open') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
  if (value === 'closed') return 'border-rose-400/30 bg-rose-400/10 text-rose-200';
  return 'border-amber-300/30 bg-amber-300/10 text-amber-100';
}

function marketStatusTone(value: 'low' | 'medium' | 'high') {
  if (value === 'low') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
  if (value === 'high') return 'border-rose-400/30 bg-rose-400/10 text-rose-200';
  return 'border-amber-300/30 bg-amber-300/10 text-amber-100';
}

function localizePricePosition(value: 'below_market' | 'near_market' | 'above_market' | 'unknown', language: Language) {
  if (language === 'pl') {
    if (value === 'below_market') return 'Poniżej rynku';
    if (value === 'near_market') return 'Blisko rynku';
    if (value === 'above_market') return 'Powyżej rynku';
    return 'Brak benchmarku';
  }
  if (language === 'es') {
    if (value === 'below_market') return 'Por debajo del mercado';
    if (value === 'near_market') return 'Cerca del mercado';
    if (value === 'above_market') return 'Por encima del mercado';
    return 'Sin benchmark';
  }
  return value.replace(/_/g, ' ');
}

function localizeDemandProxy(value: 'strong' | 'moderate' | 'weak', language: Language) {
  if (language === 'pl') {
    if (value === 'strong') return 'Mocny';
    if (value === 'moderate') return 'Umiarkowany';
    return 'Słaby';
  }
  if (language === 'es') {
    if (value === 'strong') return 'Fuerte';
    if (value === 'moderate') return 'Moderada';
    return 'Débil';
  }
  return value;
}

function localizeSaturationRisk(value: 'low' | 'medium' | 'high', language: Language) {
  if (language === 'pl') {
    if (value === 'low') return 'Niskie';
    if (value === 'medium') return 'Średnie';
    return 'Wysokie';
  }
  if (language === 'es') {
    if (value === 'low') return 'Baja';
    if (value === 'medium') return 'Media';
    return 'Alta';
  }
  return value;
}

function hasLanguageMismatch(language: Language, values: Array<string | undefined>) {
  const joined = values.filter(Boolean).join(' ');
  if (!joined.trim()) return false;

  const hasPolish = /[ąćęłńóśżź]|Werdykt|Szacowan|Możliwa|Co widać|Tryb|Najnowszy/i.test(joined);
  const hasRussian = /[А-Яа-яЁё]/.test(joined);
  const hasJapanese = /[\u3040-\u30ff]/.test(joined);
  const hasChinese = /[\u4e00-\u9fff]/.test(joined) && !hasJapanese;
  const hasEnglishHeavy = /\b(the|and|for|with|what|review|visual|document|result|score|confidence|risk|needs|candidate|loaded|awaiting)\b/i.test(joined);

  if (language === 'ja') return !hasJapanese;
  if (language === 'zh') return !hasChinese;
  if (language === 'ru') return !hasRussian;
  if (language === 'pl') return hasEnglishHeavy || hasRussian || hasJapanese || hasChinese;
  if (language === 'en') return hasPolish || hasRussian || hasJapanese || hasChinese;
  if (language === 'pt' || language === 'es' || language === 'de' || language === 'id') {
    return hasPolish || hasRussian || hasJapanese || hasChinese || hasEnglishHeavy;
  }
  return false;
}

function buildLocalizedRolloutFallback(language: Language) {
  return [
    tt(language, { en: 'Wave 1: launch at low budget and verify CAC + conversion first.', pl: 'Fala 1: start na niskim budżecie i najpierw potwierdź CAC + konwersję.', es: 'Ola 1: lanza con presupuesto bajo y valida primero CAC + conversión.' }),
    tt(language, { en: 'Wave 2: increase spend only when margin and refund risk stay stable.', pl: 'Fala 2: zwiększaj budżet tylko gdy marża i ryzyko zwrotów są stabilne.', es: 'Ola 2: aumenta el gasto solo cuando el margen y el riesgo de devoluciones sigan estables.' }),
    tt(language, { en: 'Scale only after two stable test waves with repeatable results.', pl: 'Skaluj dopiero po dwóch stabilnych falach testu z powtarzalnym wynikiem.', es: 'Escala solo tras dos olas de prueba estables con resultados repetibles.' }),
  ];
}

function buildLocalizedCapitalFallback(language: Language) {
  return [
    tt(language, { en: 'Keep the first test budget capped and avoid one-shot spending.', pl: 'Utrzymuj limit pierwszego budżetu testowego i unikaj jednorazowego wydania całości.', es: 'Mantén limitado el primer presupuesto de prueba y evita gastarlo de una sola vez.' }),
    tt(language, { en: 'Pause scaling if CAC worsens or refund pressure starts rising.', pl: 'Wstrzymaj skalowanie, gdy CAC się pogarsza albo rośnie presja zwrotów.', es: 'Pausa el escalado si el CAC empeora o aumenta la presión de devoluciones.' }),
    tt(language, { en: 'Protect margin before increasing traffic volume.', pl: 'Chroń marżę przed zwiększaniem wolumenu ruchu.', es: 'Protege el margen antes de aumentar el volumen de tráfico.' }),
  ];
}

function buildLocalizedRevenueFallback(language: Language) {
  return [
    tt(language, { en: 'Use strong outcomes to push premium plan upgrades.', pl: 'Przy mocnych wynikach wykorzystaj upsell do planów premium.', es: 'Usa resultados fuertes para impulsar upgrades a planes premium.' }),
    tt(language, { en: 'Use medium outcomes for iterative tests and additional token packs.', pl: 'Przy średnich wynikach idź w iteracyjne testy i dodatkowe pakiety tokenów.', es: 'Usa resultados medios para pruebas iterativas y paquetes adicionales de tokens.' }),
    tt(language, { en: 'Use weak outcomes for low-cost reactivation and referral loops.', pl: 'Przy słabych wynikach użyj taniej reaktywacji i pętli poleceń.', es: 'Usa resultados débiles para reactivación de bajo coste y ciclos de referidos.' }),
  ];
}

function buildLocalizedOpportunityHeadline(
  language: Language,
  opportunityWindow: 'open' | 'guarded' | 'closed'
) {
  if (opportunityWindow === 'open') {
    return tt(language, {
      en: 'Momentum looks real. Scale carefully while the pricing window remains favorable.',
      pl: 'Momentum wygląda realnie. Skaluj ostrożnie, dopóki okno cenowe pozostaje korzystne.',
      es: 'El momentum parece real. Escala con cuidado mientras la ventana de precio siga favorable.',
    });
  }

  if (opportunityWindow === 'closed') {
    return tt(language, {
      en: 'Protect capital now. Market conditions are not safe enough for scale.',
      pl: 'Teraz chroń kapitał. Warunki rynkowe nie są jeszcze bezpieczne do skali.',
      es: 'Protege capital ahora. Las condiciones del mercado aún no son seguras para escalar.',
    });
  }

  return tt(language, {
    en: 'Run a controlled validation first before increasing spend.',
    pl: 'Najpierw wykonaj kontrolowaną walidację, zanim zwiększysz budżet.',
    es: 'Realiza primero una validación controlada antes de aumentar el gasto.',
  });
}

function buildLocalizedMarketWatchHeadline(
  language: Language,
  demandProxy: 'strong' | 'moderate' | 'weak',
  pricePosition: 'below_market' | 'near_market' | 'above_market' | 'unknown',
  saturationRisk: 'low' | 'medium' | 'high'
) {
  if (pricePosition === 'below_market' && demandProxy === 'strong' && saturationRisk !== 'high') {
    return tt(language, { en: 'There may be room to raise price without hurting conversion.', pl: 'Może być przestrzeń do podniesienia ceny bez utraty konwersji.', es: 'Puede haber margen para subir precio sin dañar la conversión.' });
  }

  if (pricePosition === 'above_market' && saturationRisk === 'high') {
    return tt(language, { en: 'Market pressure is high. Defend conversion before holding a premium price.', pl: 'Presja rynku jest wysoka. Najpierw obroń konwersję, zanim utrzymasz premium cenę.', es: 'La presión de mercado es alta. Defiende la conversión antes de mantener un precio premium.' });
  }

  if (demandProxy === 'weak') {
    return tt(language, { en: 'Demand is currently too soft for safe scale.', pl: 'Popyt jest teraz zbyt słaby na bezpieczne skalowanie.', es: 'La demanda está demasiado débil ahora para escalar con seguridad.' });
  }

  return tt(language, { en: 'Watch market conditions closely before increasing spend.', pl: 'Obserwuj warunki rynkowe zanim zwiększysz budżet.', es: 'Observa de cerca las condiciones del mercado antes de aumentar el gasto.' });
}

function buildLocalizedMarketWatchAlerts(
  language: Language,
  pricePosition: 'below_market' | 'near_market' | 'above_market' | 'unknown',
  demandProxy: 'strong' | 'moderate' | 'weak',
  saturationRisk: 'low' | 'medium' | 'high'
) {
  const items: string[] = [];

  if (pricePosition === 'below_market') items.push(tt(language, { en: 'Your price is below market benchmark.', pl: 'Twoja cena jest poniżej benchmarku rynkowego.', es: 'Tu precio está por debajo del benchmark de mercado.' }));
  if (pricePosition === 'above_market') items.push(tt(language, { en: 'Your price is above market benchmark.', pl: 'Twoja cena jest powyżej benchmarku rynkowego.', es: 'Tu precio está por encima del benchmark de mercado.' }));
  if (pricePosition === 'near_market') items.push(tt(language, { en: 'Your price is near market benchmark.', pl: 'Twoja cena jest blisko benchmarku rynkowego.', es: 'Tu precio está cerca del benchmark de mercado.' }));
  if (pricePosition === 'unknown') items.push(tt(language, { en: 'No reliable competitor benchmark is attached yet.', pl: 'Brakuje wiarygodnego benchmarku konkurencji.', es: 'Aún no hay un benchmark de competencia fiable adjunto.' }));

  if (demandProxy === 'strong') items.push(tt(language, { en: 'Demand proxy is strong enough for controlled testing.', pl: 'Proxy popytu jest wystarczająco mocne do kontrolowanego testu.', es: 'El proxy de demanda es lo bastante fuerte para una prueba controlada.' }));
  if (demandProxy === 'weak') items.push(tt(language, { en: 'Demand proxy remains weak, so scaling is risky.', pl: 'Proxy popytu pozostaje słabe, więc skalowanie jest ryzykowne.', es: 'El proxy de demanda sigue débil, por lo que escalar es arriesgado.' }));

  if (saturationRisk === 'high') items.push(tt(language, { en: 'Competition saturation is high and may raise CAC pressure.', pl: 'Nasycenie konkurencji jest wysokie i może podnieść presję CAC.', es: 'La saturación competitiva es alta y puede elevar la presión de CAC.' }));
  if (saturationRisk === 'low') items.push(tt(language, { en: 'Competition pressure is relatively manageable.', pl: 'Presja konkurencji jest relatywnie umiarkowana.', es: 'La presión competitiva es relativamente manejable.' }));

  return items.slice(0, 4);
}

function buildLocalizedMarketWatchMoves(
  language: Language,
  pricePosition: 'below_market' | 'near_market' | 'above_market' | 'unknown',
  demandProxy: 'strong' | 'moderate' | 'weak',
  saturationRisk: 'low' | 'medium' | 'high'
) {
  const items: string[] = [];

  if (pricePosition === 'below_market') items.push(tt(language, { en: 'Test a small price lift and watch conversion impact.', pl: 'Przetestuj niewielkie podniesienie ceny i obserwuj wpływ na konwersję.', es: 'Prueba una pequeña subida de precio y observa el impacto en conversión.' }));
  if (pricePosition === 'above_market') items.push(tt(language, { en: 'Strengthen moat, guarantee, or proof before defending premium price.', pl: 'Wzmocnij moat, gwarancję albo dowody zanim obronisz cenę premium.', es: 'Refuerza propuesta, garantía o prueba antes de defender un precio premium.' }));
  if (pricePosition === 'unknown') items.push(tt(language, { en: 'Add competitor links to sharpen pricing readout.', pl: 'Dodaj linki konkurencji, aby zawęzić odczyt cenowy.', es: 'Añade enlaces de competencia para afinar la lectura de precios.' }));

  if (demandProxy === 'weak') items.push(tt(language, { en: 'Run low-budget creative tests before inventory decisions.', pl: 'Wykonaj niskobudżetowe testy kreacji przed decyzją o zatowarowaniu.', es: 'Ejecuta pruebas creativas de bajo presupuesto antes de decidir inventario.' }));
  if (demandProxy === 'strong') items.push(tt(language, { en: 'Keep the test structured and scale in controlled waves.', pl: 'Utrzymaj test w strukturze i skaluj falami kontrolowanymi.', es: 'Mantén la prueba estructurada y escala en olas controladas.' }));

  if (saturationRisk === 'high') items.push(tt(language, { en: 'Go niche-first or improve offer differentiation before scaling spend.', pl: 'Idź najpierw niszą albo popraw wyróżnik oferty przed skalowaniem budżetu.', es: 'Empieza por nicho o mejora la diferenciación de la oferta antes de escalar gasto.' }));

  return items.slice(0, 4);
}

function buildGenericNarrative(result: DecisionResultShape, language: Language) {
  const isCostMode = result.analysisMode === 'cost_optimization';
  const isDocumentMode = result.analysisMode === 'document_analysis';
  const isVisualMode = result.analysisMode === 'visual_analysis';

  return {
    title: isDocumentMode
      ? tt(language, { en: 'Document review summary', pl: 'Podsumowanie przeglądu dokumentu', es: 'Resumen de revisión del documento', pt: 'Resumo da revisão do documento', ru: 'Сводка проверки документа' })
      : isVisualMode
        ? tt(language, { en: 'Visual review summary', pl: 'Podsumowanie odczytu wizualnego', es: 'Resumen de revisión visual', pt: 'Resumo da leitura visual', ru: 'Сводка визуального анализа' })
        : isCostMode
          ? tt(language, { en: 'Local cost estimate summary', pl: 'Podsumowanie lokalnej estymacji kosztów', es: 'Resumen de estimación local de costes', pt: 'Resumo da estimativa local de custos', ru: 'Сводка локальной оценки затрат' })
          : tt(language, { en: 'Decision summary', pl: 'Podsumowanie decyzji', es: 'Resumen de decisión', pt: 'Resumo da decisão', ru: 'Сводка решения' }),
    notice: tt(language, {
      en: 'This saved analysis was generated in a different language. Run a fresh analysis to get the full narrative in the selected locale.',
      pl: 'Ta zapisana analiza została wygenerowana w innym języku. Uruchom nową analizę, aby dostać pełny opis w wybranym języku.',
      es: 'Este análisis guardado se generó en otro idioma. Ejecuta un análisis nuevo para obtener la narrativa completa en el idioma seleccionado.',
      pt: 'Esta análise guardada foi gerada noutro idioma. Execute uma nova análise para obter o texto completo no idioma selecionado.',
      ru: 'Этот сохранённый анализ был создан на другом языке. Запусти новый анализ, чтобы получить полный текст на выбранном языке.'
    }),
    reasons: isVisualMode
      ? [
          tt(language, { en: 'Visual mode is active, so the system focuses on what is actually visible.', pl: 'Tryb wizualny jest aktywny, więc system skupia się na tym, co naprawdę widać.', es: 'El modo visual está activo, por eso el sistema se centra en lo que realmente se ve.', pt: 'O modo visual está ativo, por isso o sistema foca no que realmente está visível.', ru: 'Включён визуальный режим, поэтому система опирается на то, что реально видно.' }),
          tt(language, { en: 'The safest reading avoids guessing small or unclear details.', pl: 'Najbezpieczniejszy odczyt unika zgadywania małych lub nieczytelnych detali.', es: 'La lectura más segura evita adivinar detalles pequeños o poco claros.', pt: 'A leitura mais segura evita adivinhar detalhes pequenos ou pouco nítidos.', ru: 'Самый безопасный разбор не угадывает мелкие или нечёткие детали.' }),
          tt(language, { en: 'Add clearer context if you want a deeper business conclusion.', pl: 'Dodaj wyraźniejszy kontekst, jeśli chcesz głębszy wniosek biznesowy.', es: 'Añade contexto más claro si quieres una conclusión de negocio más profunda.', pt: 'Adicione contexto mais claro se quiser uma conclusão de negócio mais profunda.', ru: 'Добавь более ясный контекст, если нужен более глубокий бизнес-вывод.' }),
        ]
      : isDocumentMode
        ? [
            tt(language, { en: 'Document mode reviews the file conservatively and avoids inventing missing facts.', pl: 'Tryb dokumentu ocenia plik ostrożnie i nie dopowiada brakujących faktów.', es: 'El modo documento revisa el archivo de forma conservadora y evita inventar datos faltantes.', pt: 'O modo de documento avalia o ficheiro com cautela e não inventa dados ausentes.', ru: 'Режим документа оценивает файл осторожно и не выдумывает отсутствующие факты.' }),
            tt(language, { en: 'Readable structure, amounts, and deadlines improve confidence.', pl: 'Czytelna struktura, kwoty i terminy podnoszą pewność oceny.', es: 'La estructura legible, importes y plazos mejoran la confianza.', pt: 'Estrutura legível, valores e prazos aumentam a confiança da avaliação.', ru: 'Понятная структура, суммы и сроки повышают уверенность оценки.' }),
            tt(language, { en: 'A clearer file or short summary helps produce a stronger conclusion.', pl: 'Czytelniejszy plik lub krótkie streszczenie pomagają dać mocniejszy wniosek.', es: 'Un archivo más claro o un resumen corto ayuda a construir una conclusión más sólida.', pt: 'Um ficheiro mais legível ou um resumo curto ajudam a gerar uma conclusão mais forte.', ru: 'Более читаемый файл или краткое резюме помогают дать более сильный вывод.' }),
          ]
        : [
            tt(language, { en: 'The result keeps the anti-loss logic and local market context in view.', pl: 'Wynik zachowuje logikę anti-loss i uwzględnia lokalny kontekst rynku.', es: 'El resultado mantiene visible la lógica anti-loss y el contexto local de mercado.', pt: 'O resultado mantém a lógica anti-loss e o contexto do mercado local.', ru: 'Результат сохраняет anti-loss логику и учитывает локальный контекст рынка.' }),
            tt(language, { en: 'Margin, confidence, and risk remain the main decision anchors.', pl: 'Marża, pewność i ryzyko pozostają głównymi kotwicami decyzji.', es: 'Margen, confianza y riesgo siguen siendo los anclajes principales de la decisión.', pt: 'Margem, confiança e risco continuam a ser as principais bases da decisão.', ru: 'Маржа, уверенность и риск остаются ключевыми опорами решения.' }),
            tt(language, { en: 'Use the local estimate to compare the offer safely before scaling.', pl: 'Użyj lokalnej estymacji, aby bezpiecznie porównać ofertę przed skalowaniem.', es: 'Usa la estimación local para comparar la oferta con seguridad antes de escalar.', pt: 'Use a estimativa local para comparar a oferta com segurança antes de escalar.', ru: 'Используй локальную оценку, чтобы безопасно сравнить оффер перед масштабированием.' }),
          ],
    issues: [
      tt(language, { en: 'Mixed-language saved text can confuse the readout if an old result was created in another locale.', pl: 'Mieszany język zapisanych wyników może mylić odczyt, gdy stary wynik powstał w innym locale.', es: 'El texto guardado en idioma mixto puede confundir la lectura si el resultado antiguo se creó en otra configuración regional.', pt: 'Texto guardado em idioma misto pode confundir a leitura se o resultado antigo foi criado noutro locale.', ru: 'Смешанный язык сохранённых результатов может путать, если старый результат был создан в другой локали.' }),
      tt(language, { en: 'A stronger verdict needs clear numbers, market context, or a clearer file.', pl: 'Mocniejszy werdykt wymaga czytelnych liczb, kontekstu rynku albo wyraźniejszego pliku.', es: 'Un veredicto más sólido necesita números claros, contexto de mercado o un archivo más legible.', pt: 'Um veredito mais forte exige números claros, contexto de mercado ou um ficheiro mais legível.', ru: 'Для более сильного вердикта нужны ясные цифры, контекст рынка или более читаемый файл.' }),
      tt(language, { en: 'Use a fresh analysis after switching language to avoid old narrative leftovers.', pl: 'Po zmianie języka uruchom nową analizę, aby uniknąć pozostałości starego opisu.', es: 'Ejecuta un análisis nuevo tras cambiar el idioma para evitar restos narrativos antiguos.', pt: 'Após mudar o idioma, execute uma nova análise para evitar restos do texto antigo.', ru: 'После смены языка запусти новый анализ, чтобы не было остатков старого описания.' }),
    ],
    actions: [
      tt(language, { en: 'Run a fresh analysis in the currently selected language.', pl: 'Uruchom nową analizę w aktualnie wybranym języku.', es: 'Ejecuta un análisis nuevo en el idioma seleccionado actualmente.', pt: 'Execute uma nova análise no idioma atualmente selecionado.', ru: 'Запусти новый анализ на выбранном сейчас языке.' }),
      tt(language, { en: 'Keep the target country selected so the estimate stays in the local currency.', pl: 'Zachowaj wybrany kraj docelowy, aby estymacja pozostała w lokalnej walucie.', es: 'Mantén el país objetivo seleccionado para que la estimación se mantenga en moneda local.', pt: 'Mantenha o país-alvo selecionado para que a estimativa permaneça na moeda local.', ru: 'Оставь выбранную целевую страну, чтобы оценка оставалась в местной валюте.' }),
      tt(language, { en: 'If needed, add clearer price, cost, and competitor data for a tighter estimate.', pl: 'W razie potrzeby dodaj czytelniejsze dane o cenie, koszcie i konkurencji, aby zawęzić estymację.', es: 'Si hace falta, añade datos más claros de precio, coste y competencia para ajustar la estimación.', pt: 'Se necessário, adicione dados mais claros de preço, custo e concorrência para afinar a estimativa.', ru: 'При необходимости добавь более ясные данные о цене, себестоимости и конкурентах для точной оценки.' }),
    ],
  };
}

function extractHeadlineFromText(text?: string) {
  const firstLine = String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) return null;

  return firstLine
    .replace(/^(Werdykt|Verdict)\s*:\s*/i, '')
    .replace(/^[•\-]\s*/, '')
    .trim();
}

function MetricCard({ label, value, sublabel }: { label: string; value: string; sublabel?: string | null; language?: Language }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5">
      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-2 break-words text-[clamp(1.1rem,2vw,1.35rem)] font-black leading-normal text-white [overflow-wrap:anywhere]">{value}</div>
      {sublabel ? <div className="mt-1 text-xs text-slate-500">{sublabel}</div> : null}
    </div>
  );
}

function riskTone(value?: 'low' | 'medium' | 'high') {
  if (value === 'low') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100';
  if (value === 'high') return 'border-rose-400/30 bg-rose-400/10 text-rose-100';
  return 'border-amber-300/30 bg-amber-300/10 text-amber-100';
}

function MoneyRow({
  label,
  value,
  currency,
  language,
}: {
  label: string;
  value?: number | null;
  currency?: string | null;
  language: Language;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[20px] border border-white/10 bg-slate-950/40 px-4 py-3.5">
      <div className="text-sm text-slate-300">{label}</div>
      <div className="text-sm font-semibold text-white">
        {typeof value === 'number' && currency ? formatMoney(value, language, currency as SupportedCurrency) : '—'}
      </div>
    </div>
  );
}

function buildDecisionResultViewModel(result: DecisionResultShape, currentLanguage: Language) {
  const isCostMode = result.analysisMode === 'cost_optimization';
  const isDocumentMode = result.analysisMode === 'document_analysis';
  const isVisualMode = result.analysisMode === 'visual_analysis';
  const isServiceMode = result.analysisMode === 'service_estimation';
  const showGrowthIntel = !isCostMode && !isDocumentMode && !isVisualMode;
  const currency = normalizeCurrencyCode(result.market?.displayCurrency || result.pricing?.currency || null, getCurrencyForLanguage(currentLanguage));
  const sourceCurrency = normalizeCurrencyCode(result.pricing?.currency || result.market?.displayCurrency || null, currency);
  const convertAmount = (value?: number | null) => (typeof value === 'number' ? convertCurrency(value, sourceCurrency, currency) : value);
  const narrativeMismatch = hasLanguageMismatch(currentLanguage, [result.analysisHeadline, result.text, ...(result.why || []), ...(result.issues || []), ...(result.improvements || [])]);
  const genericNarrative = buildGenericNarrative(result, currentLanguage);
  const reasons = narrativeMismatch ? genericNarrative.reasons : top(result.why, 3);
  const issues = narrativeMismatch ? genericNarrative.issues : top(result.issues, 3);
  const actions = narrativeMismatch ? genericNarrative.actions : top(result.improvements, 3);
  const signals = narrativeMismatch
    ? [tt(currentLanguage, { en: `Estimated result currency: ${currency}.`, pl: `Szacowana waluta wyniku: ${currency}.`, es: `Moneda estimada del resultado: ${currency}.`, pt: `Moeda estimada do resultado: ${currency}.`, ru: `Оценочная валюта результата: ${currency}.` })]
    : top(result.marketSignals, isDocumentMode ? 4 : 3);
  const derivedHeadline = extractHeadlineFromText(result.text);
  const marketContext = {
    competitorAvgPrice: result.market?.competitorAvgPrice ?? null,
    marketMonthlyUnits: result.market?.marketMonthlyUnits ?? null,
    estimatedMonthlyRevenue: result.market?.estimatedMonthlyRevenue ?? null,
    estimatedMonthlyTurnoverRange: {
      low: result.market?.estimatedMonthlyTurnoverRange?.low ?? null,
      high: result.market?.estimatedMonthlyTurnoverRange?.high ?? null,
    },
    displayCurrency: result.market?.displayCurrency ?? currency,
  };
  const pricingContext = {
    currentPrice: result.pricing?.currentPrice ?? 0,
    estimatedCost: result.pricing?.estimatedCost ?? 0,
    currency: result.pricing?.currency ?? currency,
    marginPercent: result.pricing?.marginPercent ?? 0,
    breakEvenROAS: result.pricing?.breakEvenROAS ?? null,
    suggestedPriceMin: result.pricing?.suggestedPriceMin ?? null,
    suggestedPriceMax: result.pricing?.suggestedPriceMax ?? null,
    suggestedTestPrice: result.pricing?.suggestedTestPrice ?? null,
  };
  const opportunity = deriveOpportunityProfile({
    score: result.score ?? 0,
    confidence: result.confidence ?? 0,
    burnRisk: (result.burnRisk as 'Low' | 'Medium' | 'High') || 'Medium',
    verdict: result.verdict,
    executionMode: result.executionMode || 'safe_test',
    moatScore: result.moatScore ?? 0,
    pricing: pricingContext,
    market: marketContext,
  });
  const marketWatch = deriveMarketWatch({
    score: result.score ?? 0,
    confidence: result.confidence ?? 0,
    burnRisk: (result.burnRisk as 'Low' | 'Medium' | 'High') || 'Medium',
    moatScore: result.moatScore ?? 0,
    pricing: pricingContext,
    market: marketContext,
    factors: result.factors || [],
  });
  const rolloutPlan = top(result.rolloutPlan, 4);
  const capitalProtection = top(result.capitalProtection, 4);
  const guardrails = top(result.guardrailsTriggered, 4);
  const revenuePlaybook = top(result.revenuePlaybook, 4);
  const localizedRolloutPlan = buildLocalizedRolloutFallback(currentLanguage);
  const localizedCapitalProtection = buildLocalizedCapitalFallback(currentLanguage);
  const localizedRevenuePlaybook = buildLocalizedRevenueFallback(currentLanguage);
  const opportunityHeadline = buildLocalizedOpportunityHeadline(currentLanguage, opportunity.opportunityWindow);
  const marketWatchHeadline = buildLocalizedMarketWatchHeadline(currentLanguage, marketWatch.demandProxy, marketWatch.pricePosition, marketWatch.saturationRisk);
  const marketWatchAlerts = buildLocalizedMarketWatchAlerts(currentLanguage, marketWatch.pricePosition, marketWatch.demandProxy, marketWatch.saturationRisk);
  const marketWatchMoves = buildLocalizedMarketWatchMoves(currentLanguage, marketWatch.pricePosition, marketWatch.demandProxy, marketWatch.saturationRisk);
  const primaryNextStep = actions[0] || tt(currentLanguage, { en: 'Run a controlled test first.', pl: 'Najpierw uruchom kontrolowany test.', es: 'Ejecuta primero una prueba controlada.', pt: 'Executa primeiro um teste controlado.', ru: 'Сначала запусти контролируемый тест.' });
  const sourcingOffers = result.productSourcing?.recommendedOffers || [];
  const serviceSetup = result.serviceSetup || null;
  const benchmarkLinks = serviceSetup?.benchmarkLinks || [];
  const userPlanLinks = [
    ...sourcingOffers.map((offer) => ({
      label: offer.title,
      url: offer.url,
      meta: [offer.platform, typeof offer.price === 'number' && offer.currency ? formatMoney(offer.price, currentLanguage, offer.currency as SupportedCurrency) : null].filter(Boolean).join(' • '),
    })),
    ...benchmarkLinks.map((url) => ({
      label: tt(currentLanguage, { en: 'Market benchmark', pl: 'Benchmark rynkowy' }),
      url,
      meta: tt(currentLanguage, { en: 'Local pricing reference', pl: 'Punkt odniesienia dla cen lokalnych' }),
    })),
  ].filter((item, index, array) => item.url && array.findIndex((candidate) => candidate.url === item.url) === index).slice(0, 5);

  const title = narrativeMismatch
    ? genericNarrative.title
    : result.analysisHeadline ||
      derivedHeadline ||
      (result.verdict === 'BUY'
        ? tt(currentLanguage, { en: 'Good candidate for a controlled test', pl: 'Są podstawy do kontrolowanego wejścia', pt: 'Bom candidato para um teste controlado', ru: 'Есть основания для контролируемого теста' })
        : result.verdict === 'AVOID'
          ? tt(currentLanguage, { en: 'Avoid for now', pl: 'Na ten moment lepiej odpuścić', pt: 'Melhor evitar por agora', ru: 'Пока лучше избегать' })
          : tt(currentLanguage, { en: 'Needs a short controlled test', pl: 'Wymaga krótkiego, kontrolowanego testu', pt: 'Precisa de um teste curto e controlado', ru: 'Нужен короткий контролируемый тест' }));

  const infoCardClass = 'rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(15,23,42,0.42))] p-4 sm:p-5';
  const infoTitleClass = 'text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300';
  const infoBodyClass = 'mt-3 space-y-2 text-[15px] leading-7 text-slate-100';

  return {
    isCostMode,
    isDocumentMode,
    isVisualMode,
    isServiceMode,
    showGrowthIntel,
    currency,
    sourceCurrency,
    convertAmount,
    narrativeMismatch,
    genericNarrative,
    reasons,
    issues,
    actions,
    signals,
    derivedHeadline,
    marketContext,
    pricingContext,
    opportunity,
    marketWatch,
    opportunityHeadline,
    marketWatchHeadline,
    marketWatchAlerts,
    marketWatchMoves,
    rolloutPlan,
    capitalProtection,
    guardrails,
    revenuePlaybook,
    localizedRolloutPlan,
    localizedCapitalProtection,
    localizedRevenuePlaybook,
    primaryNextStep,
    sourcingOffers,
    serviceSetup,
    benchmarkLinks,
    userPlanLinks,
    title,
    infoCardClass,
    infoTitleClass,
    infoBodyClass,
  };
}

export default function DecisionResult({
  result,
  currentLanguage,
}: {
  result: DecisionResultShape;
  currentLanguage: Language;
}) {
  if (!result) return null;

  const model = buildDecisionResultViewModel(result, currentLanguage);
  const {
    isCostMode,
    isDocumentMode,
    isVisualMode,
    isServiceMode,
    showGrowthIntel,
    currency,
    narrativeMismatch,
    genericNarrative,
    reasons,
    issues,
    actions,
    primaryNextStep,
    sourcingOffers,
    serviceSetup,
    userPlanLinks,
    title,
    infoCardClass,
    infoTitleClass,
    infoBodyClass,
  } = model;

  return (
    <div className="space-y-5">
      <div className="rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(15,23,42,0.72))] p-5 sm:p-6 xl:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="glass-chip border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                {tt(currentLanguage, { en: 'Global enterprise view', pl: 'Globalny widok enterprise', es: 'Vista global enterprise', pt: 'Vista enterprise global', ru: 'Глобальный enterprise-вид' })}
              </span>
              <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${verdictColor(result.verdict)} border-current/20 bg-white/5`}>
                {isDocumentMode
                  ? tt(currentLanguage, { en: 'Document mode', pl: 'Tryb dokumentu', pt: 'Modo de documento', ru: 'Режим документа' })
                  : isVisualMode
                    ? tt(currentLanguage, { en: 'Visual mode', pl: 'Tryb wizualny', pt: 'Modo visual', ru: 'Визуальный режим' })
                    : isServiceMode
                      ? tt(currentLanguage, { en: 'Service mode', pl: 'Tryb usługowy', pt: 'Modo de serviços', ru: 'Сервисный режим' })
                    : isCostMode
                      ? tt(currentLanguage, { en: 'Cost mode', pl: 'Tryb kosztowy', pt: 'Modo de custos', ru: 'Режим затрат' })
                      : tt(currentLanguage, { en: 'Decision mode', pl: 'Tryb decyzji', pt: 'Modo de decisão', ru: 'Режим решения' })}
              </span>
            </div>

            <div className="mt-4 text-[11px] uppercase tracking-[0.24em] text-cyan-200">
              {tt(currentLanguage, { en: 'Analysis result', pl: 'Wynik analizy', es: 'Resultado del análisis', pt: 'Resultado da análise', ru: 'Результат анализа' })}
            </div>
            <h3 className="mt-3 max-w-4xl text-2xl font-black leading-[1.05] tracking-tight text-white sm:text-3xl xl:text-[2.35rem]">
              {title}
            </h3>

            {narrativeMismatch ? (
              <div className="mt-5 rounded-[24px] border border-amber-300/20 bg-amber-300/10 p-4 text-[14px] leading-7 text-amber-100 sm:p-5">
                {genericNarrative.notice}
              </div>
            ) : (
              <div className="mt-5 rounded-[24px] border border-white/5 bg-slate-950/35 p-4 text-[14px] leading-7 text-slate-200 sm:p-5">
                {tt(currentLanguage, { en: 'Read the first four fields first: verdict, margin, risk, and next step. Everything else is available below in advanced reasoning.', pl: 'Najpierw przeczytaj cztery pola: werdykt, marża, ryzyko i następny krok. Reszta jest niżej w sekcji zaawansowanego uzasadnienia.', es: 'Lee primero estos cuatro campos: veredicto, margen, riesgo y siguiente paso. Todo lo demás está abajo en el razonamiento avanzado.', pt: 'Lê primeiro os quatro campos: veredito, margem, risco e próximo passo. O resto fica abaixo na secção avançada.', ru: 'Сначала прочитай четыре поля: вердикт, маржа, риск и следующий шаг. Остальное ниже в расширенной секции.' })}
              </div>
            )}
          </div>

          <div className="min-w-[220px] rounded-[24px] border border-white/10 bg-slate-950/40 p-4 sm:p-5 xl:max-w-[260px]">
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
              {tt(currentLanguage, { en: 'Executive summary', pl: 'Podsumowanie zarządcze', pt: 'Resumo executivo', ru: 'Краткое резюме' })}
            </div>
            <div className={`mt-3 text-2xl font-black ${verdictColor(result.verdict)}`}>
              {isDocumentMode
                ? tt(currentLanguage, { en: 'Review', pl: 'Przegląd', pt: 'Revisão', ru: 'Обзор' })
                : isVisualMode
                  ? tt(currentLanguage, { en: 'Insight', pl: 'Odczyt', pt: 'Insight', ru: 'Инсайт' })
                  : isServiceMode
                    ? tt(currentLanguage, { en: 'Strategy', pl: 'Strategia', pt: 'Estratégia', ru: 'Стратегия' })
                  : localizeVerdict(result.verdict, currentLanguage)}
            </div>
            <div className="mt-4 grid gap-2 text-sm text-slate-300">
              <div className="flex items-center justify-between gap-4">
                <span>{tt(currentLanguage, { en: 'Score', pl: 'Wynik', pt: 'Pontuação', ru: 'Оценка' })}</span>
                <span className="font-semibold text-white">{result.score ?? 0}/100</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>{tt(currentLanguage, { en: 'Score label', pl: 'Etykieta wyniku' })}</span>
                <span className="font-semibold text-white">{localizeScoreBand(result.score, currentLanguage)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>{tt(currentLanguage, { en: 'Confidence', pl: 'Pewność', pt: 'Confiança', ru: 'Уверенность' })}</span>
                <span className="font-semibold text-white">{result.confidence ?? 0}/100</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>{tt(currentLanguage, { en: 'Risk', pl: 'Ryzyko', pt: 'Risco', ru: 'Риск' })}</span>
                <span className="font-semibold text-white">{localizeRisk(result.burnRisk, currentLanguage)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>{tt(currentLanguage, { en: 'Usage cost', pl: 'Koszt użycia', pt: 'Custo de uso', ru: 'Стоимость использования' })}</span>
                <span className="font-semibold text-white">{result.usagePricing?.tokensCharged ?? 1} {tt(currentLanguage, { en: 'AI tokens', pl: 'tokenów AI', pt: 'tokens AI', ru: 'AI токенов' })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <MetricCard
          language={currentLanguage}
          label={tt(currentLanguage, { en: 'Verdict', pl: 'Werdykt', pt: 'Veredito', ru: 'Вердикт' })}
          value={isDocumentMode ? tt(currentLanguage, { en: 'Review', pl: 'Przegląd', pt: 'Revisão', ru: 'Обзор' }) : isVisualMode ? tt(currentLanguage, { en: 'Insight', pl: 'Odczyt', pt: 'Insight', ru: 'Инсайт' }) : localizeVerdict(result.verdict, currentLanguage)}
        />
        <MetricCard
          language={currentLanguage}
          label={isDocumentMode || isVisualMode || isServiceMode ? tt(currentLanguage, { en: 'Readiness', pl: 'Gotowość', pt: 'Prontidão', ru: 'Готовность' }) : tt(currentLanguage, { en: 'Margin', pl: 'Marża', pt: 'Margem', ru: 'Маржа' })}
          value={isDocumentMode || isVisualMode || isServiceMode ? `${result.moatScore ?? 0}%` : typeof result.pricing?.marginPercent === 'number' ? `${result.pricing.marginPercent}%` : '—'}
          sublabel={!isDocumentMode && !isVisualMode ? `${tt(currentLanguage, { en: 'Score', pl: 'Wynik', pt: 'Pontuação', ru: 'Оценка' })}: ${result.score ?? 0}/100` : undefined}
        />
        <MetricCard
          language={currentLanguage}
          label={tt(currentLanguage, { en: 'Risk', pl: 'Ryzyko', pt: 'Risco', ru: 'Риск' })}
          value={localizeRisk(result.burnRisk, currentLanguage)}
          sublabel={localizeConfidence(result.confidenceLabel, currentLanguage)}
        />
        <MetricCard
          language={currentLanguage}
          label={tt(currentLanguage, { en: 'Next step', pl: 'Następny krok', pt: 'Próximo passo', ru: 'Следующий шаг' })}
          value={String(primaryNextStep)}
        />
      </div>
    </div>
  );
}

export function AdvancedDecisionReasoning({
  result,
  currentLanguage,
}: {
  result: DecisionResultShape;
  currentLanguage: Language;
}) {
  if (!result) return null;

  const model = buildDecisionResultViewModel(result, currentLanguage);
  const {
    isCostMode,
    isDocumentMode,
    isVisualMode,
    showGrowthIntel,
    currency,
    convertAmount,
    narrativeMismatch,
    opportunity,
    issues,
    actions,
    signals,
    marketWatch,
    opportunityHeadline,
    marketWatchHeadline,
    marketWatchAlerts,
    marketWatchMoves,
    localizedRolloutPlan,
    localizedCapitalProtection,
    guardrails,
    localizedRevenuePlaybook,
    infoCardClass,
    infoTitleClass,
    infoBodyClass,
  } = model;

  return (
    <details className="advanced-reasoning-shell advanced-reasoning-hero rounded-[32px] border border-white/10 bg-white/[0.03] p-5 sm:p-6 xl:p-8" open>
      <summary className="advanced-reasoning-toggle advanced-reasoning-hero-toggle cursor-pointer list-none rounded-[28px] border border-white/10 p-5 sm:p-6 xl:p-7">
        <div className="advanced-reasoning-toggle-inner grid gap-5 xl:grid-cols-[1.25fr_0.75fr] xl:items-end">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{tt(currentLanguage, { en: 'Advanced decision layer', pl: 'Zaawansowana warstwa decyzji', es: 'Capa avanzada de decisión', pt: 'Camada avançada de decisão', ru: 'Расширенный слой решения' })}</div>
            <div className="mt-2 text-[clamp(1.6rem,2.8vw,2.8rem)] font-black leading-[0.98] tracking-[-0.04em] text-white">{tt(currentLanguage, { en: 'Advanced reasoning below the full result view', pl: 'Zaawansowane uzasadnienie w pełnej szerokości', es: 'Razonamiento avanzado bajo la vista completa del resultado', pt: 'Raciocínio avançado em largura total', ru: 'Расширенное обоснование во всю ширину' })}</div>
            <p className="mt-3 max-w-5xl text-sm leading-7 text-slate-200 sm:text-[15px]">{tt(currentLanguage, { en: 'This area now works like a real analysis stage: you get the numbers, market radar, rollout, watchtower, safeguards, and scenario simulation in one broad surface without the narrow side-column squeeze.', pl: 'Ten blok działa teraz jak pełna scena analizy: dostajesz liczby, radar rynku, rollout, watchtower, zabezpieczenia i symulację na jednej szerokiej powierzchni, bez ścisku bocznej kolumny.', es: 'Esta área ahora funciona como una etapa real de análisis: recibes números, radar de mercado, rollout, watchtower, salvaguardas y simulación de escenarios en una superficie amplia, sin el estrechamiento de una columna lateral.', pt: 'Esta área funciona agora como um palco real da análise: números, radar de mercado, rollout, watchtower, salvaguardas e simulação numa superfície ampla.', ru: 'Этот блок теперь работает как полноценная сцена анализа: цифры, радар рынка, rollout, watchtower, защитные меры и симуляция на одной широкой поверхности.' })}</p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100">{localizeExecutionMode(result.executionMode, currentLanguage)}</span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-100">{localizeDataMode(result.dataMode, currentLanguage)}</span>
              <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${opportunityTone(opportunity.opportunityWindow)}`}>
                {opportunity.opportunityWindow === 'open'
                  ? tt(currentLanguage, { en: 'Window open', pl: 'Okno okazji otwarte' })
                  : opportunity.opportunityWindow === 'closed'
                    ? tt(currentLanguage, { en: 'Protect capital', pl: 'Chroń kapitał' })
                    : tt(currentLanguage, { en: 'Guarded test', pl: 'Kontrolowany test' })}
              </span>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
            <div className="advanced-reasoning-stat rounded-[22px] border border-white/10 bg-slate-950/45 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{tt(currentLanguage, { en: 'Score', pl: 'Wynik' })}</div>
              <div className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">{result.score ?? 0}<span className="text-base text-slate-400">/100</span></div>
            </div>
            <div className="advanced-reasoning-stat rounded-[22px] border border-white/10 bg-slate-950/45 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{tt(currentLanguage, { en: 'Confidence', pl: 'Pewność' })}</div>
              <div className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">{result.confidence ?? 0}<span className="text-base text-slate-400">/100</span></div>
            </div>
            <div className="advanced-reasoning-stat rounded-[22px] border border-white/10 bg-slate-950/45 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{tt(currentLanguage, { en: 'Risk', pl: 'Ryzyko' })}</div>
              <div className="mt-2 text-lg font-black text-white">{localizeRisk(result.burnRisk, currentLanguage)}</div>
            </div>
          </div>
          <div className="advanced-reasoning-pill rounded-[22px] border px-4 py-3 text-sm font-semibold text-slate-950 xl:justify-self-end">
            {tt(currentLanguage, { en: 'Click to collapse', pl: 'Kliknij, aby zwinąć', es: 'Haz clic para contraer', pt: 'Clique para recolher', ru: 'Нажми, чтобы свернуть' })}
          </div>
        </div>
      </summary>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className={infoCardClass}>
          <div className={infoTitleClass}>
            {isDocumentMode
              ? tt(currentLanguage, { en: 'Key file facts', pl: 'Kluczowe fakty z pliku' })
              : isVisualMode
                ? tt(currentLanguage, { en: 'What is visible', pl: 'Co widać' })
                : tt(currentLanguage, { en: 'Numbers', pl: 'Liczby', es: 'Números' })}
          </div>

          {isDocumentMode || isVisualMode ? (
            <div className={infoBodyClass}>
              {signals.length ? signals.map((item) => <div key={item}>• {item}</div>) : <div>—</div>}
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <MoneyRow
                label={isCostMode ? tt(currentLanguage, { en: 'Invoice total', pl: 'Suma rachunku' }) : tt(currentLanguage, { en: 'Sell price', pl: 'Cena sprzedaży' })}
                value={convertAmount(result.pricing?.currentPrice)}
                currency={currency}
                language={currentLanguage}
              />
              <MoneyRow
                label={isCostMode ? tt(currentLanguage, { en: 'Possible savings', pl: 'Możliwa oszczędność' }) : tt(currentLanguage, { en: 'Estimated cost', pl: 'Szacowany koszt' })}
                value={convertAmount(result.pricing?.estimatedCost)}
                currency={currency}
                language={currentLanguage}
              />
              <MoneyRow
                label={tt(currentLanguage, { en: 'Competitor average', pl: 'Średnia konkurencji' })}
                value={convertAmount(result.market?.competitorAvgPrice)}
                currency={currency}
                language={currentLanguage}
              />
            </div>
          )}
        </div>

        <div className={infoCardClass}>
          <div className={infoTitleClass}>
            {isDocumentMode
              ? tt(currentLanguage, { en: 'What is in the file', pl: 'Co jest w pliku' })
              : isVisualMode
                ? tt(currentLanguage, { en: 'What it means', pl: 'Co to oznacza' })
                : tt(currentLanguage, { en: 'Why', pl: 'Dlaczego', es: 'Por qué' })}
          </div>
          <div className={infoBodyClass}>
            {model.reasons.length ? model.reasons.map((item) => <div key={item}>• {item}</div>) : <div>—</div>}
          </div>
        </div>

        <div className={infoCardClass}>
          <div className={infoTitleClass}>
            {isDocumentMode || isVisualMode ? tt(currentLanguage, { en: 'Gaps / risks', pl: 'Luki / ryzyka', es: 'Huecos / riesgos' }) : tt(currentLanguage, { en: 'Risks', pl: 'Ryzyka', es: 'Riesgos' })}
          </div>
          <div className={infoBodyClass}>
            {issues.length ? issues.map((item) => <div key={item}>• {item}</div>) : <div>—</div>}
          </div>
        </div>

        <div className={infoCardClass}>
          <div className={infoTitleClass}>
            {isDocumentMode || isVisualMode ? tt(currentLanguage, { en: 'What to improve next', pl: 'Co poprawić dalej', es: 'Qué mejorar a continuación' }) : tt(currentLanguage, { en: 'Next actions', pl: 'Kolejne kroki', es: 'Siguientes acciones' })}
          </div>
          <div className={infoBodyClass}>
            {actions.length ? actions.map((item) => <div key={item}>• {item}</div>) : <div>—</div>}
          </div>
        </div>

        {!isDocumentMode && !isVisualMode && (
          <div className={`${infoCardClass} xl:col-span-2`}>
            <div className={infoTitleClass}>{tt(currentLanguage, { en: 'Signals', pl: 'Sygnały', es: 'Señales' })}</div>
            <div className={infoBodyClass}>
              {signals.length ? signals.map((item) => <div key={item}>• {item}</div>) : <div>—</div>}
            </div>
          </div>
        )}
      </div>

      {showGrowthIntel && (
        <>
          <div className="mt-5 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <div className={infoCardClass}>
              <div className={infoTitleClass}>{tt(currentLanguage, { en: 'Market radar', pl: 'Radar rynku', es: 'Radar de mercado' })}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${opportunityTone(opportunity.opportunityWindow)}`}>
                  {opportunity.opportunityWindow === 'open'
                    ? tt(currentLanguage, { en: 'Window open', pl: 'Okno okazji otwarte' })
                    : opportunity.opportunityWindow === 'closed'
                      ? tt(currentLanguage, { en: 'Protect capital', pl: 'Chroń kapitał' })
                      : tt(currentLanguage, { en: 'Guarded test', pl: 'Kontrolowany test' })}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-100">
                  {localizeDataMode(result.dataMode, currentLanguage)}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-100">
                  {localizeExecutionMode(result.executionMode, currentLanguage)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">{opportunityHeadline}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{tt(currentLanguage, { en: 'Momentum', pl: 'Momentum' })}</div>
                  <div className="mt-1 text-xl font-black text-white">{opportunity.momentumScore}/100</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{tt(currentLanguage, { en: 'Price power', pl: 'Siła ceny' })}</div>
                  <div className="mt-1 text-xl font-black text-white">{opportunity.pricePowerScore}/100</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{tt(currentLanguage, { en: 'Readiness', pl: 'Gotowość' })}</div>
                  <div className="mt-1 text-xl font-black text-white">{opportunity.executionReadiness}/100</div>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <MoneyRow
                  label={tt(currentLanguage, { en: 'Suggested test price', pl: 'Sugerowana cena testowa' })}
                  value={convertAmount(result.pricing?.suggestedTestPrice)}
                  currency={currency}
                  language={currentLanguage}
                />
                <MoneyRow
                  label={tt(currentLanguage, { en: 'Monthly revenue proxy', pl: 'Proxy miesięcznego przychodu' })}
                  value={convertAmount(result.market?.estimatedMonthlyRevenue)}
                  currency={currency}
                  language={currentLanguage}
                />
                <div className="flex items-center justify-between gap-4 rounded-[20px] border border-white/10 bg-slate-950/40 px-4 py-3.5">
                  <div className="text-sm text-slate-300">{tt(currentLanguage, { en: 'Break-even ROAS', pl: 'Break-even ROAS' })}</div>
                  <div className="text-sm font-semibold text-white">{result.pricing?.breakEvenROAS ?? '—'}</div>
                </div>
              </div>
            </div>

            <div className={infoCardClass}>
              <div className={infoTitleClass}>{tt(currentLanguage, { en: '90-day rollout autopilot', pl: 'Autopilot wdrożenia na 90 dni', es: 'Autopiloto de despliegue a 90 días' })}</div>
              <div className={infoBodyClass}>
                {localizedRolloutPlan.length ? localizedRolloutPlan.map((item) => <div key={item}>• {item}</div>) : <div>—</div>}
              </div>
              <div className="mt-4 rounded-[20px] border border-white/10 bg-slate-950/40 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{tt(currentLanguage, { en: 'Next move', pl: 'Najbliższy ruch', es: 'Siguiente movimiento' })}</div>
                <div className="mt-2 text-sm font-semibold text-white">{result.adStrategy?.nextStep || tt(currentLanguage, { en: 'Run a controlled test first.', pl: 'Najpierw uruchom kontrolowany test.', es: 'Ejecuta primero una prueba controlada.' })}</div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <div className={infoCardClass}>
              <div className={infoTitleClass}>{tt(currentLanguage, { en: 'Competitor watchtower', pl: 'Wieża konkurencji', es: 'Torre de competencia' })}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-100">
                  {localizePricePosition(marketWatch.pricePosition, currentLanguage)}
                </span>
                <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${marketStatusTone(marketWatch.saturationRisk)}`}>
                  {tt(currentLanguage, { en: 'Saturation', pl: 'Nasycenie' })}: {localizeSaturationRisk(marketWatch.saturationRisk, currentLanguage)}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-100">
                  {tt(currentLanguage, { en: 'Demand', pl: 'Popyt' })}: {localizeDemandProxy(marketWatch.demandProxy, currentLanguage)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">{marketWatchHeadline}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{tt(currentLanguage, { en: 'Price delta vs market', pl: 'Delta ceny vs rynek' })}</div>
                  <div className="mt-1 text-xl font-black text-white">{typeof marketWatch.priceDeltaPercent === 'number' ? `${marketWatch.priceDeltaPercent > 0 ? '+' : ''}${marketWatch.priceDeltaPercent}%` : '—'}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{tt(currentLanguage, { en: 'Pressure index', pl: 'Indeks presji' })}</div>
                  <div className="mt-1 text-xl font-black text-white">{marketWatch.pressureIndex}/100</div>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-[15px] leading-7 text-slate-100">
                {marketWatchAlerts.map((item) => <div key={item}>• {item}</div>)}
              </div>
            </div>

            <div className={infoCardClass}>
              <div className={infoTitleClass}>{tt(currentLanguage, { en: 'Best strategic moves', pl: 'Najlepsze ruchy strategiczne', es: 'Mejores movimientos estratégicos' })}</div>
              <div className={infoBodyClass}>
                {marketWatchMoves.length ? marketWatchMoves.map((item) => <div key={item}>• {item}</div>) : <div>—</div>}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <div className={infoCardClass}>
              <div className={infoTitleClass}>{tt(currentLanguage, { en: 'Capital safeguards', pl: 'Zabezpieczenia kapitału', es: 'Salvaguardas de capital' })}</div>
              <div className={infoBodyClass}>
                {(guardrails.length ? guardrails : localizedCapitalProtection).length
                  ? (guardrails.length ? guardrails : localizedCapitalProtection).map((item) => <div key={item}>• {item}</div>)
                  : <div>—</div>}
              </div>
            </div>

            <div className={infoCardClass}>
              <div className={infoTitleClass}>{tt(currentLanguage, { en: 'Growth playbook', pl: 'Playbook wzrostu', es: 'Playbook de crecimiento' })}</div>
              <div className={infoBodyClass}>
                {(localizedRevenuePlaybook.length ? localizedRevenuePlaybook : [result.adStrategy?.firstObjective || tt(currentLanguage, { en: 'Keep iterating before scale.', pl: 'Iteruj przed skalą.' })]).map((item) => <div key={item}>• {item}</div>)}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <Simulator result={result} currentLanguage={currentLanguage} />
          </div>
        </>
      )}

      {result.text && !narrativeMismatch ? (
        <div className="mt-5 whitespace-pre-wrap rounded-[24px] border border-white/5 bg-slate-950/35 p-4 text-[15px] leading-8 text-slate-100 sm:p-5 sm:text-base lg:p-6">
          {result.text}
        </div>
      ) : null}
    </details>
  );
}