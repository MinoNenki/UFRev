export default function ResultPanel({ result, onUnlock }: any) {
  if (!result) return null;

  const color =
    result.verdict === 'BUY'
      ? 'text-green-400'
      : result.verdict === 'AVOID'
        ? 'text-red-400'
        : 'text-yellow-400';

  return (
    <div className="glass-strong mt-8 p-10 glow">
      <div className="mb-3 text-sm text-gray-400">AI Decision</div>

      <div className={`text-6xl font-bold ${color}`}>{result.verdict}</div>

      <div className="mt-4 text-gray-300">Confidence: {result.confidence}%</div>

      <div className="mt-6 whitespace-pre-wrap text-gray-300 leading-relaxed">
        {result.text || result.summary || 'No analysis text available.'}
      </div>

      <div className="mt-6 text-sm text-red-400">
        ⚠️ Skipping full analysis increases risk of loss
      </div>

      <div className="mt-8 border-t border-white/10 pt-6">
        <div className="text-sm text-gray-400">Recommended action</div>
        <div className="mt-2 font-semibold text-white">
          {result.nextStep || result.adStrategy?.nextStep || 'Run a small controlled test.'}
        </div>
      </div>

      <button onClick={onUnlock} className="btn-primary mt-8 w-full text-lg">
        Unlock Full Strategy
      </button>
    </div>
  );
}