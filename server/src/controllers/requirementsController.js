const { db } = require("../db/database");
const {
  PURPOSES,
  PROPERTY_TYPES,
  REQUIREMENT_URGENCY,
  REQUIREMENT_STATUS,
} = require("../utils/constants");
const {
  validateEnum,
  validateRequiredString,
  validateNumber,
  validateInteger,
  parseNullableNumber,
  parseNullableInteger,
  parseNullableString,
} = require("../utils/validation");
const { badRequest, notFound } = require("../utils/http");
const { getRequirementToPropertyMatch } = require("../utils/matcher");

function listRequirements(req, res) {
  const { purpose, location, property_type, urgency, status, contact_id } = req.query;
  const where = [];
  const params = {};

  if (purpose) {
    where.push("r.purpose = @purpose");
    params.purpose = purpose;
  }
  if (location) {
    where.push("IFNULL(r.preferred_location, '') LIKE @location");
    params.location = `%${location}%`;
  }
  if (property_type) {
    where.push("r.property_type = @property_type");
    params.property_type = property_type;
  }
  if (urgency) {
    where.push("r.urgency = @urgency");
    params.urgency = urgency;
  }
  if (status) {
    where.push("r.status = @status");
    params.status = status;
  }
  if (contact_id) {
    where.push("r.contact_id = @contact_id");
    params.contact_id = Number(contact_id);
  }

  const sql = `
    SELECT
      r.*,
      c.full_name AS contact_name,
      c.phone AS contact_phone,
      c.contact_type AS contact_type
    FROM requirements r
    JOIN contacts c ON c.id = r.contact_id
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY datetime(r.created_at) DESC
  `;

  const rows = db.prepare(sql).all(params);
  return res.json(rows);
}

function getRequirement(req, res) {
  const id = Number(req.params.id);
  const row = db
    .prepare(
      `
      SELECT
        r.*,
        c.full_name AS contact_name,
        c.phone AS contact_phone,
        c.contact_type AS contact_type
      FROM requirements r
      JOIN contacts c ON c.id = r.contact_id
      WHERE r.id = ?
    `
    )
    .get(id);

  if (!row) return notFound(res, "Requirement");
  return res.json(row);
}

function validateRequirementPayload(body, errors) {
  if (body.contact_id === undefined || body.contact_id === null || body.contact_id === "") {
    errors.push("contact_id is required");
  }
  validateRequiredString(body, "purpose", errors, "Purpose");
  validateRequiredString(body, "property_type", errors, "Property type");

  validateEnum(body, "purpose", PURPOSES, errors, "Purpose");
  validateEnum(body, "property_type", PROPERTY_TYPES, errors, "Property type");
  validateEnum(body, "urgency", REQUIREMENT_URGENCY, errors, "Urgency");
  validateEnum(body, "status", REQUIREMENT_STATUS, errors, "Status");

  validateNumber(body, "min_budget", errors, { min: 0 });
  validateNumber(body, "max_budget", errors, { min: 0 });
  validateInteger(body, "bedrooms", errors, { min: 0 });
  validateInteger(body, "bathrooms", errors, { min: 0 });

  const minBudget = parseNullableNumber(body.min_budget);
  const maxBudget = parseNullableNumber(body.max_budget);
  if (minBudget !== null && maxBudget !== null && minBudget > maxBudget) {
    errors.push("min_budget cannot be greater than max_budget");
  }
}

function ensureContactExists(contactId) {
  return db.prepare("SELECT id, full_name FROM contacts WHERE id = ?").get(Number(contactId));
}

function createRequirement(req, res) {
  const errors = [];
  validateRequirementPayload(req.body, errors);
  if (errors.length) return badRequest(res, errors);

  const contact = ensureContactExists(req.body.contact_id);
  if (!contact) return badRequest(res, "Linked contact does not exist");

  const stmt = db.prepare(`
    INSERT INTO requirements (
      contact_id, purpose, property_type, preferred_location, min_budget, max_budget,
      bedrooms, bathrooms, urgency, move_in_or_purchase_timeframe, special_requirements,
      status, created_at, updated_at
    )
    VALUES (
      @contact_id, @purpose, @property_type, @preferred_location, @min_budget, @max_budget,
      @bedrooms, @bathrooms, @urgency, @move_in_or_purchase_timeframe, @special_requirements,
      @status, datetime('now'), datetime('now')
    )
  `);

  const payload = {
    contact_id: Number(req.body.contact_id),
    purpose: req.body.purpose,
    property_type: req.body.property_type,
    preferred_location: parseNullableString(req.body.preferred_location),
    min_budget: parseNullableNumber(req.body.min_budget),
    max_budget: parseNullableNumber(req.body.max_budget),
    bedrooms: parseNullableInteger(req.body.bedrooms),
    bathrooms: parseNullableInteger(req.body.bathrooms),
    urgency: req.body.urgency || "Medium",
    move_in_or_purchase_timeframe: parseNullableString(req.body.move_in_or_purchase_timeframe),
    special_requirements: parseNullableString(req.body.special_requirements),
    status: req.body.status || "Active",
  };

  const info = stmt.run(payload);
  const inserted = db.prepare("SELECT * FROM requirements WHERE id = ?").get(info.lastInsertRowid);
  return res.status(201).json(inserted);
}

function updateRequirement(req, res) {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM requirements WHERE id = ?").get(id);
  if (!existing) return notFound(res, "Requirement");

  const errors = [];
  validateRequirementPayload(req.body, errors);
  if (errors.length) return badRequest(res, errors);

  const contact = ensureContactExists(req.body.contact_id);
  if (!contact) return badRequest(res, "Linked contact does not exist");

  const stmt = db.prepare(`
    UPDATE requirements
    SET
      contact_id = @contact_id,
      purpose = @purpose,
      property_type = @property_type,
      preferred_location = @preferred_location,
      min_budget = @min_budget,
      max_budget = @max_budget,
      bedrooms = @bedrooms,
      bathrooms = @bathrooms,
      urgency = @urgency,
      move_in_or_purchase_timeframe = @move_in_or_purchase_timeframe,
      special_requirements = @special_requirements,
      status = @status,
      updated_at = datetime('now')
    WHERE id = @id
  `);

  stmt.run({
    id,
    contact_id: Number(req.body.contact_id),
    purpose: req.body.purpose,
    property_type: req.body.property_type,
    preferred_location: parseNullableString(req.body.preferred_location),
    min_budget: parseNullableNumber(req.body.min_budget),
    max_budget: parseNullableNumber(req.body.max_budget),
    bedrooms: parseNullableInteger(req.body.bedrooms),
    bathrooms: parseNullableInteger(req.body.bathrooms),
    urgency: req.body.urgency || "Medium",
    move_in_or_purchase_timeframe: parseNullableString(req.body.move_in_or_purchase_timeframe),
    special_requirements: parseNullableString(req.body.special_requirements),
    status: req.body.status || "Active",
  });

  const updated = db.prepare("SELECT * FROM requirements WHERE id = ?").get(id);
  return res.json(updated);
}

function deleteRequirement(req, res) {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT id FROM requirements WHERE id = ?").get(id);
  if (!existing) return notFound(res, "Requirement");

  db.prepare("DELETE FROM requirements WHERE id = ?").run(id);
  return res.json({ message: "Requirement deleted" });
}

function getRequirementMatches(req, res) {
  const id = Number(req.params.id);
  const requirement = db.prepare("SELECT * FROM requirements WHERE id = ?").get(id);
  if (!requirement) return notFound(res, "Requirement");

  const properties = db
    .prepare(
      `
      SELECT p.*, c.full_name AS owner_name, c.phone AS owner_phone
      FROM properties p
      LEFT JOIN contacts c ON c.id = p.owner_contact_id
      WHERE p.status = 'Available'
    `
    )
    .all();

  const matches = properties
    .map((property) => {
      const result = getRequirementToPropertyMatch(requirement, property);
      return { ...property, match_score: result.score, is_match: result.is_match, criteria: result.criteria };
    })
    .filter((m) => m.is_match)
    .sort((a, b) => b.match_score - a.match_score || a.price - b.price);

  return res.json({
    requirement,
    total_matches: matches.length,
    matches,
  });
}

module.exports = {
  listRequirements,
  getRequirement,
  createRequirement,
  updateRequirement,
  deleteRequirement,
  getRequirementMatches,
};
