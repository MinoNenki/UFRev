'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { tr, type Language } from '@/lib/i18n';

type DemoStep = {
  id: 'capture' | 'mode' | 'analyze' | 'verdict';
  eyebrow: string;
  title: string;
  helper: string;
  accent: 'cyan' | 'emerald' | 'violet' | 'gold';
  button: string;
  verdict: string;
  margin: string;
  risk: string;
  nextStep: string;
  activeMode: 'url' | 'screenshot' | 'invoice' | 'compare' | 'video';
  signalCards: Array<{ label: string; value: string }>;
  systemBadges: string[];
};

type DemoScenario = {
  id: 'operator' | 'video' | 'decision';
  label: string;
  helper: string;
  steps: DemoStep[];
};

export default function InteractiveDemoPreview({ language }: { language: Language }) {
  const operatorSteps: DemoStep[] = [
    {
      id: 'capture',
      eyebrow: tr(language, { en: 'Step 01', pl: 'Krok 01' }),
      title: tr(language, { en: 'Capture the source you want to verify', pl: 'Złap źródło, które chcesz zweryfikować' }),
      helper: tr(language, { en: 'The preview starts from a clear source capture state instead of a static hero frame.', pl: 'Preview zaczyna się od czytelnego stanu przechwycenia źródła zamiast statycznej klatki hero.' }),
      accent: 'gold',
      button: tr(language, { en: 'Capture source', pl: 'Przechwyć źródło' }),
      verdict: tr(language, { en: 'Input staged', pl: 'Input przygotowany' }),
      margin: tr(language, { en: 'Margin not computed yet', pl: 'Marża jeszcze niepoliczona' }),
      risk: tr(language, { en: 'No risk score yet', pl: 'Brak score ryzyka' }),
      nextStep: tr(language, { en: 'Choose URL, PDF or screenshot', pl: 'Wybierz URL, PDF albo screenshot' }),
      activeMode: 'url',
      signalCards: [
        { label: tr(language, { en: 'Source type', pl: 'Typ źródła' }), value: tr(language, { en: 'Supplier product page', pl: 'Strona produktu dostawcy' }) },
        { label: tr(language, { en: 'Expected output', pl: 'Oczekiwany wynik' }), value: tr(language, { en: 'Decision-ready setup', pl: 'Setup gotowy do decyzji' }) },
        { label: tr(language, { en: 'Media support', pl: 'Obsługa mediów' }), value: tr(language, { en: 'URL, PDF, image, video', pl: 'URL, PDF, obraz, wideo' }) },
      ],
      systemBadges: [
        tr(language, { en: 'Source capture', pl: 'Przechwycenie źródła' }),
        tr(language, { en: 'File recognition', pl: 'Rozpoznanie pliku' }),
        tr(language, { en: 'Safe staging', pl: 'Bezpieczne staging' }),
      ],
    },
    {
      id: 'mode',
      eyebrow: tr(language, { en: 'Step 02', pl: 'Krok 02' }),
      title: tr(language, { en: 'Switch analysis mode for the exact job', pl: 'Przełącz tryb analizy pod konkretne zadanie' }),
      helper: tr(language, { en: 'The interface now shows multiple professional entry modes instead of one narrow demo path.', pl: 'Interfejs pokazuje teraz wiele profesjonalnych trybów wejścia zamiast jednej wąskiej ścieżki demo.' }),
      accent: 'cyan',
      button: tr(language, { en: 'Select mode', pl: 'Wybierz tryb' }),
      verdict: tr(language, { en: 'Mode selected', pl: 'Tryb wybrany' }),
      margin: tr(language, { en: 'Scenario profile loaded', pl: 'Załadowano profil scenariusza' }),
      risk: tr(language, { en: 'The system adjusts checks to product, invoice, screenshot or competitor review.', pl: 'System dopasowuje checki do produktu, faktury, screenshota albo przeglądu konkurencji.' }),
      nextStep: tr(language, { en: 'Run the deeper analysis with the right context', pl: 'Uruchom głębszą analizę z właściwym kontekstem' }),
      activeMode: 'compare',
      signalCards: [
        { label: tr(language, { en: 'Mode spread', pl: 'Zakres trybów' }), value: tr(language, { en: 'Visual, cost, competitor, product', pl: 'Wizualny, kosztowy, konkurencja, produkt' }) },
        { label: tr(language, { en: 'Context quality', pl: 'Jakość kontekstu' }), value: tr(language, { en: 'Scenario profile loaded', pl: 'Profil scenariusza załadowany' }) },
        { label: tr(language, { en: 'Operator gain', pl: 'Zysk operatora' }), value: tr(language, { en: 'Less manual switching', pl: 'Mniej ręcznego przełączania' }) },
      ],
      systemBadges: [
        tr(language, { en: 'Scenario routing', pl: 'Routing scenariusza' }),
        tr(language, { en: 'Signal matching', pl: 'Dopasowanie sygnałów' }),
        tr(language, { en: 'Analysis profile', pl: 'Profil analizy' }),
      ],
    },
    {
      id: 'analyze',
      eyebrow: tr(language, { en: 'Step 03', pl: 'Krok 03' }),
      title: tr(language, { en: 'Run the analysis from one professional control point', pl: 'Uruchom analizę z jednego profesjonalnego punktu sterowania' }),
      helper: tr(language, { en: 'The preview shows a cleaner operator-grade CTA and live system processing instead of a decorative animation only.', pl: 'Preview pokazuje czystszy operatorski CTA i live processing systemu zamiast samej dekoracyjnej animacji.' }),
      accent: 'gold',
      button: tr(language, { en: 'Run secure analysis', pl: 'Uruchom bezpieczną analizę' }),
      verdict: tr(language, { en: 'Processing scenario', pl: 'Przetwarzanie scenariusza' }),
      margin: tr(language, { en: 'Calculating unit economics', pl: 'Liczenie unit economics' }),
      risk: tr(language, { en: 'Checking margin, demand and cost pressure', pl: 'Sprawdzanie marży, popytu i presji kosztowej' }),
      nextStep: tr(language, { en: 'Hold until the decision panel updates', pl: 'Poczekaj, aż panel decyzji się zaktualizuje' }),
      activeMode: 'screenshot',
      signalCards: [
        { label: tr(language, { en: 'What analysis reads', pl: 'Co czyta analiza' }), value: tr(language, { en: 'Hook, margin, pressure, clarity', pl: 'Hook, marża, presja, klarowność' }) },
        { label: tr(language, { en: 'Heavy-media mode', pl: 'Tryb cięższych mediów' }), value: tr(language, { en: 'Weighted AI token path', pl: 'Ważona ścieżka tokenów AI' }) },
        { label: tr(language, { en: 'Business effect', pl: 'Efekt biznesowy' }), value: tr(language, { en: 'Visible ROI logic', pl: 'Widoczna logika ROI' }) },
      ],
      systemBadges: [
        tr(language, { en: 'Video capable', pl: 'Obsługa wideo' }),
        tr(language, { en: 'Economics pass', pl: 'Pass ekonomiki' }),
        tr(language, { en: 'Risk scoring', pl: 'Scoring ryzyka' }),
      ],
    },
    {
      id: 'verdict',
      eyebrow: tr(language, { en: 'Step 04', pl: 'Krok 04' }),
      title: tr(language, { en: 'Read the verdict, margin and next action in one board', pl: 'Odczytaj werdykt, marżę i następną akcję na jednej tablicy' }),
      helper: tr(language, { en: 'Users see exactly where the verdict, risk and recommendation appear after interaction.', pl: 'Użytkownik dokładnie widzi, gdzie po interakcji pojawiają się werdykt, ryzyko i rekomendacja.' }),
      accent: 'violet',
      button: tr(language, { en: 'Open decision board', pl: 'Otwórz tablicę decyzji' }),
      verdict: 'TEST',
      margin: '+18.4% projected margin',
      risk: tr(language, { en: 'Medium risk, margin still viable after supplier negotiation', pl: 'Średnie ryzyko, marża nadal sensowna po negocjacji z dostawcą' }),
      nextStep: tr(language, { en: 'Test 3-5 units before scaling ads', pl: 'Przetestuj 3-5 sztuk przed skalowaniem reklam' }),
      activeMode: 'invoice',
      signalCards: [
        { label: tr(language, { en: 'Decision output', pl: 'Wyjście decyzji' }), value: tr(language, { en: 'Verdict + margin + next move', pl: 'Werdykt + marża + następny ruch' }) },
        { label: tr(language, { en: 'Execution level', pl: 'Poziom wykonawczy' }), value: tr(language, { en: 'Test before scale', pl: 'Najpierw test, potem skala' }) },
        { label: tr(language, { en: 'Trust layer', pl: 'Warstwa zaufania' }), value: tr(language, { en: 'Clear reasoning visible', pl: 'Widoczne jasne uzasadnienie' }) },
      ],
      systemBadges: [
        tr(language, { en: 'Decision board', pl: 'Tablica decyzji' }),
        tr(language, { en: 'Margin signal', pl: 'Sygnał marży' }),
        tr(language, { en: 'Next action', pl: 'Następna akcja' }),
      ],
    },
  ];

  const videoSteps: DemoStep[] = [
    {
      id: 'capture',
      eyebrow: tr(language, { en: 'Video 01', pl: 'Wideo 01' }),
      title: tr(language, { en: 'Capture the creative or demo clip', pl: 'Przechwyć kreację albo klip demo' }),
      helper: tr(language, { en: 'This variant starts from media-heavy input so the user instantly sees that UFREV also reads video.', pl: 'Ten wariant startuje od cięższego inputu mediowego, aby użytkownik od razu zobaczył, że UFREV czyta też wideo.' }),
      accent: 'gold',
      button: tr(language, { en: 'Upload clip', pl: 'Wgraj klip' }),
      verdict: tr(language, { en: 'Video source staged', pl: 'Źródło wideo przygotowane' }),
      margin: tr(language, { en: 'Creative economics pending', pl: 'Ekonomika kreacji oczekuje' }),
      risk: tr(language, { en: 'Hook quality not scored yet', pl: 'Jakość hooka jeszcze nieoceniona' }),
      nextStep: tr(language, { en: 'Extract frames and map the scenario', pl: 'Wyodrębnij klatki i zmapuj scenariusz' }),
      activeMode: 'video',
      signalCards: [
        { label: tr(language, { en: 'Video source', pl: 'Źródło wideo' }), value: tr(language, { en: 'UGC demo / ad creative', pl: 'UGC demo / kreacja reklamowa' }) },
        { label: tr(language, { en: 'Frame support', pl: 'Obsługa klatek' }), value: tr(language, { en: 'Preview extraction on', pl: 'Ekstrakcja podglądu włączona' }) },
        { label: tr(language, { en: 'Margin safety', pl: 'Bezpieczeństwo marży' }), value: tr(language, { en: 'Weighted token path', pl: 'Ważona ścieżka tokenów' }) },
      ],
      systemBadges: [
        tr(language, { en: 'Video input', pl: 'Input wideo' }),
        tr(language, { en: 'Frame extraction', pl: 'Ekstrakcja klatek' }),
        tr(language, { en: 'Media-safe billing', pl: 'Bezpieczne rozliczenie mediów' }),
      ],
    },
    {
      id: 'mode',
      eyebrow: tr(language, { en: 'Video 02', pl: 'Wideo 02' }),
      title: tr(language, { en: 'Switch to the video-reading path', pl: 'Przełącz na ścieżkę odczytu wideo' }),
      helper: tr(language, { en: 'Instead of a generic check, the system pivots into hook, pacing, product clarity, and message structure.', pl: 'Zamiast generycznego checku system przechodzi w hook, pacing, klarowność produktu i strukturę przekazu.' }),
      accent: 'gold',
      button: tr(language, { en: 'Select video mode', pl: 'Wybierz tryb wideo' }),
      verdict: tr(language, { en: 'Video mode armed', pl: 'Tryb wideo uzbrojony' }),
      margin: tr(language, { en: 'Creative profile aligned', pl: 'Profil kreacji dopasowany' }),
      risk: tr(language, { en: 'The system prepares creative, offer, and economics checks together.', pl: 'System przygotowuje razem checki kreacji, oferty i ekonomiki.' }),
      nextStep: tr(language, { en: 'Run the weighted video analysis', pl: 'Uruchom ważoną analizę wideo' }),
      activeMode: 'video',
      signalCards: [
        { label: tr(language, { en: 'Read path', pl: 'Ścieżka odczytu' }), value: tr(language, { en: 'Hook + product + CTA', pl: 'Hook + produkt + CTA' }) },
        { label: tr(language, { en: 'Context layer', pl: 'Warstwa kontekstu' }), value: tr(language, { en: 'Creative plus economics', pl: 'Kreacja plus ekonomika' }) },
        { label: tr(language, { en: 'Why it matters', pl: 'Dlaczego to ważne' }), value: tr(language, { en: 'Shows real video value', pl: 'Pokazuje realną wartość wideo' }) },
      ],
      systemBadges: [
        tr(language, { en: 'Hook scan', pl: 'Scan hooka' }),
        tr(language, { en: 'CTA scan', pl: 'Scan CTA' }),
        tr(language, { en: 'Clarity scan', pl: 'Scan klarowności' }),
      ],
    },
    {
      id: 'analyze',
      eyebrow: tr(language, { en: 'Video 03', pl: 'Wideo 03' }),
      title: tr(language, { en: 'Watch the system read frames, economics, and risk together', pl: 'Zobacz jak system czyta razem klatki, ekonomikę i ryzyko' }),
      helper: tr(language, { en: 'This is the spectacular variant: more media, more signals, and visibly heavier processing with premium-weighted logic.', pl: 'To bardziej widowiskowy wariant: więcej mediów, więcej sygnałów i wyraźnie cięższe przetwarzanie z premium ważoną logiką.' }),
      accent: 'gold',
      button: tr(language, { en: 'Run weighted video read', pl: 'Uruchom ważony odczyt wideo' }),
      verdict: tr(language, { en: 'Frames and hook under review', pl: 'Klatki i hook są analizowane' }),
      margin: tr(language, { en: 'Estimating creative-to-margin fit', pl: 'Szacowanie dopasowania kreacji do marży' }),
      risk: tr(language, { en: 'Reading message clarity, product proof, and creative pressure', pl: 'Odczyt klarowności przekazu, proof produktu i presji kreacji' }),
      nextStep: tr(language, { en: 'Wait for BUY / TEST / SKIP recommendation', pl: 'Poczekaj na rekomendację BUY / TEST / SKIP' }),
      activeMode: 'video',
      signalCards: [
        { label: tr(language, { en: 'Token logic', pl: 'Logika tokenów' }), value: tr(language, { en: 'Heavier weighted path', pl: 'Cięższa ważona ścieżka' }) },
        { label: tr(language, { en: 'Read depth', pl: 'Głębokość odczytu' }), value: tr(language, { en: 'Frames + metadata + CTA', pl: 'Klatki + metadane + CTA' }) },
        { label: tr(language, { en: 'Business promise', pl: 'Obietnica biznesowa' }), value: tr(language, { en: 'Visible value, protected margin', pl: 'Widoczna wartość, chroniona marża' }) },
      ],
      systemBadges: [
        tr(language, { en: 'Weighted video pass', pl: 'Ważony pass wideo' }),
        tr(language, { en: 'Creative scoring', pl: 'Scoring kreacji' }),
        tr(language, { en: 'Margin protection', pl: 'Ochrona marży' }),
      ],
    },
    {
      id: 'verdict',
      eyebrow: tr(language, { en: 'Video 04', pl: 'Wideo 04' }),
      title: tr(language, { en: 'Land on a BUY / TEST / SKIP board built for video decisions', pl: 'Wyląduj na tablicy BUY / TEST / SKIP zbudowanej pod decyzje wideo' }),
      helper: tr(language, { en: 'The user sees why the clip deserves a test, where the hook is strong, and what still threatens scale.', pl: 'Użytkownik widzi dlaczego klip zasługuje na test, gdzie hook jest mocny i co nadal zagraża skali.' }),
      accent: 'violet',
      button: tr(language, { en: 'Open video verdict board', pl: 'Otwórz tablicę werdyktu wideo' }),
      verdict: 'TEST',
      margin: tr(language, { en: '+22% projected margin after supplier adjustment', pl: '+22% prognozowanej marży po korekcie dostawcy' }),
      risk: tr(language, { en: 'Hook is strong, but the product proof lands too late for cold traffic.', pl: 'Hook jest mocny, ale proof produktu pojawia się zbyt późno dla zimnego ruchu.' }),
      nextStep: tr(language, { en: 'Shorten the intro and re-test the clip before scaling spend', pl: 'Skróć intro i przetestuj klip ponownie przed skalowaniem wydatków' }),
      activeMode: 'video',
      signalCards: [
        { label: tr(language, { en: 'Decision', pl: 'Decyzja' }), value: tr(language, { en: 'Test before scale', pl: 'Najpierw test, potem skala' }) },
        { label: tr(language, { en: 'Creative issue', pl: 'Problem kreacji' }), value: tr(language, { en: 'Proof appears too late', pl: 'Proof pojawia się za późno' }) },
        { label: tr(language, { en: 'Operator next move', pl: 'Następny ruch operatora' }), value: tr(language, { en: 'Re-cut the first seconds', pl: 'Przytnij pierwsze sekundy' }) },
      ],
      systemBadges: [
        tr(language, { en: 'BUY / TEST / SKIP', pl: 'BUY / TEST / SKIP' }),
        tr(language, { en: 'Creative fix', pl: 'Poprawka kreacji' }),
        tr(language, { en: 'Retest path', pl: 'Ścieżka retestu' }),
      ],
    },
  ];

  const decisionSteps: DemoStep[] = [
    {
      id: 'capture',
      eyebrow: tr(language, { en: 'Board 01', pl: 'Board 01' }),
      title: tr(language, { en: 'Prepare the board for a hard verdict landing', pl: 'Przygotuj tablicę pod mocne lądowanie werdyktu' }),
      helper: tr(language, { en: 'This scenario is built around the decision board itself, not only the input path.', pl: 'Ten scenariusz jest zbudowany wokół samej tablicy decyzji, a nie tylko ścieżki inputu.' }),
      accent: 'gold',
      button: tr(language, { en: 'Arm decision board', pl: 'Uzbrój tablicę decyzji' }),
      verdict: tr(language, { en: 'Decision board staged', pl: 'Tablica decyzji przygotowana' }),
      margin: tr(language, { en: 'Decision metrics loading', pl: 'Ładowanie metryk decyzji' }),
      risk: tr(language, { en: 'Board framing score, confidence, and risk for the landing.', pl: 'Tablica układa score, confidence i ryzyko pod lądowanie werdyktu.' }),
      nextStep: tr(language, { en: 'Queue BUY / TEST / SKIP reveal', pl: 'Ustaw reveal BUY / TEST / SKIP' }),
      activeMode: 'compare',
      signalCards: [
        { label: tr(language, { en: 'Board type', pl: 'Typ tablicy' }), value: tr(language, { en: 'Decision-first reveal', pl: 'Reveal z naciskiem na decyzję' }) },
        { label: tr(language, { en: 'Primary focus', pl: 'Główny fokus' }), value: tr(language, { en: 'Verdict clarity', pl: 'Klarowność werdyktu' }) },
        { label: tr(language, { en: 'UX effect', pl: 'Efekt UX' }), value: tr(language, { en: 'Hard landing state', pl: 'Stan mocnego lądowania' }) },
      ],
      systemBadges: [
        tr(language, { en: 'Board reveal', pl: 'Reveal tablicy' }),
        tr(language, { en: 'Decision framing', pl: 'Ramowanie decyzji' }),
        tr(language, { en: 'Executive layout', pl: 'Układ executive' }),
      ],
    },
    {
      id: 'mode',
      eyebrow: tr(language, { en: 'Board 02', pl: 'Board 02' }),
      title: tr(language, { en: 'Stack BUY / TEST / SKIP states before landing', pl: 'Ułóż stany BUY / TEST / SKIP przed lądowaniem' }),
      helper: tr(language, { en: 'Instead of one flat response, the preview now shows the board preparing multiple decision branches.', pl: 'Zamiast jednej płaskiej odpowiedzi preview pokazuje teraz przygotowanie wielu gałęzi decyzji.' }),
      accent: 'gold',
      button: tr(language, { en: 'Stack verdict states', pl: 'Ułóż stany werdyktu' }),
      verdict: tr(language, { en: 'BUY / TEST / SKIP matrix ready', pl: 'Macierz BUY / TEST / SKIP gotowa' }),
      margin: tr(language, { en: 'Scenario cards aligned', pl: 'Karty scenariusza ustawione' }),
      risk: tr(language, { en: 'The board is ready to land on the safest branch with visible tradeoffs.', pl: 'Tablica jest gotowa wylądować na najbezpieczniejszej gałęzi z widocznymi trade-offami.' }),
      nextStep: tr(language, { en: 'Drop the final verdict with motion', pl: 'Zrzuć finalny werdykt z animacją' }),
      activeMode: 'compare',
      signalCards: [
        { label: tr(language, { en: 'Decision matrix', pl: 'Macierz decyzji' }), value: tr(language, { en: 'BUY / TEST / SKIP visible', pl: 'BUY / TEST / SKIP widoczne' }) },
        { label: tr(language, { en: 'What changes', pl: 'Co się zmienia' }), value: tr(language, { en: 'Tradeoffs become visible', pl: 'Trade-offy stają się widoczne' }) },
        { label: tr(language, { en: 'Why it matters', pl: 'Dlaczego to ważne' }), value: tr(language, { en: 'Feels like a real decision board', pl: 'Wygląda jak prawdziwa tablica decyzji' }) },
      ],
      systemBadges: [
        tr(language, { en: 'BUY state', pl: 'Stan BUY' }),
        tr(language, { en: 'TEST state', pl: 'Stan TEST' }),
        tr(language, { en: 'SKIP state', pl: 'Stan SKIP' }),
      ],
    },
    {
      id: 'analyze',
      eyebrow: tr(language, { en: 'Board 03', pl: 'Board 03' }),
      title: tr(language, { en: 'Trigger the decision landing animation', pl: 'Uruchom animację decision landing' }),
      helper: tr(language, { en: 'This is the more theatrical variant: the board lands with executive force instead of only updating quietly.', pl: 'To bardziej teatralny wariant: tablica ląduje z executive force zamiast tylko cicho się aktualizować.' }),
      accent: 'gold',
      button: tr(language, { en: 'Launch decision landing', pl: 'Uruchom decision landing' }),
      verdict: tr(language, { en: 'Decision landing in progress', pl: 'Decision landing w toku' }),
      margin: tr(language, { en: 'Locking margin, confidence, and next move', pl: 'Blokowanie marży, confidence i kolejnego ruchu' }),
      risk: tr(language, { en: 'The board resolves the safest path while still showing why the other branches lost.', pl: 'Tablica rozstrzyga najbezpieczniejszą ścieżkę, jednocześnie pokazując dlaczego inne gałęzie przegrały.' }),
      nextStep: tr(language, { en: 'Land the strongest branch now', pl: 'Wyląduj teraz najmocniejszą gałąź' }),
      activeMode: 'compare',
      signalCards: [
        { label: tr(language, { en: 'Landing style', pl: 'Styl lądowania' }), value: tr(language, { en: 'Executive impact reveal', pl: 'Reveal z executive impact' }) },
        { label: tr(language, { en: 'Board focus', pl: 'Fokus tablicy' }), value: tr(language, { en: 'One dominant answer', pl: 'Jedna dominująca odpowiedź' }) },
        { label: tr(language, { en: 'Outcome', pl: 'Rezultat' }), value: tr(language, { en: 'Decision gravity visible', pl: 'Grawitacja decyzji widoczna' }) },
      ],
      systemBadges: [
        tr(language, { en: 'Board impact', pl: 'Impact tablicy' }),
        tr(language, { en: 'Decision gravity', pl: 'Grawitacja decyzji' }),
        tr(language, { en: 'Final branch', pl: 'Finalna gałąź' }),
      ],
    },
    {
      id: 'verdict',
      eyebrow: tr(language, { en: 'Board 04', pl: 'Board 04' }),
      title: tr(language, { en: 'Land on TEST with a strong board reveal', pl: 'Wyląduj na TEST z mocnym revealem tablicy' }),
      helper: tr(language, { en: 'The board does not just say TEST. It lands on TEST while showing why BUY lost and why SKIP was too harsh.', pl: 'Tablica nie mówi tylko TEST. Ląduje na TEST, jednocześnie pokazując dlaczego BUY przegrał, a SKIP był zbyt surowy.' }),
      accent: 'violet',
      button: tr(language, { en: 'Open decision landing board', pl: 'Otwórz board decision landing' }),
      verdict: 'TEST',
      margin: tr(language, { en: '+16% projected margin in controlled rollout', pl: '+16% prognozowanej marży w kontrolowanym rolloucie' }),
      risk: tr(language, { en: 'BUY lost on proof strength. SKIP lost because the margin still justifies a small controlled test.', pl: 'BUY przegrał na sile proofu. SKIP przegrał, bo marża nadal uzasadnia mały kontrolowany test.' }),
      nextStep: tr(language, { en: 'Launch a short test and improve proof before bigger spend', pl: 'Uruchom krótki test i popraw proof przed większym wydatkiem' }),
      activeMode: 'compare',
      signalCards: [
        { label: tr(language, { en: 'Winning branch', pl: 'Wygrywająca gałąź' }), value: tr(language, { en: 'TEST', pl: 'TEST' }) },
        { label: tr(language, { en: 'Why not BUY', pl: 'Dlaczego nie BUY' }), value: tr(language, { en: 'Proof still too soft', pl: 'Proof nadal zbyt miękki' }) },
        { label: tr(language, { en: 'Why not SKIP', pl: 'Dlaczego nie SKIP' }), value: tr(language, { en: 'Margin still deserves a shot', pl: 'Marża nadal zasługuje na próbę' }) },
      ],
      systemBadges: [
        tr(language, { en: 'Decision landing', pl: 'Decision landing' }),
        tr(language, { en: 'TEST wins', pl: 'TEST wygrywa' }),
        tr(language, { en: 'Branch logic visible', pl: 'Widoczna logika gałęzi' }),
      ],
    },
  ];

  const scenarios: DemoScenario[] = [
    {
      id: 'operator',
      label: tr(language, { en: 'Operator flow', pl: 'Flow operatora' }),
      helper: tr(language, { en: 'Classic path: source, mode, analysis, verdict.', pl: 'Klasyczna ścieżka: źródło, tryb, analiza, werdykt.' }),
      steps: operatorSteps,
    },
    {
      id: 'video',
      label: tr(language, { en: 'Video verdict flow', pl: 'Flow werdyktu wideo' }),
      helper: tr(language, { en: 'More spectacular path showing video reading and weighted token logic.', pl: 'Bardziej widowiskowa ścieżka pokazująca odczyt wideo i ważoną logikę tokenów.' }),
      steps: videoSteps,
    },
    {
      id: 'decision',
      label: tr(language, { en: 'Decision landing', pl: 'Decision landing' }),
      helper: tr(language, { en: 'The most dramatic board-first scenario for BUY / TEST / SKIP reveal.', pl: 'Najbardziej dramatyczny scenariusz board-first dla revealu BUY / TEST / SKIP.' }),
      steps: decisionSteps,
    },
  ];

  const modeOptions = [
    { id: 'url', label: 'URL', helper: tr(language, { en: 'Product page', pl: 'Strona produktu' }) },
    { id: 'screenshot', label: tr(language, { en: 'Screenshot', pl: 'Screenshot' }), helper: tr(language, { en: 'Visual review', pl: 'Review wizualny' }) },
    { id: 'video', label: tr(language, { en: 'Video', pl: 'Wideo' }), helper: tr(language, { en: 'Creative read', pl: 'Odczyt kreacji' }) },
    { id: 'invoice', label: tr(language, { en: 'Invoice', pl: 'Faktura' }), helper: tr(language, { en: 'Cost audit', pl: 'Audyt kosztu' }) },
    { id: 'compare', label: tr(language, { en: 'Compare', pl: 'Porównanie' }), helper: tr(language, { en: 'Competitor check', pl: 'Check konkurencji' }) },
  ] as const;

  const [activeScenarioIndex, setActiveScenarioIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeScenario = scenarios[activeScenarioIndex];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current + 1 >= activeScenario.steps.length) {
          setActiveScenarioIndex((scenario) => (scenario + 1) % scenarios.length);
          return 0;
        }

        return current + 1;
      });
    }, 2800);

    return () => window.clearInterval(interval);
  }, [activeScenario.steps.length, scenarios.length]);

  useEffect(() => {
    setActiveIndex(0);
  }, [activeScenarioIndex]);

  const activeStep = activeScenario.steps[activeIndex];
  const progress = ((activeIndex + 1) / activeScenario.steps.length) * 100;
  const accentStyles = {
    cyan: 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100',
    emerald: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100',
    violet: 'border-violet-300/30 bg-violet-300/10 text-violet-100',
    gold: 'border-amber-200/40 bg-amber-300/15 text-amber-50 shadow-[0_0_30px_rgba(251,191,36,0.16)]',
  }[activeStep.accent];
  const previewTone = {
    cyan: 'analysis-preview-cyan',
    emerald: 'analysis-preview-emerald',
    violet: 'analysis-preview-violet',
    gold: 'analysis-preview-gold',
  }[activeStep.accent];

  return (
    <section className={`premium-panel analysis-preview-shell ${previewTone} overflow-hidden p-5 sm:p-6 xl:p-7`}>
      <div className="analysis-preview-orb analysis-preview-orb-a" />
      <div className="analysis-preview-orb analysis-preview-orb-b" />
      <div className="analysis-preview-scan" />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">
            {tr(language, { en: 'Interactive product walkthrough', pl: 'Interaktywny walkthrough produktu' })}
          </div>
          <h2 className="text-balance mt-2 max-w-2xl text-[clamp(1.7rem,3vw,2.35rem)] font-black leading-[1.02] text-white">
            {tr(language, { en: 'A cleaner operator-grade preview that shows more options, not just motion.', pl: 'Czystszy preview klasy operatorskiej, który pokazuje więcej opcji, a nie tylko ruch.' })}
          </h2>
        </div>
        <div className="glass-chip border-amber-200/25 bg-amber-300/12 text-amber-50 shadow-[0_0_30px_rgba(251,191,36,0.12)]">
          {tr(language, { en: 'Analysis value preview', pl: 'Preview wartości analizy' })}
        </div>
      </div>

      <p className="max-w-3xl text-sm leading-6 text-slate-300">
        {tr(language, { en: 'This preview now shows a fuller workflow: capture input, switch mode, run analysis, and review the decision board with margin and risk.', pl: 'Ten preview pokazuje teraz pełniejszy workflow: przechwycenie inputu, zmianę trybu, uruchomienie analizy i tablicę decyzji z marżą oraz ryzykiem.' })}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {scenarios.map((scenario, index) => {
          const selected = index === activeScenarioIndex;
          return (
            <button
              key={`${scenario.id}-${index}`}
              type="button"
              onClick={() => setActiveScenarioIndex(index)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${selected ? 'border-amber-200/35 bg-amber-300/14 text-amber-50 shadow-[0_0_26px_rgba(251,191,36,0.12)]' : 'border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]'}`}
            >
              {scenario.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 text-sm text-slate-300">{activeScenario.helper}</div>

      <div className="mt-5 flex flex-wrap gap-2">
        {activeScenario.steps.map((step, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition duration-200 ${isActive ? accentStyles : 'border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]'}`}
            >
              {step.eyebrow} - {step.button}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {activeStep.systemBadges.map((badge) => (
          <span key={badge} className="analysis-preview-badge rounded-full border border-amber-200/20 bg-amber-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-50">
            {badge}
          </span>
        ))}
      </div>

      <div className={`analysis-preview-stage mt-5 overflow-hidden rounded-[30px] border border-amber-200/15 bg-slate-950/60 shadow-[0_24px_90px_rgba(2,6,23,0.45)] ${activeScenario.id === 'decision' ? 'analysis-preview-stage-decision' : ''}`}>
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.22em] text-slate-400">
          <span>{tr(language, { en: 'Live interaction path', pl: 'Ścieżka live interaction' })}</span>
          <span>{activeStep.eyebrow}</span>
        </div>

        <div className="grid gap-0 xl:grid-cols-[minmax(520px,1.12fr)_minmax(620px,1fr)]">
          <div className="relative border-b border-white/10 p-5 sm:p-6 xl:border-b-0 xl:border-r xl:p-7">
            <div className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-200">
              {tr(language, { en: 'User action', pl: 'Akcja usera' })}
            </div>
            <div className={`analysis-console-3d mt-10 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 ${activeScenario.id === 'video' ? 'analysis-console-video' : ''} ${activeScenario.id === 'decision' ? 'analysis-console-decision' : ''}`}>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{tr(language, { en: 'Source console', pl: 'Konsola źródła' })}</div>
              <div className={`mt-3 min-h-[96px] rounded-[22px] border px-4 py-4 text-[15px] font-medium leading-7 break-all ${activeIndex === 0 ? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-50 shadow-[0_0_0_1px_rgba(34,211,238,0.1)]' : 'border-white/10 bg-slate-950/50 text-slate-300'}`}>
                https://supplier.example.com/product/portable-blender
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {modeOptions.map((option) => {
                  const isActiveMode = option.id === activeStep.activeMode;
                  return (
                    <div key={option.id} className={`analysis-mode-card min-h-[110px] rounded-[20px] border p-4 transition duration-300 ${isActiveMode ? 'border-amber-200/35 bg-amber-300/10 shadow-[0_18px_40px_rgba(251,191,36,0.08)]' : 'border-white/10 bg-slate-950/50'}`}>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{option.label}</div>
                      <div className="mt-2 text-base font-semibold leading-6 text-white">{option.helper}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className={`analysis-live-cta rounded-2xl border px-4 py-3 text-sm font-semibold transition duration-300 ${activeIndex === 2 ? 'border-amber-200/40 bg-amber-300/15 text-amber-50 shadow-[0_0_30px_rgba(251,191,36,0.18)]' : 'border-white/10 bg-white/[0.03] text-white'}`}>
                {tr(language, { en: 'Analyze input', pl: 'Analizuj input' })}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">{activeStep.button}</div>
              <div className="basis-full rounded-[20px] border border-white/10 bg-slate-950/45 px-4 py-4 text-sm leading-7 text-slate-300 xl:basis-auto xl:flex-1">{activeStep.helper}</div>
            </div>

            <div className="mt-5 h-2 rounded-full bg-white/5">
              <div className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,1),rgba(16,185,129,0.95),rgba(168,85,247,0.95))] transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="relative p-5 sm:p-6 xl:p-7">
            <div className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-200">
              {tr(language, { en: 'System response', pl: 'Odpowiedź systemu' })}
            </div>
            <div className="mt-10 grid gap-4 lg:grid-cols-2">
              <div className={`analysis-response-card rounded-[24px] border p-5 transition duration-300 lg:col-span-2 ${activeIndex === 3 ? 'border-violet-300/35 bg-violet-300/10' : activeStep.accent === 'gold' ? 'border-amber-200/30 bg-amber-300/10' : 'border-white/10 bg-white/[0.03]'} ${activeScenario.id === 'decision' && activeIndex === 3 ? 'analysis-response-card-decision' : ''}`}>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{tr(language, { en: 'Verdict', pl: 'Werdykt' })}</div>
                <div className="mt-3 text-[clamp(1.7rem,3vw,2.5rem)] font-black leading-[1.05] text-white">{activeStep.verdict}</div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{tr(language, { en: 'Margin', pl: 'Marża' })}</div>
                <div className="mt-3 text-base font-semibold leading-7 break-words text-white">{activeStep.margin}</div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{tr(language, { en: 'Risk', pl: 'Ryzyko' })}</div>
                <div className="mt-3 text-base font-semibold leading-7 break-words text-white">{activeStep.risk}</div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 lg:col-span-2">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{tr(language, { en: 'Next step', pl: 'Następny krok' })}</div>
                <div className="mt-3 text-base font-semibold leading-7 break-words text-white">{activeStep.nextStep}</div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {activeStep.signalCards.map((card, index) => (
                <div key={`${card.label}-${index}`} className="analysis-signal-card rounded-[22px] border border-white/10 bg-white/[0.04] p-4" style={{ animationDelay: `${index * 140}ms` }}>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{card.label}</div>
                  <div className="mt-2 text-sm font-semibold leading-6 text-white">{card.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-[24px] border border-white/10 bg-slate-950/45 p-5 text-sm leading-7 text-slate-300">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{tr(language, { en: 'What the user sees changing', pl: 'Co zmienia się na oczach usera' })}</div>
              <div className="mt-2 text-base font-semibold leading-7 text-white">{activeStep.title}</div>
              <div className="mt-2">{activeStep.helper}</div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link href="/dashboard" className="rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 transition duration-200 hover:scale-[1.02]">
                {tr(language, { en: 'Open the real flow', pl: 'Otwórz realny flow' })}
              </Link>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                {tr(language, { en: 'Click any step above to preview a different UI state.', pl: 'Kliknij dowolny krok powyżej, aby podejrzeć inny stan UI.' })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}