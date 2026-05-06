import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import ErrorAlert from "../components/ErrorAlert";
import LoadingState from "../components/LoadingState";
import { api } from "../services/api";
import { PROPERTY_TYPES, PURPOSES, REQUIREMENT_STATUS, REQUIREMENT_URGENCY } from "../utils/constants";

const initialForm = {
  contact_id: "",
  purpose: "Buy",
  property_type: "House",
  preferred_location: "",
  min_budget: "",
  max_budget: "",
  bedrooms: "",
  bathrooms: "",
  urgency: "Medium",
  move_in_or_purchase_timeframe: "",
  special_requirements: "",
  status: "Active",
};

export default function RequirementFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);
      setError("");
      try {
        const [contactData, requirementData] = await Promise.all([
          api.get("/contacts"),
          isEdit ? api.get(`/requirements/${id}`) : Promise.resolve(null),
        ]);

        setContacts(contactData);
        if (requirementData) {
          setForm({
            contact_id: String(requirementData.contact_id || ""),
            purpose: requirementData.purpose || "Buy",
            property_type: requirementData.property_type || "House",
            preferred_location: requirementData.preferred_location || "",
            min_budget: requirementData.min_budget ?? "",
            max_budget: requirementData.max_budget ?? "",
            bedrooms: requirementData.bedrooms ?? "",
            bathrooms: requirementData.bathrooms ?? "",
            urgency: requirementData.urgency || "Medium",
            move_in_or_purchase_timeframe: requirementData.move_in_or_purchase_timeframe || "",
            special_requirements: requirementData.special_requirements || "",
            status: requirementData.status || "Active",
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [id, isEdit]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        contact_id: Number(form.contact_id),
      };
      if (isEdit) {
        await api.put(`/requirements/${id}`, payload);
      } else {
        await api.post("/requirements", payload);
      }
      navigate("/requirements");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState text="Loading requirement form..." />;

  return (
    <div>
      <PageHeader
        title={isEdit ? "Edit Requirement" : "Add Requirement"}
        subtitle="Save buyer/renter preferences and criteria for matching."
        actions={[
          <Link key="back" to="/requirements" className="btn btn-secondary">
            Back
          </Link>,
        ]}
      />
      <ErrorAlert error={error} />

      <form className="card space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
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
                  {contact.full_name} ({contact.contact_type})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Purpose *</label>
            <select
              className="input"
              value={form.purpose}
              onChange={(e) => setForm((prev) => ({ ...prev, purpose: e.target.value }))}
              required
            >
              {PURPOSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Property Type *</label>
            <select
              className="input"
              value={form.property_type}
              onChange={(e) => setForm((prev) => ({ ...prev, property_type: e.target.value }))}
              required
            >
              {PROPERTY_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Preferred Location</label>
            <input
              className="input"
              value={form.preferred_location}
              onChange={(e) => setForm((prev) => ({ ...prev, preferred_location: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Min Budget</label>
            <input
              type="number"
              min="0"
              className="input"
              value={form.min_budget}
              onChange={(e) => setForm((prev) => ({ ...prev, min_budget: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Max Budget</label>
            <input
              type="number"
              min="0"
              className="input"
              value={form.max_budget}
              onChange={(e) => setForm((prev) => ({ ...prev, max_budget: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Bedrooms</label>
            <input
              type="number"
              min="0"
              className="input"
              value={form.bedrooms}
              onChange={(e) => setForm((prev) => ({ ...prev, bedrooms: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Bathrooms</label>
            <input
              type="number"
              min="0"
              className="input"
              value={form.bathrooms}
              onChange={(e) => setForm((prev) => ({ ...prev, bathrooms: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Urgency</label>
            <select
              className="input"
              value={form.urgency}
              onChange={(e) => setForm((prev) => ({ ...prev, urgency: e.target.value }))}
            >
              {REQUIREMENT_URGENCY.map((item) => (
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
              {REQUIREMENT_STATUS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">Move-in/Purchase Timeframe</label>
            <input
              className="input"
              value={form.move_in_or_purchase_timeframe}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, move_in_or_purchase_timeframe: e.target.value }))
              }
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Special Requirements</label>
            <textarea
              className="input min-h-28"
              value={form.special_requirements}
              onChange={(e) => setForm((prev) => ({ ...prev, special_requirements: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Update Requirement" : "Create Requirement"}
          </button>
          <Link to="/requirements" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
