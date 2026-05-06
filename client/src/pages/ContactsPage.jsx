import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import ErrorAlert from "../components/ErrorAlert";
import LoadingState from "../components/LoadingState";
import StatusBadge from "../components/StatusBadge";
import TableEmptyState from "../components/TableEmptyState";
import { api } from "../services/api";
import { CONTACT_STATUSES, CONTACT_TYPES } from "../utils/constants";
import { formatDate, normalizePhoneForWhatsapp } from "../utils/format";

function openWhatsApp(contact) {
  const number = normalizePhoneForWhatsapp(contact.whatsapp || contact.phone);
  if (!number) return;
  const message = encodeURIComponent(`Hi ${contact.full_name}, this is Empire Property CRM following up with you.`);
  window.open(`https://wa.me/${number}?text=${message}`, "_blank");
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [contactType, setContactType] = useState("");
  const [status, setStatus] = useState("");

  const query = useMemo(
    () => ({
      q,
      contact_type: contactType,
      status,
    }),
    [q, contactType, status]
  );

  async function fetchContacts() {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/contacts", query);
      setContacts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    const ok = window.confirm("Delete this contact? This also deletes linked requirements/follow-ups/viewings.");
    if (!ok) return;

    try {
      await api.delete(`/contacts/${id}`);
      await fetchContacts();
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    fetchContacts();
  }, [query]);

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle="Track buyers, sellers, tenants, landlords, investors, and leads."
        actions={[
          <Link key="new" to="/contacts/new" className="btn btn-primary">
            Add Contact
          </Link>,
        ]}
      />

      <ErrorAlert error={error} />

      <div className="card mb-4 grid gap-3 md:grid-cols-4">
        <div>
          <label className="label">Search</label>
          <input
            className="input"
            placeholder="Name, phone, location..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Contact Type</label>
          <select className="input" value={contactType} onChange={(e) => setContactType(e.target.value)}>
            <option value="">All</option>
            {CONTACT_TYPES.map((item) => (
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
            {CONTACT_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button type="button" className="btn btn-secondary w-full" onClick={fetchContacts}>
            Refresh
          </button>
        </div>
      </div>

      {loading ? <LoadingState text="Loading contacts..." /> : null}
      {!loading ? (
        <div className="table-wrap">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Next Follow-up</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contacts.length ? (
                  contacts.map((contact) => (
                    <tr key={contact.id}>
                      <td className="font-medium text-slate-900">{contact.full_name}</td>
                      <td>{contact.phone}</td>
                      <td>{contact.location || "-"}</td>
                      <td>{contact.contact_type}</td>
                      <td>
                        <StatusBadge status={contact.status} />
                      </td>
                      <td>{formatDate(contact.next_follow_up_date)}</td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <Link to={`/contacts/${contact.id}`} className="btn btn-secondary px-2 py-1 text-xs">
                            View
                          </Link>
                          <Link to={`/contacts/${contact.id}/edit`} className="btn btn-secondary px-2 py-1 text-xs">
                            Edit
                          </Link>
                          <button
                            type="button"
                            className="btn btn-secondary px-2 py-1 text-xs"
                            onClick={() => openWhatsApp(contact)}
                          >
                            WhatsApp
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger px-2 py-1 text-xs"
                            onClick={() => handleDelete(contact.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <TableEmptyState colSpan={7} message="No contacts found." />
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
