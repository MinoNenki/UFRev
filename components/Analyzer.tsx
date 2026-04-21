'use client';

import { useState } from 'react';

export default function Analyzer({ onResult }: any) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('content', input);

      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      onResult(data);
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