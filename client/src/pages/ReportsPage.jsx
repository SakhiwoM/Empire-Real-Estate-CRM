import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import ErrorAlert from "../components/ErrorAlert";
import LoadingState from "../components/LoadingState";
import { api } from "../services/api";

function ReportCard({ title, items }) {
  return (
    <div className="card">
      <h3 className="mb-3 text-base font-semibold">{title}</h3>
      <div className="space-y-2">
        {items?.length ? (
          items.map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span>{item.label}</span>
              <span className="font-semibold">{item.count}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No data yet.</p>
        )}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchReports() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/reports");
      setData(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        subtitle="Simple operational summaries for fast weekly reviews."
        actions={[
          <button key="refresh" className="btn btn-secondary" onClick={fetchReports}>
            Refresh
          </button>,
        ]}
      />
      <ErrorAlert error={error} />
      {loading ? <LoadingState text="Loading reports..." /> : null}
      {!loading && data ? (
        <div className="grid gap-4 md:grid-cols-2">
          <ReportCard title="Contacts by Type" items={data.contacts_by_type} />
          <ReportCard title="Properties by Status" items={data.properties_by_status} />
          <ReportCard title="Properties by Listing Type" items={data.properties_by_listing_type} />
          <ReportCard title="Follow-ups by Status" items={data.follow_ups_by_status} />
          <div className="card md:col-span-2">
            <h3 className="mb-2 text-base font-semibold">Future Deals Module</h3>
            <p className="text-sm text-slate-600">
              {data.deals?.note ||
                "Structure reserved for future deals pipeline reporting (won/lost value, commissions, and conversion rates)."}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
