const fs = require("fs");
const path = require("path");
const { dbPath, db } = require("../db/database");
const { toCsv } = require("../utils/csv");

const backupsDir = path.join(__dirname, "../../backups");

function ensureBackupsDir() {
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }
}

function getTimestamp() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}_${hh}${mi}${ss}`;
}

function backupDatabase(req, res) {
  ensureBackupsDir();
  const filename = `empire_property_crm_backup_${getTimestamp()}.db`;
  const backupPath = path.join(backupsDir, filename);

  db.pragma("wal_checkpoint(TRUNCATE)");
  fs.copyFileSync(dbPath, backupPath);

  return res.json({
    message: "Backup created successfully",
    filename,
    path: backupPath,
  });
}

function downloadLatestBackup(req, res) {
  ensureBackupsDir();
  const files = fs
    .readdirSync(backupsDir)
    .filter((file) => file.endsWith(".db"))
    .map((file) => ({
      file,
      fullPath: path.join(backupsDir, file),
      mtime: fs.statSync(path.join(backupsDir, file)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  if (!files.length) {
    return res.status(404).json({ message: "No backup found" });
  }

  const latest = files[0];
  return res.download(latest.fullPath, latest.file);
}

function exportContacts(req, res) {
  const rows = db
    .prepare("SELECT * FROM contacts ORDER BY datetime(created_at) DESC")
    .all();
  const csv = toCsv(rows, [
    { key: "id", label: "ID" },
    { key: "full_name", label: "Full Name" },
    { key: "phone", label: "Phone" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "email", label: "Email" },
    { key: "location", label: "Location" },
    { key: "contact_type", label: "Contact Type" },
    { key: "status", label: "Status" },
    { key: "notes", label: "Notes" },
    { key: "last_contacted_date", label: "Last Contacted Date" },
    { key: "next_follow_up_date", label: "Next Follow-up Date" },
    { key: "created_at", label: "Created At" },
    { key: "updated_at", label: "Updated At" },
  ]);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="contacts_export.csv"');
  return res.send(csv);
}

function exportProperties(req, res) {
  const rows = db
    .prepare(
      `
      SELECT
        p.*,
        c.full_name AS owner_name,
        c.phone AS owner_phone
      FROM properties p
      LEFT JOIN contacts c ON c.id = p.owner_contact_id
      ORDER BY datetime(p.created_at) DESC
    `
    )
    .all();

  const csv = toCsv(rows, [
    { key: "id", label: "ID" },
    { key: "owner_contact_id", label: "Owner Contact ID" },
    { key: "owner_name", label: "Owner Name" },
    { key: "owner_phone", label: "Owner Phone" },
    { key: "title", label: "Title" },
    { key: "property_type", label: "Property Type" },
    { key: "listing_type", label: "Listing Type" },
    { key: "location", label: "Location" },
    { key: "price", label: "Price" },
    { key: "bedrooms", label: "Bedrooms" },
    { key: "bathrooms", label: "Bathrooms" },
    { key: "description", label: "Description" },
    { key: "status", label: "Status" },
    { key: "commission_notes", label: "Commission Notes" },
    { key: "document_notes", label: "Document Notes" },
    { key: "created_at", label: "Created At" },
    { key: "updated_at", label: "Updated At" },
  ]);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="properties_export.csv"');
  return res.send(csv);
}

function exportFollowUps(req, res) {
  const rows = db
    .prepare(
      `
      SELECT
        f.*,
        c.full_name AS contact_name,
        c.phone AS contact_phone,
        p.title AS property_title
      FROM follow_ups f
      JOIN contacts c ON c.id = f.contact_id
      LEFT JOIN properties p ON p.id = f.property_id
      ORDER BY date(f.due_date) ASC
    `
    )
    .all();

  const csv = toCsv(rows, [
    { key: "id", label: "ID" },
    { key: "contact_id", label: "Contact ID" },
    { key: "contact_name", label: "Contact Name" },
    { key: "contact_phone", label: "Contact Phone" },
    { key: "property_id", label: "Property ID" },
    { key: "property_title", label: "Property Title" },
    { key: "title", label: "Title" },
    { key: "description", label: "Description" },
    { key: "due_date", label: "Due Date" },
    { key: "priority", label: "Priority" },
    { key: "status", label: "Status" },
    { key: "completed_at", label: "Completed At" },
    { key: "created_at", label: "Created At" },
    { key: "updated_at", label: "Updated At" },
  ]);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="follow_ups_export.csv"');
  return res.send(csv);
}

module.exports = {
  backupDatabase,
  downloadLatestBackup,
  exportContacts,
  exportProperties,
  exportFollowUps,
};
