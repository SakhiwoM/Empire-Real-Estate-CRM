import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import ErrorAlert from "../components/ErrorAlert";
import LoadingState from "../components/LoadingState";
import StatusBadge from "../components/StatusBadge";
import TableEmptyState from "../components/TableEmptyState";
import { api } from "../services/api";
import { VIEWING_STATUS } from "../utils/constants";
import { formatDate } from "../utils/format";

const initialForm = {
  id: null,
  contact_id: "",
  property_id: "",
  viewing_date: "",
  viewing_time: "",
  location: "",
  status: "Scheduled",
  notes: "",
};

export default function ViewingsPage() {
  const [viewings, setViewings] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function bootstrap() {
    setLoading(true);
    setError("");
    try {
      const [contactsData, propertiesData] = await Promise.all([api.get("/contacts"), api.get("/properties")]);
      setContacts(contactsData);
      setProperties(propertiesData);
      await fetchViewings(statusFilter);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchViewings(nextStatus = statusFilter) {
    try {
      const data = await api.get("/viewings", { status: nextStatus });
      setViewings(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    bootstrap();
  }, []);

  useEffect(() => {
    fetchViewings(statusFilter);
  }, [statusFilter]);

  function startEdit(item) {
    setForm({
      id: item.id,
      contact_id: String(item.contact_id),
      property_id: String(item.property_id),
      viewing_date: item.viewing_date || "",
      viewing_time: item.viewing_time || "",
      location: item.location || "",
      status: item.status || "Scheduled",
      notes: item.notes || "",
    });
  }

  function resetForm() {
    setForm(initialForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        contact_id: Number(form.contact_id),
        property_id: Number(form.property_id),
      };
      if (form.id) {
        await api.put(`/viewings/${form.id}`, payload);
      } else {
        await api.post("/viewings", payload);
      }
      resetForm();
      await fetchViewings(statusFilter);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const ok = window.confirm("Delete this viewing?");
    if (!ok) return;
    try {
      await api.delete(`/viewings/${id}`);
      await fetchViewings(statusFilter);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Viewings"
        subtitle="Schedule and track property viewing appointments."
        actions={[
          <button key="new" className="btn btn-secondary" type="button" onClick={resetForm}>
            New Viewing
          </button>,
        ]}
      />
      <ErrorAlert error={error} />

      <form className="card space-y-3" onSubmit={handleSubmit}>
        <h3 className="text-base font-semibold">{form.id ? "Edit Viewing" : "Add Viewing"}</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="label">Contact *</label>
            <select
              className="input"
              value={form.contact_id}
              onChange={(e) => setForm((prev) => ({ ...prev, contact_id: e.target.value }))}
              required
            >
              <option value="">Select contact</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Property *</label>
            <select
              className="input"
              value={form.property_id}
              onChange={(e) => setForm((prev) => ({ ...prev, property_id: e.target.value }))}
              required
            >
              <option value="">Select property</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Viewing Date *</label>
            <input
              type="date"
              className="input"
              value={form.viewing_date}
              onChange={(e) => setForm((prev) => ({ ...prev, viewing_date: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Viewing Time *</label>
            <input
              type="time"
              className="input"
              value={form.viewing_time}
              onChange={(e) => setForm((prev) => ({ ...prev, viewing_time: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Location</label>
            <input
              className="input"
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
            >
              {VIEWING_STATUS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="label">Notes</label>
            <textarea
              className="input min-h-24"
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : form.id ? "Update Viewing" : "Create Viewing"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={resetForm}>
            Clear
          </button>
        </div>
      </form>

      <div className="card">
        <label className="label">Filter by Status</label>
        <select className="input max-w-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All</option>
          {VIEWING_STATUS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {loading ? <LoadingState text="Loading viewings..." /> : null}
      {!loading ? (
        <div className="table-wrap">
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {viewings.length ? (
                  viewings.map((item) => (
                    <tr key={item.id}>
                      <td>{formatDate(item.viewing_date)}</td>
                      <td>{item.viewing_time}</td>
                      <td>{item.contact_name}</td>
                      <td>{item.property_title}</td>
                      <td>{item.location || "-"}</td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" className="btn btn-secondary px-2 py-1 text-xs" onClick={() => startEdit(item)}>
                            Edit
                          </button>
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
                  <TableEmptyState colSpan={7} message="No viewings found." />
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
