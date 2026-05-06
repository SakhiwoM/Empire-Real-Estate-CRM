import { useState } from "react";
import PageHeader from "../components/PageHeader";
import ErrorAlert from "../components/ErrorAlert";
import { api } from "../services/api";

export default function BackupExportPage() {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loadingKey, setLoadingKey] = useState("");

  async function runAction(key, action) {
    setLoadingKey(key);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingKey("");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Backup & Export" subtitle="Protect your local data and export CSV records for sharing." />
      <ErrorAlert error={error} />
      {message ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card space-y-3">
          <h3 className="text-base font-semibold">Database Backup</h3>
          <p className="text-sm text-slate-600">
            Create a timestamped backup of the SQLite file in `server/backups/`.
          </p>
          <button
            className="btn btn-primary"
            type="button"
            disabled={loadingKey === "backup"}
            onClick={() =>
              runAction("backup", async () => {
                const result = await api.post("/backup");
                setMessage(`Backup created: ${result.filename}`);
              })
            }
          >
            {loadingKey === "backup" ? "Backing up..." : "Backup Database"}
          </button>
          <button
            className="btn btn-secondary"
            type="button"
            disabled={loadingKey === "download-latest"}
            onClick={() =>
              runAction("download-latest", async () => {
                await api.download("/backup/latest", "latest_empire_property_crm_backup.db");
                setMessage("Latest backup downloaded.");
              })
            }
          >
            {loadingKey === "download-latest" ? "Downloading..." : "Download Latest Backup"}
          </button>
        </div>

        <div className="card space-y-3">
          <h3 className="text-base font-semibold">Export CSV</h3>
          <p className="text-sm text-slate-600">Export records to CSV for offline analysis and archives.</p>
          <button
            className="btn btn-secondary"
            type="button"
            disabled={loadingKey === "contacts"}
            onClick={() =>
              runAction("contacts", async () => {
                await api.download("/export/contacts", "contacts_export.csv");
                setMessage("Contacts CSV downloaded.");
              })
            }
          >
            {loadingKey === "contacts" ? "Exporting..." : "Export Contacts CSV"}
          </button>
          <button
            className="btn btn-secondary"
            type="button"
            disabled={loadingKey === "properties"}
            onClick={() =>
              runAction("properties", async () => {
                await api.download("/export/properties", "properties_export.csv");
                setMessage("Properties CSV downloaded.");
              })
            }
          >
            {loadingKey === "properties" ? "Exporting..." : "Export Properties CSV"}
          </button>
          <button
            className="btn btn-secondary"
            type="button"
            disabled={loadingKey === "followups"}
            onClick={() =>
              runAction("followups", async () => {
                await api.download("/export/follow-ups", "follow_ups_export.csv");
                setMessage("Follow-ups CSV downloaded.");
              })
            }
          >
            {loadingKey === "followups" ? "Exporting..." : "Export Follow-ups CSV"}
          </button>
        </div>
      </div>
    </div>
  );
}
