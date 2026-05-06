import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import ErrorAlert from "../components/ErrorAlert";
import LoadingState from "../components/LoadingState";
import { api } from "../services/api";
import { CONTACT_STATUSES, CONTACT_TYPES } from "../utils/constants";

const initialForm = {
  full_name: "",
  phone: "",
  whatsapp: "",
  email: "",
  location: "",
  contact_type: "Other",
  status: "New Lead",
  notes: "",
  last_contacted_date: "",
  next_follow_up_date: "",
};

export default function ContactFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchContact() {
      if (!isEdit) return;
      setLoading(true);
      try {
        const data = await api.get(`/contacts/${id}`);
        setForm({
          full_name: data.full_name || "",
          phone: data.phone || "",
          whatsapp: data.whatsapp || "",
          email: data.email || "",
          location: data.location || "",
          contact_type: data.contact_type || "Other",
          status: data.status || "New Lead",
          notes: data.notes || "",
          last_contacted_date: data.last_contacted_date || "",
          next_follow_up_date: data.next_follow_up_date || "",
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchContact();
  }, [id, isEdit]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (isEdit) {
        await api.put(`/contacts/${id}`, form);
      } else {
        await api.post("/contacts", form);
      }
      navigate("/contacts");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState text="Loading contact..." />;

  return (
    <div>
      <PageHeader
        title={isEdit ? "Edit Contact" : "Add Contact"}
        subtitle="Save full contact and follow-up details."
        actions={[
          <Link key="back" to="/contacts" className="btn btn-secondary">
            Back to Contacts
          </Link>,
        ]}
      />

      <ErrorAlert error={error} />

      <form className="card space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Full Name *</label>
            <input
              className="input"
              value={form.full_name}
              onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Phone *</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">WhatsApp</label>
            <input
              className="input"
              value={form.whatsapp}
              onChange={(e) => setForm((prev) => ({ ...prev, whatsapp: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
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
            <label className="label">Contact Type</label>
            <select
              className="input"
              value={form.contact_type}
              onChange={(e) => setForm((prev) => ({ ...prev, contact_type: e.target.value }))}
            >
              {CONTACT_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
            >
              {CONTACT_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Last Contacted Date</label>
            <input
              type="date"
              className="input"
              value={form.last_contacted_date}
              onChange={(e) => setForm((prev) => ({ ...prev, last_contacted_date: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Next Follow-up Date</label>
            <input
              type="date"
              className="input"
              value={form.next_follow_up_date}
              onChange={(e) => setForm((prev) => ({ ...prev, next_follow_up_date: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea
            className="input min-h-28"
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Update Contact" : "Create Contact"}
          </button>
          <Link to="/contacts" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
