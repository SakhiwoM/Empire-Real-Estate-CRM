export default function StatCard({ label, value, tone = "default" }) {
  const tones = {
    default: "border-slate-200 bg-white/90",
    warning: "border-amber-200 bg-amber-50/90",
    danger: "border-rose-200 bg-rose-50/90",
    success: "border-emerald-200 bg-emerald-50/90",
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-4 shadow-lg shadow-slate-200/50 transition hover:-translate-y-0.5 hover:shadow-xl ${
        tones[tone] || tones.default
      }`}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-white/70 blur-xl" />
      <p className="relative text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="relative mt-2 text-3xl font-semibold leading-none text-slate-900">{value ?? 0}</p>
    </div>
  );
}