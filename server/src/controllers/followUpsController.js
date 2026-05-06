const { db } = require("../db/database");
const { FOLLOW_UP_PRIORITIES, FOLLOW_UP_STATUS } = require("../utils/constants");
const {
  validateRequiredString,
  validateEnum,
  parseNullableString,
  parseNullableInteger,
} = require("../utils/validation");
const { badRequest, notFound } = require("../utils/http");

function listFollowUps(req, res) {
  const { status, filter, contact_id } = req.query;
  const where = [];
  const params = {};
  const todayExpr = "date('now', 'localtime')";

  if (contact_id) {
    where.push("f.contact_id = @contact_id");
    params.contact_id = Number(contact_id);
  }

  if (status) {
    where.push("f.status = @status");
    params.status = status;
  }

  if (filter) {
    const normalized = String(filter).toLowerCase();
    if (normalized === "pending") {
      where.push("f.status = 'Pending'");
    } else if (normalized === "completed") {
      where.push("f.status = 'Completed'");
    } else if (normalized === "overdue") {
      where.push(`f.status = 'Pending' AND date(f.due_date) < ${todayExpr}`);
    } else if (normalized === "today") {
      where.push(`f.status = 'Pending' AND date(f.due_date) = ${todayExpr}`);
    }
  }

  const sql = `
    SELECT
      f.*,
      c.full_name AS contact_name,
      c.phone AS contact_phone,
      c.whatsapp AS contact_whatsapp,
      p.title AS property_title
    FROM follow_ups f
    JOIN contacts c ON c.id = f.contact_id
    LEFT JOIN properties p ON p.id = f.property_id
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY
      CASE
        WHEN f.status = 'Pending' THEN 0
        WHEN f.status = 'Completed' THEN 1
        ELSE 2
      END,
      date(f.due_date) ASC
  `;

  const rows = db.prepare(sql).all(params);
  return res.json(rows);
}

function getFollowUp(req, res) {
  const id = Number(req.params.id);
  const row = db
    .prepare(
      `
      SELECT
        f.*,
        c.full_name AS contact_name,
        c.phone AS contact_phone,
        c.whatsapp AS contact_whatsapp,
        p.title AS property_title
      FROM follow_ups f
      JOIN contacts c ON c.id = f.contact_id
      LEFT JOIN properties p ON p.id = f.property_id
      WHERE f.id = ?
    `
    )
    .get(id);
  if (!row) return notFound(res, "Follow-up");
  return res.json(row);
}

function validateFollowUpPayload(body, errors) {
  if (body.contact_id === undefined || body.contact_id === null || body.contact_id === "") {
    errors.push("contact_id is required");
  }
  validateRequiredString(body, "title", errors, "Title");
  validateRequiredString(body, "due_date", errors, "Due date");
  validateEnum(body, "priority", FOLLOW_UP_PRIORITIES, errors, "Priority");
  validateEnum(body, "status", FOLLOW_UP_STATUS, errors, "Status");
}

function validateLinks(contactId, propertyId) {
  const contact = db.prepare("SELECT id FROM contacts WHERE id = ?").get(Number(contactId));
  if (!contact) return "Linked contact does not exist";

  if (propertyId !== undefined && propertyId !== null && propertyId !== "") {
    const property = db.prepare("SELECT id FROM properties WHERE id = ?").get(Number(propertyId));
    if (!property) return "Linked property does not exist";
  }

  return null;
}

function createFollowUp(req, res) {
  const errors = [];
  validateFollowUpPayload(req.body, errors);
  if (errors.length) return badRequest(res, errors);

  const linkError = validateLinks(req.body.contact_id, req.body.property_id);
  if (linkError) return badRequest(res, linkError);

  const stmt = db.prepare(`
    INSERT INTO follow_ups (
      contact_id, property_id, title, description, due_date, priority, status,
      completed_at, created_at, updated_at
    )
    VALUES (
      @contact_id, @property_id, @title, @description, @due_date, @priority, @status,
      @completed_at, datetime('now'), datetime('now')
    )
  `);

  const status = req.body.status || "Pending";
  const completedAt = status === "Completed" ? new Date().toISOString() : null;
  const payload = {
    contact_id: Number(req.body.contact_id),
    property_id: parseNullableInteger(req.body.property_id),
    title: req.body.title.trim(),
    description: parseNullableString(req.body.description),
    due_date: req.body.due_date,
    priority: req.body.priority || "Medium",
    status,
    completed_at: completedAt,
  };

  const info = stmt.run(payload);
  const inserted = db.prepare("SELECT * FROM follow_ups WHERE id = ?").get(info.lastInsertRowid);
  return res.status(201).json(inserted);
}

function updateFollowUp(req, res) {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM follow_ups WHERE id = ?").get(id);
  if (!existing) return notFound(res, "Follow-up");

  const errors = [];
  validateFollowUpPayload(req.body, errors);
  if (errors.length) return badRequest(res, errors);

  const linkError = validateLinks(req.body.contact_id, req.body.property_id);
  if (linkError) return badRequest(res, linkError);

  const status = req.body.status || "Pending";
  const completedAt =
    status === "Completed"
      ? existing.completed_at || new Date().toISOString()
      : status === "Cancelled"
      ? null
      : null;

  const stmt = db.prepare(`
    UPDATE follow_ups
    SET
      contact_id = @contact_id,
      property_id = @property_id,
      title = @title,
      description = @description,
      due_date = @due_date,
      priority = @priority,
      status = @status,
      completed_at = @completed_at,
      updated_at = datetime('now')
    WHERE id = @id
  `);

  stmt.run({
    id,
    contact_id: Number(req.body.contact_id),
    property_id: parseNullableInteger(req.body.property_id),
    title: req.body.title.trim(),
    description: parseNullableString(req.body.description),
    due_date: req.body.due_date,
    priority: req.body.priority || "Medium",
    status,
    completed_at: completedAt,
  });

  const updated = db.prepare("SELECT * FROM follow_ups WHERE id = ?").get(id);
  return res.json(updated);
}

function deleteFollowUp(req, res) {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT id FROM follow_ups WHERE id = ?").get(id);
  if (!existing) return notFound(res, "Follow-up");

  db.prepare("DELETE FROM follow_ups WHERE id = ?").run(id);
  return res.json({ message: "Follow-up deleted" });
}

function completeFollowUp(req, res) {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM follow_ups WHERE id = ?").get(id);
  if (!existing) return notFound(res, "Follow-up");

  db.prepare(
    `
    UPDATE follow_ups
    SET
      status = 'Completed',
      completed_at = @completed_at,
      updated_at = datetime('now')
    WHERE id = @id
  `
  ).run({
    id,
    completed_at: new Date().toISOString(),
  });

  const updated = db.prepare("SELECT * FROM follow_ups WHERE id = ?").get(id);
  return res.json(updated);
}

module.exports = {
  listFollowUps,
  getFollowUp,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp,
  completeFollowUp,
};
