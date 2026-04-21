'use client';

export default function BackgroundFX() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.16] bg-[linear-gradient(rgba(34,211,238,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.04)_1px,transparent_1px)] bg-[size:72px_72px]" />
      <div className="absolute left-[-12%] top-[-14%] h-[36rem] w-[36rem] rounded-full bg-cyan-400/18 blur-[120px] animate-drift-diagonal" />
      <div className="absolute right-[-10%] top-[14%] h-[30rem] w-[30rem] rounded-full bg-indigo-500/18 blur-[115px] animate-float-long" />
      <div className="absolute bottom-[-14%] left-[22%] h-[26rem] w-[26rem] rounded-full bg-fuchsia-500/14 blur-[105px] animate-float-delayed" />
      <div className="absolute left-[8%] top-[24%] h-56 w-56 rounded-full border border-cyan-300/10 animate-rotate-slow" />
      <div className="absolute right-[12%] bottom-[14%] h-72 w-72 rounded-full border border-fuchsia-300/10 animate-rotate-reverse" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),transparent_32%)]" />
      <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(34,211,238,0.08),transparent)]" />
    </div>
  );
}
