"use client";

export default function Paywall() {
  return (
    <div className="glass-strong p-10 mt-12 glow">

      <h2 className="text-3xl font-semibold text-center">
        Unlock full decision intelligence
      </h2>

      <p className="text-gray-400 mt-3 text-center max-w-xl mx-auto">
        You already have the decision. Now unlock the full strategy to avoid mistakes and maximize results.
      </p>

      <div className="mt-8 grid md:grid-cols-2 gap-4">

        <div className="card">
          <h3 className="font-semibold text-white">Risk Breakdown</h3>
          <p className="text-gray-400 text-sm mt-1">
            Avoid costly mistakes before investing
          </p>
        </div>

        <div className="card">
          <h3 className="font-semibold text-white">Profit Potential</h3>
          <p className="text-gray-400 text-sm mt-1">
            See real margin and upside
          </p>
        </div>

        <div className="card">
          <h3 className="font-semibold text-white">Safe Entry Plan</h3>
          <p className="text-gray-400 text-sm mt-1">
            Start safely without burning budget
          </p>
        </div>

        <div className="card">
          <h3 className="font-semibold text-white">Hidden Opportunities</h3>
          <p className="text-gray-400 text-sm mt-1">
            Discover insights others miss
          </p>
        </div>

      </div>

      <div className="mt-8 text-center text-sm text-yellow-400">
        Most users lose money skipping this step
      </div>

      <button className="btn-primary mt-8 w-full text-lg">
        Unlock Full Report
      </button>

      <div className="mt-5 text-xs text-gray-500 text-center">
        Trusted by founders & operators
      </div>

    </div>
  );
}
