function toneForStatus(status = "") {
  const value = status.toLowerCase();
  if (["available", "active", "completed", "closed", "sold", "rented"].includes(value)) {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (["pending", "contacted", "interested", "scheduled", "new lead", "viewing scheduled"].includes(value)) {
    return "border border-sky-200 bg-sky-50 text-sky-700";
  }
  if (["overdue", "high", "lost", "cancelled", "inactive", "unavailable"].includes(value)) {
    return "border border-rose-200 bg-rose-50 text-rose-700";
  }
  if (["under offer", "negotiating", "paused", "medium"].includes(value)) {
    return "border border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border border-slate-200 bg-slate-50 text-slate-700";
}

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${toneForStatus(status)}`}>
      {status || "-"}
    </span>
  );
}
