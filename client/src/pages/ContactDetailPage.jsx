import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import ErrorAlert from "../components/ErrorAlert";
import LoadingState from "../components/LoadingState";
import StatusBadge from "../components/StatusBadge";
import { api } from "../services/api";
import { formatDate } from "../utils/format";

export default function ContactDetailPage() {
  const { id } = useParams();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchContact() {
    setLoading(true);
    setError("");
    try {
      const data = await api.get(`/contacts/${id}`);
      setContact(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchContact();
  }, [id]);

  if (loading) return <LoadingState text="Loading contact details..." />;

  return (
    <div className="space-y-5">
      <PageHeader
        title={contact?.full_name || "Contact Detail"}
        subtitle="View linked requirements, properties, follow-ups, and viewings."
        actions={[
          <Link key="edit" to={`/contacts/${id}/edit`} className="btn btn-primary">
            Edit Contact
          </Link>,
          <Link key="back" to="/contacts" className="btn btn-secondary">
            Back
          </Link>,
        ]}
      />

      <ErrorAlert error={error} />

      {contact ? (
        <>
          <section className="card grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-slate-500">Phone</p>
              <p className="font-medium">{contact.phone || "-"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">WhatsApp</p>
              <p className="font-medium">{contact.whatsapp || "-"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Email</p>
              <p className="font-medium">{contact.email || "-"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Location</p>
              <p className="font-medium">{contact.location || "-"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Contact Type</p>
              <p className="font-medium">{contact.contact_type || "-"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Status</p>
              <StatusBadge status={contact.status} />
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Last Contacted</p>
              <p className="font-medium">{formatDate(contact.last_contacted_date)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Next Follow-up</p>
              <p className="font-medium">{formatDate(contact.next_follow_up_date)}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs uppercase text-slate-500">Notes</p>
              <p className="whitespace-pre-wrap">{contact.notes || "-"}</p>
            </div>
          </section>

          <section className="card">
            <h3 className="mb-2 text-base font-semibold">Requirements ({contact.requirements?.length || 0})</h3>
            <ul className="space-y-2 text-sm">
              {contact.requirements?.length ? (
                contact.requirements.map((item) => (
                  <li key={item.id} className="rounded-md border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">
                        {item.purpose} - {item.property_type}
                      </p>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-slate-600">
                      {item.preferred_location || "Any location"} | Budget:{" "}
                      {item.min_budget || item.max_budget
                        ? `${item.min_budget || 0} - ${item.max_budget || "No max"}`
                        : "Not specified"}
                    </p>
                  </li>
                ))
              ) : (
                <li className="text-slate-500">No requirements linked.</li>
              )}
            </ul>
          </section>

          <section className="card">
            <h3 className="mb-2 text-base font-semibold">Owned Properties ({contact.properties?.length || 0})</h3>
            <ul className="space-y-2 text-sm">
              {contact.properties?.length ? (
                contact.properties.map((item) => (
                  <li key={item.id} className="rounded-md border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{item.title}</p>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-slate-600">
                      {item.listing_type} | {item.property_type} | {item.location}
                    </p>
                    <Link to={`/properties/${item.id}`} className="text-xs font-medium">
                      Open Property
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-slate-500">No properties linked.</li>
              )}
            </ul>
          </section>

          <section className="card">
            <h3 className="mb-2 text-base font-semibold">Follow-ups ({contact.follow_ups?.length || 0})</h3>
            <ul className="space-y-2 text-sm">
              {contact.follow_ups?.length ? (
                contact.follow_ups.map((item) => (
                  <li key={item.id} className="rounded-md border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{item.title}</p>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-slate-600">
                      Due: {formatDate(item.due_date)} {item.property_title ? `| Property: ${item.property_title}` : ""}
                    </p>
                  </li>
                ))
              ) : (
                <li className="text-slate-500">No follow-ups linked.</li>
              )}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}
