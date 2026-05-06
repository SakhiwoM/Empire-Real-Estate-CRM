import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import ErrorAlert from "../components/ErrorAlert";
import LoadingState from "../components/LoadingState";
import StatusBadge from "../components/StatusBadge";
import TableEmptyState from "../components/TableEmptyState";
import { api } from "../services/api";
import { LISTING_TYPES, PROPERTY_STATUSES, PROPERTY_TYPES } from "../utils/constants";
import { formatCurrency } from "../utils/format";

export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [listingType, setListingType] = useState("");
  const [status, setStatus] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const query = useMemo(
    () => ({
      q,
      listing_type: listingType,
      status,
      property_type: propertyType,
      min_price: minPrice,
      max_price: maxPrice,
    }),
    [q, listingType, status, propertyType, minPrice, maxPrice]
  );

  async function fetchProperties() {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/properties", query);
      setProperties(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    const ok = window.confirm("Delete this property?");
    if (!ok) return;
    try {
      await api.delete(`/properties/${id}`);
      await fetchProperties();
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    fetchProperties();
  }, [query]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Properties"
        subtitle="Manage sale/rental listings and owner information."
        actions={[
          <Link key="new" to="/properties/new" className="btn btn-primary">
            Add Property
          </Link>,
        ]}
      />

      <ErrorAlert error={error} />

      <div className="card grid gap-3 md:grid-cols-6">
        <div>
          <label className="label">Search</label>
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title, location..." />
        </div>
        <div>
          <label className="label">Listing Type</label>
          <select className="input" value={listingType} onChange={(e) => setListingType(e.target.value)}>
            <option value="">All</option>
            {LISTING_TYPES.map((item) => (
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
            {PROPERTY_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
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
          <label className="label">Min Price</label>
          <input type="number" min="0" className="input" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
        </div>
        <div>
          <label className="label">Max Price</label>
          <input type="number" min="0" className="input" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
        </div>
      </div>

      {loading ? <LoadingState text="Loading properties..." /> : null}
      {!loading ? (
        <div className="table-wrap">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Owner</th>
                  <th>Type</th>
                  <th>Listing</th>
                  <th>Location</th>
                  <th>Photos</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {properties.length ? (
                  properties.map((property) => (
                    <tr key={property.id}>
                      <td className="font-medium text-slate-900">{property.title}</td>
                      <td>
                        {property.owner_name || "-"}
                        <p className="text-xs text-slate-500">{property.owner_phone || ""}</p>
                      </td>
                      <td>{property.property_type}</td>
                      <td>{property.listing_type}</td>
                      <td>
                        {property.location}
                        <p className="text-xs text-slate-500">
                          {property.latitude !== null && property.longitude !== null ? "GPS saved" : "No GPS"}
                        </p>
                      </td>
                      <td>{property.image_count || 0}</td>
                      <td>{formatCurrency(property.price)}</td>
                      <td>
                        <StatusBadge status={property.status} />
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <Link to={`/properties/${property.id}`} className="btn btn-secondary px-2 py-1 text-xs">
                            View
                          </Link>
                          <Link to={`/properties/${property.id}/edit`} className="btn btn-secondary px-2 py-1 text-xs">
                            Edit
                          </Link>
                          <button
                            className="btn btn-danger px-2 py-1 text-xs"
                            type="button"
                            onClick={() => handleDelete(property.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <TableEmptyState colSpan={9} message="No properties found." />
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
