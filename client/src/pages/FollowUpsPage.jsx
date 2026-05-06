import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import ErrorAlert from "../components/ErrorAlert";
import LoadingState from "../components/LoadingState";
import StatusBadge from "../components/StatusBadge";
import TableEmptyState from "../components/TableEmptyState";
import { api } from "../services/api";
import { FOLLOW_UP_PRIORITIES, FOLLOW_UP_STATUS } from "../utils/constants";
import { formatDate, normalizePhoneForWhatsapp } from "../utils/format";

const initialForm = {
  id: null,
  contact_id: "",
  property_id: "",
  title: "",
  description: "",
  due_date: "",
  priority: "Medium",
  status: "Pending",
};

const filterOptions = ["Pending", "Completed", "Overdue", "Today"];

function openWhatsApp(item) {
  const number = normalizePhoneForWhatsapp(item.contact_whatsapp || item.contact_phone);
  if (!number) return;
  const message = encodeURIComponent(`Hi ${item.contact_name}, quick follow-up: ${item.title}`);
  window.open(`https://wa.me/${number}?text=${message}`, "_blank");
}

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [filter, setFilter] = useState("Pending");
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
      await fetchFollowUps(filter);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchFollowUps(nextFilter = filter) {
    try {
      const data = await api.get("/follow-ups", { filter: nextFilter.toLowerCase() });
      setFollowUps(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    bootstrap();
  }, []);

  useEffect(() => {
    fetchFollowUps(filter);
  }, [filter]);

  function startEdit(item) {
    setForm({
      id: item.id,
      contact_id: String(item.contact_id),
      property_id: item.property_id ? String(item.property_id) : "",
      title: item.title || "",
      description: item.description || "",
      due_date: item.due_date || "",
      priority: item.priority || "Medium",
      status: item.status || "Pending",
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
        property_id: form.property_id ? Number(form.property_id) : null,
      };
      if (form.id) {
        await api.put(`/follow-ups/${form.id}`, payload);
      } else {
        await api.post("/follow-ups", payload);
      }
      resetForm();
      await fetchFollowUps(filter);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const ok = window.confirm("Delete this follow-up?");
    if (!ok) return;
    try {
      await api.delete(`/follow-ups/${id}`);
      await fetchFollowUps(filter);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleComplete(id) {
    try {
      await api.patch(`/follow-ups/${id}/complete`);
      await fetchFollowUps(filter);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Follow-ups"
        subtitle="Plan reminders and keep communication on schedule."
        actions={[
          <button key="reset" className="btn btn-secondary" type="button" onClick={resetForm}>
            New Follow-up
          </button>,
        ]}
      />
      <ErrorAlert error={error} />

      <form className="card space-y-3" onSubmit={handleSubmit}>
        <h3 className="text-base font-semibold">{form.id ? "Edit Follow-up" : "Add Follow-up"}</h3>
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
            <label className="label">Property (optional)</label>
            <select
              className="input"
              value={form.property_id}
              onChange={(e) => setForm((prev) => ({ ...prev, property_id: e.target.value }))}
            >
              <option value="">Not linked</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Due Date *</label>
            <input
              type="date"
              className="input"
              value={form.due_date}
              onChange={(e) => setForm((prev) => ({ ...prev, due_date: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Title *</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Priority</label>
            <select
              className="input"
              value={form.priority}
              onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
            >
              {FOLLOW_UP_PRIORITIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
              {FOLLOW_UP_STATUS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="label">Description</label>
            <textarea
              className="input min-h-24"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : form.id ? "Update Follow-up" : "Create Follow-up"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={resetForm}>
            Clear
          </button>
        </div>
      </form>

      <div className="card">
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((item) => (
            <button
              key={item}
              className={`btn ${filter === item ? "btn-primary" : "btn-secondary"}`}
              type="button"
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {loading ? <LoadingState text="Loading follow-ups..." /> : null}
      {!loading ? (
        <div className="table-wrap">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Due</th>
                  <th>Contact</th>
                  <th>Property</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {followUps.length ? (
                  followUps.map((item) => (
                    <tr key={item.id}>
                      <td>{formatDate(item.due_date)}</td>
                      <td>{item.contact_name}</td>
                      <td>{item.property_title || "-"}</td>
                      <td>{item.title}</td>
                      <td>
                        <StatusBadge status={item.priority} />
                      </td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" className="btn btn-secondary px-2 py-1 text-xs" onClick={() => startEdit(item)}>
                            Edit
                          </button>
                          {item.status !== "Completed" ? (
                            <button
                              type="button"
                              className="btn btn-secondary px-2 py-1 text-xs"
                              onClick={() => handleComplete(item.id)}
                            >
                              Mark Completed
                            </button>
                          ) : null}
                          <button type="button" className="btn btn-secondary px-2 py-1 text-xs" onClick={() => openWhatsApp(item)}>
                            WhatsApp
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
                  <TableEmptyState colSpan={7} message="No follow-ups found for this filter." />
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
