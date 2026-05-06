import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import ErrorAlert from "../components/ErrorAlert";
import LoadingState from "../components/LoadingState";
import { api } from "../services/api";
import { LISTING_TYPES, PROPERTY_STATUSES, PROPERTY_TYPES } from "../utils/constants";

const initialForm = {
  owner_contact_id: "",
  title: "",
  property_type: "House",
  listing_type: "Sale",
  location: "",
  latitude: "",
  longitude: "",
  location_notes: "",
  price: "",
  bedrooms: "",
  bathrooms: "",
  description: "",
  status: "Available",
  commission_notes: "",
  document_notes: "",
};

export default function PropertyFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [capturingLocation, setCapturingLocation] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);
      setError("");
      try {
        const [contactsData, propertyData] = await Promise.all([
          api.get("/contacts"),
          isEdit ? api.get(`/properties/${id}`) : Promise.resolve(null),
        ]);
        setContacts(contactsData);
        if (propertyData) {
          setForm({
            owner_contact_id: propertyData.owner_contact_id ? String(propertyData.owner_contact_id) : "",
            title: propertyData.title || "",
            property_type: propertyData.property_type || "House",
            listing_type: propertyData.listing_type || "Sale",
            location: propertyData.location || "",
            latitude: propertyData.latitude ?? "",
            longitude: propertyData.longitude ?? "",
            location_notes: propertyData.location_notes || "",
            price: propertyData.price ?? "",
            bedrooms: propertyData.bedrooms ?? "",
            bathrooms: propertyData.bathrooms ?? "",
            description: propertyData.description || "",
            status: propertyData.status || "Available",
            commission_notes: propertyData.commission_notes || "",
            document_notes: propertyData.document_notes || "",
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

  function captureCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported on this device/browser.");
      return;
    }

    setCapturingLocation(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setCapturingLocation(false);
      },
      () => {
        setError("Unable to capture GPS location. Please allow location permission or enter coordinates manually.");
        setCapturingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        owner_contact_id: form.owner_contact_id ? Number(form.owner_contact_id) : null,
      };
      if (isEdit) {
        await api.put(`/properties/${id}`, payload);
      } else {
        await api.post("/properties", payload);
      }
      navigate("/properties");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState text="Loading property form..." />;

  return (
    <div>
      <PageHeader
        title={isEdit ? "Edit Property" : "Add Property"}
        subtitle="Capture property listing details, location, and owner link."
        actions={[
          <Link key="back" to="/properties" className="btn btn-secondary">
            Back
          </Link>,
        ]}
      />
      <ErrorAlert error={error} />

      <form className="card space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Owner Contact</label>
            <select
              className="input"
              value={form.owner_contact_id}
              onChange={(e) => setForm((prev) => ({ ...prev, owner_contact_id: e.target.value }))}
            >
              <option value="">Not linked</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.full_name} ({contact.contact_type})
                </option>
              ))}
            </select>
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
            <label className="label">Property Type *</label>
            <select
              className="input"
              value={form.property_type}
              onChange={(e) => setForm((prev) => ({ ...prev, property_type: e.target.value }))}
            >
              {PROPERTY_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Listing Type *</label>
            <select
              className="input"
              value={form.listing_type}
              onChange={(e) => setForm((prev) => ({ ...prev, listing_type: e.target.value }))}
            >
              {LISTING_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Location / Address *</label>
            <input
              className="input"
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
              required
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              className="btn btn-secondary w-full"
              onClick={captureCurrentLocation}
              disabled={capturingLocation}
            >
              {capturingLocation ? "Capturing GPS..." : "Use Current GPS Location"}
            </button>
          </div>
          <div>
            <label className="label">Latitude</label>
            <input
              type="number"
              step="0.000001"
              className="input"
              value={form.latitude}
              onChange={(e) => setForm((prev) => ({ ...prev, latitude: e.target.value }))}
              placeholder="-26.204103"
            />
          </div>
          <div>
            <label className="label">Longitude</label>
            <input
              type="number"
              step="0.000001"
              className="input"
              value={form.longitude}
              onChange={(e) => setForm((prev) => ({ ...prev, longitude: e.target.value }))}
              placeholder="28.047304"
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Location Notes</label>
            <input
              className="input"
              value={form.location_notes}
              onChange={(e) => setForm((prev) => ({ ...prev, location_notes: e.target.value }))}
              placeholder="Gate code, floor number, landmarks, access notes..."
            />
          </div>
          <div>
            <label className="label">Price</label>
            <input
              type="number"
              min="0"
              className="input"
              value={form.price}
              onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
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
            <label className="label">Status</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
            >
              {PROPERTY_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">Description</label>
            <textarea
              className="input min-h-28"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Commission Notes</label>
            <textarea
              className="input min-h-24"
              value={form.commission_notes}
              onChange={(e) => setForm((prev) => ({ ...prev, commission_notes: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Document Notes</label>
            <textarea
              className="input min-h-24"
              value={form.document_notes}
              onChange={(e) => setForm((prev) => ({ ...prev, document_notes: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Update Property" : "Create Property"}
          </button>
          <Link to="/properties" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
