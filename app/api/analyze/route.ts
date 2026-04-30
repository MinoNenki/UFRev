import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { openai, ANALYSIS_SYSTEM_PROMPT } from '@/lib/openai';
import { calculateDecision } from '@/lib/decision-engine';
import { normalizePlanKey, PLANS, estimateAnalysisTokenCost } from '@/lib/plans';
import { getAutomationSettings, getIntegrationSettings } from '@/lib/profit-config';
import { getMonetizationSettings } from '@/lib/app-config';
import { SECURITY_LIMITS, clampText, estimateAnalysisCostUsd, estimateTokens } from '@/lib/security';
import { getReferralSettings } from '@/lib/app-config';
import { execFileSync } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type { Language } from '@/lib/i18n';
import { collectProMarketData } from '@/lib/market-connectors';
import { convertCurrency, convertToUsd, formatMoney, getCurrencyForCountry, getCurrencyForLanguage, normalizeCurrencyCode } from '@/lib/currency';
import { buildSystemPrompt } from '@/lib/analysis-prompt';
import { buildMarketWatchReport, getRecentMarketWatchSnapshots, persistMarketWatchReport } from '@/lib/market-watch';
import { isServiceBusinessPrompt } from '@/lib/analyze-helpers';
import { buildProductSourcingLayer, buildServiceSetupLayer } from '@/lib/recommendation-layers';
export const runtime = 'nodejs';


function finalGuard(decision: any, websiteUrl: string) {
  if (!websiteUrl && decision.verdict === 'BUY') decision.verdict = 'TEST';

  if (decision.confidence < 65) decision.verdict = 'TEST';

  if (decision.burnRisk === 'High') decision.verdict = 'AVOID';

  if ((decision.pricing?.marginPercent ?? 0) < 25) decision.verdict = 'TEST';

  if (!decision.rolloutPlan?.length && decision.verdict === 'BUY') {
    decision.verdict = 'TEST';
  }

  return decision;
}

function applyServiceBusinessOverlay(params: {
  decision: any;
  currentLanguage: Language;
  competitorUrls: string;
  selectedCountry: string;
  hasConfirmedPrice: boolean;
  hasConfirmedCost: boolean;
}) {
  const { decision, currentLanguage, competitorUrls, selectedCountry, hasConfirmedPrice, hasConfirmedCost } = params;

  decision.analysisMode = 'service_estimation';
  decision.analysisHeadline = currentLanguage === 'pl'
    ? 'To jest analiza lokalnego biznesu usługowego, a nie klasycznego produktu pod e-commerce.'
    : 'This is a local service-business analysis, not a standard e-commerce product case.';
  decision.verdict = decision.verdict === 'BUY' ? 'TEST' : decision.verdict;
  decision.executionMode = 'manual_review';

  decision.why = currentLanguage === 'pl'
    ? [
        'Pytanie dotyczy sprzętu, kosztu startu, regionu i kierunku wejścia, więc odpowiedź musi być operacyjna i usługowa.',
        competitorUrls ? 'Podane linki konkurencji trzeba czytać jako benchmark usług, pakietów i lokalnego pozycjonowania.' : 'Bez benchmarku lokalnych usług wynik musi pozostać ostrożny.',
        selectedCountry ? `Analiza została osadzona w lokalnym kontekście kraju / regionu: ${selectedCountry}.` : 'Lokalny kontekst regionu powinien prowadzić odpowiedź bardziej niż sztywny model produktu.',
      ]
    : [
        'The user is asking about equipment, startup cost, region, and service direction, so the response must stay operational and service-focused.',
        competitorUrls ? 'Competitor links should be read as local service and pricing benchmarks, not product listings.' : 'Without local service benchmarks the result has to stay conservative.',
        selectedCountry ? `The answer should stay grounded in the selected local context: ${selectedCountry}.` : 'The local region context should drive the answer more than a rigid product model.',
      ];

  decision.issues = currentLanguage === 'pl'
    ? [
        'Nie wolno pokazywać 0,00 jako ceny lub kosztu, jeśli cennik i CAPEX nie zostały potwierdzone.',
        'Myjnia mobilna, myjnia TIR i mycie elewacji to trzy różne modele operacyjne, więc nie warto startować od wszystkiego naraz.',
        'Bez lokalnych widełek cen oraz listy sprzętu werdykt nie może udawać policzonej marży.',
      ]
    : [
        'Do not show 0.00 as a price or cost when pricing and startup capex have not been confirmed.',
        'Mobile washing, truck washing, and facade cleaning are three different operating models, so starting with all of them at once is risky.',
        'Without local price bands and an equipment list, the result cannot pretend to have a verified margin.',
      ];

  decision.improvements = currentLanguage === 'pl'
    ? [
        'Wybierz jedną główną niszę startową i dopiero po pierwszych zleceniach rozszerzaj usługę.',
        'Rozpisz starterowy zestaw sprzętu, auto, chemię, osprzęt, wodę, serwis i dojazdy jako osobne pozycje kosztowe.',
        'Zbierz minimum 5 lokalnych benchmarków cen i na tej podstawie zbuduj 3 pakiety usług.',
      ]
    : [
        'Pick one starter niche first and expand only after the first jobs validate the lane.',
        'Break the startup stack into equipment, vehicle, chemicals, accessories, water, service, and travel costs.',
        'Collect at least 5 local pricing benchmarks and build 3 service packages from them.',
      ];

  if (!hasConfirmedPrice) decision.pricing.currentPrice = null;
  if (!hasConfirmedCost) decision.pricing.estimatedCost = null;
  if (!hasConfirmedPrice || !hasConfirmedCost) {
    decision.pricing.marginPercent = null;
    decision.pricing.breakEvenROAS = null;
    decision.pricing.suggestedPriceMin = null;
    decision.pricing.suggestedPriceMax = null;
    decision.pricing.suggestedTestPrice = null;
  }

  return decision;
}

function listEnabledIntegrationLanes(settings: Awaited<ReturnType<typeof getIntegrationSettings>>) {
  return [
    settings.amazonEnabled ? 'Amazon' : null,
    settings.ebayEnabled ? 'eBay' : null,
    settings.allegroEnabled ? 'Allegro' : null,
    settings.alibabaEnabled ? 'Alibaba' : null,
    settings.aliexpressEnabled ? 'AliExpress' : null,
    settings.walmartEnabled ? 'Walmart' : null,
    settings.etsyEnabled ? 'Etsy' : null,
    settings.rakutenEnabled ? 'Rakuten' : null,
    settings.shopifyEnabled ? 'Shopify' : null,
    settings.woocommerceEnabled ? 'WooCommerce' : null,
  ].filter(Boolean) as string[];
}


type UploadedImage = {
  name: string;
  mimeType: string;
  dataUrl: string;
};

type VideoMetadata = {
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  codec: string | null;
  frameRate: number | null;
};

const VIDEO_EXTENSIONS = new Set(['.mp4', '.mov', '.webm', '.m4v', '.avi']);

function isVideoFile(file: File) {
  const extension = `.${String(file.name || '').split('.').pop()?.toLowerCase() || ''}`;
  return file.type.startsWith('video/') || VIDEO_EXTENSIONS.has(extension);
}

type AnalysisMode = 'product_analysis' | 'cost_optimization' | 'document_analysis' | 'visual_analysis';

function countKeywordMatches(text: string, keywords: string[]) {
  return keywords.reduce((total, keyword) => total + (text.includes(keyword) ? 1 : 0), 0);
}

function detectAnalysisMode(params: { analysisType: string; websiteUrl: string; productName: string; content: string; uploadedFiles: File[] }) : AnalysisMode {
  if (params.analysisType === 'pricing-check') return 'cost_optimization';

  const joined = `${params.productName} ${params.content} ${params.uploadedFiles.map((f) => f.name).join(' ')}`.toLowerCase();
  const hasPdf = params.uploadedFiles.some((file) => file.name.toLowerCase().endsWith('.pdf'));
  const hasDocumentFiles = params.uploadedFiles.some((file) => !file.type.startsWith('image/') && !isVideoFile(file));
  const hasVisualFiles = params.uploadedFiles.some((file) => file.type.startsWith('image/') || isVideoFile(file));

  const strongCostHints = [
    'faktura', 'rachunek', 'invoice', 'bill', 'nr faktury', 'do zapłaty', 'do zaplaty',
    'opłata', 'oplata', 'abonament', 'media', 'kwh', 'vat', 'netto', 'brutto',
  ];
  const costIntentHints = [
    'obniż koszty', 'obniz koszty', 'obniżyć koszty', 'obnizyc koszty',
    'zoptymalizuj rachunek', 'optimize invoice', 'reduce cost', 'lower cost'
  ];
  const documentHints = [
    'co tu jest', 'co jest w pliku', 'streść', 'stresc', 'podsumuj', 'wyciągnij', 'wyciagnij',
    'przeanalizuj dokument', 'document', 'pdf', 'wniosek', 'dotac', 'dofinans', 'grant',
    'application', 'proposal', 'umowa', 'regulamin', 'oferta', 'jakie ma szanse', 'jakie są szanse', 'jakie sa szanse'
  ];
  const grantHints = ['dotac', 'dofinans', 'grant', 'wniosek', 'application', 'proposal', 'saas', 'startup', 'biznesplan'];
  const visualHints = [
    'co jest na tym zdjęciu', 'co jest na tym zdjeciu', 'co jest na zdjęciu', 'co jest na zdjeciu',
    'co widać', 'co widac', 'co widzisz', 'opisz zdjęcie', 'opisz zdjecie', 'opisz obraz',
    'describe image', 'describe the screenshot', 'what is in this image', 'what do you see',
    'screenshot', 'screen', 'ui', 'panel', 'dashboard', 'container', 'docker', 'n8n'
  ];
  const businessHints = ['cena', 'price', 'koszt', 'cost', 'marża', 'marza', 'margin', 'konkurenc', 'competitor', 'competition', 'roas', 'budżet', 'budget'];

  const costScore = countKeywordMatches(joined, strongCostHints) + (costIntentHints.some((hint) => joined.includes(hint)) ? 2 : 0);
  const documentScore = countKeywordMatches(joined, documentHints);
  const grantLike = grantHints.some((hint) => joined.includes(hint));
  const directVisualQuestion = visualHints.some((hint) => joined.includes(hint));
  const businessSignalCount = countKeywordMatches(joined, businessHints);

  if (!params.websiteUrl && !grantLike && (costScore >= 2 || (hasPdf && /faktura|rachunek|invoice|bill/i.test(joined)))) {
    return 'cost_optimization';
  }

  if (!params.websiteUrl && hasVisualFiles && (directVisualQuestion || businessSignalCount < 2)) {
    return 'visual_analysis';
  }

  if (!params.websiteUrl && (grantLike || documentScore > 0 || hasDocumentFiles)) {
    return 'document_analysis';
  }

  return 'product_analysis';
}

function parseMoneyValues(text: string) {
  const matches = Array.from(text.matchAll(/([0-9]{1,6}(?:[\.,][0-9]{1,2})?)\s?(?:zł|zl|pln|eur|usd|gbp)?/gi));
  return matches
    .map((m) => Number(String(m[1]).replace(',', '.')))
    .filter((value) => Number.isFinite(value) && value > 0.5 && value < 100000);
}

function parseNumericFormValue(value: FormDataEntryValue | null) {
  const normalized = String(value || '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/,/g, '.')
    .replace(/[^0-9.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseLooseMoneyValue(raw: string) {
  const normalized = String(raw || '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/,/g, '.')
    .replace(/[^0-9.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function extractLabeledMoneyValue(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const parsed = parseLooseMoneyValue(match?.[1] || '');
    if (parsed != null) return parsed;
  }
  return 0;
}

function inferFinancialContextFromText(text: string) {
  const compact = ` ${String(text || '').replace(/\s+/g, ' ')} `;

  const inferredCost = extractLabeledMoneyValue(compact, [
    /(?:koszt(?:uje)?(?: zakupu| hurtowy| produktu)?|cena zakupu|kupion(?:y|a|e)? za|buy(?:ing)? cost|cost(?: price)?|wholesale cost|landed cost)[^0-9]{0,24}([0-9][0-9\s.,]{0,14})/i,
    /([0-9][0-9\s.,]{0,14})\s?(?:zł|zl|pln|eur|usd|gbp)?[^a-z0-9]{0,8}(?:koszt|cost|hurt|zakup)/i,
  ]);

  const inferredPrice = extractLabeledMoneyValue(compact, [
    /(?:sprzeda(?:ż|z)(?:y| do| za)?|sprzeda[cć] za|po ile|wystawia(?:ć|c)|selling price|sell for|listing price|retail price|cena sprzeda(?:ż|z)y)[^0-9]{0,24}([0-9][0-9\s.,]{0,14})/i,
  ]);

  return { inferredCost, inferredPrice };
}

function extractUrlsFromText(text: string) {
  return Array.from(new Set((text.match(/https?:\/\/[^\s)]+/gi) || []).map((item) => item.trim()))).slice(0, 4);
}

function looksLikeSupplierMarketplaceUrl(url: string) {
  return /alibaba\.com|aliexpress\.com|1688\.com|made-in-china\.com|globalsources\.com/i.test(url || '');
}

function buildCostOptimizationDecision(params: { content: string; displayCurrency: string; currentLanguage: Language; productName: string }) {
  const compact = params.content.replace(/\s+/g, ' ');
  const values = parseMoneyValues(compact).sort((a, b) => b - a);
  const total = values.length ? values[0] : 0;
  const energyLike = /pr[aą]d|energia|electricity|kwh/i.test(compact);
  const internetLike = /internet|telefon|abonament|subscription/i.test(compact);
  const gasLike = /gaz|heating|ogrzewanie/i.test(compact);
  const invoiceLike = /faktura|rachunek|invoice|bill/i.test(compact);

  const biggestCategory = energyLike ? 'energia / prąd' : internetLike ? 'internet / abonament' : gasLike ? 'gaz / ogrzewanie' : invoiceLike ? 'główna pozycja z faktury' : 'największa pozycja kosztowa';
  const savingsPercent = energyLike ? 15 : internetLike ? 12 : gasLike ? 10 : 8;
  const estimatedSavings = total > 0 ? Number((total * (savingsPercent / 100)).toFixed(2)) : 0;
  const score = Math.min(92, Math.max(38, (total > 0 ? 45 : 30) + savingsPercent + (invoiceLike ? 8 : 0)));

  return {
    score,
    profitability: savingsPercent,
    verdict: 'TEST' as const,
    confidence: total > 0 ? 82 : 58,
    confidenceLabel: total > 0 ? 'High' as const : 'Medium' as const,
    moatScore: 0,
    burnRisk: 'Low' as const,
    executionMode: 'manual_review' as const,
    killSwitchArmed: false,
    dataMode: 'manual_plus_evidence' as const,
    analysisMode: 'cost_optimization' as const,
    analysisHeadline: total > 0 ? 'Rachunek można obniżyć' : 'Potrzebne są wyraźniejsze dane z faktury',
    why: [
      total > 0 ? `W pliku wykryto kwoty i dokument wygląda jak faktura lub rachunek.` : 'Plik wygląda jak dokument kosztowy, ale ma zbyt mało czytelnych danych liczbowych.',
      `Największy obszar do sprawdzenia: ${biggestCategory}.`,
      estimatedSavings > 0 ? `Szacowany potencjał oszczędności to około ${estimatedSavings} ${params.displayCurrency}.` : 'Najpierw trzeba odczytać pełną sumę i główne pozycje kosztowe.',
    ],
    issues: [
      total > 0 ? `Najwyższa wykryta kwota to około ${total} ${params.displayCurrency}.` : 'Nie udało się pewnie odczytać głównej kwoty z pliku.',
      'Bez rozbicia pozycji nie da się wskazać jednego dostawcy lub jednej opłaty do natychmiastowej zmiany.',
      'Jeśli PDF jest skanem, wynik będzie mniej dokładny bez czytelnego tekstu.',
    ],
    improvements: [
      energyLike ? 'Sprawdź zmianę taryfy lub przeniesienie części zużycia poza godziny szczytu.' : 'Porównaj ofertę obecnego dostawcy z 2–3 tańszymi alternatywami.',
      internetLike ? 'Zweryfikuj, czy nie płacisz za pakiet lub usługi, których realnie nie używasz.' : 'Poproś dostawcę o tańszy pakiet albo ofertę retencyjną.',
      'Dodaj zdjęcie / PDF z wyraźnym rozbiciem pozycji, a system wskaże dokładniej co ciąć najpierw.',
    ],
    factors: [],
    marketSignals: [
      'Tryb kosztowy został uruchomiony na podstawie treści pytania i pliku.',
      total > 0 ? `Wykryta główna kwota dokumentu: ${total} ${params.displayCurrency}.` : 'Nie wykryto pewnej kwoty głównej.',
    ],
    guardrailsTriggered: [
      'Nie pokazuj BUY / AVOID dla faktury lub rachunku.',
      'W trybie kosztowym wynik ma być opisem oszczędności, a nie decyzją produktową.',
    ],
    capitalProtection: [],
    rolloutPlan: [],
    revenuePlaybook: [],
    market: {
      competitorAvgPrice: null,
      marketMonthlyUnits: null,
      estimatedMonthlyRevenue: estimatedSavings || null,
      estimatedMonthlyTurnoverRange: { low: estimatedSavings ? Number((estimatedSavings * 0.7).toFixed(2)) : null, high: estimatedSavings ? Number((estimatedSavings * 1.3).toFixed(2)) : null },
      sources: { ownPrice: 'manual', competitorAvgPrice: null, marketMonthlyUnits: null },
      displayCurrency: params.displayCurrency,
    },
    adStrategy: {
      primaryChannel: 'cost_optimization',
      testBudget: estimatedSavings,
      dailyBudget: estimatedSavings,
      firstObjective: 'reduce_cost',
      creativeAngle: 'n/a',
      nextStep: 'review_invoice',
    },
    pricing: {
      currentPrice: total,
      estimatedCost: estimatedSavings,
      currency: params.displayCurrency,
      marginPercent: savingsPercent,
      breakEvenROAS: null,
      suggestedPriceMin: null,
      suggestedPriceMax: null,
      suggestedTestPrice: null,
    },
    monetization: {
      paywallMode: 'free_soft' as const,
      recommendedPlan: 'pro' as const,
      upsellReason: 'cost_optimization',
      unlockCTA: 'Odblokuj pełniejszą analizę kosztów',
    },
  };
}

function buildCostOptimizationText(decision: ReturnType<typeof buildCostOptimizationDecision>, displayCurrency: string) {
  return [
    `Werdykt: ${decision.analysisHeadline}.`,
    '',
    '1. Co widać w dokumencie',
    ...decision.why.map((item) => `- ${item}`),
    '',
    '2. Co zrobić teraz',
    ...decision.improvements.map((item) => `- ${item}`),
    '',
    '3. Na co uważać',
    ...decision.issues.map((item) => `- ${item}`),
    '',
    decision.pricing.estimatedCost ? `Szacowana możliwa oszczędność: około ${decision.pricing.estimatedCost} ${displayCurrency}.` : 'Dodaj czytelniejszy dokument, aby policzyć oszczędność dokładniej.',
  ].join('\n');
}

function buildVisualAnalysisDecision(params: { content: string; currentLanguage: Language; productName: string }) {
  const compact = params.content.replace(/\s+/g, ' ').toLowerCase();
  const looksLikeInterface = /dashboard|panel|admin|container|docker|n8n|settings|ustawien|screen|screenshot|ui/.test(compact);
  const looksLikeProductPage = /produkt|product|cena|price|koszyk|cart|offer|oferta|checkout|listing/.test(compact);
  const headline = params.currentLanguage === 'pl'
    ? looksLikeInterface
      ? 'To wygląda na zrzut ekranu panelu, konfiguracji albo interfejsu.'
      : looksLikeProductPage
        ? 'To wygląda na screen oferty lub strony produktowej.'
        : 'To wygląda na materiał wizualny do bezpośredniego odczytu.'
    : looksLikeInterface
      ? 'This looks like a dashboard, configuration, or interface screenshot.'
      : looksLikeProductPage
        ? 'This looks like a product page or offer screenshot.'
        : 'This looks like visual material that should be read directly.';

  return {
    score: looksLikeInterface ? 82 : 76,
    profitability: 0,
    verdict: 'TEST' as const,
    confidence: 78,
    confidenceLabel: 'High' as const,
    moatScore: looksLikeInterface ? 84 : 72,
    burnRisk: 'Low' as const,
    executionMode: 'manual_review' as const,
    killSwitchArmed: false,
    dataMode: 'visual_evidence' as const,
    analysisMode: 'visual_analysis' as const,
    analysisHeadline: headline,
    why: params.currentLanguage === 'pl'
      ? [
          'Tryb wizualny został włączony, więc odpowiedź ma opierać się na tym, co naprawdę widać na obrazie lub screenie.',
          looksLikeInterface ? 'Materiał wygląda bardziej jak UI / panel / konfiguracja niż klasyczny brief sprzedażowy.' : 'Materiał wygląda jak obraz, screen albo kreatywa wymagająca bezpośredniego odczytu.',
          'Jeśli tekst lub detale są małe, system powinien to zaznaczyć zamiast zgadywać.',
        ]
      : [
          'Visual mode is active, so the answer should be based on what is actually visible in the image or screenshot.',
          looksLikeInterface ? 'The material looks more like a UI / dashboard / config screen than a classic sales brief.' : 'The material looks like an image, screenshot, or creative that needs direct visual reading.',
          'If text or small details are unclear, the response should say that instead of guessing.',
        ],
    issues: params.currentLanguage === 'pl'
      ? [
          'Drobny tekst lub małe elementy mogą wymagać wyraźniejszego pliku albo zbliżenia.',
          'W trybie wizualnym nie powinno się wymuszać marży, ceny ani BUY/AVOID bez dodatkowych danych.',
          'Jeśli potrzebujesz decyzji biznesowej, dołóż link, cenę, koszt lub krótki kontekst.',
        ]
      : [
          'Small text or tiny UI elements may need a clearer file or zoomed crop.',
          'Visual mode should not force margin, pricing, or BUY/AVOID logic without extra business data.',
          'If you want a business verdict, add a link, price, cost, or short context.',
        ],
    improvements: params.currentLanguage === 'pl'
      ? [
          'Zadawaj konkretne pytanie: co widać, jaki jest błąd, co poprawić, co oznaczają widoczne pola.',
          'Przy screenach i PDF-ach z małym tekstem dodaj krótkie streszczenie lub wyraźniejszą wersję.',
          'Jeśli chcesz oceny opłacalności, dołóż liczby i dane rynkowe obok obrazu.',
        ]
      : [
          'Ask a concrete question: what is visible, what error appears, what should be improved, or what the shown fields mean.',
          'For screenshots and PDFs with tiny text, add a short summary or a clearer file.',
          'If you want profitability advice, add numbers and market context next to the image.',
        ],
    factors: [],
    marketSignals: params.currentLanguage === 'pl'
      ? ['Włączono tryb odczytu wizualnego zamiast sztywnej analizy produktowej.']
      : ['Visual reading mode was enabled instead of a rigid product decision flow.'],
    guardrailsTriggered: params.currentLanguage === 'pl'
      ? ['Nie zgaduj treści, jeśli obraz lub tekst są niewyraźne.']
      : ['Do not guess details if the image or text is unclear.'],
    capitalProtection: [],
    rolloutPlan: [],
    revenuePlaybook: [],
    market: {
      competitorAvgPrice: null,
      marketMonthlyUnits: null,
      estimatedMonthlyRevenue: null,
      estimatedMonthlyTurnoverRange: { low: null, high: null },
      sources: { ownPrice: null, competitorAvgPrice: null, marketMonthlyUnits: null },
      displayCurrency: null,
    },
    adStrategy: {
      primaryChannel: 'visual_review',
      testBudget: 0,
      dailyBudget: 0,
      firstObjective: 'read_visual_input',
      creativeAngle: 'n/a',
      nextStep: 'review_visuals',
    },
    pricing: {
      currentPrice: null,
      estimatedCost: null,
      currency: null,
      marginPercent: null,
      breakEvenROAS: null,
      suggestedPriceMin: null,
      suggestedPriceMax: null,
      suggestedTestPrice: null,
    },
    monetization: {
      paywallMode: 'free_soft' as const,
      recommendedPlan: 'pro' as const,
      upsellReason: 'visual_analysis',
      unlockCTA: params.currentLanguage === 'pl' ? 'Odblokuj głębszy odczyt materiałów' : 'Unlock deeper visual analysis',
    },
  };
}

function buildVisualAnalysisText(decision: ReturnType<typeof buildVisualAnalysisDecision>, currentLanguage: Language) {
  if (currentLanguage === 'pl') {
    return [
      `Werdykt: ${decision.analysisHeadline}`,
      '',
      '1. Co widać',
      ...decision.why.map((item) => `- ${item}`),
      '',
      '2. Ograniczenia',
      ...decision.issues.map((item) => `- ${item}`),
      '',
      '3. Co zrobić dalej',
      ...decision.improvements.map((item) => `- ${item}`),
    ].join('\n');
  }

  return [
    `Verdict: ${decision.analysisHeadline}`,
    '',
    '1. What is visible',
    ...decision.why.map((item) => `- ${item}`),
    '',
    '2. Limitations',
    ...decision.issues.map((item) => `- ${item}`),
    '',
    '3. What to do next',
    ...decision.improvements.map((item) => `- ${item}`),
  ].join('\n');
}

function detectDocumentKind(text: string) {
  const compact = text.toLowerCase();
  if (/dotac|dofinans|grant|wniosek|application|proposal/.test(compact)) return 'grant';
  if (/umowa|contract|agreement/.test(compact)) return 'contract';
  if (/oferta|quotation|quote/.test(compact)) return 'offer';
  return 'document';
}

function normalizeDocumentText(text: string) {
  return text
    .replace(/\u0000/g, ' ')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]+/g, ' ')
    .replace(/[^\S\r\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function looksLikeReadableDocumentText(text: string) {
  const normalized = normalizeDocumentText(text);
  if (normalized.length < 24) return false;

  const sample = normalized.slice(0, 6000);
  const words = sample.match(/[A-Za-zÀ-ÿąćęłńóśżźĄĆĘŁŃÓŚŻŹ]{2,}/g) || [];
  const letters = sample.match(/[A-Za-zÀ-ÿąćęłńóśżźĄĆĘŁŃÓŚŻŹ]/g) || [];
  const strangeChars = sample.match(/[^A-Za-zÀ-ÿąćęłńóśżźĄĆĘŁŃÓŚŻŹ0-9\s.,:;!?%\-–—()\/"'@&+#]/g) || [];
  const suspiciousTokens = sample
    .split(/\s+/)
    .filter((token) => {
      const cleaned = token.replace(/[^A-Za-zÀ-ÿąćęłńóśżźĄĆĘŁŃÓŚŻŹ]/g, '');
      return cleaned.length >= 16 && !/[aeiouyąęóAEIOUYĄĘÓ]/.test(cleaned);
    });

  const lettersRatio = letters.length / Math.max(sample.length, 1);
  const strangeRatio = strangeChars.length / Math.max(sample.length, 1);

  return words.length >= 6 && lettersRatio >= 0.35 && strangeRatio <= 0.1 && suspiciousTokens.length <= 8;
}

function isMeaningfulDocumentLine(line: string) {
  const normalized = normalizeDocumentText(line);
  if (normalized.length < 8 || normalized.length > 220) return false;
  if (/^# file:/i.test(normalized)) return false;
  if (/^(target market|sales channel|website url|competitor urls):/i.test(normalized)) return false;
  if (/^pdf (uploaded|added)|^video file detected/i.test(normalized)) return false;

  const words = normalized.match(/[A-Za-zÀ-ÿąćęłńóśżźĄĆĘŁŃÓŚŻŹ]{2,}/g) || [];
  const strangeChars = normalized.match(/[^A-Za-zÀ-ÿąćęłńóśżźĄĆĘŁŃÓŚŻŹ0-9\s.,:;!?%\-–—()\/"'@&+#]/g) || [];
  const digits = normalized.match(/[0-9]/g) || [];
  const suspiciousToken = normalized
    .split(/\s+/)
    .some((token) => {
      const cleaned = token.replace(/[^A-Za-zÀ-ÿąćęłńóśżźĄĆĘŁŃÓŚŻŹ]/g, '');
      return cleaned.length >= 16 && !/[aeiouyąęóAEIOUYĄĘÓ]/.test(cleaned);
    });

  return words.length >= 2
    && strangeChars.length / Math.max(normalized.length, 1) <= 0.08
    && digits.length / Math.max(normalized.length, 1) < 0.6
    && !suspiciousToken;
}

function extractMeaningfulLines(text: string, limit = 6) {
  const normalized = normalizeDocumentText(text);
  const candidates = normalized
    .replace(/([.!?;:])\s+/g, '$1\n')
    .split(/\r?\n+/)
    .map((line) => line.trim());

  return Array.from(new Set(candidates))
    .filter(isMeaningfulDocumentLine)
    .slice(0, limit);
}

function buildDocumentAnalysisDecision(params: { content: string; displayCurrency: string; currentLanguage: Language; productName: string }) {
  const fullCompact = params.content.replace(/\s+/g, ' ');
  const documentSource = params.content.includes('# File:')
    ? params.content.split(/# File:/i).slice(1).join('\n')
    : params.content;
  const compact = documentSource.replace(/\s+/g, ' ');
  const signalSource = `${fullCompact} ${compact}`;
  const kind = detectDocumentKind(signalSource);
  const lines = extractMeaningfulLines(documentSource, 6);
  const amounts = parseMoneyValues(compact).sort((a, b) => b - a);

  const hasBudget = /budżet|budzet|koszt|finans|wkład|wklad|przychod|revenue|cashflow/i.test(signalSource);
  const hasTimeline = /harmonogram|termin|etap|miesiąc|miesiac|kwartał|kwartal|milestone|deadline/i.test(signalSource);
  const hasMarket = /rynek|klient|odbiorc|konkurenc|target|segment|persona|user/i.test(signalSource);
  const hasProduct = /produkt|usługa|usluga|service|saas|platforma|aplikacj/i.test(signalSource);
  const hasMetrics = /kpi|mrr|arr|ltv|cac|konwers|conversion|sprzedaż|sprzedaz/i.test(signalSource);
  const completenessSignals = [hasBudget, hasTimeline, hasMarket, hasProduct, hasMetrics].filter(Boolean).length;

  const textLooksReadable = lines.length > 0;
  const score = Math.min(90, Math.max(textLooksReadable ? 46 : 32, 42 + completenessSignals * 8 + (lines.length >= 4 ? 6 : 0) + (amounts.length ? 4 : 0) - (textLooksReadable ? 0 : 16)));
  const confidence = Math.min(88, Math.max(textLooksReadable ? 52 : 34, 48 + Math.min(lines.length, 6) * 5 + (amounts.length ? 4 : 0) - (textLooksReadable ? 0 : 18)));
  const chanceSummary = !textLooksReadable
    ? 'Treść PDF jest zbyt nieczytelna, żeby dać mocną ocenę — przyda się lepszy plik albo krótkie streszczenie.'
    : score >= 76
      ? 'Dokument wygląda sensownie, ale przed decyzją końcową warto dopracować kluczowe liczby i argumenty.'
      : score >= 60
        ? 'To ma umiarkowane szanse, ale trzeba doprecyzować liczby, przewagę i plan wykonania.'
        : 'Na dziś dokument jest zbyt ogólny lub zbyt nieczytelny, żeby dać mocną pozytywną ocenę.';

  const missingAreas = [
    !hasBudget ? 'konkretne liczby i budżet' : null,
    !hasTimeline ? 'harmonogram lub etapy realizacji' : null,
    !hasMarket ? 'opis rynku, klienta i konkurencji' : null,
    !hasMetrics ? 'mierniki sukcesu lub model przychodu' : null,
  ].filter(Boolean);

  const titleByKind = kind === 'grant'
    ? 'To wygląda na wniosek o dotację / dofinansowanie'
    : kind === 'contract'
      ? 'To wygląda na dokument umowny lub formalny'
      : kind === 'offer'
        ? 'To wygląda na ofertę lub proposal'
        : 'To wygląda na dokument opisowy do przejrzenia';

  return {
    score,
    profitability: Math.max(0, Math.min(100, score - 8)),
    verdict: 'TEST' as const,
    confidence,
    confidenceLabel: confidence >= 74 ? 'High' as const : confidence >= 58 ? 'Medium' as const : 'Low' as const,
    moatScore: Math.max(0, Math.min(100, completenessSignals * 18)),
    burnRisk: score >= 70 ? 'Low' as const : score >= 58 ? 'Medium' as const : 'High' as const,
    executionMode: 'manual_review' as const,
    killSwitchArmed: true,
    dataMode: 'manual_plus_evidence' as const,
    analysisMode: 'document_analysis' as const,
    analysisHeadline: `${titleByKind}. ${chanceSummary}`,
    why: [
      `${titleByKind}, a nie na zwykłą fakturę kosztową.`,
      completenessSignals >= 3
        ? 'W pliku widać kilka ważnych elementów: opis rozwiązania, liczby lub sekcje oceniające projekt.'
        : 'W pliku widać ogólny opis sprawy, ale nadal brakuje części konkretów potrzebnych do mocnej oceny.',
      amounts.length
        ? `W dokumencie wykryto także kwoty/liczby — największa z nich to około ${amounts[0]} ${params.displayCurrency}.`
        : 'Nie udało się wyłapać wielu twardych kwot, więc ocena musi pozostać ostrożna.',
    ],
    issues: [
      missingAreas.length
        ? `Do dopracowania: ${missingAreas.slice(0, 3).join(', ')}.`
        : 'Główne sekcje wyglądają sensownie, ale nadal trzeba sprawdzić spójność argumentacji i liczb.',
      'Nie warto dopowiadać danych, których nie ma wprost w pliku — decyzja końcowa wymaga twardych dowodów.',
      'Jeśli PDF jest skanem niskiej jakości, część treści może wymagać lepszego źródła lub OCR.',
    ],
    improvements: [
      kind === 'grant'
        ? 'Doprecyzuj problem, rozwiązanie, grupę docelową i przewagę projektu w 3–4 prostych punktach.'
        : 'Wyciągnij najważniejsze punkty dokumentu do krótkiego, czytelnego podsumowania dla decydenta.',
      hasBudget
        ? 'Sprawdź, czy budżet, harmonogram i spodziewane efekty są ze sobą spójne.'
        : 'Dodaj twarde liczby: budżet, zakres kosztów, terminy i oczekiwane efekty.',
      'Przed dalszym ruchem zrób krótką checklistę ryzyk, braków formalnych i elementów do uzupełnienia.',
    ],
    factors: [],
    marketSignals: lines.length
      ? lines.slice(0, 4).map((line) => `Fragment z pliku: ${line}`)
      : ['Nie udało się wyciągnąć czytelnych fragmentów tekstu z dokumentu.'],
    guardrailsTriggered: [
      'Przy analizie dokumentów nie wolno zgadywać brakujących danych.',
      'Werdykt ma pozostać ostrożny, dopóki liczby i treść nie są jednoznaczne.',
    ],
    capitalProtection: [
      'Nie podejmuj kosztownej decyzji tylko na podstawie jednego niepełnego PDF-a.',
      'Najpierw potwierdź liczby, warunki formalne i kluczowe założenia dokumentu.',
    ],
    rolloutPlan: [
      'Krok 1: potwierdź, czego dokładnie dotyczy dokument.',
      'Krok 2: sprawdź liczby, terminy i warunki.',
      'Krok 3: dopiero potem podejmij decyzję operacyjną lub finansową.',
    ],
    revenuePlaybook: [],
    market: {
      competitorAvgPrice: null,
      marketMonthlyUnits: null,
      estimatedMonthlyRevenue: amounts[0] || null,
      estimatedMonthlyTurnoverRange: { low: null, high: null },
      sources: { ownPrice: 'manual', competitorAvgPrice: null, marketMonthlyUnits: null },
      displayCurrency: params.displayCurrency,
    },
    adStrategy: {
      primaryChannel: 'document_review',
      testBudget: 0,
      dailyBudget: 0,
      firstObjective: 'verify_document',
      creativeAngle: 'n/a',
      nextStep: 'review_document',
    },
    pricing: {
      currentPrice: amounts[0] || 0,
      estimatedCost: 0,
      currency: params.displayCurrency,
      marginPercent: Math.max(0, Math.min(100, score - 40)),
      breakEvenROAS: null,
      suggestedPriceMin: null,
      suggestedPriceMax: null,
      suggestedTestPrice: null,
    },
    monetization: {
      paywallMode: 'free_soft' as const,
      recommendedPlan: 'pro' as const,
      upsellReason: 'document_analysis',
      unlockCTA: 'Odblokuj głębszą analizę dokumentu',
    },
  };
}

function buildDocumentAnalysisText(decision: ReturnType<typeof buildDocumentAnalysisDecision>) {
  return [
    `Werdykt: ${decision.analysisHeadline}.`,
    '',
    '1. Co jest w pliku',
    ...decision.why.map((item) => `- ${item}`),
    '',
    '2. Jakie to ma szanse',
    `- Ocena na teraz: ${decision.score}/100.`,
    `- Pewność: ${decision.confidence}/100.`,
    `- ${decision.issues[0]}`,
    '',
    '3. Co poprawić lub sprawdzić dalej',
    ...decision.improvements.map((item) => `- ${item}`),
  ].join('\n');
}

function localizeSpecialModeDecisionNarrative(params: {
  decision: any;
  currentLanguage: Language;
  mode: 'cost_optimization' | 'visual_analysis' | 'document_analysis';
  displayCurrency?: string;
}) {
  const { decision, currentLanguage, mode, displayCurrency } = params;
  if (currentLanguage === 'pl') return decision;

  const isEs = currentLanguage === 'es';
  const ctaByMode = mode === 'cost_optimization'
    ? (isEs ? 'Desbloquear análisis de costes más profundo' : 'Unlock deeper cost analysis')
    : mode === 'visual_analysis'
      ? (isEs ? 'Desbloquear análisis visual más profundo' : 'Unlock deeper visual analysis')
      : (isEs ? 'Desbloquear análisis de documento más profundo' : 'Unlock deeper document analysis');

  if (mode === 'cost_optimization') {
    decision.analysisHeadline = isEs
      ? 'Se puede optimizar el coste, pero antes hay que confirmar números clave del documento.'
      : 'Cost optimization is possible, but key numbers in the document still need confirmation.';
    decision.why = [
      isEs ? 'Se detectó un contexto de factura/coste en el contenido.' : 'A cost/invoice context was detected in the content.',
      isEs ? `La estimación usa la moneda local seleccionada (${displayCurrency || 'local currency'}).` : `The estimate uses the selected local currency (${displayCurrency || 'local currency'}).`,
      isEs ? 'La decisión es conservadora hasta validar importes y partidas principales.' : 'The decision remains conservative until totals and key line items are verified.',
    ];
    decision.issues = [
      isEs ? 'Sin desglose claro de partidas, la precisión es limitada.' : 'Without a clear line-item breakdown, precision is limited.',
      isEs ? 'No conviene forzar una conclusión fuerte sin datos legibles.' : 'A strong conclusion should not be forced without readable data.',
      isEs ? 'Un PDF escaneado o borroso reduce la calidad de la lectura.' : 'A scanned/blurred PDF lowers extraction quality.',
    ];
    decision.improvements = [
      isEs ? 'Añade una factura más legible o un resumen corto con importes clave.' : 'Add a clearer invoice file or a short summary with key amounts.',
      isEs ? 'Compara 2-3 alternativas de proveedor sobre la partida principal.' : 'Compare 2-3 supplier alternatives on the largest cost line.',
      isEs ? 'Empieza con recorte pequeño y mide resultado antes de cambios grandes.' : 'Start with a small optimization step and measure before larger changes.',
    ];
    decision.marketSignals = [isEs ? 'Modo de optimización de costes activo.' : 'Cost-optimization mode is active.'];
  } else if (mode === 'visual_analysis') {
    decision.analysisHeadline = isEs
      ? 'Análisis visual activo: la respuesta se basa en lo que realmente se ve.'
      : 'Visual analysis mode is active: the response is based on what is actually visible.';
    decision.why = [
      isEs ? 'El sistema prioriza lectura visual real frente a suposiciones.' : 'The system prioritizes real visual reading over assumptions.',
      isEs ? 'Si hay texto pequeño o borroso, se marca como incierto.' : 'If text is small or blurry, uncertainty is explicitly stated.',
      isEs ? 'La decisión de negocio fuerte requiere datos adicionales.' : 'A stronger business decision still requires additional numeric context.',
    ];
    decision.issues = [
      isEs ? 'Sin contexto de precio/coste no se debe fijar margen rígido.' : 'Without price/cost context, a rigid margin should not be forced.',
      isEs ? 'Detalles visuales pequeños pueden reducir precisión.' : 'Small visual details can reduce precision.',
      isEs ? 'Una sola imagen puede no reflejar todo el caso.' : 'A single screenshot/image may not represent the full case.',
    ];
    decision.improvements = [
      isEs ? 'Añade contexto corto y pregunta concreta sobre la imagen/pantalla.' : 'Add short context and a concrete question about the image/screen.',
      isEs ? 'Incluye datos de precio/coste si quieres decisión de rentabilidad.' : 'Include price/cost data if you want a profitability decision.',
      isEs ? 'Sube una versión más nítida para mejorar lectura.' : 'Upload a clearer file version to improve visual reading quality.',
    ];
    decision.marketSignals = [isEs ? 'Modo visual activado.' : 'Visual mode enabled.'];
  } else {
    decision.analysisHeadline = isEs
      ? 'Documento detectado: primero se valida contenido y consistencia antes de una decisión fuerte.'
      : 'Document mode detected: content and consistency are validated before a strong decision.';
    decision.why = [
      isEs ? 'La lectura se centra en hechos visibles del documento.' : 'The readout focuses on visible facts from the document.',
      isEs ? 'Se evita inventar datos que no estén en el archivo.' : 'Missing facts are not invented.',
      isEs ? 'La conclusión sube de calidad con estructura y cifras claras.' : 'Conclusion quality increases with clearer structure and numbers.',
    ];
    decision.issues = [
      isEs ? 'Si faltan cifras o plazos, la evaluación se mantiene conservadora.' : 'If figures or timeline are missing, the evaluation remains conservative.',
      isEs ? 'Texto poco legible reduce confianza de lectura.' : 'Low text readability reduces confidence.',
      isEs ? 'Sin benchmark o contexto adicional, la decisión puede quedarse corta.' : 'Without benchmark/additional context, the decision can stay shallow.',
    ];
    decision.improvements = [
      isEs ? 'Añade resumen de objetivos, cifras y plazos del documento.' : 'Add a short summary of goals, numbers, and timeline from the document.',
      isEs ? 'Sube una versión más legible si el archivo es escaneo.' : 'Upload a clearer version if the file is a scan.',
      isEs ? 'Confirma datos críticos antes de ejecutar gasto o escala.' : 'Confirm critical data before spending or scaling.',
    ];
    decision.marketSignals = [isEs ? 'Modo documento activado.' : 'Document mode enabled.'];
  }

  decision.monetization = {
    ...(decision.monetization || {}),
    unlockCTA: ctaByMode,
  };

  return decision;
}

function parseVideoMetadataOutput(output: string): VideoMetadata {
  const durationMatch = output.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/i);
  const streamMatch = output.match(/Video:\s*([^,]+),.*?(\d{2,5})x(\d{2,5})/i);
  const fpsMatch = output.match(/(\d+(?:\.\d+)?)\s*fps/i);

  const durationSeconds = durationMatch
    ? (Number(durationMatch[1]) * 3600) + (Number(durationMatch[2]) * 60) + Number(durationMatch[3])
    : null;

  return {
    durationSeconds: Number.isFinite(durationSeconds as number) ? Number((durationSeconds as number).toFixed(1)) : null,
    width: streamMatch ? Number(streamMatch[2]) : null,
    height: streamMatch ? Number(streamMatch[3]) : null,
    codec: streamMatch?.[1]?.trim() || null,
    frameRate: fpsMatch ? Number(fpsMatch[1]) : null,
  };
}

function formatVideoMetadataSummary(metadata: VideoMetadata, currentLanguage: Language) {
  const parts: string[] = [];
  if (metadata.durationSeconds != null) parts.push(currentLanguage === 'pl' ? `czas: ${metadata.durationSeconds}s` : `duration: ${metadata.durationSeconds}s`);
  if (metadata.width && metadata.height) parts.push(currentLanguage === 'pl' ? `rozdzielczość: ${metadata.width}x${metadata.height}` : `resolution: ${metadata.width}x${metadata.height}`);
  if (metadata.codec) parts.push(currentLanguage === 'pl' ? `kodek: ${metadata.codec}` : `codec: ${metadata.codec}`);
  if (metadata.frameRate != null) parts.push(currentLanguage === 'pl' ? `fps: ${metadata.frameRate}` : `fps: ${metadata.frameRate}`);
  return parts.length ? parts.join(', ') : (currentLanguage === 'pl' ? 'metadane wideo ograniczone' : 'video metadata limited');
}

function readExtractedVideoFrames(tempDir: string, fileName: string, maxFrames: number): UploadedImage[] {
  return fs.readdirSync(tempDir)
    .filter((name) => /^frame-\d+\.jpg$/i.test(name))
    .sort()
    .slice(0, maxFrames)
    .map((name) => {
      const imagePath = path.join(tempDir, name);
      return {
        name: `${fileName} • ${name}`,
        mimeType: 'image/jpeg',
        dataUrl: `data:image/jpeg;base64,${fs.readFileSync(imagePath).toString('base64')}`,
      };
    });
}

function extractVideoMetadata(fileName: string, bytes: Buffer): VideoMetadata {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ufrev-video-meta-'));
  const inputPath = path.join(tempDir, fileName.replace(/[^a-zA-Z0-9._-]/g, '_'));
  const candidates = [typeof ffmpegPath === 'string' ? ffmpegPath : '', 'ffmpeg'].filter(Boolean);

  try {
    fs.writeFileSync(inputPath, bytes);

    for (const binary of candidates) {
      try {
        execFileSync(binary, ['-hide_banner', '-i', inputPath], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true, encoding: 'utf8' });
      } catch (error: any) {
        const output = `${String(error?.stdout || '')}\n${String(error?.stderr || '')}`;
        const parsed = parseVideoMetadataOutput(output);
        if (parsed.durationSeconds != null || (parsed.width && parsed.height) || parsed.codec) {
          return parsed;
        }
      }
    }

    return { durationSeconds: null, width: null, height: null, codec: null, frameRate: null };
  } finally {
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
  }
}

function extractVideoFrames(fileName: string, bytes: Buffer, maxFrames = 3): UploadedImage[] {
  if (maxFrames <= 0) return [];

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ufrev-video-'));
  const inputPath = path.join(tempDir, fileName.replace(/[^a-zA-Z0-9._-]/g, '_'));
  const framePattern = path.join(tempDir, 'frame-%02d.jpg');
  const candidates = [typeof ffmpegPath === 'string' ? ffmpegPath : '', 'ffmpeg'].filter(Boolean);
  let lastError: unknown = null;

  try {
    fs.writeFileSync(inputPath, bytes);

    const strategies = [
      ['-hide_banner', '-loglevel', 'error', '-y', '-i', inputPath, '-vf', 'fps=1/2,scale=960:-1:flags=lanczos', '-frames:v', String(maxFrames), framePattern],
      ['-hide_banner', '-loglevel', 'error', '-y', '-ss', '00:00:01', '-i', inputPath, '-vf', 'thumbnail=40,scale=960:-1:flags=lanczos', '-frames:v', String(Math.min(maxFrames, 1)), framePattern],
      ['-hide_banner', '-loglevel', 'error', '-y', '-i', inputPath, '-vf', "select='not(mod(n,45))',scale=960:-1:flags=lanczos", '-vsync', 'vfr', '-frames:v', String(maxFrames), framePattern],
    ];

    for (const binary of candidates) {
      for (const args of strategies) {
        try {
          execFileSync(binary, args, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
        } catch (error) {
          lastError = error;
        }

        const frames = readExtractedVideoFrames(tempDir, fileName, maxFrames);
        if (frames.length) return frames;
      }
    }

    if (lastError) {
      console.error('VIDEO FRAME EXTRACTION FAILED', fileName, lastError);
    }
    return [];
  } catch (error) {
    console.error('VIDEO FRAME EXTRACTION SETUP FAILED', fileName, error);
    return [];
  } finally {
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
  }
}

function extractRawPdfText(bytes: Buffer) {
  const raw = bytes.toString('latin1');
  return normalizeDocumentText(
    Array.from(raw.matchAll(/\(([^()\n\r]{4,200})\)/g))
      .map((match) => match[1])
      .filter((chunk) => /[a-zA-ZąćęłńóśżźĄĆĘŁŃÓŚŻŹ]/.test(chunk))
      .join('\n')
      .replace(/\\[nrt]/g, ' ')
  );
}

async function extractPdfText(fileName: string, bytes: Buffer) {
  try {
    const pdfParseModule = await import('pdf-parse');
    const pdfParse = (pdfParseModule as any).default || pdfParseModule;
    const parsed = await pdfParse(bytes);
    const extracted = normalizeDocumentText(String(parsed?.text || ''));
    if (looksLikeReadableDocumentText(extracted)) return extracted;
  } catch {
    // ignore and continue to fallback methods
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ufrev-pdf-'));
  const inputPath = path.join(tempDir, fileName.replace(/[^a-zA-Z0-9._-]/g, '_'));
  const outputPath = path.join(tempDir, 'output.txt');
  try {
    fs.writeFileSync(inputPath, bytes);
    execFileSync('pdftotext', ['-enc', 'UTF-8', '-layout', inputPath, outputPath], { stdio: 'ignore', windowsHide: true });
    const extracted = fs.existsSync(outputPath) ? normalizeDocumentText(fs.readFileSync(outputPath, 'utf8')) : '';
    if (looksLikeReadableDocumentText(extracted)) return extracted;
  } catch {
    // ignore and continue to raw fallback
  } finally {
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
  }

  const rawFallback = extractRawPdfText(bytes);
  return looksLikeReadableDocumentText(rawFallback) ? rawFallback : '';
}

function extractPdfPreviewImages(fileName: string, bytes: Buffer, maxPages = 2): UploadedImage[] {
  if (maxPages <= 0) return [];

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ufrev-pdf-preview-'));
  const inputPath = path.join(tempDir, fileName.replace(/[^a-zA-Z0-9._-]/g, '_'));
  const outputPrefix = path.join(tempDir, 'pdf-preview');

  try {
    fs.writeFileSync(inputPath, bytes);
    execFileSync('pdftoppm', ['-jpeg', '-f', '1', '-l', String(Math.max(1, maxPages)), '-r', '144', inputPath, outputPrefix], { stdio: 'ignore', windowsHide: true });

    return fs.readdirSync(tempDir)
      .filter((name) => /^pdf-preview-\d+\.jpg$/i.test(name))
      .sort()
      .slice(0, maxPages)
      .map((name) => ({
        name: `${fileName} • ${name}`,
        mimeType: 'image/jpeg',
        dataUrl: `data:image/jpeg;base64,${fs.readFileSync(path.join(tempDir, name)).toString('base64')}`,
      }));
  } catch {
    return [];
  } finally {
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
  }
}

function analysisLabel(type: string, language: Language = 'en') {
  if (language === 'pl') {
    switch (type) {
      case 'competitor-review': return 'Analiza konkurencji';
      case 'offer-audit': return 'Audyt oferty / landing page';
      case 'ad-angle': return 'Analiza kąta reklamowego i kreacji';
      case 'pricing-check': return 'Analiza ceny i opłacalności';
      default: return 'Decyzja produktowa';
    }
  }

  switch (type) {
    case 'competitor-review': return 'Competitor review';
    case 'offer-audit': return 'Offer / landing page audit';
    case 'ad-angle': return 'Ad angle and creative review';
    case 'pricing-check': return 'Pricing and profitability check';
    default: return 'Product decision';
  }
}


function extractStructuredFacts(text: string) {
  const facts: string[] = [];
  const compact = text.replace(/\s+/g, ' ');

  const qtyMatch = compact.match(/(?:qty|quantity|ilość|ilosc|szt\.?|pcs\.?)[^0-9]{0,8}([0-9]{1,6})/i);
  const totalMatch = compact.match(/(?:total|suma|razem|wartość brutto|wartosc brutto|kwota|amount)[^0-9]{0,12}([0-9]+(?:[\.,][0-9]{1,2})?)/i);
  const unitMatch = compact.match(/(?:unit price|cena netto|cena brutto|price per unit|za szt\.?|za sztukę)[^0-9]{0,12}([0-9]+(?:[\.,][0-9]{1,2})?)/i);

  const qty = qtyMatch ? Number(String(qtyMatch[1]).replace(',', '.')) : null;
  const total = totalMatch ? Number(String(totalMatch[1]).replace(',', '.')) : null;
  const unit = unitMatch ? Number(String(unitMatch[1]).replace(',', '.')) : null;

  if (qty && qty > 0) facts.push(`Detected quantity from source files/text: ${qty}.`);
  if (total && total > 0) facts.push(`Detected total invoice/order value from source files/text: ${total}.`);
  if (unit && unit > 0) facts.push(`Detected unit price from source files/text: ${unit}.`);
  if (!unit && qty && total && qty > 0) facts.push(`Derived approximate unit cost from source files/text: ${(total / qty).toFixed(2)}.`);

  return facts;
}

function chooseResponseStyle(seed: string) {
  const variants = ['operator', 'consultant', 'ecommerce', 'analyst'];
  let total = 0;
  for (let i = 0; i < seed.length; i += 1) total += seed.charCodeAt(i);
  return variants[total % variants.length];
}

function buildDirectQuestionLead(params: {
  content: string;
  currentLanguage: Language;
  displayCurrency: string;
  websiteUrl: string;
  salesChannel: string;
  price: number;
  cost: number;
}) {
  const combined = `${params.content} ${params.salesChannel}`.toLowerCase();
  const asksUnits = /ile sztuk|how many units|order quantity|test batch|moq|min(?:imum)? order/.test(combined);
  const asksPrice = /po ile|wystawia[cć]|selling price|listing price|sell price|jak[aą] cen[aę]/.test(combined);
  const asksDemand = /popyt|demand|czy się sprzeda|czy sie sprzeda|will it sell|czy będzie|czy bedzie/.test(combined);
  const asksRental = /wynajem|wypożycz|wypozycz|rental|rent out|lease/.test(combined);
  const asksEquipment = /jaki sprzęt|jaki sprzet|sprzęt|sprzet|equipment|maszyn|generator|odkurzacz|parownic|myjk/i.test(combined);
  const asksStartupCost = /ile to będzie kosztowa|ile to bedzie kosztowa|startup cost|budżet start|budzet start|koszt start/i.test(combined);
  const asksDirection = /w jaki kierunek|co wybrać|co wybrac|pionier rynku|which direction|what niche|which lane/i.test(combined);
  const serviceBusinessCase = isServiceBusinessPrompt(`${params.content} ${params.salesChannel}`);

  if (!asksUnits && !asksPrice && !asksDemand && !asksRental && !asksEquipment && !asksStartupCost && !asksDirection) return '';

  const supplierSource = looksLikeSupplierMarketplaceUrl(params.websiteUrl);
  const hasHardCost = params.cost > 0 || params.price > 0 || /unit price|price per unit|cena|cost|koszt|shipping|dostaw/i.test(combined);
  const targetSellFloor = params.cost > 0 ? params.cost / 0.65 : null;
  const quickPaybackRentLow = params.cost > 0 ? params.cost / 12 : null;
  const quickPaybackRentHigh = params.cost > 0 ? params.cost / 8 : null;
  const weekendPackage = params.cost > 0 ? params.cost / 5 : null;

  if (serviceBusinessCase && params.currentLanguage === 'pl') {
    const parts: string[] = [];

    if (asksDirection) {
      parts.push('Najbezpieczniej wejść najpierw w jedną niszę premium z dojazdem, a dopiero potem rozszerzać usługę na TIR-y albo cięższe mycie elewacji.');
    }

    if (asksEquipment) {
      parts.push('Starter usługowy zwykle wymaga auta roboczego, wydajnej myjki lub parownicy, zbiornika / dostępu do wody, chemii, osprzętu do piany i szczotek oraz zabezpieczeń BHP.');
    }

    if (asksStartupCost) {
      parts.push('Budżet startowy trzeba policzyć osobno dla auta, maszyny głównej, osprzętu, chemii, brandingu, dojazdów i bufora serwisowego, zamiast udawać jedną pewną kwotę.');
    }

    if (asksDemand || params.websiteUrl) {
      parts.push('Linki konkurencji traktuj tu jako benchmark usług i cenników lokalnych, a nie jak listing produktu pod klasyczny e-commerce verdict.');
    }

    return parts.join(' ');
  }

  if (params.currentLanguage === 'pl') {
    const parts: string[] = [];

    if (asksUnits) {
      parts.push(hasHardCost
        ? 'Zakup zacznij od małej partii testowej i skaluj dopiero po potwierdzeniu konwersji oraz zwrotów.'
        : 'Bez pełnego kosztu zakupu, dostawy i prowizji zacząłbym od testu 20–50 sztuk, a nie większego zatowarowania.');
    }

    if (asksPrice) {
      parts.push(targetSellFloor != null
        ? `Przy tym koszcie sensowny floor ceny to około ${formatMoney(targetSellFloor, params.currentLanguage, params.displayCurrency as any)}, żeby zostawić miejsce na prowizję, dostawę i reklamę.`
        : `Nie podawaj jednej sztywnej ceny bez kosztu lądowania — na Allegro celuj w minimum 30–40% marży po wszystkich opłatach w ${params.displayCurrency}.`);
    }

    if (asksDemand) {
      parts.push(supplierSource
        ? 'Sam link z Alibaba pokazuje źródło zakupu, ale nie potwierdza popytu — popyt trzeba sprawdzić na Allegro po liczbie ofert, opinii i poziomie cen.'
        : 'Popyt trzeba potwierdzić realną konkurencją, ceną i wynikami małego testu, a nie samym opisem produktu.');
    }

    if (asksRental) {
      parts.push(quickPaybackRentLow != null && quickPaybackRentHigh != null && weekendPackage != null
        ? `Jeśli chcesz szybki zwrot przy modelu wynajem, licz odzyskanie kosztu w około 8–12 rezerwacji: stawka dzienna około ${formatMoney(quickPaybackRentLow, params.currentLanguage, params.displayCurrency as any)}–${formatMoney(quickPaybackRentHigh, params.currentLanguage, params.displayCurrency as any)}, a pakiet weekendowy około ${formatMoney(weekendPackage, params.currentLanguage, params.displayCurrency as any)}.`
        : 'Przy wynajmie ustaw stawkę tak, aby cały koszt zwrócił się w około 8–12 rezerwacji, a dopiero potem skaluj park maszyn.');
    }

    return parts.join(' ');
  }

  const parts: string[] = [];
  if (asksUnits) {
    parts.push(hasHardCost
      ? 'Start with a small test batch and scale only after conversion and return data confirm the demand.'
      : 'Without full landed cost, shipping, and fees, start with a small 20–50 unit test batch instead of deeper inventory.');
  }
  if (asksPrice) {
    parts.push(targetSellFloor != null
      ? `A sensible sell-price floor is about ${formatMoney(targetSellFloor, params.currentLanguage, params.displayCurrency as any)} so there is still room for marketplace fees and ad spend.`
      : `Do not force one exact resale price without landed cost data — aim for at least a 30–40% margin after marketplace fees in ${params.displayCurrency}.`);
  }
  if (asksDemand) {
    parts.push(supplierSource
      ? 'A supplier link like Alibaba shows sourcing context, not proof of retail demand, so demand must still be validated on the target marketplace.'
      : 'Demand still needs to be validated with competitor pricing, listing volume, and a controlled test.');
  }
  if (asksRental) {
    parts.push(quickPaybackRentLow != null && quickPaybackRentHigh != null && weekendPackage != null
      ? `For a fast rental payback, aim to recover the cost in roughly 8–12 bookings: about ${formatMoney(quickPaybackRentLow, params.currentLanguage, params.displayCurrency as any)}–${formatMoney(quickPaybackRentHigh, params.currentLanguage, params.displayCurrency as any)} per day, and about ${formatMoney(weekendPackage, params.currentLanguage, params.displayCurrency as any)} for a weekend package.`
      : 'For rentals, set the daily and weekend rate so the full cost returns within roughly 8–12 bookings before scaling further.');
  }

  return parts.join(' ');
}

function pickDisplayCurrency(currentLanguage: Language, requestedCurrency: string, selectedCountry?: string) {
  const fallback = getCurrencyForCountry(selectedCountry, getCurrencyForLanguage(currentLanguage));
  return normalizeCurrencyCode(requestedCurrency, fallback);
}

function languageName(language: Language) {
  if (language === 'pl') return 'Polish';
  if (language === 'de') return 'German';
  if (language === 'es') return 'Spanish';
  if (language === 'pt') return 'Portuguese';
  if (language === 'ja') return 'Japanese';
  if (language === 'zh') return 'Chinese';
  if (language === 'id') return 'Indonesian';
  if (language === 'ru') return 'Russian';
  return 'English';
}

function formatAiTokens(count: number, language: Language) {
  if (language === 'pl') {
    if (count === 1) return '1 token AI';
    const mod10 = count % 10;
    const mod100 = count % 100;
    const label = mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14) ? 'tokeny AI' : 'tokenów AI';
    return `${count} ${label}`;
  }
  return `${count} ${count === 1 ? 'AI token' : 'AI tokens'}`;
}

function buildInsufficientTokensMessage(currentLanguage: Language, tokenCost: number, availableTokens: number) {
  if (currentLanguage === 'pl') {
    return `Ta analiza wymaga ${formatAiTokens(tokenCost, currentLanguage)}, a na koncie dostępne są tylko ${formatAiTokens(availableTokens, currentLanguage)}.`;
  }
  return `This analysis needs ${formatAiTokens(tokenCost, currentLanguage)}, but only ${formatAiTokens(availableTokens, currentLanguage)} are available on the account.`;
}

type AnalysisProfileSnapshot = {
  credits_balance: number;
  analyses_used_this_month: number;
  monthly_analysis_limit: number;
  role: string | null;
  plan_key: string | null;
};

function normalizeAnalysisProfile(profile?: Partial<AnalysisProfileSnapshot> | null): AnalysisProfileSnapshot {
  return {
    credits_balance: Math.max(0, Number(profile?.credits_balance ?? 3) || 3),
    analyses_used_this_month: Math.max(0, Number(profile?.analyses_used_this_month ?? 0) || 0),
    monthly_analysis_limit: Math.max(1, Number(profile?.monthly_analysis_limit ?? 3) || 3),
    role: typeof profile?.role === 'string' ? profile.role : 'user',
    plan_key: typeof profile?.plan_key === 'string' ? profile.plan_key : 'free',
  };
}

async function ensureAnalysisProfile(user: { id: string; email?: string | null }) {
  const selectColumns = 'credits_balance, analyses_used_this_month, monthly_analysis_limit, role, plan_key';
  const fallback = normalizeAnalysisProfile(null);

  try {
    const { data } = await supabaseAdmin.from('profiles').select(selectColumns).eq('id', user.id).limit(1);
    const existing = Array.isArray(data) ? data[0] : null;
    if (existing) return normalizeAnalysisProfile(existing as Partial<AnalysisProfileSnapshot>);

    await supabaseAdmin.from('profiles').upsert({
      id: user.id,
      email: user.email || null,
      role: 'user',
      plan_key: 'free',
      credits_balance: fallback.credits_balance,
      monthly_analysis_limit: fallback.monthly_analysis_limit,
      analyses_used_this_month: fallback.analyses_used_this_month,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    const { data: afterUpsert } = await supabaseAdmin.from('profiles').select(selectColumns).eq('id', user.id).limit(1);
    const ensured = Array.isArray(afterUpsert) ? afterUpsert[0] : null;
    return normalizeAnalysisProfile(ensured as Partial<AnalysisProfileSnapshot> | null);
  } catch (error) {
    console.error('ANALYSIS PROFILE INIT ERROR:', error);
    return fallback;
  }
}

function getAnalysisRateLimits(profile?: { role?: string | null; plan_key?: string | null }) {
  if (profile?.role === 'admin') {
    return { maxPer10Min: 200, maxPerDay: 2000 };
  }

  const planKey = normalizePlanKey(profile?.plan_key);

  if (planKey === 'scale') return { maxPer10Min: 40, maxPerDay: 400 };
  if (planKey === 'starter') return { maxPer10Min: 10, maxPerDay: 90 };
  if (planKey === 'pro') return { maxPer10Min: 20, maxPerDay: 180 };

  return {
    maxPer10Min: SECURITY_LIMITS.maxAnalysisRequestsPer10Min,
    maxPerDay: SECURITY_LIMITS.maxAnalysesPerDay,
  };
}

async function generateModelAnalysisText(params: {
  userPrompt: string;
  dynamicSystemPrompt: string;
  uploadedImages: UploadedImage[];
  analysisMode: AnalysisMode;
  currentLanguage: Language;
  fallbackText: string;
}) {
  if (!openai) return params.fallbackText;

  const modeInstruction = params.analysisMode === 'visual_analysis'
    ? `VISUAL MODE: read the uploaded image, screenshot, or preview frame directly. Name what is visible, answer the exact question, and avoid forcing product-metric language when the user only wants visual understanding.${params.uploadedImages.length > 0 ? ' Preview frames are attached, so do not claim that the video cannot be opened or that no visual evidence is available.' : ''}`
    : params.analysisMode === 'document_analysis'
      ? 'DOCUMENT MODE: explain what the document likely contains and answer the exact question using the extracted content and any preview page images.'
      : 'STANDARD MODE: answer directly and stay grounded in the provided evidence.';

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 260,
      messages: [
        {
          role: 'system',
          content: `${ANALYSIS_SYSTEM_PROMPT}\n\n${params.dynamicSystemPrompt}\n\n${modeInstruction}\n\nCRITICAL:\n- Answer the exact user question first\n- Use only the provided visual/document evidence\n- If something is unclear, say so directly instead of guessing`,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: params.userPrompt },
            ...params.uploadedImages.map((image) => ({ type: 'image_url' as const, image_url: { url: image.dataUrl } })),
          ],
        },
      ],
    });

    return (completion.choices[0]?.message?.content || '').trim() || params.fallbackText;
  } catch (err) {
    console.error('OPENAI MODE-SPECIFIC ERROR:', err);
    return params.fallbackText;
  }
}

async function persistAnalysisAndConsumeTokens(params: {
  supabase: any;
  userId: string;
  analysisType: string;
  inputText: string;
  resultText: string;
  productName: string;
  decisionJson: any;
  tokenCost: number;
  profile: { credits_balance: number };
}) {
  const rpcPayload = {
    p_user_id: params.userId,
    p_analysis_type: params.analysisType,
    p_input_text: params.inputText,
    p_result_text: params.resultText,
    p_product_name: params.productName,
    p_decision_json: params.decisionJson,
    p_token_cost: params.tokenCost,
  };

  const { error: rpcError } = await params.supabase.rpc('consume_credit_and_store_analysis', rpcPayload);
  if (!rpcError) return;

  const rpcMessage = String(rpcError.message || '');
  const canUseLegacyFallback = /consume_credit_and_store_analysis|schema cache|does not exist/i.test(rpcMessage);
  if (!canUseLegacyFallback) throw rpcError;

  const { error: legacyError } = await params.supabase.rpc('consume_credit_and_store_analysis', {
    p_user_id: params.userId,
    p_analysis_type: params.analysisType,
    p_input_text: params.inputText,
    p_result_text: params.resultText,
    p_product_name: params.productName,
    p_decision_json: params.decisionJson,
  });

  if (legacyError) throw legacyError;

  if (params.tokenCost > 1) {
    const adjustedBalance = Math.max(0, Number(params.profile.credits_balance || 0) - params.tokenCost);
    const { error: balanceError } = await supabaseAdmin
      .from('profiles')
      .update({ credits_balance: adjustedBalance, updated_at: new Date().toISOString() })
      .eq('id', params.userId);

    if (balanceError) throw balanceError;
  }
}

function enhanceDecisionForUi(params: {
  decision: ReturnType<typeof calculateDecision> & { analysisMode?: string; analysisHeadline?: string };
  currentLanguage: Language;
  productName: string;
  websiteUrl: string;
  competitorUrls: string;
  uploadedFilesCount: number;
  uploadedImagesCount: number;
  intent: SmartIntent;
  isServiceBusinessCase: boolean;
  selectedCountry?: string;
  targetMarket?: string;
  resolvedDemand?: number;
  resolvedCompetition?: number;
}) {
  const {
    decision,
    currentLanguage,
    productName,
    websiteUrl,
    competitorUrls,
    uploadedFilesCount,
    uploadedImagesCount,
    intent,
    isServiceBusinessCase,
    selectedCountry,
    targetMarket,
    resolvedDemand,
    resolvedCompetition,
  } = params;

  const strictLanguage = currentLanguage === 'pl' || currentLanguage === 'en' || currentLanguage === 'es';

  if (
    !strictLanguage ||
    decision.analysisMode === 'cost_optimization' ||
    decision.analysisMode === 'document_analysis' ||
    intent === 'extract_data' ||
    (!websiteUrl && !competitorUrls && (uploadedFilesCount > 0 || uploadedImagesCount > 0) && !decision.pricing?.currentPrice)
  ) {
    return decision;
  }

  const itemLabelPl = productName?.trim() ? `„${productName.trim()}”` : 'tej oferty';
  const itemLabelEn = productName?.trim() ? `"${productName.trim()}"` : 'this offer';
  const itemLabelEs = productName?.trim() ? `"${productName.trim()}"` : 'esta oferta';
  const margin = decision.pricing?.marginPercent ?? 0;
  const competitionLevel = Array.isArray(decision.issues) && decision.issues.some((item) => /competition pressure is high/i.test(item));
  const hasEvidence = Boolean(websiteUrl || competitorUrls || uploadedFilesCount > 0 || uploadedImagesCount > 0);
  const hasHardUnitEconomics = Boolean((decision.pricing?.currentPrice ?? 0) > 0 && (decision.pricing?.estimatedCost ?? 0) > 0);
  const region = (targetMarket || selectedCountry || '').trim();

  if (isServiceBusinessCase) {
    decision.analysisMode = 'service_estimation';
    decision.verdict = decision.verdict === 'BUY' ? 'TEST' : decision.verdict;
    decision.executionMode = 'manual_review';

    if (currentLanguage === 'pl') {
      decision.analysisHeadline = `To jest case usługowy lokalny${region ? ` (${region})` : ''} - zacznij od kontrolowanego wejścia, nie od pełnej skali.`;
      decision.why = [
        `Pytanie dotyczy uruchomienia usługi lokalnej, więc priorytetem jest popyt lokalny, cennik i operacja, a nie klasyczny e-commerce margin model.`,
        competitorUrls ? 'Konkurencja została uwzględniona jako benchmark usług i poziomów cen.' : 'Brak linków konkurencji obniża pewność i utrudnia precyzyjny cennik startowy.',
        `Sygnały wejściowe: popyt ${Math.round(resolvedDemand ?? 0)}/100, konkurencja ${Math.round(resolvedCompetition ?? 0)}/100.`,
      ].slice(0, 3);
      decision.issues = [
        hasHardUnitEconomics ? 'Model usługi ma częściowo potwierdzone liczby, ale nadal wymaga walidacji lokalnej i testu ofert.' : 'Nie ma pełnych danych liczbowych do twardej marży, więc wynik musi pozostać ostrożny.',
        'Szybkie wejście dużym budżetem bez testu pakietów i jakości leadów zwiększa ryzyko przepalenia.',
        competitionLevel ? 'Konkurencja wygląda mocno, więc oferta musi mieć wyraźny wyróżnik i lepszą prezentację wartości.' : 'Brak wyraźnego benchmarku konkurencji może zaniżyć trafność decyzji.',
      ].slice(0, 3);
      decision.improvements = [
        'Wybierz 1 główną usługę startową i 2 pakiety cenowe (entry + premium), zamiast ruszać od razu szeroko.',
        'Zrób mały test lokalny (3-7 dni) i mierz: koszt leada, konwersję kontakt->zlecenie, realny czas realizacji.',
        competitorUrls ? 'Porównaj cennik i zakres konkurencji 1:1, a potem ustaw ofertę z jasnym wyróżnikiem.' : 'Dodaj min. 3 linki lokalnej konkurencji, żeby doprecyzować cennik i pozycjonowanie.',
      ].slice(0, 3);
      decision.marketSignals = [
        region ? `Kontekst lokalny ustawiony na: ${region}.` : 'Brak jednoznacznie ustawionego regionu docelowego.',
        competitorUrls ? 'Benchmark konkurencji został podpięty do analizy.' : 'Brakuje benchmarku konkurencji w danych wejściowych.',
        hasEvidence ? 'Analiza opiera się na realnych danych wejściowych i kontekście użytkownika.' : 'To nadal wstępna analiza - dodaj więcej danych lokalnych.',
      ].slice(0, 3);
      decision.adStrategy.nextStep = decision.improvements[0];
      return decision;
    }

    if (currentLanguage === 'es') {
      decision.analysisHeadline = `Este es un caso de servicio local${region ? ` (${region})` : ''}: empieza con validación controlada, no con escala total.`;
      decision.why = [
        'La pregunta es sobre abrir un servicio local, así que importa más la demanda local, el precio y la operación que un modelo e-commerce rígido.',
        competitorUrls ? 'La competencia se usó como benchmark de servicios y niveles de precio.' : 'Faltan enlaces de competencia, por eso la confianza es más limitada.',
        `Señales de entrada: demanda ${Math.round(resolvedDemand ?? 0)}/100, competencia ${Math.round(resolvedCompetition ?? 0)}/100.`,
      ].slice(0, 3);
      decision.issues = [
        hasHardUnitEconomics ? 'Hay datos parciales, pero todavía hace falta validación local antes de escalar.' : 'No hay números completos para una margen dura, por eso la decisión debe seguir conservadora.',
        'Escalar rápido sin test de paquetes ni calidad del lead eleva el riesgo de quemar presupuesto.',
        competitionLevel ? 'La competencia parece fuerte, así que la oferta necesita un diferenciador claro.' : 'Sin benchmark sólido de competencia, la precisión baja.',
      ].slice(0, 3);
      decision.improvements = [
        'Elige 1 servicio principal de entrada y 2 paquetes de precio (entry + premium).',
        'Ejecuta una prueba local pequeña (3-7 días) y mide coste por lead, conversión y tiempo real de servicio.',
        competitorUrls ? 'Compara precio y alcance de competidores 1:1 y define una propuesta diferenciada.' : 'Añade al menos 3 enlaces de competencia local para afinar precio y posicionamiento.',
      ].slice(0, 3);
      decision.marketSignals = [
        region ? `Contexto local fijado en: ${region}.` : 'No hay región objetivo claramente definida.',
        competitorUrls ? 'Benchmark de competencia incluido en la lectura.' : 'Falta benchmark de competencia en el input.',
        hasEvidence ? 'El análisis usa datos reales del usuario.' : 'Todavía es una lectura inicial; añade más datos locales.',
      ].slice(0, 3);
      decision.adStrategy.nextStep = decision.improvements[0];
      return decision;
    }

    decision.analysisHeadline = `This is a local service-business case${region ? ` (${region})` : ''}: start with controlled validation, not full scale.`;
    decision.why = [
      'This question is about launching a local service, so local demand, pricing, and operations matter more than a rigid e-commerce margin template.',
      competitorUrls ? 'Competitor data was used as a local service and pricing benchmark.' : 'Missing competitor links lowers confidence for precise startup pricing.',
      `Input signals: demand ${Math.round(resolvedDemand ?? 0)}/100, competition ${Math.round(resolvedCompetition ?? 0)}/100.`,
    ].slice(0, 3);
    decision.issues = [
      hasHardUnitEconomics ? 'Some numbers are available, but local validation is still required before scale.' : 'Hard unit-economics are not fully confirmed, so the decision remains conservative.',
      'Scaling budget too fast without package testing and lead-quality checks increases burn risk.',
      competitionLevel ? 'Competition looks strong, so differentiation must be explicit in the first offer screen.' : 'Without a strong competitor benchmark, precision is lower.',
    ].slice(0, 3);
    decision.improvements = [
      'Choose one primary starter lane and define two price packages (entry + premium).',
      'Run a small local test (3-7 days) and measure lead cost, lead-to-job conversion, and real service time.',
      competitorUrls ? 'Compare competitor pricing and service scope 1:1, then set a clearer differentiator.' : 'Add at least 3 local competitor URLs to tighten price and positioning logic.',
    ].slice(0, 3);
    decision.marketSignals = [
      region ? `Local context set to: ${region}.` : 'No explicit local region was set.',
      competitorUrls ? 'Competitor benchmark was included in the analysis.' : 'Competitor benchmark is missing from inputs.',
      hasEvidence ? 'The analysis uses real user-provided context and evidence.' : 'This is still an early read; add more local evidence.',
    ].slice(0, 3);
    decision.adStrategy.nextStep = decision.improvements[0];
    return decision;
  }

  if (currentLanguage === 'es') {
    decision.analysisHeadline =
      decision.verdict === 'BUY'
        ? `Hay base para entrar con cuidado en ${itemLabelEs}`
        : decision.verdict === 'AVOID'
          ? `Por ahora es mejor frenar el movimiento sobre ${itemLabelEs}`
          : 'Este caso necesita una prueba pequeña, no una entrada completa';
    decision.why = [
      hasHardUnitEconomics ? (margin >= 30 ? `El margen parece saludable (${margin}%), hay espacio para prueba segura.` : `El margen está ajustado (${margin}%), hay que controlar presupuesto y precio.`) : 'No hay margen confirmado todavía porque faltan precio y/o coste completos.',
      competitorUrls ? 'Hay benchmark de competencia, así que la decisión no depende solo de intuición.' : 'Falta benchmark sólido de competencia, por eso la decisión sigue conservadora.',
      hasEvidence ? 'La lectura usa evidencia real de entrada (link/archivo/imagen).' : 'Sin link o archivo, la precisión todavía es limitada.',
    ].slice(0, 3);
    decision.issues = [
      competitionLevel ? 'La competencia parece fuerte; sin diferenciación clara será difícil ganar por precio o creatividad.' : 'No aparece una bandera roja crítica, pero la entrada debe ser en pasos pequeños.',
      margin < 22 || !hasHardUnitEconomics ? 'Con margen débil o no confirmado, escalar rápido puede quemar presupuesto.' : 'El mayor riesgo sigue siendo la calidad del tráfico y el CAC real al inicio.',
      uploadedFilesCount > 0 && uploadedImagesCount === 0 ? 'Si el archivo no trae datos de mercado completos, la decisión requiere validación adicional.' : 'Sin resultados reales de campaña no conviene escalar de inmediato.',
    ].slice(0, 3);
    decision.improvements = [
      margin < 22 || !hasHardUnitEconomics ? 'Ajusta precio o reduce coste antes de aumentar tráfico.' : 'Lanza una prueba pequeña con 2-3 creatividades y mide CTR, CPC y primeras conversiones.',
      competitionLevel ? 'Refuerza el diferenciador: bundle, garantía, prueba social, hook más fuerte o nicho más estrecho.' : 'Explica claramente por qué tu oferta gana frente a alternativas desde la primera pantalla.',
      'No aumentes presupuesto de golpe: valida primero calidad del tráfico, conversión y devoluciones.',
    ].slice(0, 3);
    decision.marketSignals = [
      websiteUrl ? 'El link de oferta fue incluido en la lectura.' : 'No se añadió link de oferta, así que la lectura depende más del texto y números.',
      competitorUrls ? 'Los datos de competencia mejoran el posicionamiento y la lectura de precio.' : 'Añadir 2-3 links de competencia mejorará la siguiente decisión.',
      uploadedFilesCount > 0 ? `Se incluyeron ${uploadedFilesCount} archivo(s), por lo que se usó también contexto documental.` : uploadedImagesCount > 0 ? `Se incluyeron ${uploadedImagesCount} imagen(es), por lo que se usaron señales visuales.` : 'Es una lectura rápida sin archivos adicionales; añade más contexto en la siguiente pregunta.',
    ].slice(0, 3);
    decision.adStrategy.nextStep = decision.improvements[0];
    return decision;
  }

  if (currentLanguage === 'en') {
    decision.analysisHeadline =
      decision.verdict === 'BUY'
        ? `There is enough signal to enter ${itemLabelEn} carefully`
        : decision.verdict === 'AVOID'
          ? `For now it is safer to pause around ${itemLabelEn}`
          : 'This case needs a small controlled test, not a full rollout';
    decision.why = [
      hasHardUnitEconomics ? (margin >= 30 ? `Margin looks healthy (${margin}%), so there is room for a safer test.` : `Margin is tight (${margin}%), so budget and pricing need caution.`) : 'Margin is not fully confirmed yet because price and/or cost are incomplete.',
      competitorUrls ? 'Competitor benchmarks are present, so the decision is not purely intuition-driven.' : 'Competitor benchmark is limited, so the decision remains conservative.',
      hasEvidence ? 'The analysis uses real evidence (link/file/image), not only a plain description.' : 'Without a link or file, precision is still limited.',
    ].slice(0, 3);
    decision.issues = [
      competitionLevel ? 'Competition pressure looks high, so clear differentiation is required before scaling.' : 'No single critical red flag appears, but entry should still be staged.',
      margin < 22 || !hasHardUnitEconomics ? 'Weak or unverified margin makes aggressive scaling unsafe.' : 'The main risk remains traffic quality and real CAC after launch.',
      uploadedFilesCount > 0 && uploadedImagesCount === 0 ? 'If files do not include complete market evidence, the conclusion still needs validation.' : 'Without real campaign outcomes, scaling immediately is still risky.',
    ].slice(0, 3);
    decision.improvements = [
      margin < 22 || !hasHardUnitEconomics ? 'Raise price or reduce landed cost before increasing spend.' : 'Run a small test on 2-3 creatives and track CTR, CPC, and early conversion quality.',
      competitionLevel ? 'Strengthen your moat: bundle, guarantee, proof, tighter hook, or narrower target segment.' : 'Show clearly why the offer wins against alternatives above the fold.',
      'Do not increase budget immediately. Validate traffic quality, conversion, and return risk first.',
    ].slice(0, 3);
    decision.marketSignals = [
      websiteUrl ? 'Offer URL was included in the analysis.' : 'No offer URL was provided, so the read relies mostly on text and numbers.',
      competitorUrls ? 'Competitor input improved price and positioning readout.' : 'Adding 2-3 competitor links will improve the next decision quality.',
      uploadedFilesCount > 0 ? `${uploadedFilesCount} file(s) were included, so document context was used.` : uploadedImagesCount > 0 ? `${uploadedImagesCount} image(s) were included, so visual signals were used.` : 'This is a quick read without extra files; add more context in the next prompt.',
    ].slice(0, 3);
    decision.adStrategy.nextStep = decision.improvements[0];
    return decision;
  }

  decision.analysisHeadline =
    decision.verdict === 'BUY'
      ? `Są podstawy, żeby ostrożnie wejść z ${itemLabelPl}`
      : decision.verdict === 'AVOID'
        ? `Na teraz lepiej wstrzymać ruch wokół ${itemLabelPl}`
        : `To wygląda na case do małego testu, a nie pełnego wejścia`;

  decision.why = [
    hasHardUnitEconomics
      ? (margin >= 30
        ? `Marża wygląda sensownie (${margin}%), więc jest przestrzeń na bezpieczny test.`
        : `Marża jest napięta (${margin}%), więc trzeba uważać z budżetem i ceną.`)
      : 'Brakuje pełnych danych liczbowych do twardej marży, więc decyzja musi pozostać ostrożna.',
    competitorUrls
      ? 'Masz punkt odniesienia do konkurencji, więc werdykt nie opiera się wyłącznie na przeczuciu.'
      : 'Brakuje twardszego benchmarku konkurencji, więc decyzja pozostaje ostrożna.',
    hasEvidence
      ? 'Analiza korzysta z realnych materiałów wejściowych (link / plik / obraz), więc kontekst jest lepszy niż przy gołym opisie.'
      : 'To wciąż wstępna ocena — bez linku lub pliku precyzja wyniku jest niższa.',
  ].slice(0, 3);

  decision.issues = [
    competitionLevel
      ? 'Konkurencja wygląda na mocną, więc bez wyraźnej przewagi będzie trudno wygrać ceną lub kreacją.'
      : 'Nie widać jednej krytycznej czerwonej flagi, ale wejście nadal trzeba robić małym krokiem.',
    margin < 22
      ? 'Przy tej marży zbyt szybkie skalowanie może przepalić budżet.'
      : 'Największym ryzykiem pozostaje jakość ruchu i realny koszt pozyskania klienta po starcie.',
    uploadedFilesCount > 0 && uploadedImagesCount === 0
      ? 'Jeśli plik nie zawiera pełnych danych rynkowych, część wniosków nadal wymaga potwierdzenia testem.'
      : 'Bez porównania z realnymi wynikami kampanii nadal nie warto iść od razu szeroko.',
  ].slice(0, 3);

  decision.improvements = [
    margin < 22 || !hasHardUnitEconomics
      ? 'Podnieś cenę albo zetnij koszt produktu przed większym ruchem.'
      : 'Uruchom mały test na 2–3 kreacjach i mierz CTR, CPC oraz pierwsze zakupy.',
    competitionLevel
      ? 'Doprecyzuj przewagę: bundle, gwarancja, proof, mocniejszy hook lub węższa grupa docelowa.'
      : 'Pokaż jasno, dlaczego oferta wygrywa z alternatywami już w pierwszym ekranie.',
    'Nie zwiększaj budżetu od razu — najpierw sprawdź jakość ruchu, konwersję i ewentualne zwroty.',
  ].slice(0, 3);

  decision.marketSignals = [
    websiteUrl
      ? 'Link do oferty został uwzględniony w analizie.'
      : 'Nie podano linku do oferty, więc ocena opiera się głównie na treści i liczbach.',
    competitorUrls
      ? 'Dodane dane konkurencji pomagają lepiej ocenić pozycjonowanie i cenę.'
      : 'Dodanie 2–3 linków konkurencji zwiększy trafność kolejnego wyniku.',
    uploadedFilesCount > 0
      ? `Do analizy dołączono ${uploadedFilesCount} plik(i), więc system bierze pod uwagę także treść dokumentów.`
      : uploadedImagesCount > 0
        ? `Do analizy dołączono ${uploadedImagesCount} obraz(y), więc system bierze pod uwagę również sygnały wizualne.`
        : 'To szybka analiza bez dodatkowych plików, więc warto dorzucić więcej kontekstu przy kolejnym pytaniu.',
  ].slice(0, 3);

  decision.adStrategy.nextStep = decision.improvements[0];

  return decision;
}

function buildFallbackAnalysis(params: {
  productName: string;
  analysisType: string;
  price: number;
  cost: number;
  demand: number;
  competition: number;
  adBudget: number;
  targetMarket: string;
  salesChannel: string;
  websiteUrl: string;
  competitorUrls: string;
  competitorAvgPrice: number;
  marketMonthlyUnits: number;
  content: string;
  uploadedImages: UploadedImage[];
  currentLanguage: Language;
  displayCurrency: string;
  decision: ReturnType<typeof calculateDecision>;
  isServiceBusinessCase?: boolean;
}) {
  const {
    productName,
    analysisType,
    price,
    cost,
    demand,
    competition,
    adBudget,
    targetMarket,
    salesChannel,
    websiteUrl,
    competitorUrls,
    competitorAvgPrice,
    marketMonthlyUnits,
    content,
    uploadedImages,
    currentLanguage,
    displayCurrency,
    decision,
    isServiceBusinessCase,
  } = params;

  const directAnswerLead = buildDirectQuestionLead({
    content,
    currentLanguage,
    displayCurrency,
    websiteUrl,
    salesChannel,
    price,
    cost,
  });
  const formatMoneyOrMissing = (value: number, missingLabel: string) => value > 0 ? formatMoney(value, currentLanguage, displayCurrency as any) : missingLabel;
  const serviceSetup = (decision as any).serviceSetup || null;
  const productSourcing = (decision as any).productSourcing || null;

  if (currentLanguage === 'pl' && isServiceBusinessCase) {
    return [
      directAnswerLead ? `Krótka odpowiedź: ${directAnswerLead}` : `Krótka odpowiedź: ${decision.verdict === 'BUY' ? 'wejdź ostrożnie i tylko po małym teście.' : decision.verdict === 'AVOID' ? 'na teraz lepiej odpuścić.' : 'zacznij od małego testu.'}`,
      '',
      'Linki:',
      ...((productSourcing?.recommendedOffers || []).slice(0, 3).map((item: any) => `- ${item.title}: ${item.url}`) || []),
      ...(websiteUrl ? [`- Główny link: ${websiteUrl}`] : []),
      ...(!(productSourcing?.recommendedOffers || []).length && !websiteUrl ? ['- Brak potwierdzonych linków z danych wejściowych lub researchu.'] : []),
      '',
      'Sprzęt:',
      ...(serviceSetup?.equipment?.length
        ? serviceSetup.equipment.slice(0, 4).map((item: any) => `- ${item.item}${item.estimatedCost != null ? ` (${formatMoney(item.estimatedCost, currentLanguage, displayCurrency as any)})` : ''} - ${item.purpose}`)
        : ['- Brak potwierdzonej listy sprzętu. Najpierw zrób mały test popytu.']),
      '',
      'CAPEX:',
      ...(serviceSetup?.capexBuckets?.length
        ? serviceSetup.capexBuckets.slice(0, 3).map((item: any) => `- ${item.label}: ${item.low != null ? formatMoney(item.low, currentLanguage, displayCurrency as any) : 'n/d'} - ${item.high != null ? formatMoney(item.high, currentLanguage, displayCurrency as any) : 'n/d'} | ${item.note}`)
        : [`- Start ostrożny: ${formatMoneyOrMissing(cost, 'brak potwierdzonych danych kosztowych')}`]),
      '',
      'Pakiety:',
      ...(serviceSetup?.pricePackages?.length
        ? serviceSetup.pricePackages.slice(0, 3).map((item: any) => `- ${item.name}: ${item.priceFrom != null ? formatMoney(item.priceFrom, currentLanguage, displayCurrency as any) : 'n/d'} - ${item.priceTo != null ? formatMoney(item.priceTo, currentLanguage, displayCurrency as any) : 'n/d'} | ${item.note}`)
        : ['- Najpierw przygotuj 1 mały pakiet testowy i 1 pakiet premium dopiero po walidacji popytu.']),
      '',
      'Kroki:',
      ...(serviceSetup?.starterSteps?.length
        ? serviceSetup.starterSteps.slice(0, 3).map((item: string) => `- ${item}`)
        : decision.improvements.slice(0, 3).map((item) => `- ${item}`)),
      '',
      'Ryzyka:',
      ...decision.issues.slice(0, 2).map((item) => `- ${item}`),
      ...((serviceSetup?.riskNotes || []).slice(0, 2).map((item: string) => `- ${item}`)),
      ...(!(decision.issues.length || serviceSetup?.riskNotes?.length) ? ['- Brak wystarczających danych potwierdzających cenę, koszt lub popyt.'] : []),
      '',
      'Notatka źródłowa:',
      content || 'Brak dodatkowego opisu.',
    ].join('\n');
  }

  if (currentLanguage === 'pl') {
    return [
      directAnswerLead
        ? `Krótka odpowiedź: ${directAnswerLead}`
        : `Krótka odpowiedź: ${decision.verdict === 'BUY' ? 'możesz wejść ostrożnie po małym teście.' : decision.verdict === 'AVOID' ? 'na teraz lepiej odpuścić i doprecyzować dane.' : 'zacznij od krótkiego testu i walidacji.'}`,
      '',
      'Dlaczego:',
      ...decision.why.slice(0, 3).map((item) => `- ${item}`),
      '',
      'Ryzyka:',
      ...decision.issues.slice(0, 3).map((item) => `- ${item}`),
      '',
      'Kolejne kroki:',
      ...decision.improvements.slice(0, 3).map((item) => `- ${item}`),
      '',
      'Dane wejściowe:',
      `- Cena: ${price > 0 ? formatMoney(price, currentLanguage, displayCurrency as any) : 'brak'}`,
      `- Koszt: ${cost > 0 ? formatMoney(cost, currentLanguage, displayCurrency as any) : 'brak'}`,
      `- Konkurencja: ${competition}/100`,
      `- Popyt: ${demand}/100`,
      `- Rynek docelowy: ${targetMarket || 'brak'}`,
      ...(websiteUrl ? [`- Link oferty: ${websiteUrl}`] : []),
      ...(competitorUrls ? [`- Linki konkurencji: ${competitorUrls}`] : []),
      ...(productSourcing?.recommendedOffers?.length ? [...productSourcing.recommendedOffers.slice(0, 3).map((item: any) => `- Link referencyjny: ${item.url}`)] : []),
    ].join('\n');
  }

  return [
    `Product: ${productName || 'Untitled'}`,
    ...(directAnswerLead ? ['', `Direct answer: ${directAnswerLead}`] : []),
    `Analysis type: ${analysisLabel(analysisType, currentLanguage)}`,
    '',
    'Short decision summary:',
    '',
    `Score: ${decision.score}/100`,
    `Profit potential: ${decision.profitability}%`,
    `Verdict: ${decision.verdict}`,
    `Confidence: ${decision.confidence}/100 (${decision.confidenceLabel})`,
    `Moat score: ${decision.moatScore}/100`,
    `Estimated margin: ${decision.pricing.marginPercent}%`,
    '',
    'Input data:',
    `- Price: ${formatMoney(price, currentLanguage, displayCurrency as any)}`,
    `- Product cost: ${formatMoney(cost, currentLanguage, displayCurrency as any)}`,
    `- Ad budget: ${formatMoney(adBudget, currentLanguage, displayCurrency as any)}`,
    `- Demand: ${demand}/100`,
    `- Competition: ${competition}/100`,
    `- Target market: ${targetMarket || 'Not provided'}`,
    `- Sales channel: ${salesChannel || 'Not provided'}`,
    `- Website URL: ${websiteUrl || 'Not provided'}`,
    `- Competitor URLs: ${competitorUrls || 'Not provided'}`,
    `- Average competitor sell price: ${competitorAvgPrice > 0 ? formatMoney(competitorAvgPrice, currentLanguage, displayCurrency as any) : 'Not provided'}`,
    `- Estimated market turnover volume: ${marketMonthlyUnits > 0 ? `${marketMonthlyUnits} units / month` : 'Not provided'}`,
    `- Uploaded images: ${uploadedImages.length}`,
    ...((productSourcing?.recommendedOffers || []).length
      ? ['', 'Offer shortlist:', ...(productSourcing.recommendedOffers || []).slice(0, 3).map((item: any) => `- ${item.title}: ${item.url}${item.price != null ? ` (${item.price} ${item.currency})` : ''}`)]
      : []),
    ...(serviceSetup
      ? ['', `Recommended service lane: ${serviceSetup.primaryLane}`, ...(serviceSetup.starterSteps || []).slice(0, 3).map((item: string) => `- ${item}`)]
      : []),
    '',
    'Top risks:',
    ...decision.issues.map((item) => `- ${item}`),
    '',
    'Next actions:',
    ...decision.improvements.map((item) => `- ${item}`),
    '',
    'Source notes:',
    content || 'No text provided.',
  ].join('\n');
}

function ensureFixedResponseSections(params: {
  currentLanguage: Language;
  text: string;
  fallbackText: string;
  isServiceBusinessCase?: boolean;
}) {
  if (params.currentLanguage !== 'pl') return params.text || params.fallbackText;

  if (!params.isServiceBusinessCase) {
    const normalized = (params.text || '').trim();
    if (!normalized) return params.fallbackText;

    const hasActionsHeader = /(^|\n)(Kolejne kroki:|Działania:|\*\*Działania:\*\*|\*\*Kolejne kroki:\*\*)/i.test(normalized);
    const actionsSectionInFallback = (() => {
      const match = params.fallbackText.match(/(?:Kolejne kroki:|Działania:)[\s\S]*$/i);
      return match?.[0]?.trim() || '';
    })();

    if (!hasActionsHeader) {
      return [normalized, actionsSectionInFallback].filter(Boolean).join('\n\n');
    }

    const hasActionBulletsAfterHeader = /(?:Kolejne kroki:|Działania:|\*\*Działania:\*\*|\*\*Kolejne kroki:\*\*)(?:\s*\n)+(?:[-•*]|\d+\.)/i.test(normalized);
    if (!hasActionBulletsAfterHeader && actionsSectionInFallback) {
      return `${normalized}\n\n${actionsSectionInFallback}`;
    }

    return normalized;
  }

  const requiredHeaders = ['Linki:', 'Sprzęt:', 'CAPEX:', 'Pakiety:', 'Kroki:', 'Ryzyka:'];
  const normalized = (params.text || '').trim();
  if (requiredHeaders.every((header) => normalized.includes(header))) {
    return normalized;
  }

  const lead = normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !requiredHeaders.some((header) => line.startsWith(header.replace(':', ''))));

  return [lead ? `Krótka odpowiedź: ${lead.replace(/^[-*]\s*/, '')}` : '', params.fallbackText].filter(Boolean).join('\n\n');
}
type SmartIntent =
  | 'validate_product'
  | 'calculate_profit'
  | 'competitor_analysis'
  | 'extract_data'
  | 'general_analysis';

type SmartFileType = 'image' | 'video' | 'link' | 'text' | 'mixed' | 'unknown';

function detectIntent(input: string): SmartIntent {
  const text = (input || '').toLowerCase();

  if (
    text.includes('czy warto') ||
    text.includes('czy się sprzeda') ||
    text.includes('czy to sie sprzeda') ||
    text.includes('worth') ||
    text.includes('should i sell')
  ) {
    return 'validate_product';
  }

  if (
    text.includes('marża') ||
    text.includes('marza') ||
    text.includes('profit') ||
    text.includes('zarob') ||
    text.includes('opłaca') ||
    text.includes('oplaca') ||
    text.includes('opłacaln') ||
    text.includes('oplacaln') ||
    text.includes('ile sztuk') ||
    text.includes('po ile') ||
    text.includes('wystawiać') ||
    text.includes('wystawiac') ||
    text.includes('listing price') ||
    text.includes('selling price') ||
    text.includes('allegro') ||
    text.includes('moq')
  ) {
    return 'calculate_profit';
  }

  if (
    text.includes('konkurenc') ||
    text.includes('competition') ||
    text.includes('competitor')
  ) {
    return 'competitor_analysis';
  }

  const extractLikePatterns = [
    'wyciągnij', 'wyciagnij', 'extract', 'co to jest', 'co jest na zdjęciu', 'co jest na zdjeciu',
    'co jest na tym zdjęciu', 'co jest na tym zdjeciu', 'co widać', 'co widac', 'co widzisz',
    'opisz zdjęcie', 'opisz zdjecie', 'opisz obraz', 'describe image', 'describe the screenshot',
    'what is in this image', 'what do you see', 'what is shown', 'summarize file', 'stresc', 'streść',
    'wniosek', 'dotac', 'dofinans', 'pdf', 'jakie ma szanse', 'jakie są szanse', 'jakie sa szanse',
    'screenshot', 'screen', 'panel', 'dashboard', 'błąd', 'blad', 'error on screen'
  ];

  if (extractLikePatterns.some((pattern) => text.includes(pattern))) {
    return 'extract_data';
  }

  return 'general_analysis';
}

function detectFileType(params: {
  websiteUrl: string;
  content: string;
  uploadedImages: UploadedImage[];
  uploadedFiles: File[];
}): SmartFileType {
  const hasLink = Boolean(params.websiteUrl);
  const hasImages = params.uploadedImages.length > 0;
  const hasVideo = params.uploadedFiles.some((file) => isVideoFile(file));
  const hasText = Boolean(params.content?.trim());
  const hasDocumentFiles = params.uploadedFiles.some((file) => !file.type.startsWith('image/') && !isVideoFile(file));

  const signals = [hasLink, hasImages || hasVideo, hasText || hasDocumentFiles].filter(Boolean).length;

  if (signals > 1) return 'mixed';
  if (hasLink) return 'link';
  if (hasVideo) return 'video';
  if (hasImages) return 'image';
  if (hasText || hasDocumentFiles) return 'text';

  return 'unknown';
}

function buildDynamicSystemPrompt(params: {
  intent: SmartIntent;
  fileType: SmartFileType;
  currentLanguage: Language;
  isServiceBusinessCase?: boolean;
}) {
  const languageRule =
    params.currentLanguage === 'pl'
      ? 'Respond ONLY in Polish.'
      : params.currentLanguage === 'de'
        ? 'Respond ONLY in German.'
        : params.currentLanguage === 'es'
          ? 'Respond ONLY in Spanish.'
          : params.currentLanguage === 'pt'
            ? 'Respond ONLY in Portuguese.'
            : params.currentLanguage === 'ja'
              ? 'Respond ONLY in Japanese.'
              : params.currentLanguage === 'zh'
                ? 'Respond ONLY in Chinese.'
                : params.currentLanguage === 'id'
                  ? 'Respond ONLY in Indonesian.'
                  : params.currentLanguage === 'ru'
                    ? 'Respond ONLY in Russian.'
                    : 'Respond in English only.';

  return `
You are a professional commerce and document analysis engine.

YOUR JOB:
- Understand what the user wants from the provided input
- Adapt analysis to the actual input type
- Be specific, practical, and professional
- Prevent financial loss first
- Respect the decision engine and risk controls

INPUT TYPE: ${params.fileType}
USER INTENT: ${params.intent}

ANALYSIS RULES:
- If input is a product link: analyze offer quality, positioning, pricing, margin potential, market risk
- If input is an image: identify what it likely shows, visual selling strength, trust issues, packaging quality, perceived value
- If input is a video: use extracted preview frames to assess the hook, clarity, product demonstration, CTA, and what should be improved
- If input is text or file text: first explain what is in the file, then answer the user's request directly
- If input is mixed: combine all evidence and prioritize the strongest signals
- If advanced business numbers are present, anchor the answer on price, cost, margin, competition, and budget
- If a target country or market is provided, adapt pricing, currency, and go-to-market notes to that local context instead of assuming the US by default
- If the source URL is from a supplier or wholesale marketplace (Alibaba, AliExpress, 1688, and similar), treat it as sourcing context, not as direct proof of retail demand
- Never invent facts that do not appear in the source text, link signals, image, or extracted video frames
- If the PDF, image, or video is unclear, say exactly what is missing instead of guessing

INTENT RULES:
- validate_product: focus on demand, competition, margin, risk, testability
- calculate_profit: focus on margin, cost structure, breakeven, price logic
- competitor_analysis: focus on market gaps, competitor pricing, weaknesses, positioning
- extract_data: focus on identifying and extracting useful facts from the file/link/image
- general_analysis: answer the user's request in the most relevant business-safe way

OUTPUT RULES:
- Start with one direct answer to the exact user question
- If a document/PDF was provided, first say what the file likely contains
- If the user is only asking what is visible in an image, screenshot, UI, or PDF page, describe the content clearly first and do NOT force a business verdict, pricing note, or market note
- For screenshots, dashboards, admin panels, or configuration screens: explain what is visible, what it is used for, and what looks strong or weak
- If the user asks how many units to buy, what price to list, or whether demand exists, answer those points explicitly instead of giving a generic summary
- If the user asks about opening a local business in a specific city/country, answer viability directly for that location with a concrete starter plan
- If the user is researching a local service business, answer with the recommended service lane, starter equipment stack, startup-cost buckets, pricing-pack logic, and what to test first in that region
- If hard cost or market data is missing, recommend a conservative first batch and say which numbers still need confirmation before scaling
- Then add "Reasons" with 3 concrete bullets when that structure fits the question
- Then add "Actions" with 3 concrete next steps focused on what to change, add, remove, or test next
- If concrete links are available from the user input or live/public research, include the most relevant ones explicitly and say what each URL is useful for
- Add pricing or market notes only when they are truly relevant to the user request
- Keep every money estimate consistent with the selected display currency and country context
- Mention uploaded files/images explicitly when relevant
- Avoid generic filler
- Keep answer concise and concrete
- Never recommend aggressive scaling without a controlled test
- If burn risk is high, be conservative
- If confidence is low, lean TEST rather than BUY
- Never ignore provided competition inputs; if competition value/links exist, explicitly reference them in the reasoning
- Do not invent a new selling price, margin, or market number unless it is supported by provided data
- Never invent marketplace or product URLs; only return links that were provided by the user or found in live/public research signals
${params.isServiceBusinessCase ? '- This request is about a local service business. Do not force retail-unit economics, product margin language, or fake 0-value metrics. Treat competitor links as service benchmarks and answer the equipment / startup-cost / direction question directly.' : ''}

${languageRule}
`.trim();
}

  export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 });

    const formData = await req.formData();

    const analysisType = String(formData.get('analysisType') || 'product-decision');
    const productName = clampText(String(formData.get('productName') || ''), SECURITY_LIMITS.maxProductNameChars);
    const selectedCountry = clampText(String(formData.get('selectedCountry') || ''), 12).toUpperCase();
    const targetMarket = clampText(String(formData.get('targetMarket') || ''), SECURITY_LIMITS.maxAuxFieldChars);
    const resolvedTargetMarket = targetMarket || (selectedCountry ? `Country: ${selectedCountry}` : '');
    const salesChannel = clampText(String(formData.get('salesChannel') || ''), SECURITY_LIMITS.maxAuxFieldChars);
    const websiteUrl = clampText(String(formData.get('websiteUrl') || ''), SECURITY_LIMITS.maxAuxFieldChars);
    const competitorUrls = clampText(String(formData.get('competitorUrls') || ''), SECURITY_LIMITS.maxCompetitorUrlsChars);
    const rawContent = clampText(String(formData.get('content') || ''), SECURITY_LIMITS.maxContentChars);
    const detectedUrls = extractUrlsFromText(rawContent);
    const resolvedWebsiteUrlInput = websiteUrl || detectedUrls[0] || '';
    const resolvedCompetitorUrlsInput = competitorUrls || detectedUrls.slice(1).join('\n');
    const currentLanguage = String(formData.get('currentLanguage') || 'en') as Language;
    const displayCurrency = pickDisplayCurrency(currentLanguage, String(formData.get('displayCurrency') || ''), selectedCountry);
    const inputCurrency = normalizeCurrencyCode(String(formData.get('inputCurrency') || displayCurrency), displayCurrency);

    const price = parseNumericFormValue(formData.get('price'));
    const competitorAvgPrice = parseNumericFormValue(formData.get('competitorAvgPrice'));
    const marketMonthlyUnits = parseNumericFormValue(formData.get('marketMonthlyUnits'));
    const cost = parseNumericFormValue(formData.get('productCost'));
    const adBudget = parseNumericFormValue(formData.get('adBudget'));
    const demandInput = formData.get('demand');
    const competitionInput = formData.get('competition');
    const demandWasProvided = demandInput != null && String(demandInput).trim() !== '';
    const competitionWasProvided = competitionInput != null && String(competitionInput).trim() !== '';
    const demand = Math.max(0, Math.min(100, demandWasProvided ? parseNumericFormValue(demandInput) : 50));
    const competition = Math.max(0, Math.min(100, competitionWasProvided ? parseNumericFormValue(competitionInput) : 50));
    const wantsRentalModel = /wynajem|wypożycz|wypozycz|rental|rent out|lease/i.test([productName, salesChannel, rawContent].join(' '));

    const uploadedFiles = formData.getAll('analysisFiles').filter((entry): entry is File => entry instanceof File && entry.size > 0);
    const previewImageFiles = formData.getAll('analysisPreviewImages').filter((entry): entry is File => entry instanceof File && entry.size > 0).slice(0, SECURITY_LIMITS.maxImages);
    if (uploadedFiles.length > SECURITY_LIMITS.maxFiles) {
      return NextResponse.json({ error: `Too many files. Maximum: ${SECURITY_LIMITS.maxFiles}.` }, { status: 400 });
    }

    let totalUploadBytes = 0;
    const uploadedImages: UploadedImage[] = [];
    const uploadedTextParts: string[] = [];

    for (const previewFile of previewImageFiles) {
      totalUploadBytes += previewFile.size;
      if (totalUploadBytes > SECURITY_LIMITS.maxTotalUploadBytes) {
        return NextResponse.json({ error: `Total upload size is too large. Max total is ${Math.round(SECURITY_LIMITS.maxTotalUploadBytes / (1024 * 1024))}MB.` }, { status: 400 });
      }
      if (uploadedImages.length >= SECURITY_LIMITS.maxImages) break;
      const previewBytes = Buffer.from(await previewFile.arrayBuffer());
      uploadedImages.push({
        name: previewFile.name,
        mimeType: previewFile.type || 'image/jpeg',
        dataUrl: `data:${previewFile.type || 'image/jpeg'};base64,${previewBytes.toString('base64')}`,
      });
    }

    for (const file of uploadedFiles) {
      totalUploadBytes += file.size;
      const videoUpload = isVideoFile(file);
      const perFileLimit = videoUpload ? SECURITY_LIMITS.maxVideoFileSizeBytes : SECURITY_LIMITS.maxFileSizeBytes;

      if (file.size > perFileLimit) {
        const limitMb = Math.round(perFileLimit / (1024 * 1024));
        return NextResponse.json({
          error: videoUpload
            ? `Video ${file.name} is too large. Max video size is ${limitMb}MB. Trim or compress the recording and try again.`
            : `File ${file.name} is too large. Max size is ${limitMb}MB.`,
        }, { status: 400 });
      }
      if (totalUploadBytes > SECURITY_LIMITS.maxTotalUploadBytes) {
        return NextResponse.json({ error: `Total upload size is too large. Max total is ${Math.round(SECURITY_LIMITS.maxTotalUploadBytes / (1024 * 1024))}MB.` }, { status: 400 });
      }

      const bytes = Buffer.from(await file.arrayBuffer());
      const extension = `.${String(file.name || '').split('.').pop()?.toLowerCase() || ''}`;

      if (file.type.startsWith('image/')) {
        if (uploadedImages.length >= SECURITY_LIMITS.maxImages) {
          return NextResponse.json({ error: `Too many images. Maximum: ${SECURITY_LIMITS.maxImages}.` }, { status: 400 });
        }
        uploadedImages.push({ name: file.name, mimeType: file.type, dataUrl: `data:${file.type};base64,${bytes.toString('base64')}` });
      } else if (isVideoFile(file)) {
        const previewCountBefore = uploadedImages.length;
        const remainingSlots = Math.max(0, SECURITY_LIMITS.maxImages - uploadedImages.length);
        const previewFrames = extractVideoFrames(file.name, bytes, Math.min(remainingSlots, 3));
        const videoMetadata = extractVideoMetadata(file.name, bytes);
        uploadedImages.push(...previewFrames);
        const availablePreviewCount = uploadedImages.length - previewCountBefore + previewCountBefore;
        uploadedTextParts.push(clampText(`# File: ${file.name}
Video file detected (${extension.replace('.', '').toUpperCase()}). ${formatVideoMetadataSummary(videoMetadata, currentLanguage)}.
${availablePreviewCount > 0
          ? (currentLanguage === 'pl' ? `Dostępnych jest ${availablePreviewCount} klatek podglądowych do analizy wizualnej.` : `${availablePreviewCount} preview frame(s) are available for visual analysis.`)
          : (currentLanguage === 'pl' ? 'Podgląd klatek był ograniczony, więc odpowiedź powinna oprzeć się na dostępnych metadanych i pytaniu użytkownika bez zgadywania.' : 'Preview extraction was limited, so the answer should rely on available metadata and the user question without guessing.')}`, SECURITY_LIMITS.maxContentChars));
      } else if (extension === '.pdf') {
        const remainingSlots = Math.max(0, SECURITY_LIMITS.maxImages - uploadedImages.length);
        const pdfPreviewImages = extractPdfPreviewImages(file.name, bytes, Math.min(remainingSlots, 2));
        if (pdfPreviewImages.length) uploadedImages.push(...pdfPreviewImages);

        const extracted = (await extractPdfText(file.name, bytes)).trim();
        const unreadablePdfMessage = currentLanguage === 'pl'
          ? 'Plik PDF został dodany, ale nie udało się odczytać czytelnego tekstu. Jeśli to skan lub zdjęcie dokumentu, dodaj krótkie streszczenie albo wyraźniejszy PDF.'
          : 'PDF uploaded successfully, but no readable text could be extracted. If this is a scan or photo-based PDF, add a short summary or a clearer file.';
        const previewNote = pdfPreviewImages.length
          ? (currentLanguage === 'pl' ? `Dodatkowo wyciągnięto ${pdfPreviewImages.length} podglądową stronę/strony do analizy wizualnej.` : `Additionally extracted ${pdfPreviewImages.length} preview page(s) for visual analysis.`)
          : '';
        uploadedTextParts.push(clampText(`# File: ${file.name}
${extracted || unreadablePdfMessage}
${previewNote}`.trim(), SECURITY_LIMITS.maxContentChars));
      } else {
        const extractedText = bytes.toString('utf8').trim();
        uploadedTextParts.push(clampText(`# File: ${file.name}
${extractedText || (currentLanguage === 'pl'
          ? 'Plik został dodany, ale nie udało się odczytać czytelnego tekstu UTF-8. Dodaj krótkie streszczenie lub bardziej czytelną wersję pliku.'
          : 'The file was uploaded, but no readable UTF-8 text could be extracted. Add a short summary or a clearer version of the file.')}`, SECURITY_LIMITS.maxContentChars));
      }
    }

    const content = [
      rawContent,
      selectedCountry ? `Selected country: ${selectedCountry}` : '',
      resolvedTargetMarket ? `Target market: ${resolvedTargetMarket}` : '',
      salesChannel ? `Sales channel: ${salesChannel}` : '',
      resolvedWebsiteUrlInput ? `Website URL: ${resolvedWebsiteUrlInput}` : '',
      resolvedCompetitorUrlsInput ? `Competitor URLs: ${resolvedCompetitorUrlsInput}` : '',
      ...uploadedTextParts,
    ].filter(Boolean).join('\n\n');

    const inferredFinancials = inferFinancialContextFromText([productName, rawContent].filter(Boolean).join(' '));
    const structuredFacts = extractStructuredFacts(content);
    const responseStyle = chooseResponseStyle(`${productName}|${resolvedWebsiteUrlInput}|${content.slice(0, 120)}`);
    const analysisMode = detectAnalysisMode({ analysisType, websiteUrl: resolvedWebsiteUrlInput, productName, content, uploadedFiles });
    const isServiceBusinessCase = isServiceBusinessPrompt([productName, rawContent, salesChannel, resolvedTargetMarket, resolvedCompetitorUrlsInput].filter(Boolean).join(' '));
    const intent = detectIntent([productName, content].filter(Boolean).join(' '));
    const fileType = detectFileType({ websiteUrl: resolvedWebsiteUrlInput, content, uploadedImages, uploadedFiles });
    const dynamicSystemPrompt = buildDynamicSystemPrompt({ intent, fileType, currentLanguage, isServiceBusinessCase });
    const analysisTokenCost = estimateAnalysisTokenCost({
      contentLength: content.length,
      uploadedImageCount: uploadedImages.length,
      uploadedFiles: uploadedFiles.map((file) => ({ name: file.name, size: file.size, type: file.type })),
      analysisMode,
    });

    if (!content && uploadedImages.length === 0) {
      return NextResponse.json({ error: 'Add text, files, or images before running an analysis.' }, { status: 400 });
    }

    const [profile, automationSettings, integrationSettings, recentEventsResult, dailyEventsResult, referralSettings] = await Promise.all([
      ensureAnalysisProfile({ id: user.id, email: user.email || null }),
      getAutomationSettings(),
      getIntegrationSettings(),
      supabaseAdmin.from('security_events').select('id, created_at').eq('user_id', user.id).eq('event_type', 'analysis_request').gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()),
      supabaseAdmin.from('security_events').select('id').eq('user_id', user.id).eq('event_type', 'analysis_request').gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      getReferralSettings(),
    ]);

    if (!profile || profile.credits_balance <= 0) {
      return NextResponse.json({ error: currentLanguage === 'pl' ? 'Brak dostępnych tokenów AI.' : 'No AI tokens available.' }, { status: 400 });
    }
    if (profile.credits_balance < analysisTokenCost) {
      return NextResponse.json({ error: buildInsufficientTokensMessage(currentLanguage, analysisTokenCost, profile.credits_balance) }, { status: 400 });
    }
    if ((profile.analyses_used_this_month ?? 0) >= (profile.monthly_analysis_limit ?? 0)) {
      return NextResponse.json({ error: 'Monthly analysis limit reached.' }, { status: 400 });
    }

    const analysisRateLimits = getAnalysisRateLimits(profile);

    if ((recentEventsResult.data?.length ?? 0) >= analysisRateLimits.maxPer10Min) {
      return NextResponse.json({ error: currentLanguage === 'pl' ? 'Za dużo analiz w krótkim czasie. Odczekaj chwilę i spróbuj ponownie.' : 'Too many analysis requests in a short time. Please wait a moment and try again.' }, { status: 429 });
    }
    if ((dailyEventsResult.data?.length ?? 0) >= analysisRateLimits.maxPerDay) {
      return NextResponse.json({ error: currentLanguage === 'pl' ? 'Dzisiejszy limit analiz został osiągnięty dla tego planu.' : 'The daily analysis limit for this plan has been reached.' }, { status: 429 });
    }

    if (analysisMode === 'visual_analysis') {
      const decision = localizeSpecialModeDecisionNarrative({
        decision: {
        ...buildVisualAnalysisDecision({ content, currentLanguage, productName }),
        usagePricing: { tokensCharged: analysisTokenCost, billingUnit: 'AI tokens' },
        },
        currentLanguage,
        mode: 'visual_analysis',
        displayCurrency,
      });
      const visualUserPrompt = [
        `User question: ${rawContent || productName || (currentLanguage === 'pl' ? 'Opisz, co widać na obrazie.' : 'Describe what is visible in the image.')}`,
        uploadedFiles.length ? `Attached files: ${uploadedFiles.map((file) => file.name).join(', ')}` : '',
        content ? `Supporting extracted text:\n${content}` : 'No supporting extracted text was found.',
        uploadedFiles.some((file) => isVideoFile(file))
          ? uploadedImages.length
            ? (currentLanguage === 'pl'
              ? 'To plik wideo z wyodrębnionymi klatkami podglądowymi. Oprzyj ocenę na tych kadrach, opisz co naprawdę widać i nie pisz, że podgląd jest niedostępny.'
              : 'This is a video file with extracted preview frames. Base the reading on those frames, describe what is actually visible, and do not claim the preview is unavailable.')
            : (currentLanguage === 'pl'
              ? 'To plik wideo. Jeśli podgląd klatek był ograniczony, nie pisz, że nie da się otworzyć pliku — oprzyj odpowiedź na dostępnych metadanych, nazwie pliku i pytaniu użytkownika, a brak pewności zaznacz krótko.'
              : 'This is a video file. If preview extraction was limited, do not say the file cannot be opened — use the available metadata, file name, and the user question, and mention uncertainty briefly.')
          : '',
        currentLanguage === 'pl'
          ? 'Najpierw odpowiedz wprost, co widać lub co oznacza ten screen/obraz. Jeśli to panel lub konfiguracja, nazwij najważniejsze elementy i wskaż co jest dobre albo słabe.'
          : 'First answer directly what is visible or what this screen/image means. If it is a dashboard or config screen, name the key elements and say what looks strong or weak.',
      ].filter(Boolean).join('\n\n');
      const resultText = await generateModelAnalysisText({
        userPrompt: visualUserPrompt,
        dynamicSystemPrompt,
        uploadedImages,
        analysisMode,
        currentLanguage,
        fallbackText: buildVisualAnalysisText(decision, currentLanguage),
      });
      await persistAnalysisAndConsumeTokens({
        supabase,
        userId: user.id,
        analysisType,
        inputText: content,
        resultText,
        productName: productName || (currentLanguage === 'pl' ? 'Analiza wizualna' : 'Visual analysis'),
        decisionJson: decision,
        tokenCost: analysisTokenCost,
        profile,
      });
      return NextResponse.json({
        success: true,
        productName: productName || (currentLanguage === 'pl' ? 'Analiza wizualna' : 'Visual analysis'),
        decision,
        resultText,
        usedFallback: false,
        marketData: null,
        revenueMode: 'free_soft',
        usagePricing: { tokensCharged: analysisTokenCost, billingUnit: 'AI tokens' },
        upgradeOffer: {
          planKey: 'starter',
          planName: PLANS.starter.name,
          priceLabel: PLANS.starter.priceLabel,
          annualDiscountPercent: 0,
          freeAnalysesBeforePaywall: 0,
          cta: currentLanguage === 'pl' ? 'Odblokuj więcej analiz obrazów i screenów w tańszym planie' : 'Unlock more visual analysis in the affordable plan',
        },
      });
    }

    if (analysisMode === 'cost_optimization') {
      const decision = localizeSpecialModeDecisionNarrative({
        decision: {
        ...buildCostOptimizationDecision({ content, displayCurrency, currentLanguage, productName }),
        usagePricing: { tokensCharged: analysisTokenCost, billingUnit: 'AI tokens' },
        },
        currentLanguage,
        mode: 'cost_optimization',
        displayCurrency,
      });
      const resultText = buildCostOptimizationText(decision, displayCurrency);
      await persistAnalysisAndConsumeTokens({
        supabase,
        userId: user.id,
        analysisType,
        inputText: content,
        resultText,
        productName: productName || 'Analiza kosztów',
        decisionJson: decision,
        tokenCost: analysisTokenCost,
        profile,
      });
      return NextResponse.json({
        success: true,
        productName: productName || 'Analiza kosztów',
        decision,
        resultText,
        usedFallback: false,
        marketData: null,
        revenueMode: 'free_soft',
        usagePricing: { tokensCharged: analysisTokenCost, billingUnit: 'AI tokens' },
        upgradeOffer: {
          planKey: 'starter',
          planName: PLANS.starter.name,
          priceLabel: PLANS.starter.priceLabel,
          annualDiscountPercent: 0,
          freeAnalysesBeforePaywall: 0,
          cta: 'Odblokuj pełniejsze podpowiedzi kosztowe bez dużego abonamentu',
        },
      });
    }

    if (analysisMode === 'document_analysis') {
      const decision = localizeSpecialModeDecisionNarrative({
        decision: {
        ...buildDocumentAnalysisDecision({ content, displayCurrency, currentLanguage, productName }),
        usagePricing: { tokensCharged: analysisTokenCost, billingUnit: 'AI tokens' },
        },
        currentLanguage,
        mode: 'document_analysis',
        displayCurrency,
      });
      const documentUserPrompt = [
        `User question: ${rawContent || productName || (currentLanguage === 'pl' ? 'Wyjaśnij, co zawiera dokument.' : 'Explain what the document contains.')}`,
        uploadedFiles.length ? `Attached files: ${uploadedFiles.map((file) => file.name).join(', ')}` : '',
        content ? `Extracted document text:\n${content}` : 'No readable document text could be extracted.',
        currentLanguage === 'pl'
          ? 'Najpierw wyjaśnij, czego dotyczy plik. Potem odpowiedz dokładnie na pytanie użytkownika i zaznacz, jeśli część dokumentu była nieczytelna.'
          : 'First explain what the file is about. Then answer the user question directly and state clearly if any part of the document was unreadable.',
      ].filter(Boolean).join('\n\n');
      const resultText = await generateModelAnalysisText({
        userPrompt: documentUserPrompt,
        dynamicSystemPrompt,
        uploadedImages,
        analysisMode,
        currentLanguage,
        fallbackText: buildDocumentAnalysisText(decision),
      });
      await persistAnalysisAndConsumeTokens({
        supabase,
        userId: user.id,
        analysisType,
        inputText: content,
        resultText,
        productName: productName || 'Analiza dokumentu',
        decisionJson: decision,
        tokenCost: analysisTokenCost,
        profile,
      });
      return NextResponse.json({
        success: true,
        productName: productName || 'Analiza dokumentu',
        decision,
        resultText,
        usedFallback: false,
        marketData: null,
        revenueMode: 'free_soft',
        usagePricing: { tokensCharged: analysisTokenCost, billingUnit: 'AI tokens' },
        upgradeOffer: {
          planKey: 'starter',
          planName: PLANS.starter.name,
          priceLabel: PLANS.starter.priceLabel,
          annualDiscountPercent: 0,
          freeAnalysesBeforePaywall: 0,
          cta: currentLanguage === 'pl' ? 'Odblokuj głębszą analizę dokumentów w planie Starter' : 'Unlock deeper document analysis in Starter',
        },
      });
    }

    const marketData = await collectProMarketData({
      websiteUrl: resolvedWebsiteUrlInput,
      competitorUrls: resolvedCompetitorUrlsInput,
      queryText: [productName, rawContent, salesChannel, resolvedTargetMarket].filter(Boolean).join(' '),
      selectedCountry,
      includeRentalResearch: wantsRentalModel,
    });
    const enabledIntegrationLanes = listEnabledIntegrationLanes(integrationSettings);
    const productSourcing = await buildProductSourcingLayer({
      productName: productName || rawContent || resolvedWebsiteUrlInput || 'Market sourcing',
      marketData,
      displayCurrency,
      enabledIntegrationLanes,
      country: selectedCountry || resolvedTargetMarket,
      currentLanguage,
    });
    const serviceSetup = isServiceBusinessCase
      ? buildServiceSetupLayer({
          content: [productName, rawContent, salesChannel, resolvedTargetMarket].filter(Boolean).join(' '),
          competitorUrls: resolvedCompetitorUrlsInput,
          marketData,
          displayCurrency,
          selectedCountry: selectedCountry || resolvedTargetMarket,
          currentLanguage,
        })
      : null;
    const trackedUrls = Array.from(new Set([resolvedWebsiteUrlInput, ...extractUrlsFromText(resolvedCompetitorUrlsInput)].filter(Boolean)));
    const previousMarketSnapshots = trackedUrls.length ? await getRecentMarketWatchSnapshots(user.id, trackedUrls) : [];
    const marketWatchReport = buildMarketWatchReport({ marketData, previousSnapshots: previousMarketSnapshots, language: currentLanguage });
    const supplierSourceDetected = looksLikeSupplierMarketplaceUrl(resolvedWebsiteUrlInput);
    const shouldUseInferredSellPrice = price <= 0 && inferredFinancials.inferredPrice > 0 && (!resolvedWebsiteUrlInput || !(marketData.product?.priceUsd && marketData.product.priceUsd > 0));
    const resolvedManualPriceInput = price > 0 ? price : shouldUseInferredSellPrice ? inferredFinancials.inferredPrice : 0;
    const resolvedManualCostInput = cost > 0 ? cost : inferredFinancials.inferredCost;
    const manualPriceUsd = resolvedManualPriceInput > 0 ? convertToUsd(resolvedManualPriceInput, inputCurrency) : 0;
    const manualCompetitorAvgPriceUsd = competitorAvgPrice > 0 ? convertToUsd(competitorAvgPrice, inputCurrency) : 0;
    const baseCostUsd = resolvedManualCostInput > 0 ? convertToUsd(resolvedManualCostInput, inputCurrency) : 0;
    const supplierLandedCostUsd = supplierSourceDetected && baseCostUsd <= 0 && (marketData.product?.priceUsd ?? 0) > 0
      ? Number(((marketData.product?.priceUsd ?? 0) * 1.15).toFixed(2))
      : 0;
    const resolvedCostUsd = baseCostUsd > 0 ? baseCostUsd : supplierLandedCostUsd;
    const manualAdBudgetUsd = adBudget > 0 ? convertToUsd(adBudget, inputCurrency) : 0;

    const resolvedPriceUsd = manualPriceUsd > 0 ? manualPriceUsd : supplierSourceDetected ? 0 : (marketData.product?.priceUsd ?? 0);
    const resolvedCompetitorAvgPriceUsd = manualCompetitorAvgPriceUsd > 0 ? manualCompetitorAvgPriceUsd : (marketData.competitorAvgPriceUsd ?? 0);
    const resolvedMarketMonthlyUnits = marketMonthlyUnits > 0 ? marketMonthlyUnits : (marketData.marketMonthlyUnitsEstimate ?? 0);
    const resolvedDemand = demandWasProvided ? demand : Math.max(18, marketData.demandScore ?? 34);
    const resolvedCompetition = competitionWasProvided ? competition : Math.max(12, marketData.competitionScore ?? (supplierSourceDetected ? 52 : 34));
    const resolvedProductName = productName || marketData.product?.title || (resolvedWebsiteUrlInput ? resolvedWebsiteUrlInput.replace(/^https?:\/\//, '').split('/')[0] : '') || 'Produkt';
    const supplierContextNote = looksLikeSupplierMarketplaceUrl(resolvedWebsiteUrlInput)
      ? /allegro|amazon|ebay|etsy|walmart|shopify/i.test(`${salesChannel} ${content}`)
        ? 'Supplier-to-marketplace resale flow detected. Treat the source link as sourcing context (cost, MOQ, shipping, supplier risk), not as direct proof of demand on the target marketplace.'
        : 'Supplier / wholesale sourcing link detected. Use it mainly for landed-cost, MOQ, shipping, and supplier-risk context, and state clearly when retail demand still needs validation.'
      : '';

    const monetizationSettings = await getMonetizationSettings();

    const decision = calculateDecision({
      price: resolvedPriceUsd,
      cost: resolvedCostUsd,
      demand: resolvedDemand,
      competition: resolvedCompetition,
      adBudget: manualAdBudgetUsd,
      analysisType,
      targetMarket: resolvedTargetMarket,
      salesChannel,
      websiteUrl: resolvedWebsiteUrlInput,
      competitorUrls: resolvedCompetitorUrlsInput,
      competitorAvgPrice: resolvedCompetitorAvgPriceUsd,
      marketMonthlyUnits: resolvedMarketMonthlyUnits,
      content,
      displayCurrency,
      uploadedImageCount: uploadedImages.length,
      uploadedFileCount: uploadedFiles.length,
      guardrails: {
        minMarginPercent: automationSettings.profitabilityGuardrailPercent,
        minConfidenceForBuy: automationSettings.minConfidenceForBuy,
        maxSafeTestBudgetUsd: automationSettings.maxSafeTestBudgetUsd,
        requireCompetitorEvidenceForBuy: automationSettings.requireCompetitorEvidenceForBuy,
        requireUrlForBuy: automationSettings.requireUrlForBuy,
        requireManualApprovalForScale: automationSettings.requireManualApprovalForScale,
        killSwitchEnabled: automationSettings.killSwitchEnabled,
        maxDailySpendUsd: automationSettings.maxDailySpendUsd,
        maxAllowedRefundRatePercent: automationSettings.maxAllowedRefundRatePercent,
        maxAllowedCACPercentOfAOV: automationSettings.maxAllowedCACPercentOfAOV,
        cooldownHoursAfterLoss: automationSettings.cooldownHoursAfterLoss,
        stagedRolloutPercent: automationSettings.stagedRolloutPercent,
        stagedRolloutMaxWaves: automationSettings.stagedRolloutMaxWaves,
      },
    });

    const safeDecision: any = finalGuard(decision, resolvedWebsiteUrlInput);

    safeDecision.market.sources = {
      ownPrice: price > 0 ? 'manual' : resolvedManualPriceInput > 0 ? 'estimated' : supplierSourceDetected ? null : marketData.product?.price ? 'public_page' : null,
      competitorAvgPrice: competitorAvgPrice > 0 ? 'manual' : marketData.competitorAvgPriceUsd ? 'public_page' : null,
      marketMonthlyUnits: marketMonthlyUnits > 0 ? 'manual' : marketData.marketMonthlyUnitsEstimate ? 'public_page' : null,
    };
    safeDecision.pricing.currency = displayCurrency;
    safeDecision.market.displayCurrency = displayCurrency;
    safeDecision.pricing.currentPrice = convertCurrency(safeDecision.pricing.currentPrice, 'USD', displayCurrency);
    safeDecision.pricing.estimatedCost = convertCurrency(safeDecision.pricing.estimatedCost, 'USD', displayCurrency);
    safeDecision.pricing.suggestedPriceMin = safeDecision.pricing.suggestedPriceMin != null ? convertCurrency(safeDecision.pricing.suggestedPriceMin, 'USD', displayCurrency) : null;
    safeDecision.pricing.suggestedPriceMax = safeDecision.pricing.suggestedPriceMax != null ? convertCurrency(safeDecision.pricing.suggestedPriceMax, 'USD', displayCurrency) : null;
    safeDecision.pricing.suggestedTestPrice = safeDecision.pricing.suggestedTestPrice != null ? convertCurrency(safeDecision.pricing.suggestedTestPrice, 'USD', displayCurrency) : null;
    safeDecision.adStrategy.testBudget = convertCurrency(safeDecision.adStrategy.testBudget, 'USD', displayCurrency);
    safeDecision.adStrategy.dailyBudget = convertCurrency(safeDecision.adStrategy.dailyBudget, 'USD', displayCurrency);
    safeDecision.market.competitorAvgPrice = safeDecision.market.competitorAvgPrice != null ? convertCurrency(safeDecision.market.competitorAvgPrice, 'USD', displayCurrency) : null;
    safeDecision.market.estimatedMonthlyRevenue = safeDecision.market.estimatedMonthlyRevenue != null ? convertCurrency(safeDecision.market.estimatedMonthlyRevenue, 'USD', displayCurrency) : null;
    safeDecision.market.estimatedMonthlyTurnoverRange = {
      low: safeDecision.market.estimatedMonthlyTurnoverRange.low != null ? convertCurrency(safeDecision.market.estimatedMonthlyTurnoverRange.low, 'USD', displayCurrency) : null,
      high: safeDecision.market.estimatedMonthlyTurnoverRange.high != null ? convertCurrency(safeDecision.market.estimatedMonthlyTurnoverRange.high, 'USD', displayCurrency) : null,
    };
    if (isServiceBusinessCase) {
      applyServiceBusinessOverlay({
        decision: safeDecision,
        currentLanguage,
        competitorUrls: resolvedCompetitorUrlsInput,
        selectedCountry: selectedCountry || resolvedTargetMarket,
        hasConfirmedPrice: resolvedManualPriceInput > 0 || resolvedCompetitorAvgPriceUsd > 0,
        hasConfirmedCost: cost > 0,
      });
    }
    safeDecision.productSourcing = productSourcing;
    safeDecision.serviceSetup = serviceSetup;
    safeDecision.connectorBlueprint = {
      status: 'blueprint_ready',
      docPath: 'docs/analysis/marketplace-connectors-architecture.md',
    };
    safeDecision.usagePricing = { tokensCharged: analysisTokenCost, billingUnit: 'AI tokens' };
    safeDecision.marketWatch = marketWatchReport;
    safeDecision.marketSignals = Array.from(new Set([
      ...(safeDecision.marketSignals || []),
      ...marketData.sourceNotes,
      ...marketData.resaleResearchUrls.map((url) => `Research link: ${url}`),
      ...marketData.rentalResearchUrls.map((url) => `Service research link: ${url}`),
      ...marketData.connectorSignals.map((item) => item.note),
      ...(trackedUrls.length ? [`Market watch: ${marketWatchReport.headline}`, ...marketWatchReport.alerts, ...marketWatchReport.opportunities] : []),
      `Display currency synchronized to ${displayCurrency}${selectedCountry ? ` for ${selectedCountry}` : ''}.`,
      selectedCountry ? `Selected country context: ${selectedCountry}.` : 'No explicit country was selected.',
      `This job used ${analysisTokenCost} AI token(s) because of the media/file complexity.`,
      ...(supplierSourceDetected && supplierLandedCostUsd > 0 ? ['Supplier page pricing was treated as sourcing cost with a basic logistics/import buffer, not as the resale price.'] : []),
      ...(marketData.resaleSignalCount ? [`Live resale signals found in the target market: ${marketData.resaleSignalCount}.`] : []),
      ...(marketData.rentalSignalCount ? [`Live rental-provider signals found in the target market: ${marketData.rentalSignalCount}.`] : []),
      ...(!demandWasProvided && marketData.demandScore != null ? [`Demand score was derived from live public market evidence: ${marketData.demandScore}/100.`] : []),
      ...(!competitionWasProvided && marketData.competitionScore != null ? [`Competition score was derived from live public market evidence: ${marketData.competitionScore}/100.`] : []),
      ...(cost <= 0 && inferredFinancials.inferredCost > 0 ? [`Product cost was inferred from the user message: ${inferredFinancials.inferredCost} ${inputCurrency}.`] : []),
      ...(price <= 0 && resolvedManualPriceInput > 0 ? [`Sell price was inferred from the user message: ${resolvedManualPriceInput} ${inputCurrency}.`] : []),
      ...(enabledIntegrationLanes.length ? [`Enabled marketplace lanes in admin: ${enabledIntegrationLanes.join(', ')}.`] : []),
      ...(productSourcing.recommendedOffers.length ? [`Product sourcing shortlist contains ${productSourcing.recommendedOffers.length} concrete offer link(s).`] : []),
      ...(serviceSetup ? [`Service setup lane selected: ${serviceSetup.primaryLane}.`] : []),
      resolvedManualPriceInput > 0 || competitorAvgPrice > 0 || resolvedManualCostInput > 0 || supplierLandedCostUsd > 0 ? `Manual financial inputs were normalized from ${inputCurrency} to USD for scoring.` : 'No manual financial currency normalization was needed.',
    ])).slice(0, 12);

    enhanceDecisionForUi({
      decision: safeDecision,
      currentLanguage,
      productName: resolvedProductName,
      websiteUrl: resolvedWebsiteUrlInput,
      competitorUrls: resolvedCompetitorUrlsInput,
      uploadedFilesCount: uploadedFiles.length,
      uploadedImagesCount: uploadedImages.length,
      intent,
      isServiceBusinessCase,
      selectedCountry,
      targetMarket: resolvedTargetMarket,
      resolvedDemand,
      resolvedCompetition,
    });

    const responseContractLines = isServiceBusinessCase
      ? [
          currentLanguage === 'pl' ? 'Co zwrócić:' : 'What to return:',
          currentLanguage === 'pl' ? '- Zacznij od jednego zdania: „Krótka odpowiedź: ...”.' : '- Start with one sentence: "Short answer: ...".',
          currentLanguage === 'pl' ? '- Potem sekcje: Linki, Sprzęt, CAPEX, Pakiety, Kroki, Ryzyka.' : '- Then sections: Links, Equipment, CAPEX, Packages, Steps, Risks.',
          currentLanguage === 'pl' ? '- W Linkach podawaj wyłącznie potwierdzone URL-e (bez wymyślania).' : '- In Links, include only verified URLs (never invent links).',
          currentLanguage === 'pl' ? '- W Kroki podaj 2-4 praktyczne działania, zaczynając od małego testu.' : '- In Steps, provide 2-4 practical actions, starting from a small test.',
          currentLanguage === 'pl' ? '- Jeśli brakuje danych do marży, napisz to wprost zamiast podawać 0% jako pewnik.' : '- If margin data is missing, state it explicitly instead of presenting 0% as confirmed.',
        ]
      : [
          currentLanguage === 'pl' ? 'Co zwrócić:' : 'What to return:',
          currentLanguage === 'pl' ? '- Odpowiedz najpierw wprost na pytanie użytkownika (1-2 zdania).' : '- First answer the user question directly (1-2 sentences).',
          currentLanguage === 'pl' ? '- Następnie sekcje: Dlaczego, Ryzyka, Kolejne kroki.' : '- Then sections: Why, Risks, Next steps.',
          currentLanguage === 'pl' ? '- Jeśli user podał miasto/kraj, uwzględnij kontekst lokalny w decyzji.' : '- If city/country was provided, include local context in the decision.',
          currentLanguage === 'pl' ? '- Jeśli brakuje ceny lub kosztu, nie podawaj sztywnej marży jako pewnej.' : '- If price or cost is missing, do not present a fixed margin as certain.',
          currentLanguage === 'pl' ? '- Gdy podano konkurencję lub linki konkurencji, odnieś się do nich jawnie.' : '- When competitor input/links are provided, reference them explicitly.',
        ];

    const userPrompt = [
      `Product: ${resolvedProductName}`,
      marketData.product?.title ? `Resolved page title: ${marketData.product.title}` : 'Resolved page title: not available',
      `Analysis type: ${analysisLabel(analysisType, currentLanguage)}`,
      `Price: ${formatMoney(convertCurrency(resolvedPriceUsd, 'USD', displayCurrency), currentLanguage, displayCurrency)}`,
      `Estimated product cost: ${formatMoney(convertCurrency(resolvedCostUsd, 'USD', displayCurrency), currentLanguage, displayCurrency)}`,
      `Monthly ad budget: ${formatMoney(convertCurrency(manualAdBudgetUsd, 'USD', displayCurrency), currentLanguage, displayCurrency)}`,
      `Demand score: ${resolvedDemand}/100 (${demandWasProvided ? 'manual input' : marketData.demandScore != null ? 'live public market evidence' : 'limited evidence'})`,
      `Competition score: ${resolvedCompetition}/100 (${competitionWasProvided ? 'manual input' : marketData.competitionScore != null ? 'live public market evidence' : 'limited evidence'})`,
      `Selected country: ${selectedCountry || 'Not provided'}`,
      `Target market: ${resolvedTargetMarket || 'Not provided'}`,
      `Sales channel: ${salesChannel || 'Not provided'}`,
      `Website URL: ${resolvedWebsiteUrlInput || 'Not provided'}`,
      `Competitor URLs: ${resolvedCompetitorUrlsInput || 'Not provided'}`,
      `Average competitor sell price: ${resolvedCompetitorAvgPriceUsd > 0 ? formatMoney(convertCurrency(resolvedCompetitorAvgPriceUsd, 'USD', displayCurrency), currentLanguage, displayCurrency) : 'Not provided'}` ,
      `Estimated market turnover volume: ${resolvedMarketMonthlyUnits > 0 ? `${resolvedMarketMonthlyUnits} units / month` : 'Not provided'}` ,
      `Decision engine score: ${safeDecision.score}`,
      `Decision engine verdict: ${safeDecision.verdict}`,
      `Confidence: ${safeDecision.confidence}/100 (${safeDecision.confidenceLabel})`,
      `Moat score: ${safeDecision.moatScore}/100`,
      `Data mode: ${safeDecision.dataMode}`,
      `Burn risk: ${safeDecision.burnRisk}`,
      `Execution mode: ${safeDecision.executionMode}`,
      `Kill switch armed: ${safeDecision.killSwitchArmed ? 'yes' : 'no'}`,
      `Estimated margin: ${resolvedPriceUsd > 0 && resolvedCostUsd > 0 ? `${safeDecision.pricing.marginPercent}%` : 'Not verified yet — needs an actual resale price and full landed cost.'}`,
      `Break-even ROAS: ${safeDecision.pricing.breakEvenROAS ?? 'n/a'}`,
      `Suggested test price: ${safeDecision.pricing.suggestedTestPrice ?? 'n/a'}`,
      `Recommended plan trigger: ${safeDecision.monetization.recommendedPlan}`,
      `Response style: ${responseStyle}`,
      isServiceBusinessCase ? 'Service-business case: yes. The user wants equipment, startup-cost logic, local viability, competitor pricing, and which service lane to choose first.' : 'Service-business case: no.',
      enabledIntegrationLanes.length ? `Enabled integration lanes in admin: ${enabledIntegrationLanes.join(', ')}.` : 'No marketplace integration lanes are enabled in admin settings.',
      supplierContextNote,
      '',
      ...(structuredFacts.length ? ['Structured facts from uploaded files/text:', ...structuredFacts.map((item) => `- ${item}`), ''] : []),
      productSourcing.recommendedOffers.length ? 'Product sourcing shortlist:' : '',
      ...productSourcing.recommendedOffers.map((offer) => `- ${offer.title} | ${offer.url} | ${offer.price != null ? `${offer.price} ${offer.currency}` : 'price n/a'} | risk: ${offer.risk} | why: ${offer.whyItFits}`),
      ...(productSourcing.notes.length ? ['', 'Product sourcing notes:', ...productSourcing.notes.map((item) => `- ${item}`)] : []),
      ...(serviceSetup ? [
        '',
        'Service setup plan:',
        `- Primary lane: ${serviceSetup.primaryLane}`,
        ...(serviceSetup.secondaryLane ? [`- Secondary lane: ${serviceSetup.secondaryLane}`] : []),
        `- Lane reason: ${serviceSetup.laneReason}`,
        ...serviceSetup.equipment.map((item) => `- Equipment: ${item.item} | ${item.purpose} | ${item.priority} | ${item.estimatedCost != null ? `${item.estimatedCost} ${displayCurrency}` : 'cost n/a'}`),
        ...serviceSetup.capexBuckets.map((item) => `- CAPEX bucket: ${item.label} | ${item.low != null ? `${item.low}` : 'n/a'}-${item.high != null ? `${item.high}` : 'n/a'} ${displayCurrency} | ${item.note}`),
        ...serviceSetup.pricePackages.map((item) => `- Package: ${item.name} | ${item.target} | ${item.priceFrom != null ? `${item.priceFrom}` : 'n/a'}-${item.priceTo != null ? `${item.priceTo}` : 'n/a'} ${displayCurrency} | ${item.note}`),
        ...serviceSetup.starterSteps.map((item) => `- Starter step: ${item}`),
        ...serviceSetup.riskNotes.map((item) => `- Service risk: ${item}`),
      ] : []),
      'Decision factors:',
      ...safeDecision.factors.map((factor: any) => `- ${factor.label}: ${factor.score}/100 (weight ${factor.weight}%) -> ${factor.explanation}`),
      '',
      'Rollout plan:',
      ...safeDecision.rolloutPlan.map((step: string) => `- ${step}`),
      '',
      ...responseContractLines,
      '',
      'CRITICAL:',
      `- Reply only in ${languageName(currentLanguage)}.`,
      '- Never mix languages in one answer.',
      `- Use only ${displayCurrency} for every amount and currency symbol.`,
      marketData.sourceNotes.length ? `Public market signals:
${marketData.sourceNotes.map((item) => `- ${item}`).join('\n')}` : 'No public market signals were extracted from the URLs.',
      marketData.resaleResearchUrls.length ? `Public resale research links:
    ${marketData.resaleResearchUrls.map((item) => `- ${item}`).join('\n')}` : 'No public resale research links were extracted.',
      marketData.rentalResearchUrls.length ? `Public rental/service research links:
    ${marketData.rentalResearchUrls.map((item) => `- ${item}`).join('\n')}` : 'No public rental/service research links were extracted.',
      marketData.connectorSignals.length ? `Connector signals:
${marketData.connectorSignals.map((item) => `- ${item.provider}: ${item.note}`).join('\n')}` : 'No connector signals available.',
      '',
      content ? `Source text:\n${content}` : 'No source text was provided. Use the attached images and structured inputs only.',
    ].join('\n');

    const estimatedInputTokens = estimateTokens(userPrompt);
    const estimatedCostUsd = estimateAnalysisCostUsd({ inputTokens: estimatedInputTokens, imageCount: uploadedImages.length });
    if (estimatedInputTokens > SECURITY_LIMITS.maxEstimatedInputTokens || estimatedCostUsd > SECURITY_LIMITS.maxEstimatedAnalysisCostUsd) {
      return NextResponse.json({ error: 'Input is too large or too expensive for one analysis. Reduce text or files.' }, { status: 400 });
    }
    if (resolvedPriceUsd > 0 && resolvedCostUsd > 0) {
      const marginPercent = ((resolvedPriceUsd - resolvedCostUsd) / resolvedPriceUsd) * 100;
      if (marginPercent < automationSettings.priceFloorPercent) {
        return NextResponse.json({ error: `Margin too low for protected mode. Increase price or reduce cost to reach at least ${automationSettings.priceFloorPercent}% margin.` }, { status: 400 });
      }
    }

    await supabaseAdmin.from('security_events').insert({ user_id: user.id, event_type: 'analysis_request', metadata: { analysis_type: analysisType, estimated_input_tokens: estimatedInputTokens, estimated_cost_usd: estimatedCostUsd, usage_token_cost: analysisTokenCost, uploaded_file_count: uploadedFiles.length, uploaded_image_count: uploadedImages.length } });

    let resultText = '';
    let usedFallback = false;

    try {
      if (!openai) {
        throw new Error('OpenAI not configured');
      }
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.35,
        max_tokens: 220,
        messages: [
          { role: 'system', content: `${ANALYSIS_SYSTEM_PROMPT}\n\n${dynamicSystemPrompt}\n\nAlways reference the decision engine result. If images or video preview frames are attached, include visual observations when relevant.\nCRITICAL:\n- Always prioritize preventing financial loss\n- Never recommend scaling without a controlled test\n- Avoid optimistic assumptions\n- Give a direct actionable next step\n- Be concise and concrete\n- Answer the user's exact question, not a generic template\n- Never invent facts that are not present in the uploaded material or extracted signals.` },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              ...uploadedImages.map((image) => ({ type: 'image_url' as const, image_url: { url: image.dataUrl } })),
            ],
          },
        ],
      });

      resultText = (completion.choices[0]?.message?.content || '').trim();
    } catch (err) {
      console.error('OPENAI ERROR:', err);
      usedFallback = true;
      resultText = buildFallbackAnalysis({
        productName: resolvedProductName,
        analysisType,
        price: convertCurrency(resolvedPriceUsd, 'USD', displayCurrency),
        cost: convertCurrency(resolvedCostUsd, 'USD', displayCurrency),
        demand,
        competition,
        adBudget: convertCurrency(manualAdBudgetUsd, 'USD', displayCurrency),
        targetMarket: resolvedTargetMarket,
        salesChannel,
        websiteUrl: resolvedWebsiteUrlInput,
        competitorUrls: resolvedCompetitorUrlsInput,
        competitorAvgPrice: resolvedCompetitorAvgPriceUsd > 0 ? convertCurrency(resolvedCompetitorAvgPriceUsd, 'USD', displayCurrency) : 0,
        marketMonthlyUnits: resolvedMarketMonthlyUnits,
        content,
        uploadedImages,
        currentLanguage,
        displayCurrency,
        decision: safeDecision,
        isServiceBusinessCase,
      });
    }

    if (!resultText) {
      usedFallback = true;
      resultText = buildFallbackAnalysis({
        productName: resolvedProductName,
        analysisType,
        price: convertCurrency(resolvedPriceUsd, 'USD', displayCurrency),
        cost: convertCurrency(resolvedCostUsd, 'USD', displayCurrency),
        demand,
        competition,
        adBudget: convertCurrency(manualAdBudgetUsd, 'USD', displayCurrency),
        targetMarket: resolvedTargetMarket,
        salesChannel,
        websiteUrl: resolvedWebsiteUrlInput,
        competitorUrls: resolvedCompetitorUrlsInput,
        competitorAvgPrice: resolvedCompetitorAvgPriceUsd > 0 ? convertCurrency(resolvedCompetitorAvgPriceUsd, 'USD', displayCurrency) : 0,
        marketMonthlyUnits: resolvedMarketMonthlyUnits,
        content,
        uploadedImages,
        currentLanguage,
        displayCurrency,
        decision: safeDecision,
        isServiceBusinessCase,
      });
    }

    resultText = ensureFixedResponseSections({
      currentLanguage,
      text: resultText,
      isServiceBusinessCase,
      fallbackText: buildFallbackAnalysis({
        productName: resolvedProductName,
        analysisType,
        price: convertCurrency(resolvedPriceUsd, 'USD', displayCurrency),
        cost: convertCurrency(resolvedCostUsd, 'USD', displayCurrency),
        demand,
        competition,
        adBudget: convertCurrency(manualAdBudgetUsd, 'USD', displayCurrency),
        targetMarket: resolvedTargetMarket,
        salesChannel,
        websiteUrl: resolvedWebsiteUrlInput,
        competitorUrls: resolvedCompetitorUrlsInput,
        competitorAvgPrice: resolvedCompetitorAvgPriceUsd > 0 ? convertCurrency(resolvedCompetitorAvgPriceUsd, 'USD', displayCurrency) : 0,
        marketMonthlyUnits: resolvedMarketMonthlyUnits,
        content,
        uploadedImages,
        currentLanguage,
        displayCurrency,
        decision: safeDecision,
        isServiceBusinessCase,
      }),
    });

    const persistedInput = [
      userPrompt,
      `Usage pricing: ${formatAiTokens(analysisTokenCost, currentLanguage)} charged for this request.`,
      uploadedImages.length ? `Uploaded images: ${uploadedImages.map((item) => item.name).join(', ')}` : '',
    ].filter(Boolean).join('\n\n');

    await persistAnalysisAndConsumeTokens({
      supabase,
      userId: user.id,
      analysisType,
      inputText: persistedInput,
      resultText,
      productName: resolvedProductName,
      decisionJson: safeDecision,
      tokenCost: analysisTokenCost,
      profile,
    });

    await Promise.all([
      supabase.rpc('process_referral_activation', { p_user_id: user.id, p_reward_credits: referralSettings.rewardCredits }),
      supabase.from('leaderboard').insert({
        user_id: user.id,
        product_name: resolvedProductName,
        score: safeDecision.score,
        verdict: safeDecision.verdict,
        profitability: safeDecision.profitability,
      }),
      supabaseAdmin.from('ai_usage_logs').insert({
        user_id: user.id,
        action_type: 'analysis',
        model_name: 'gpt-4o-mini',
        estimated_input_tokens: estimatedInputTokens,
        estimated_output_tokens: estimateTokens(resultText),
        estimated_cost_usd: estimatedCostUsd,
        metadata: { analysis_type: analysisType, used_fallback: usedFallback, image_count: uploadedImages.length, file_count: uploadedFiles.length, usage_token_cost: analysisTokenCost },
      }),
      persistMarketWatchReport({
        userId: user.id,
        websiteUrl: resolvedWebsiteUrlInput,
        competitorUrls: extractUrlsFromText(resolvedCompetitorUrlsInput),
        report: marketWatchReport,
        saveWatchlist: trackedUrls.length > 0,
      }),
    ]);

    const premiumGateHit =
    monetizationSettings.smartPaywallEnabled &&
  (
    safeDecision.verdict === 'BUY' ||
    safeDecision.confidence >= 72 ||
    safeDecision.score >= 78 ||
    safeDecision.burnRisk === 'Medium'
  );
    const planKey: keyof typeof PLANS = premiumGateHit
      ? (safeDecision.score >= 85 ? 'scale' : safeDecision.score >= 72 ? 'pro' : 'starter')
      : safeDecision.score >= monetizationSettings.creditPackUpsellScore
        ? safeDecision.monetization.recommendedPlan
        : 'starter';
    const upgradePlan = PLANS[planKey];

    await supabaseAdmin.from('analysis_execution_logs').insert({
      user_id: user.id,
      product_name: resolvedProductName,
      verdict: safeDecision.verdict,
      score: safeDecision.score,
      confidence: safeDecision.confidence,
      burn_risk: safeDecision.burnRisk,
      recommended_plan: upgradePlan.key,
      revenue_mode: premiumGateHit ? 'premium_gate' : safeDecision.monetization.paywallMode,
      metadata: {
        execution_mode: safeDecision.executionMode,
        kill_switch_armed: safeDecision.killSwitchArmed,
        rollout_plan: safeDecision.rolloutPlan,
        revenue_playbook: safeDecision.revenuePlaybook,
        usage_token_cost: analysisTokenCost,
      },
    });

    return NextResponse.json({
      success: true,
      productName: resolvedProductName,
      decision: safeDecision,
      resultText,
      usedFallback,
      productSourcing,
      serviceSetup,
      connectorBlueprint: safeDecision.connectorBlueprint,
      marketData: {
        ownPriceDetected: marketData.product?.priceUsd != null ? convertCurrency(marketData.product.priceUsd, 'USD', displayCurrency) : null,
        competitorAvgPriceDetected: marketData.competitorAvgPriceUsd != null ? convertCurrency(marketData.competitorAvgPriceUsd, 'USD', displayCurrency) : null,
        marketUnitsDetected: marketData.marketMonthlyUnitsEstimate ?? null,
        sourceNotes: [...marketData.sourceNotes, ...marketData.connectorSignals.map((item) => item.note)],
        resaleResearchUrls: marketData.resaleResearchUrls,
        rentalResearchUrls: marketData.rentalResearchUrls,
      },
      marketWatch: marketWatchReport,
      revenueMode: premiumGateHit ? 'premium_gate' : safeDecision.monetization.paywallMode,
      usagePricing: { tokensCharged: analysisTokenCost, billingUnit: 'AI tokens' },
      upgradeOffer: {
        planKey: upgradePlan.key,
        planName: upgradePlan.name,
        priceLabel: upgradePlan.priceLabel,
        annualDiscountPercent: monetizationSettings.annualDiscountPercent,
        freeAnalysesBeforePaywall: monetizationSettings.freeAnalysesBeforePaywall,
        cta: premiumGateHit ? 'Unlock premium decision workspace' : safeDecision.monetization.unlockCTA,
      },
    });
  } catch (err: any) {
    console.error('API ERROR:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
