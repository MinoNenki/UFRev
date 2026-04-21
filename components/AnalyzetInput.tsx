export default function AnalyzetInput() {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-white">
        Co chcesz sprawdzić?
      </label>

      <textarea
        placeholder={`Wklej link, dodaj plik albo wpisz pytanie...

np.
- czy to się sprzeda?
- policz marżę
- przeanalizuj konkurencję`}
        className="w-full rounded-lg border border-white/10 bg-slate-950 p-4 text-white"
        rows={6}
      />

      <p className="text-xs text-slate-400">
        System sam dobierze rodzaj analizy.
      </p>
    </div>
  );
}