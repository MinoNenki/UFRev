'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, options: object) => YTPlayer;
      PlayerState: { ENDED: number; PLAYING: number; PAUSED: number; BUFFERING: number; CUED: number };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

type YTPlayer = {
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
  playVideo: () => void;
};

type Props = {
  videoId: string;
  minWatchPercent?: number;
  onComplete: () => void;
  onClose: () => void;
  lang?: string;
};

const STRINGS = {
  pl: {
    watch: 'Obejrzyj reklamę i odbierz tokeny AI',
    desc: 'Nie zamykaj okna — tokeny zostaną dodane automatycznie po obejrzeniu do końca.',
    progress: 'postęp oglądania',
    claim: 'Odbierz tokeny AI',
    loading: 'Ładowanie wideo...',
    noSkip: 'Nie pomijaj — tokeny po zakończeniu',
    closeAnyway: 'Zamknij bez nagrody',
  },
  en: {
    watch: 'Watch the ad and earn AI tokens',
    desc: 'Do not close — tokens are added automatically after watching to the end.',
    progress: 'watch progress',
    claim: 'Claim AI tokens',
    loading: 'Loading video...',
    noSkip: 'Don\'t skip — tokens on completion',
    closeAnyway: 'Close without reward',
  },
};

function t(lang: string | undefined, key: keyof typeof STRINGS['pl']) {
  const l = lang === 'pl' ? 'pl' : 'en';
  return STRINGS[l][key];
}

export default function YoutubeRewardModal({ videoId, minWatchPercent = 90, onComplete, onClose, lang }: Props) {
  const [progress, setProgress] = useState(0);
  const [canClaim, setCanClaim] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const playerRef = useRef<YTPlayer | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const handleComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    clearInterval(intervalRef.current!);
    setProgress(100);
    setCanClaim(true);
  }, []);

  useEffect(() => {
    function initPlayer() {
      if (!document.getElementById('yt-reward-player')) return;
      playerRef.current = new window.YT.Player('yt-reward-player', {
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          playsinline: 1,
        },
        events: {
          onReady: () => setPlayerReady(true),
          onStateChange: (e: { data: number }) => {
            if (e.data === window.YT.PlayerState.ENDED) {
              handleComplete();
            }
            if (e.data === window.YT.PlayerState.PLAYING) {
              intervalRef.current = setInterval(() => {
                if (!playerRef.current) return;
                const elapsed = playerRef.current.getCurrentTime();
                const total = playerRef.current.getDuration();
                if (total > 0) {
                  const pct = Math.min(100, Math.round((elapsed / total) * 100));
                  setProgress(pct);
                  if (pct >= minWatchPercent) handleComplete();
                }
              }, 800);
            }
            if (e.data === window.YT.PlayerState.PAUSED) {
              clearInterval(intervalRef.current!);
            }
          },
        },
      });
    }

    if (typeof window !== 'undefined') {
      if (window.YT && window.YT.Player) {
        initPlayer();
      } else {
        const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
        if (!existing) {
          const tag = document.createElement('script');
          tag.src = 'https://www.youtube.com/iframe_api';
          document.head.appendChild(tag);
        }
        window.onYouTubeIframeAPIReady = initPlayer;
      }
    }

    return () => {
      clearInterval(intervalRef.current!);
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch { /* ignore */ }
      }
    };
  }, [videoId, minWatchPercent, handleComplete]);

  function handleClaim() {
    setClaimed(true);
    onComplete();
  }

  const progressColor = canClaim ? 'bg-emerald-400' : progress > 50 ? 'bg-amber-300' : 'bg-cyan-400';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t(lang, 'watch')}
    >
      <div className="relative mx-4 w-full max-w-2xl rounded-[28px] border border-white/10 bg-slate-950 p-5 shadow-[0_40px_120px_rgba(0,0,0,0.8)]">
        {/* Header */}
        <div className="mb-1 flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-200">
              Rewarded Ads
            </div>
            <h2 className="mt-2 text-base font-black text-white sm:text-lg">
              {t(lang, 'watch')}
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">{t(lang, 'desc')}</p>
          </div>
        </div>

        {/* Video */}
        <div className="relative mt-3 aspect-video w-full overflow-hidden rounded-2xl bg-slate-900">
          {!playerReady && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
              {t(lang, 'loading')}
            </div>
          )}
          <div id="yt-reward-player" className="h-full w-full" />
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>{t(lang, 'progress')}</span>
            <span className={canClaim ? 'text-emerald-400 font-bold' : 'text-slate-400'}>{progress}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-700 ${progressColor}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {canClaim ? (
            <button
              onClick={handleClaim}
              disabled={claimed}
              className="w-full rounded-2xl bg-emerald-400 px-6 py-3.5 text-sm font-black text-slate-950 shadow-lg transition hover:bg-emerald-300 disabled:opacity-60 sm:w-auto"
            >
              {claimed ? '✓ ' : ''}{t(lang, 'claim')}
            </button>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-slate-400 sm:flex-1">
              {t(lang, 'noSkip')}
            </div>
          )}
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-slate-500 transition hover:text-slate-300"
          >
            {t(lang, 'closeAnyway')}
          </button>
        </div>
      </div>
    </div>
  );
}
