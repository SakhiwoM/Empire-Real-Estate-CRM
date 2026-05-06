const { db } = require("../db/database");
const {
  CONTACT_TYPES,
  CONTACT_STATUSES,
} = require("../utils/constants");
const {
  validateRequiredString,
  validateEnum,
  parseNullableString,
} = require("../utils/validation");
const { badRequest, notFound } = require("../utils/http");

function listContacts(req, res) {
  const { q, contact_type, status } = req.query;
  const where = [];
  const params = {};

  if (q) {
    where.push(
      `(full_name LIKE @q OR phone LIKE @q OR IFNULL(location,'') LIKE @q OR contact_type LIKE @q OR status LIKE @q)`
    );
    params.q = `%${q}%`;
  }
  if (contact_type) {
    where.push("contact_type = @contact_type");
    params.contact_type = contact_type;
  }
  if (status) {
    where.push("status = @status");
    params.status = status;
  }

  const sql = `
    SELECT *
    FROM contacts
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY datetime(created_at) DESC
  `;
  const rows = db.prepare(sql).all(params);
  return res.json(rows);
}

function getContact(req, res) {
  const id = Number(req.params.id);
  const contact = db.prepare("SELECT * FROM contacts WHERE id = ?").get(id);
  if (!contact) return notFound(res, "Contact");

  const requirements = db
    .prepare("SELECT * FROM requirements WHERE contact_id = ? ORDER BY datetime(created_at) DESC")
    .all(id);
  const properties = db
    .prepare(
      "SELECT * FROM properties WHERE owner_contact_id = ? ORDER BY datetime(created_at) DESC"
    )
    .all(id);
  const followUps = db
    .prepare(
      `
      SELECT f.*, p.title as property_title
      FROM follow_ups f
      LEFT JOIN properties p ON p.id = f.property_id
      WHERE f.contact_id = ?
      ORDER BY date(f.due_date) ASC, datetime(f.created_at) DESC
    `
    )
    .all(id);
  const viewings = db
    .prepare(
      `
      SELECT v.*, p.title as property_title
      FROM viewings v
      LEFT JOIN properties p ON p.id = v.property_id
      WHERE v.contact_id = ?
      ORDER BY date(v.viewing_date) DESC, time(v.viewing_time) DESC
    `
    )
    .all(id);

  return res.json({
    ...contact,
    requirements,
    properties,
    follow_ups: followUps,
    viewings,
  });
}

function createContact(req, res) {
  const errors = [];
  validateRequiredString(req.body, "full_name", errors, "Full name");
  validateRequiredString(req.body, "phone", errors, "Phone");
  validateEnum(req.body, "contact_type", CONTACT_TYPES, errors, "Contact type");
  validateEnum(req.body, "status", CONTACT_STATUSES, errors, "Status");

  if (errors.length) return badRequest(res, errors);

  const stmt = db.prepare(`
    INSERT INTO contacts (
      full_name, phone, whatsapp, email, location, contact_type, status, notes,
      last_contacted_date, next_follow_up_date, created_at, updated_at
    )
    VALUES (
      @full_name, @phone, @whatsapp, @email, @location, @contact_type, @status, @notes,
      @last_contacted_date, @next_follow_up_date, datetime('now'), datetime('now')
    )
  `);

  const payload = {
    full_name: req.body.full_name.trim(),
    phone: req.body.phone.trim(),
    whatsapp: parseNullableString(req.body.whatsapp),
    email: parseNullableString(req.body.email),
    location: parseNullableString(req.body.location),
    contact_type: req.body.contact_type || "Other",
    status: req.body.status || "New Lead",
    notes: parseNullableString(req.body.notes),
    last_contacted_date: parseNullableString(req.body.last_contacted_date),
    next_follow_up_date: parseNullableString(req.body.next_follow_up_date),
  };

  const info = stmt.run(payload);
  const inserted = db.prepare("SELECT * FROM contacts WHERE id = ?").get(info.lastInsertRowid);
  return res.status(201).json(inserted);
}

function updateContact(req, res) {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM contacts WHERE id = ?").get(id);
  if (!existing) return notFound(res, "Contact");

  const errors = [];
  validateRequiredString(req.body, "full_name", errors, "Full name");
  validateRequiredString(req.body, "phone", errors, "Phone");
  validateEnum(req.body, "contact_type", CONTACT_TYPES, errors, "Contact type");
  validateEnum(req.body, "status", CONTACT_STATUSES, errors, "Status");
  if (errors.length) return badRequest(res, errors);

  const stmt = db.prepare(`
    UPDATE contacts
    SET
      full_name = @full_name,
      phone = @phone,
      whatsapp = @whatsapp,
      email = @email,
      location = @location,
      contact_type = @contact_type,
      status = @status,
      notes = @notes,
      last_contacted_date = @last_contacted_date,
      next_follow_up_date = @next_follow_up_date,
      updated_at = datetime('now')
    WHERE id = @id
  `);

  stmt.run({
    id,
    full_name: req.body.full_name.trim(),
    phone: req.body.phone.trim(),
    whatsapp: parseNullableString(req.body.whatsapp),
    email: parseNullableString(req.body.email),
    location: parseNullableString(req.body.location),
    contact_type: req.body.contact_type || "Other",
    status: req.body.status || "New Lead",
    notes: parseNullableString(req.body.notes),
    last_contacted_date: parseNullableString(req.body.last_contacted_date),
    next_follow_up_date: parseNullableString(req.body.next_follow_up_date),
  });

  const updated = db.prepare("SELECT * FROM contacts WHERE id = ?").get(id);
  return res.json(updated);
}

function deleteContact(req, res) {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT id FROM contacts WHERE id = ?").get(id);
  if (!existing) return notFound(res, "Contact");

  db.prepare("DELETE FROM contacts WHERE id = ?").run(id);
  return res.json({ message: "Contact deleted" });
}

module.exports = {
  listContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
};
