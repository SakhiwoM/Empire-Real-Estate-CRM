import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import ErrorAlert from "../components/ErrorAlert";
import LoadingState from "../components/LoadingState";
import StatusBadge from "../components/StatusBadge";
import TableEmptyState from "../components/TableEmptyState";
import { api } from "../services/api";
import { PROPERTY_TYPES, PURPOSES, REQUIREMENT_STATUS, REQUIREMENT_URGENCY } from "../utils/constants";
import { formatCurrency } from "../utils/format";

export default function RequirementsPage() {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [purpose, setPurpose] = useState("");
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [urgency, setUrgency] = useState("");
  const [status, setStatus] = useState("");
  const [matchData, setMatchData] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);

  const query = useMemo(
    () => ({
      purpose,
      location,
      property_type: propertyType,
      urgency,
      status,
    }),
    [purpose, location, propertyType, urgency, status]
  );

  async function fetchRequirements() {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/requirements", query);
      setRequirements(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    const ok = window.confirm("Delete this requirement?");
    if (!ok) return;
    try {
      await api.delete(`/requirements/${id}`);
      await fetchRequirements();
    } catch (err) {
      setError(err.message);
    }
  }

  async function viewMatches(id) {
    setMatchLoading(true);
    setError("");
    try {
      const data = await api.get(`/requirements/${id}/matches`);
      setMatchData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setMatchLoading(false);
    }
  }

  useEffect(() => {
    fetchRequirements();
  }, [query]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Client Requirements"
        subtitle="Track buyer/renter needs and compare with available properties."
        actions={[
          <Link key="new" to="/requirements/new" className="btn btn-primary">
            Add Requirement
          </Link>,
        ]}
      />

      <ErrorAlert error={error} />

      <div className="card grid gap-3 md:grid-cols-6">
        <div>
          <label className="label">Purpose</label>
          <select className="input" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
            <option value="">All</option>
            {PURPOSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Location</label>
          <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div>
          <label className="label">Property Type</label>
          <select className="input" value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
            <option value="">All</option>
            {PROPERTY_TYPES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Urgency</label>
          <select className="input" value={urgency} onChange={(e) => setUrgency(e.target.value)}>
            <option value="">All</option>
            {REQUIREMENT_URGENCY.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            {REQUIREMENT_STATUS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button className="btn btn-secondary w-full" type="button" onClick={fetchRequirements}>
            Refresh
          </button>
        </div>
      </div>

      {loading ? <LoadingState text="Loading requirements..." /> : null}
      {!loading ? (
        <div className="table-wrap">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Contact</th>
                  <th>Purpose</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Budget</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requirements.length ? (
                  requirements.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <p className="font-medium text-slate-900">{item.contact_name}</p>
                        <p className="text-xs text-slate-500">{item.contact_phone}</p>
                      </td>
                      <td>{item.purpose}</td>
                      <td>{item.property_type}</td>
                      <td>{item.preferred_location || "-"}</td>
                      <td>
                        {item.min_budget || item.max_budget
                          ? `${formatCurrency(item.min_budget || 0)} - ${item.max_budget ? formatCurrency(item.max_budget) : "No max"}`
                          : "Not set"}
                      </td>
                      <td>
                        <StatusBadge status={item.urgency} />
                      </td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <button className="btn btn-secondary px-2 py-1 text-xs" onClick={() => viewMatches(item.id)}>
                            Matches
                          </button>
                          <Link to={`/requirements/${item.id}/edit`} className="btn btn-secondary px-2 py-1 text-xs">
                            Edit
                          </Link>
                          <button
                            type="button"
                            className="btn btn-danger px-2 py-1 text-xs"
                            onClick={() => handleDelete(item.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <TableEmptyState colSpan={8} message="No requirements found." />
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <section className="card">
        <h3 className="mb-2 text-base font-semibold">Matching Results</h3>
        {matchLoading ? <LoadingState text="Finding matching properties..." /> : null}
        {!matchLoading && matchData ? (
          <>
            <p className="mb-3 text-sm text-slate-500">
              Requirement #{matchData.requirement.id} has {matchData.total_matches} match(es).
            </p>
            <div className="space-y-2">
              {matchData.matches.length ? (
                matchData.matches.map((item) => (
                  <div key={item.id} className="rounded-md border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{item.title}</p>
                      <span className="rounded-full bg-brand-100 px-2 py-1 text-xs font-semibold text-brand-700">
                        Match {item.match_score}%
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      {item.property_type} | {item.listing_type} | {item.location} | {formatCurrency(item.price)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Owner: {item.owner_name || "N/A"} {item.owner_phone ? `(${item.owner_phone})` : ""}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No matches found for this requirement.</p>
              )}
            </div>
          </>
        ) : !matchLoading ? (
          <p className="text-sm text-slate-500">Choose any requirement and click "Matches".</p>
        ) : null}
      </section>
    </div>
  );
}
