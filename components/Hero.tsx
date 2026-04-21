'use client';

export default function Hero() {
  return (
    <section className="pt-28 pb-20 text-center">
      <h1 className="mx-auto max-w-4xl text-5xl font-black leading-tight text-white md:text-6xl">
        Ask what you want.
        <span className="gradient-text"> Get a decision.</span>
      </h1>

      <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300">
        Paste a link, file or idea. The system analyzes it, protects you from bad decisions,
        and tells you what to do next.
      </p>

      <div className="mt-10 flex justify-center gap-4">
        <button className="btn-primary glow">Analyze now</button>
        <button className="btn-secondary">See how it works</button>
      </div>
    </section>
  );
}