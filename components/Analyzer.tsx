'use client';

import { useState } from 'react';
import { trackEvent } from '@/lib/analytics';

export default function Analyzer({ onResult }: any) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    const startedAt = Date.now();

    trackEvent('analyze_started', {
      analysis_type: 'quick_text',
      content_length: input.trim().length,
      advanced_mode: false,
      upload_file_count: 0,
      preview_image_count: 0,
    });

    try {
      const formData = new FormData();
      formData.append('content', input);

      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        trackEvent('analyze_error', {
          analysis_type: 'quick_text',
          error_stage: 'api_error',
          status_code: res.status,
          error_code: String(data?.error || 'analysis_failed').slice(0, 120),
          duration_ms: Date.now() - startedAt,
        });
      } else {
        trackEvent('analyze_completed', {
          analysis_type: 'quick_text',
          duration_ms: Date.now() - startedAt,
          verdict: String(data?.decision?.verdict || 'n/a'),
          score: Number(data?.decision?.score ?? 0),
          confidence: Number(data?.decision?.confidence ?? 0),
        });
      }
      onResult(data);
    } catch (error) {
      trackEvent('analyze_error', {
        analysis_type: 'quick_text',
        error_stage: 'network_or_runtime',
        error_code: String((error as Error)?.message || 'unknown_error').slice(0, 120),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass p-6">
      <textarea
        placeholder="Wklej link albo napisz czego chcesz..."
        className="w-full rounded-xl border border-white/10 bg-black/30 p-4"
        rows={6}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <div className="mt-4 flex gap-3">
        <button onClick={() => setInput('czy to się sprzeda?')} className="btn-secondary">
          Produkt
        </button>
        <button onClick={() => setInput('policz marżę')} className="btn-secondary">
          Marża
        </button>
        <button onClick={() => setInput('przeanalizuj konkurencję')} className="btn-secondary">
          Konkurencja
        </button>
      </div>

      <button onClick={analyze} className="btn-primary mt-6 w-full">
        {loading ? 'Analizuję...' : 'Analizuj'}
      </button>
    </div>
  );
}