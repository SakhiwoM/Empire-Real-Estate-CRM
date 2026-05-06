const { db } = require("../db/database");
const { VIEWING_STATUS } = require("../utils/constants");
const {
  validateRequiredString,
  validateEnum,
  parseNullableString,
} = require("../utils/validation");
const { badRequest, notFound } = require("../utils/http");

function listViewings(req, res) {
  const { status, from_date, to_date } = req.query;
  const where = [];
  const params = {};

  if (status) {
    where.push("v.status = @status");
    params.status = status;
  }
  if (from_date) {
    where.push("date(v.viewing_date) >= date(@from_date)");
    params.from_date = from_date;
  }
  if (to_date) {
    where.push("date(v.viewing_date) <= date(@to_date)");
    params.to_date = to_date;
  }

  const sql = `
    SELECT
      v.*,
      c.full_name AS contact_name,
      c.phone AS contact_phone,
      p.title AS property_title
    FROM viewings v
    JOIN contacts c ON c.id = v.contact_id
    JOIN properties p ON p.id = v.property_id
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY date(v.viewing_date) ASC, time(v.viewing_time) ASC
  `;

  const rows = db.prepare(sql).all(params);
  return res.json(rows);
}

function getViewing(req, res) {
  const id = Number(req.params.id);
  const row = db
    .prepare(
      `
      SELECT
        v.*,
        c.full_name AS contact_name,
        c.phone AS contact_phone,
        p.title AS property_title
      FROM viewings v
      JOIN contacts c ON c.id = v.contact_id
      JOIN properties p ON p.id = v.property_id
      WHERE v.id = ?
    `
    )
    .get(id);

  if (!row) return notFound(res, "Viewing");
  return res.json(row);
}

function validateViewingPayload(body, errors) {
  if (body.contact_id === undefined || body.contact_id === null || body.contact_id === "") {
    errors.push("contact_id is required");
  }
  if (body.property_id === undefined || body.property_id === null || body.property_id === "") {
    errors.push("property_id is required");
  }
  validateRequiredString(body, "viewing_date", errors, "Viewing date");
  validateRequiredString(body, "viewing_time", errors, "Viewing time");
  validateEnum(body, "status", VIEWING_STATUS, errors, "Status");
}

function validateLinks(contactId, propertyId) {
  const contact = db.prepare("SELECT id FROM contacts WHERE id = ?").get(Number(contactId));
  if (!contact) return "Linked contact does not exist";

  const property = db.prepare("SELECT id FROM properties WHERE id = ?").get(Number(propertyId));
  if (!property) return "Linked property does not exist";

  return null;
}

function createViewing(req, res) {
  const errors = [];
  validateViewingPayload(req.body, errors);
  if (errors.length) return badRequest(res, errors);

  const linkError = validateLinks(req.body.contact_id, req.body.property_id);
  if (linkError) return badRequest(res, linkError);

  const stmt = db.prepare(`
    INSERT INTO viewings (
      contact_id, property_id, viewing_date, viewing_time, location, status, notes,
      created_at, updated_at
    )
    VALUES (
      @contact_id, @property_id, @viewing_date, @viewing_time, @location, @status, @notes,
      datetime('now'), datetime('now')
    )
  `);

  const payload = {
    contact_id: Number(req.body.contact_id),
    property_id: Number(req.body.property_id),
    viewing_date: req.body.viewing_date,
    viewing_time: req.body.viewing_time,
    location: parseNullableString(req.body.location),
    status: req.body.status || "Scheduled",
    notes: parseNullableString(req.body.notes),
  };

  const info = stmt.run(payload);
  const inserted = db.prepare("SELECT * FROM viewings WHERE id = ?").get(info.lastInsertRowid);
  return res.status(201).json(inserted);
}

function updateViewing(req, res) {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM viewings WHERE id = ?").get(id);
  if (!existing) return notFound(res, "Viewing");

  const errors = [];
  validateViewingPayload(req.body, errors);
  if (errors.length) return badRequest(res, errors);

  const linkError = validateLinks(req.body.contact_id, req.body.property_id);
  if (linkError) return badRequest(res, linkError);

  const stmt = db.prepare(`
    UPDATE viewings
    SET
      contact_id = @contact_id,
      property_id = @property_id,
      viewing_date = @viewing_date,
      viewing_time = @viewing_time,
      location = @location,
      status = @status,
      notes = @notes,
      updated_at = datetime('now')
    WHERE id = @id
  `);

  stmt.run({
    id,
    contact_id: Number(req.body.contact_id),
    property_id: Number(req.body.property_id),
    viewing_date: req.body.viewing_date,
    viewing_time: req.body.viewing_time,
    location: parseNullableString(req.body.location),
    status: req.body.status || "Scheduled",
    notes: parseNullableString(req.body.notes),
  });

  const updated = db.prepare("SELECT * FROM viewings WHERE id = ?").get(id);
  return res.json(updated);
}

function deleteViewing(req, res) {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT id FROM viewings WHERE id = ?").get(id);
  if (!existing) return notFound(res, "Viewing");

  db.prepare("DELETE FROM viewings WHERE id = ?").run(id);
  return res.json({ message: "Viewing deleted" });
}

module.exports = {
  listViewings,
  getViewing,
  createViewing,
  updateViewing,
  deleteViewing,
};
