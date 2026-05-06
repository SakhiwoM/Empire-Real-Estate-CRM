import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import ErrorAlert from "../components/ErrorAlert";
import LoadingState from "../components/LoadingState";
import StatusBadge from "../components/StatusBadge";
import { api } from "../services/api";
import { formatCurrency, formatDate } from "../utils/format";

export default function PropertyDetailPage() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [matching, setMatching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState(null);

  async function fetchProperty() {
    setLoading(true);
    setError("");
    try {
      const data = await api.get(`/properties/${id}`);
      setProperty(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMatches() {
    setMatching(true);
    try {
      const data = await api.get(`/properties/${id}/matches`);
      setMatches(data.matches || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setMatching(false);
    }
  }

  async function handleImageUpload(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("images", file));
      await api.postForm(`/properties/${id}/images`, formData);
      await fetchProperty();
      event.target.value = "";
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteImage(imageId) {
    const ok = window.confirm("Delete this image from the property?");
    if (!ok) return;
    setDeletingImageId(imageId);
    setError("");
    try {
      await api.delete(`/properties/${id}/images/${imageId}`);
      await fetchProperty();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingImageId(null);
    }
  }

  useEffect(() => {
    fetchProperty();
    fetchMatches();
  }, [id]);

  const hasCoordinates = useMemo(
    () => property?.latitude !== null && property?.latitude !== undefined && property?.longitude !== null && property?.longitude !== undefined,
    [property]
  );

  if (loading) return <LoadingState text="Loading property..." />;

  return (
    <div className="space-y-5">
      <PageHeader
        title={property?.title || "Property Detail"}
        subtitle="Internal property profile with location, photos, follow-ups, and matching requirements."
        actions={[
          <Link key="edit" to={`/properties/${id}/edit`} className="btn btn-primary">
            Edit Property
          </Link>,
          <Link key="back" to="/properties" className="btn btn-secondary">
            Back
          </Link>,
        ]}
      />

      <ErrorAlert error={error} />

      {property ? (
        <>
          <section className="card grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-slate-500">Owner</p>
              <p className="font-medium">
                {property.owner_name || "-"} {property.owner_phone ? `(${property.owner_phone})` : ""}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Status</p>
              <StatusBadge status={property.status} />
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Property Type</p>
              <p className="font-medium">{property.property_type}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Listing Type</p>
              <p className="font-medium">{property.listing_type}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Location / Address</p>
              <p className="font-medium">{property.location}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Price</p>
              <p className="font-medium">{formatCurrency(property.price)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Bedrooms / Bathrooms</p>
              <p className="font-medium">
                {property.bedrooms ?? "-"} / {property.bathrooms ?? "-"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">GPS Coordinates</p>
              <p className="font-medium">
                {hasCoordinates ? `${property.latitude}, ${property.longitude}` : "-"}
              </p>
              {hasCoordinates ? (
                <a
                  href={`https://www.google.com/maps?q=${property.latitude},${property.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold"
                >
                  Open in Maps
                </a>
              ) : null}
            </div>
            <div className="md:col-span-2">
              <p className="text-xs uppercase text-slate-500">Location Notes</p>
              <p className="whitespace-pre-wrap">{property.location_notes || "-"}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs uppercase text-slate-500">Description</p>
              <p className="whitespace-pre-wrap">{property.description || "-"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Commission Notes</p>
              <p className="whitespace-pre-wrap">{property.commission_notes || "-"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Document Notes</p>
              <p className="whitespace-pre-wrap">{property.document_notes || "-"}</p>
            </div>
          </section>

          <section className="card">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold">Property Photos ({property.images?.length || 0})</h3>
              <label className="btn btn-secondary cursor-pointer">
                {uploading ? "Uploading..." : "Upload Photos"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </label>
            </div>

            {property.images?.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {property.images.map((image) => (
                  <div key={image.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <img src={image.url} alt={image.original_name} className="h-44 w-full object-cover" />
                    <div className="space-y-2 p-3">
                      <p className="truncate text-xs text-slate-500">{image.original_name}</p>
                      <button
                        type="button"
                        className="btn btn-danger w-full"
                        onClick={() => handleDeleteImage(image.id)}
                        disabled={deletingImageId === image.id}
                      >
                        {deletingImageId === image.id ? "Deleting..." : "Delete Image"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No property images yet. Upload photos for internal tracking.</p>
            )}
          </section>

          <section className="card">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-semibold">Matching Requirements</h3>
              <button className="btn btn-secondary" type="button" onClick={fetchMatches} disabled={matching}>
                {matching ? "Refreshing..." : "Refresh Matches"}
              </button>
            </div>
            <div className="space-y-2">
              {matches.length ? (
                matches.map((item) => (
                  <div key={item.id} className="rounded-md border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">
                        {item.contact_name} - {item.purpose} {item.property_type}
                      </p>
                      <span className="rounded-full bg-brand-100 px-2 py-1 text-xs font-semibold text-brand-700">
                        Match {item.match_score}%
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      {item.preferred_location || "Any location"} | Budget {item.min_budget || 0} -{" "}
                      {item.max_budget || "No max"} | Beds {item.bedrooms ?? "-"} | Baths {item.bathrooms ?? "-"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No active requirement matches.</p>
              )}
            </div>
          </section>

          <section className="card">
            <h3 className="mb-2 text-base font-semibold">Follow-ups ({property.follow_ups?.length || 0})</h3>
            <ul className="space-y-2 text-sm">
              {property.follow_ups?.length ? (
                property.follow_ups.map((item) => (
                  <li key={item.id} className="rounded-md border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{item.title}</p>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-slate-600">
                      Contact: {item.contact_name} | Due: {formatDate(item.due_date)}
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
