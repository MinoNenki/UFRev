'use client';

import { useEffect, useMemo, useState } from 'react';

const HERO_KEYWORD_GROUPS = {
  hot: ['check', 'sprawdz', 'product', 'produkt', 'budget', 'budzet', 'ads', 'reklam'],
  alert: ['cost', 'koszt', 'invoice', 'faktura', 'business', 'biznes', 'spend', 'wydasz'],
  glow: ['idea', 'pomysl', 'sense', 'sens', 'more', 'wiecej', 'money', 'pieniedzy'],
} as const;

function normalizeWord(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function getKeywordTone(word: string) {
  const normalized = normalizeWord(word);

  if (HERO_KEYWORD_GROUPS.hot.some((entry) => normalized.includes(entry))) return 'hero-word-key hero-word-key-hot';
  if (HERO_KEYWORD_GROUPS.alert.some((entry) => normalized.includes(entry))) return 'hero-word-key hero-word-key-alert';
  if (HERO_KEYWORD_GROUPS.glow.some((entry) => normalized.includes(entry))) return 'hero-word-key hero-word-key-glow';

  return '';
}

export default function HeroWordReveal({ text, durationMs = 15000 }: { text: string; durationMs?: number }) {
  const words = useMemo(() => String(text || '').trim().split(/\s+/).filter(Boolean), [text]);
  const [visibleWords, setVisibleWords] = useState(words.length);
  const [activeWord, setActiveWord] = useState(words.length - 1);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');

    const update = () => setReduceMotion(media.matches);
    update();

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }

    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  useEffect(() => {
    if (!words.length) return;

    if (reduceMotion) {
      setVisibleWords(words.length);
      setActiveWord(words.length - 1);
      return;
    }

    setVisibleWords(0);
    setActiveWord(-1);

    const stepDuration = Math.max(220, Math.floor(durationMs / words.length));
    const revealInterval = window.setInterval(() => {
      setVisibleWords((current) => {
        const next = current + 1;
        setActiveWord(Math.min(next - 1, words.length - 1));

        if (next >= words.length) {
          window.clearInterval(revealInterval);
          return words.length;
        }

        return next;
      });
    }, stepDuration);

    return () => window.clearInterval(revealInterval);
  }, [durationMs, reduceMotion, words]);

  return (
    <span className="hero-word-reveal" aria-label={text}>
      {words.map((word, index) => {
        const isVisible = reduceMotion || index < visibleWords;
        const isCurrent = !reduceMotion && visibleWords < words.length && index === activeWord;
        const keywordTone = getKeywordTone(word);

        return (
          <span
            key={`${word}-${index}`}
            className={`hero-word ${keywordTone} ${isVisible ? 'hero-word-visible' : ''} ${isCurrent ? 'hero-word-current' : ''}`}
          >
            {word}
          </span>
        );
      })}
    </span>
  );
}