import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import LoadingState from "../components/LoadingState";
import ErrorAlert from "../components/ErrorAlert";
import StatusBadge from "../components/StatusBadge";
import { api } from "../services/api";
import { formatDate } from "../utils/format";
import { BRAND } from "../utils/branding";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchDashboard() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/dashboard");
      setData(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Quick snapshot of contacts, listings, and priority actions."
        actions={[
          <button key="refresh" type="button" className="btn btn-secondary" onClick={fetchDashboard}>
            Refresh
          </button>,
        ]}
      />

      <ErrorAlert error={error} />

      {loading ? <LoadingState text="Loading dashboard..." /> : null}

      {!loading && data ? (
        <>
          <section className="relative overflow-hidden rounded-3xl border border-slate-800/10 bg-gradient-to-br from-slate-950 via-slate-900 to-brand-700 p-6 text-white shadow-2xl shadow-slate-400/30">
            <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-brand-200/20 blur-2xl" />

            <div className="relative grid gap-5 md:grid-cols-[220px_1fr]">
              <div className="rounded-2xl border border-white/25 bg-white p-3 shadow-lg">
                <img src={BRAND.logoPath} alt={BRAND.companyName} className="w-full rounded-xl object-contain" />
              </div>

              <div>
                <h3 className="text-2xl font-semibold leading-tight">{BRAND.companyName}</h3>
                <p className="mt-1 text-sm text-slate-100">Internal Management Workspace</p>
                <p className="mt-1 text-sm font-medium text-white/90">
                  Manage leads, listings, operations, and follow-ups from one place.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {BRAND.services.map((service) => (
                    <span
                      key={service}
                      className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                    >
                      {service}
                    </span>
                  ))}
                </div>

                <div className="mt-4 grid gap-2 text-sm md:grid-cols-3">
                  <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
                    Prioritize overdue follow-ups daily
                  </div>
                  <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
                    Attach property photos for field tracking
                  </div>
                  <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
                    Save exact location with GPS coordinates
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard label="Total Contacts" value={data.total_contacts} />
            <StatCard label="Total Buyers" value={data.total_buyers} />
            <StatCard label="Total Sellers" value={data.total_sellers} />
            <StatCard label="Total Tenants" value={data.total_tenants} />
            <StatCard label="Total Landlords" value={data.total_landlords} />
            <StatCard label="Total Properties" value={data.total_properties} />
            <StatCard label="Available Rentals" value={data.available_rentals} tone="success" />
            <StatCard label="Available for Sale" value={data.available_for_sale} tone="success" />
            <StatCard label="Follow-ups Due Today" value={data.follow_ups_due_today} tone="warning" />
            <StatCard label="Overdue Follow-ups" value={data.overdue_follow_ups} tone="danger" />
          </section>

          <section className="card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold">Upcoming Viewings</h3>
              <p className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                {data.upcoming_viewings_count || 0} scheduled
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Contact</th>
                    <th>Property</th>
                    <th>Location</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.upcoming_viewings?.length ? (
                    data.upcoming_viewings.map((item) => (
                      <tr key={item.id}>
                        <td>{formatDate(item.viewing_date)}</td>
                        <td>{item.viewing_time}</td>
                        <td>{item.contact_name}</td>
                        <td>{item.property_title}</td>
                        <td>{item.location || "-"}</td>
                        <td>
                          <StatusBadge status={item.status} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                        No upcoming viewings.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
